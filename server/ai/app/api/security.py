"""Session introspection, bounded requests and single-process usage limits.

Run one Uvicorn worker/replica. The configured global limits are per process;
horizontal scaling requires a shared limiter before increasing replica count.
"""
import asyncio
from collections import OrderedDict
from dataclasses import dataclass
import hmac
import json
import os
from pathlib import Path
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request as URLRequest, urlopen
from uuid import UUID

from fastapi import HTTPException
from starlette.requests import Request
from starlette.responses import JSONResponse


def positive_env(name: str, default: int) -> int:
    value = int(os.getenv(name, str(default)))
    if value <= 0:
        raise ValueError(f'{name} must be positive')
    return value


AUTH_URL = os.getenv('AUTH_BACKEND_URL', 'http://127.0.0.1:4000').rstrip('/')
INTERNAL_TOKEN = os.getenv('AI_INTERNAL_TOKEN', '')
ALLOWED_ORIGINS = [value.strip() for value in os.getenv('CORS_ORIGIN', 'http://localhost:5173').split(',') if value.strip()]
if '*' in ALLOWED_ORIGINS:
    raise ValueError('CORS_ORIGIN must contain explicit origins')
HTTP_MAX_BYTES = positive_env('AI_HTTP_MAX_BYTES', 36 * 1024 * 1024)
MATERIAL_MAX_BYTES = positive_env('MATERIAL_MAX_BYTES', 25 * 1024 * 1024)
MAX_SESSIONS = positive_env('AI_MAX_SESSIONS', 4)
USER_SESSIONS = positive_env('AI_MAX_SESSIONS_PER_USER', 1)
SESSION_SECONDS = positive_env('AI_SESSION_MAX_SECONDS', 3600)
RECHECK_SECONDS = positive_env('AI_AUTH_RECHECK_SECONDS', 5)
REQUESTS_PER_MINUTE = positive_env('AI_REQUESTS_PER_MINUTE', 60)
WS_STARTS_PER_MINUTE = positive_env('AI_WS_STARTS_PER_MINUTE', 6)


def identifier(value: str) -> str:
    try:
        return str(UUID(str(value)))
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(400, 'Identificador inválido') from None


def contained(root: Path, *parts: str) -> Path:
    root = root.resolve()
    target = root.joinpath(*parts).resolve()
    if not target.is_relative_to(root) or target == root:
        raise HTTPException(400, 'Caminho inválido')
    return target


@dataclass(frozen=True)
class Principal:
    user_id: str
    role: str
    lesson_id: str | None = None
    classroom_id: str | None = None

    @property
    def scope(self) -> tuple[str, str]:
        return ('lessons', self.lesson_id) if self.lesson_id else ('users', self.user_id)


def internal_request(headers) -> bool:
    return bool(INTERNAL_TOKEN) and hmac.compare_digest(
        headers.get('x-ai-internal-token', ''), INTERNAL_TOKEN
    )


def check_origin(headers, *, websocket=False, mutation=False) -> None:
    origin = headers.get('origin')
    if origin and origin not in ALLOWED_ORIGINS:
        raise HTTPException(403, 'Origem não autorizada')
    # Cookie-authenticated browser mutations and every browser WS must carry an
    # allowed Origin. Bearer clients and the trusted Express ingest need no CSRF.
    if (websocket or mutation) and not origin and not headers.get('authorization') and not internal_request(headers):
        raise HTTPException(403, 'Origem obrigatória')


def lookup_session(headers, action: str, lesson_id: str | None, material_id: str | None):
    if not INTERNAL_TOKEN:
        raise HTTPException(503, 'Autorização indisponível')
    forwarded = {'X-AI-Internal-Token': INTERNAL_TOKEN}
    for name in ('cookie', 'authorization'):
        if headers.get(name): forwarded[name] = headers[name]
    if len(forwarded) == 1:
        raise HTTPException(401, 'Entre para continuar')
    query = {'action': action}
    if lesson_id: query['lessonId'] = lesson_id
    if material_id: query['materialId'] = material_id
    req = URLRequest(f'{AUTH_URL}/internal/ai/authorize?{urlencode(query)}', headers=forwarded)
    try:
        with urlopen(req, timeout=3) as response:
            return json.loads(response.read(8192))
    except HTTPError as exc:
        code = exc.code if exc.code in (400, 401, 403, 404, 409, 429) else 503
        raise HTTPException(code, 'Sessão ou acesso indisponível') from None
    except (URLError, OSError, ValueError):
        raise HTTPException(503, 'Autorização indisponível') from None


async def authorize(headers, action='read', lesson_id=None, material_id=None) -> Principal:
    if lesson_id: lesson_id = identifier(lesson_id)
    if material_id: material_id = identifier(material_id)
    data = await asyncio.to_thread(lookup_session, headers, action, lesson_id, material_id)
    try:
        principal = Principal(identifier(data['userId']), data['role'],
                              identifier(data['lessonId']) if data.get('lessonId') else None,
                              identifier(data['classroomId']) if data.get('classroomId') else None)
        if principal.role not in ('ADMIN', 'PROFESSOR', 'ALUNO') or principal.lesson_id != lesson_id:
            raise ValueError('Invalid introspection')
        return principal
    except (KeyError, ValueError, TypeError):
        raise HTTPException(503, 'Autorização indisponível') from None


class WindowLimiter:
    def __init__(self):
        self.windows = OrderedDict()

    def take(self, key: str, maximum: int):
        now = time.monotonic()
        while self.windows and next(iter(self.windows.values()))[0] <= now - 60:
            self.windows.popitem(last=False)
        started, count = self.windows.get(key, (now, 0))
        if started <= now - 60: started, count = now, 0
        if count >= maximum:
            raise HTTPException(429, 'Limite de uso atingido. Aguarde um minuto.')
        # Reject new identities when full instead of evicting active limits.
        if key not in self.windows and len(self.windows) >= 10000:
            raise HTTPException(429, 'Serviço ocupado')
        self.windows[key] = (started, count + 1)


limiter = WindowLimiter()
sessions: dict[str, int] = {}


def acquire_session(user_id: str):
    limiter.take('ws:' + user_id, WS_STARTS_PER_MINUTE)
    if sum(sessions.values()) >= MAX_SESSIONS or sessions.get(user_id, 0) >= USER_SESSIONS:
        raise HTTPException(429, 'Limite de sessões simultâneas atingido')
    sessions[user_id] = sessions.get(user_id, 0) + 1


def release_session(user_id: str):
    remaining = sessions.get(user_id, 0) - 1
    if remaining > 0: sessions[user_id] = remaining
    else: sessions.pop(user_id, None)


class SecurityMiddleware:
    def __init__(self, app): self.app = app

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http' or (scope['path'] == '/health' and scope['method'] == 'GET'):
            return await self.app(scope, receive, send)
        request = Request(scope, receive)
        try:
            limiter.take('ip:' + (request.client.host if request.client else 'unknown'), REQUESTS_PER_MINUTE * 4)
            mutation = request.method not in ('GET', 'HEAD', 'OPTIONS')
            check_origin(request.headers, mutation=mutation)
            principal = await authorize(request.headers, 'write' if mutation else 'read', request.query_params.get('lesson_id'))
            limiter.take('http:' + principal.user_id, REQUESTS_PER_MINUTE)
            scope.setdefault('state', {})['principal'] = principal
            body = bytearray()
            async with asyncio.timeout(15):
                while True:
                    message = await receive()
                    if message['type'] == 'http.disconnect': return
                    body.extend(message.get('body', b''))
                    if len(body) > HTTP_MAX_BYTES:
                        raise HTTPException(413, 'Requisição muito grande')
                    if not message.get('more_body', False): break
            delivered = False
            async def bounded_receive():
                nonlocal delivered
                if not delivered:
                    delivered = True
                    return {'type': 'http.request', 'body': bytes(body), 'more_body': False}
                return await receive()
            await self.app(scope, bounded_receive, send)
        except HTTPException as exc:
            await JSONResponse({'detail': exc.detail}, status_code=exc.status_code)(scope, receive, send)
        except TimeoutError:
            await JSONResponse({'detail': 'Tempo de leitura excedido'}, status_code=408)(scope, receive, send)
