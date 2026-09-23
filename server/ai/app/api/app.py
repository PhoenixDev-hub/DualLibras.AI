import asyncio
import base64
import binascii
import json
import logging
import os
from pathlib import Path
import time
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from . import security
from .schemas import SaveTranscriptRequest, MaterialIngestRequest, MaterialIngestResponse, TranscriptListResponse, TranscriptResponse
from ..realtime.session import ClientSession
from ..services.transcripts import TranscriptManager
from ..services.documentation import DocumentationGenerator

logging.basicConfig(level=os.getenv('LOG_LEVEL', 'INFO'), format='%(asctime)s %(name)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)
PORT = int(os.getenv('PORT', '5455'))
STORAGE_ROOT = Path(os.getenv('OUTPUT_PATH', '../../storage')).resolve()
MATERIAL_OUTPUT_DIR = Path(os.getenv('MATERIAL_OUTPUT_DIR', '../../storage/materials/ai')).resolve()

app = FastAPI(title='DualLibras.AI Backend', version='1.1.0', docs_url=None, redoc_url=None, openapi_url=None)
app.add_middleware(security.SecurityMiddleware)
app.add_middleware(CORSMiddleware, allow_origins=security.ALLOWED_ORIGINS, allow_credentials=True,
                   allow_methods=['GET', 'POST'], allow_headers=['Content-Type', 'Authorization'])


def scoped_manager(principal: security.Principal) -> TranscriptManager:
    # Legacy unscoped exports are deliberately not exposed. Migration requires
    # an explicit ownership mapping, not guessing owners from filenames.
    directory = security.contained(STORAGE_ROOT, 'scoped', *principal.scope)
    return TranscriptManager(str(directory))


@app.get('/health')
async def health():
    return {'status': 'ok', 'authorization_configured': bool(security.INTERNAL_TOKEN)}


@app.get('/ready')
async def ready():
    # Reaching this route includes live session/database authorization.
    if not os.getenv('ASSEMBLYAI_API_KEY'):
        raise HTTPException(503, 'Provedor de transcrição não configurado')
    return {'status': 'ready', 'provider_credentials_tested': False}


@app.post('/test-message')
async def test_message():
    return {'status': 'ok', 'message': 'Conexão autenticada.'}


@app.post('/materials/ingest', response_model=MaterialIngestResponse)
async def ingest_material(request: MaterialIngestRequest, http: Request):
    if not security.internal_request(http.headers):
        raise HTTPException(403, 'Acesso interno obrigatório')
    if http.query_params.get('lesson_id'):
        raise HTTPException(400, 'Escopo de material deve vir do banco')
    principal = await security.authorize(http.headers, 'ingest', material_id=str(request.material_id))
    try:
        raw = base64.b64decode(request.content_base64, validate=True)
    except (ValueError, binascii.Error):
        raise HTTPException(400, 'Base64 inválido') from None
    if not raw or len(raw) > security.MATERIAL_MAX_BYTES:
        raise HTTPException(413, 'Tamanho de material inválido')
    filename = request.filename
    if filename != Path(filename).name or '\\' in filename or filename in ('.', '..'):
        raise HTTPException(400, 'Nome de arquivo inválido')
    if Path(filename).suffix.lower() not in {'.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt'}:
        raise HTTPException(400, 'Formato não permitido')
    directory = security.contained(MATERIAL_OUTPUT_DIR, 'classrooms', security.identifier(principal.classroom_id))
    directory.mkdir(parents=True, exist_ok=True)
    target = security.contained(directory, str(request.material_id) + Path(filename).suffix.lower())
    # Atomic replacement and server-controlled metadata; uploaded_by is ignored.
    temporary = security.contained(directory, uuid4().hex + '.tmp')
    def store():
        try:
            with temporary.open('xb') as handle: handle.write(raw)
            temporary.replace(target)
        finally:
            temporary.unlink(missing_ok=True)
    await asyncio.to_thread(store)
    return MaterialIngestResponse(success=True, message='Cópia armazenada; análise automática não disponível', file=target.name)


@app.websocket('/ws')
async def websocket_endpoint(websocket: WebSocket):
    await capture_socket(websocket, demo=False)


@app.websocket('/ws/demo')
async def demo_websocket_endpoint(websocket: WebSocket):
    await capture_socket(websocket, demo=True)


async def capture_socket(websocket: WebSocket, *, demo: bool):
    principal = None
    acquired = False
    session = None
    try:
        security.limiter.take('ws-ip:' + (websocket.client.host if websocket.client else 'unknown'), security.WS_STARTS_PER_MINUTE * 4)
        security.check_origin(websocket.headers, websocket=True)
        lesson_id = websocket.query_params.get('lesson_id')
        auth_headers = websocket.headers
        protocols = [value.strip() for value in websocket.headers.get('sec-websocket-protocol', '').split(',')]
        tickets = [value.removeprefix('duallibras-ticket.') for value in protocols if value.startswith('duallibras-ticket.')]
        if demo:
            if lesson_id or not websocket.headers.get('origin') or len(tickets) != 1 or 'duallibras' not in protocols or len(tickets[0]) != 64:
                raise HTTPException(401, 'Demonstração inválida')
            visitor_id = await asyncio.to_thread(security.exchange_demo_ticket, tickets[0])
            principal = security.Principal(visitor_id, 'VISITOR')
            security.acquire_demo_session(visitor_id)
        elif tickets:
            if len(tickets) != 1 or 'duallibras' not in protocols or not lesson_id or len(tickets[0]) != 64:
                raise HTTPException(401, 'Ticket inválido')
            auth_headers = await asyncio.to_thread(security.exchange_ws_ticket, tickets[0], lesson_id)
        if not demo:
            principal = await security.authorize(auth_headers, 'capture', lesson_id)
            security.acquire_session(principal.user_id)
        acquired = True
        if tickets:
            await websocket.accept(subprotocol='duallibras')
        else:
            await websocket.accept()
        if demo:
            session = ClientSession(websocket, persist=False)
        else:
            session_path = security.contained(STORAGE_ROOT, 'scoped', *principal.scope, 'live', str(uuid4()))
            session = ClientSession(websocket, transcript_manager=scoped_manager(principal), transcript_dir=session_path)
        started = False
        now = time.monotonic()
        last_audio_at = now
        deadline = now + (security.DEMO_SECONDS if demo else security.SESSION_SECONDS)
        next_check = deadline if demo else now + security.RECHECK_SECONDS
        audio_window, audio_bytes = now, 0
        control_window, controls = now, 0
        while True:
            now = time.monotonic()
            if now >= deadline:
                raise HTTPException(429, 'Demonstração encerrada após 60 segundos. Entre na sua conta para usar as aulas.' if demo else 'Duração máxima da sessão atingida')
            if now - last_audio_at >= 15:
                raise HTTPException(408, 'Sessão encerrada por ausência de áudio')
            if not demo and now >= next_check:
                renewed = await security.authorize(auth_headers, 'capture', lesson_id)
                if renewed != principal:
                    raise HTTPException(401, 'Sessão alterada. Entre novamente.')
                next_check = time.monotonic() + security.RECHECK_SECONDS
            try:
                message = await asyncio.wait_for(websocket.receive(), timeout=max(0.001, min(deadline, next_check, last_audio_at + 15) - time.monotonic()))
            except asyncio.TimeoutError:
                continue
            if message.get('type') == 'websocket.disconnect': break
            if message.get('bytes'):
                raw = message['bytes']
                if len(raw) % 2 or len(raw) > 32000:
                    raise HTTPException(400, 'Quadro PCM inválido')
                now = time.monotonic()
                if now - audio_window >= 1: audio_window, audio_bytes = now, 0
                audio_bytes += len(raw)
                if audio_bytes > 64000:
                    raise HTTPException(429, 'Envio de áudio acima do limite')
                last_audio_at = now
                if not started:
                    started = True
                    session.provider_task = asyncio.create_task(session.start())
                session.audio_buffer.push(raw, now)
            elif message.get('text'):
                now = time.monotonic()
                if now - control_window >= 60: control_window, controls = now, 0
                controls += 1
                if len(message['text']) > 4096 or controls > 30:
                    raise HTTPException(429, 'Limite de mensagens atingido')
                try: data = json.loads(message['text'])
                except ValueError: raise HTTPException(400, 'Mensagem inválida') from None
                if not isinstance(data, dict): raise HTTPException(400, 'Mensagem inválida')
                if data.get('type') == 'set_provider' and started:
                    if demo:
                        raise HTTPException(403, 'Troca de provedor disponível apenas nas aulas')
                    provider = data.get('provider')
                    if provider not in {'assemblyai', 'local'}: raise HTTPException(400, 'Provedor inválido')
                    await session.request_provider_switch(provider)
                elif data.get('type') == 'ping':
                    await session.send_to_client({'type': 'pong'})
                else:
                    raise HTTPException(400, 'Mensagem não suportada; use áudio PCM pelo WebSocket')
    except HTTPException as exc:
        if session:
            await session.send_to_client({'type': 'error', 'text': exc.detail, 'error': True})
        try: await websocket.close(code=1008)
        except RuntimeError: pass
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception('Falha na sessão de transcrição')
    finally:
        try:
            if session: await session.stop()
        finally:
            if acquired:
                if demo: security.release_demo_session(principal.user_id)
                else: security.release_session(principal.user_id)
            try: await websocket.close()
            except RuntimeError: pass


@app.post('/save-transcript', response_model=TranscriptResponse)
def save_transcript(request: SaveTranscriptRequest, http: Request):
    if not request.text.strip(): raise HTTPException(400, 'Texto não pode estar vazio')
    manager = scoped_manager(http.state.principal)
    files = manager.save_transcript(text=request.text, title=request.title, formats=request.formats,
                                   owner_id=http.state.principal.user_id, lesson_id=http.state.principal.lesson_id)
    return TranscriptResponse(success=True, message='Transcrição salva', files={fmt: path.name for fmt, path in files.items()}, metadata={'title': request.title})


@app.get('/transcripts', response_model=TranscriptListResponse)
def list_transcripts(http: Request):
    files = scoped_manager(http.state.principal).list_transcripts()
    return TranscriptListResponse(total=sum(map(len, files.values())), **files)


def download(filename: str, principal: security.Principal):
    if Path(filename).name != filename or '\\' in filename or '..' in filename:
        raise HTTPException(400, 'Nome de arquivo inválido')
    manager = scoped_manager(principal)
    for directory in (manager.pdfs_dir, manager.texts_dir, manager.metadata_dir):
        target = security.contained(directory, filename)
        if target.is_file():
            return FileResponse(target, filename=filename, headers={'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'})
    raise HTTPException(404, 'Arquivo indisponível')


@app.get('/transcripts/download/{filename}')
def download_transcript(filename: str, http: Request):
    return download(filename, http.state.principal)


@app.get('/transcripts/pdf/{filename}')
def get_pdf(filename: str, http: Request):
    if not filename.endswith('.pdf'): raise HTTPException(400, 'PDF inválido')
    return download(filename, http.state.principal)


@app.get('/upload-status')
def upload_status(http: Request):
    files = scoped_manager(http.state.principal).list_transcripts()
    return {'counts': {key: len(values) for key, values in files.items()}, 'status': 'online'}


@app.get('/documentation/generate')
def generate_documentation(http: Request):
    if http.state.principal.role != 'ADMIN': raise HTTPException(403, 'Acesso administrativo obrigatório')
    generator = DocumentationGenerator()
    generator.generate_project_documentation()
    return {'success': True, 'file': 'Festival2026_Documentacao.pdf', 'download_url': '/documentation/download'}


@app.get('/documentation/download')
def download_documentation(http: Request):
    if http.state.principal.role != 'ADMIN': raise HTTPException(403, 'Acesso administrativo obrigatório')
    generator = DocumentationGenerator()
    target = generator.output_dir / 'Festival2026_Documentacao.pdf'
    if not target.exists(): target = generator.generate_project_documentation()
    return FileResponse(target, filename=target.name, headers={'Cache-Control': 'private, no-store'})
