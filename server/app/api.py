import asyncio
import json
import logging
import os
import time
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

try:
    from server.app.documentation_generator import DocumentationGenerator
    from server.app.transcript_manager import TranscriptManager
    from server.app.config import SETTINGS
    from server.app.transcription import AudioBuffer, classify_speaker, TranscriptSaver, is_internet_available
except ImportError:
    from app.documentation_generator import DocumentationGenerator
    from app.transcript_manager import TranscriptManager
    from app.config import SETTINGS
    from app.transcription import AudioBuffer, classify_speaker, TranscriptSaver, is_internet_available

import numpy as np

# Try importing aiortc
try:
    from aiortc import RTCPeerConnection, RTCSessionDescription, RTCConfiguration, RTCIceServer
    AIORTC_AVAILABLE = True
except ImportError:
    AIORTC_AVAILABLE = False

import websockets

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)
PORT = int(os.getenv("PORT", "5455"))

transcript_manager = TranscriptManager()
doc_generator = DocumentationGenerator()

# Global whisper model cache
local_model = None

def get_local_model():
    global local_model
    if local_model is None:
        from faster_whisper import WhisperModel
        logger.info(f"Carregando modelo Faster-Whisper: {SETTINGS.local_fallback_model}")
        # Use CPU/Auto device
        local_model = WhisperModel(SETTINGS.local_fallback_model, device="auto")
    return local_model

class SaveTranscriptRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Texto da transcrição")
    title: str = Field(default="Transcrição", description="Título do documento")
    formats: list[str] = Field(
        default=["pdf", "txt", "json"], description="Formatos a salvar"
    )
    metadata: dict[str, Any] = Field(
        default_factory=dict, description="Dados adicionais"
    )

class TranscriptResponse(BaseModel):
    success: bool
    message: str
    files: dict[str, str]
    metadata: dict[str, Any]

class TranscriptListResponse(BaseModel):
    total: int
    pdfs: list[str]
    texts: list[str]
    metadata: list[str]


class ClientSession:
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self.audio_buffer = AudioBuffer(max_size=SETTINGS.audio_queue_size)
        self.pc = None
        self.dc = None
        self.assembly_ws = None
        self.tasks = []
        self.active = True
        self.saver = TranscriptSaver() if SETTINGS.save_transcripts else None

    async def send_to_client(self, message: dict[str, Any]):
        if not self.active:
            return
        try:
            payload = json.dumps(message)
            # Send via WebSockets
            await self.websocket.send_text(payload)
            # Also send via WebRTC Data Channel if open for low latency
            if self.dc and self.dc.readyState == "open":
                self.dc.send(payload)
        except Exception as e:
            logger.warning(f"Erro ao enviar mensagem para o cliente: {e}")

    async def send_audio_to_assembly(self):
        try:
            buffer = bytearray()
            while self.active:
                # Get audio chunks from our queue
                try:
                    data, captured_at = await asyncio.wait_for(
                        self.audio_buffer.queue.get(), 
                        timeout=1.0
                    )
                except asyncio.TimeoutError:
                    continue

                buffer.extend(data)
                
                # AssemblyAI v2 expects chunks of audio. We send them as binary frames.
                while len(buffer) >= SETTINGS.chunk_size:
                    chunk = bytes(buffer[:SETTINGS.chunk_size])
                    del buffer[:SETTINGS.chunk_size]
                    
                    if self.assembly_ws:
                        await self.assembly_ws.send(chunk)
                        if self.audio_buffer.stats.sent % 50 == 0:
                            logger.info(f"Enviado chunk de áudio {self.audio_buffer.stats.sent} para AssemblyAI.")
                    
                    # Update stats
                    self.audio_buffer.stats.sent += 1
                    self.audio_buffer.stats.total_bytes_sent += len(chunk)
                    
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Erro ao transmitir áudio para AssemblyAI: {e}")

    async def receive_from_assembly(self):
        try:
            while self.active:
                if not self.assembly_ws:
                    await asyncio.sleep(0.1)
                    continue
                
                raw = await self.assembly_ws.recv()
                msg = json.loads(raw)
                
                msg_type = msg.get("type")
                
                # Log general message type from AssemblyAI
                logger.info(f"Mensagem recebida da AssemblyAI: {msg_type}")
                
                if msg_type == "Turn":
                    text = msg.get("transcript", "").strip()
                    logger.info(f"Transcrição parcial recebida: '{text}' (is_final={msg.get('turn_is_done')})")
                    if text:
                        is_final = bool(msg.get("turn_is_done"))
                        speaker = msg.get("speaker")
                        if not speaker:
                            speaker = classify_speaker(text)
                        
                        # Auto save if final
                        if is_final:
                            if self.saver:
                                self.saver.save_final(text, speaker)
                            
                            if os.getenv("AUTO_SAVE_TRANSCRIPTS", "0") == "1":
                                formats = os.getenv("AUTO_SAVE_FORMATS", "pdf,txt,json").split(",")
                                try:
                                    transcript_manager.save_transcript(
                                        text=text,
                                        title="Transcrição Automática",
                                        formats=[f.strip() for f in formats if f.strip()],
                                        speaker=speaker,
                                    )
                                except Exception as e:
                                    logger.error(f"Auto-save falhou: {e}")
                        
                        # Send result back to client
                        await self.send_to_client({
                            "type": "transcript",
                            "text": text,
                            "is_final": is_final,
                            "speaker": speaker
                        })
                elif msg_type == "SessionBegins":
                    logger.info(f"AssemblyAI SessionBegins: {msg.get('id')}")
                elif msg_type == "Error":
                    logger.error(f"AssemblyAI Error message: {msg}")
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Erro ao receber dados da AssemblyAI: {e}")

    async def run_local_transcription(self):
        try:
            model = get_local_model()
        except Exception as e:
            logger.error(f"Não foi possível carregar o modelo local Faster-Whisper: {e}")
            await self.send_to_client({
                "type": "error",
                "text": f"Erro no modelo local: {e}",
                "error": True,
                "is_final": True
            })
            return

        local_data = bytearray()
        
        def transcribe_audio(audio_bytes: bytes) -> list[str]:
            audio_np = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
            segments, _ = model.transcribe(
                audio_np,
                beam_size=1,
                language="pt",
                word_timestamps=False,
                vad_filter=True,
            )
            return [segment.text.strip() for segment in segments if segment.text.strip()]

        logger.info("Fallback local de transcrição iniciado.")
        while self.active:
            try:
                try:
                    data, _ = await asyncio.wait_for(
                        self.audio_buffer.queue.get(), 
                        timeout=1.5
                    )
                    local_data.extend(data)
                    
                    # Se acumulamos mais que 8 segundos de áudio, transcrevemos
                    if len(local_data) >= SETTINGS.sample_rate * 2 * 8:
                        chunk = bytes(local_data)
                        local_data.clear()
                        
                        texts = await asyncio.to_thread(transcribe_audio, chunk)
                        for text in texts:
                            speaker = classify_speaker(text)
                            if self.saver:
                                self.saver.save_final(text, speaker)
                            await self.send_to_client({
                                "type": "transcript",
                                "text": text,
                                "is_final": True,
                                "speaker": speaker
                            })
                except asyncio.TimeoutError:
                    # Silêncio longo / Pausa detectada -> transcreve o resto do buffer acumulado
                    if len(local_data) >= SETTINGS.sample_rate * 2 * 0.5:
                        chunk = bytes(local_data)
                        local_data.clear()
                        
                        try:
                            texts = await asyncio.to_thread(transcribe_audio, chunk)
                            for text in texts:
                                speaker = classify_speaker(text)
                                if self.saver:
                                    self.saver.save_final(text, speaker)
                                await self.send_to_client({
                                    "type": "transcript",
                                    "text": text,
                                    "is_final": True,
                                    "speaker": speaker
                                })
                        except Exception as e:
                            logger.error(f"Erro ao processar áudio acumulado no silêncio: {e}")
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Erro no loop do fallback local: {e}")
                await asyncio.sleep(1)

    async def start(self):
        # Determine if we can use AssemblyAI
        auth_key = SETTINGS.assemblyai_api_key
        internet = is_internet_available()
        
        if internet and auth_key:
            try:
                # Connect to AssemblyAI Real-Time WebSocket v3
                url = f"wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&speech_model={SETTINGS.speech_model}"
                logger.info(f"Conectando ao AssemblyAI em {url}")
                
                self.assembly_ws = await websockets.connect(
                    url,
                    additional_headers={"Authorization": auth_key},
                    ping_interval=10,
                    ping_timeout=30
                )
                
                # Read the initial SessionBegins confirmation message
                first_msg = await self.assembly_ws.recv()
                logger.info(f"AssemblyAI Session iniciada: {first_msg}")
                
                # Start tasks
                self.tasks.append(asyncio.create_task(self.send_audio_to_assembly()))
                self.tasks.append(asyncio.create_task(self.receive_from_assembly()))
                
                await self.send_to_client({
                    "type": "status",
                    "text": "Conectado com AssemblyAI",
                    "connected": True,
                    "mode": "assemblyai"
                })
                return
            except Exception as e:
                logger.error(f"Falha ao conectar na AssemblyAI: {e}. Iniciando fallback local.")
                
        # If offline or connection fails, use local fallback
        if SETTINGS.local_fallback:
            self.tasks.append(asyncio.create_task(self.run_local_transcription()))
            await self.send_to_client({
                "type": "status",
                "text": "Conectado via Fallback Local",
                "connected": True,
                "mode": "local"
            })
        else:
            await self.send_to_client({
                "type": "error",
                "text": "Sem conexão de internet e fallback local desativado.",
                "error": True,
                "is_final": True
            })

    async def handle_webrtc_offer(self, sdp: str):
        if not AIORTC_AVAILABLE:
            logger.warning("aiortc não disponível. Ignorando offer WebRTC.")
            return

        try:
            config = RTCConfiguration(
                iceServers=[RTCIceServer(urls="stun:stun.l.google.com:19302")]
            )
            pc = RTCPeerConnection(configuration=config)
            self.pc = pc
            
            @pc.on("datachannel")
            def on_datachannel(channel):
                self.dc = channel
                logger.info("WebRTC Data Channel criado e aberto pelo cliente!")
                
                @channel.on("message")
                def on_message(message):
                    if isinstance(message, bytes):
                        # Pushes PCM audio chunk into our local queue
                        self.audio_buffer.push(message, time.monotonic())
                    elif isinstance(message, str):
                        try:
                            # Parse JSON if text is sent on data channel
                            data = json.loads(message)
                            if data.get("type") == "ping":
                                channel.send(json.dumps({"type": "pong"}))
                        except Exception as e:
                            logger.error(f"Erro ao processar mensagem texto no Data Channel: {e}")
                            
                @channel.on("close")
                def on_close():
                    logger.info("WebRTC Data Channel fechado.")
                    
            @pc.on("iceconnectionstatechange")
            async def on_iceconnectionstatechange():
                logger.info(f"ICE Connection State mudou para: {pc.iceConnectionState}")
                if pc.iceConnectionState in ["failed", "closed"]:
                    await pc.close()
            
            # Create an event to wait for ICE gathering completion
            ice_gathering_complete = asyncio.Event()

            @pc.on("icegatheringstatechange")
            def on_icegatheringstatechange():
                logger.info(f"ICE Gathering State mudou para: {pc.iceGatheringState}")
                if pc.iceGatheringState == "complete":
                    ice_gathering_complete.set()
            
            await pc.setRemoteDescription(RTCSessionDescription(sdp=sdp, type="offer"))
            answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            
            # Wait for ICE gathering to complete before sending the answer
            if pc.iceGatheringState != "complete":
                logger.info("Aguardando gathering de ICE completar...")
                try:
                    await asyncio.wait_for(ice_gathering_complete.wait(), timeout=5.0)
                except asyncio.TimeoutError:
                    logger.warning("Timeout aguardando gathering de ICE completar. Enviando SDP parcial.")
            
            # Send answer to client
            await self.send_to_client({
                "type": "webrtc_answer",
                "sdp": pc.localDescription.sdp
            })
        except Exception as e:
            logger.error(f"Erro ao processar offer WebRTC: {e}")

    async def stop(self):
        self.active = False
        
        # Stop all tasks
        for task in self.tasks:
            task.cancel()
        if self.tasks:
            await asyncio.gather(*self.tasks, return_exceptions=True)
            self.tasks.clear()
            
        # Clean up peer connection
        if self.pc:
            await self.pc.close()
            self.pc = None
            self.dc = None
            
        # Clean up AssemblyAI socket
        if self.assembly_ws:
            try:
                await self.assembly_ws.close()
            except Exception:
                pass
            self.assembly_ws = None
            
        logger.info("Sessão limpa com sucesso.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Iniciando DualLibras Backend na porta {PORT}")
    try:
        yield
    finally:
        logger.info("Finalizando aplicação...")

app = FastAPI(
    title="DualLibras.AI Backend",
    description="API de transcrição em tempo real para Libras",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "porta": PORT,
        "webrtc_suportado": AIORTC_AVAILABLE
    }


@app.post("/test-message")
async def test_message():
    return {
        "status": "ok",
        "message": "Teste do backend. Conexão ok."
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    try:
        await websocket.accept()
    except Exception as exc:
        logger.error(f"Erro ao aceitar conexão WebSocket: {exc}")
        raise

    logger.info(f"Novo cliente WebSocket conectado. Criando sessão.")
    session = ClientSession(websocket)
    await session.start()

    try:
        while True:
            # Wait for text or binary frames from client
            message = await websocket.receive()
            
            if "bytes" in message:
                # Binary audio bytes
                session.audio_buffer.push(message["bytes"], time.monotonic())
                if session.audio_buffer.stats.queued % 100 == 1:
                    logger.info(f"WebSocket recebeu chunk de áudio {session.audio_buffer.stats.queued}. Tamanho da fila: {session.audio_buffer.queue.qsize()}")
                
            elif "text" in message:
                try:
                    data = json.loads(message["text"])
                    msg_type = data.get("type")
                    
                    if msg_type == "webrtc_offer":
                        sdp = data.get("sdp")
                        logger.info("Recebeu WebRTC offer do cliente pelo WebSocket")
                        await session.handle_webrtc_offer(sdp)
                    elif msg_type == "ping":
                        await session.send_to_client({"type": "pong"})
                except Exception as e:
                    logger.error(f"Erro ao processar mensagem JSON: {e}")
                    
    except WebSocketDisconnect:
        logger.info("Cliente WebSocket desconectado")
    except Exception as exc:
        logger.error(f"Erro na conexão do WebSocket: {type(exc).__name__}: {exc}")
    finally:
        await session.stop()


@app.post("/save-transcript", response_model=TranscriptResponse)
async def save_transcript(request: SaveTranscriptRequest) -> TranscriptResponse:
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Texto não pode estar vazio")

        logger.info(
            f"Recebendo requisição de salvamento de transcrição: {request.title}"
        )

        files = transcript_manager.save_transcript(
            text=request.text,
            title=request.title,
            formats=request.formats,
            **request.metadata,
        )

        files_dict = {
            fmt: str(files[fmt].relative_to(transcript_manager.base_path))
            for fmt in files
        }

        response = TranscriptResponse(
            success=True,
            message=f"Transcrição salva com sucesso em {len(files)} formato(s)",
            files=files_dict,
            metadata={
                "title": request.title,
                "text_length": len(request.text),
                "formats_saved": list(files.keys()),
                **request.metadata,
            },
        )

        logger.info(f"Transcrição salva: {response.message}")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao salvar transcrição: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Erro ao salvar transcrição: {str(e)}"
        )


@app.get("/transcripts", response_model=TranscriptListResponse)
async def list_transcripts() -> TranscriptListResponse:
    try:
        transcripts = transcript_manager.list_transcripts()

        total = sum(len(files) for files in transcripts.values())

        response = TranscriptListResponse(
            total=total,
            pdfs=transcripts["pdfs"],
            texts=transcripts["texts"],
            metadata=transcripts["metadata"],
        )

        logger.info(f"Listadas {total} transcrições")
        return response

    except Exception as e:
        logger.error(f"Erro ao listar transcrições: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Erro ao listar transcrições: {str(e)}"
        )


@app.get("/transcripts/download/{filename}")
async def download_transcript(filename: str):
    try:
        if ".." in filename or "/" in filename or "\\" in filename:
            raise HTTPException(status_code=400, detail="Nome de arquivo inválido")

        for directory in [
            transcript_manager.pdfs_dir,
            transcript_manager.texts_dir,
            transcript_manager.metadata_dir,
        ]:
            filepath = directory / filename
            if filepath.exists() and filepath.is_file():
                logger.info(f"Baixando arquivo: {filename}")

                media_type = (
                    "application/pdf" if filename.endswith(".pdf") else "text/plain"
                )

                return FileResponse(
                    path=filepath,
                    media_type=media_type,
                    filename=filename,
                )

        raise HTTPException(
            status_code=404, detail=f"Arquivo não encontrado: {filename}"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao baixar arquivo: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro ao baixar arquivo: {str(e)}")


@app.get("/transcripts/pdf/{filename}")
async def get_pdf(filename: str):
    try:
        filepath = transcript_manager.pdfs_dir / filename
        if not filepath.exists():
            raise HTTPException(
                status_code=404, detail=f"PDF não encontrado: {filename}"
            )

        return FileResponse(
            path=filepath, media_type="application/pdf", filename=filename
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao servir PDF: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro ao servir PDF: {str(e)}")


@app.get("/upload-status")
async def upload_status():
    try:
        transcripts = transcript_manager.list_transcripts()

        total_size = 0
        for directory in [
            transcript_manager.pdfs_dir,
            transcript_manager.texts_dir,
            transcript_manager.metadata_dir,
        ]:
            total_size += sum(
                f.stat().st_size for f in directory.glob("*") if f.is_file()
            )

        return {
            "paths": {
                "base": str(transcript_manager.base_path),
                "pdfs": str(transcript_manager.pdfs_dir),
                "texts": str(transcript_manager.texts_dir),
                "metadata": str(transcript_manager.metadata_dir),
            },
            "counts": {
                "pdfs": len(transcripts["pdfs"]),
                "texts": len(transcripts["texts"]),
                "metadata": len(transcripts["metadata"]),
            },
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "status": "online",
        }

    except Exception as e:
        logger.error(f"Erro ao obter status de upload: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro ao obter status: {str(e)}")


@app.get("/documentation/generate")
async def generate_documentation():
    try:
        logger.info("Gerando documentação do projeto...")
        pdf_path = doc_generator.generate_project_documentation()

        return {
            "success": True,
            "message": "Documentação gerada com sucesso",
            "file": str(pdf_path),
            "download_url": "/documentation/download",
        }
    except Exception as e:
        logger.error(f"Erro ao gerar documentação: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Erro ao gerar documentação: {str(e)}"
        )


@app.get("/documentation/download")
async def download_documentation():
    try:
        doc_path = doc_generator.output_dir / "Festival2026_Documentacao.pdf"
        if not doc_path.exists():
            doc_path = doc_generator.generate_project_documentation()

        logger.info(f"Servindo documentação: {doc_path}")
        return FileResponse(
            path=doc_path,
            media_type="application/pdf",
            filename="Festival2026_Documentacao.pdf",
        )
    except Exception as e:
        logger.error(f"Erro ao servir documentação: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Erro ao servir documentação: {str(e)}"
        )
