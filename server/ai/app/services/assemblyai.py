import asyncio
import json
import logging
from collections.abc import Awaitable, Callable
from typing import Any

import websockets

from .assembly_turns import AssemblyTurns
from ..config import SETTINGS
from ..realtime.audio import AudioBuffer

logger = logging.getLogger(__name__)


def build_streaming_url() -> str:
    return (
        "wss://streaming.assemblyai.com/v3/ws"
        f"?sample_rate={SETTINGS.sample_rate}&speech_model={SETTINGS.speech_model}"
    )


async def connect() -> Any:
    url = build_streaming_url()
    logger.info("Conectando ao AssemblyAI em %s", url)
    websocket = await websockets.connect(
        url,
        additional_headers={"Authorization": SETTINGS.assemblyai_api_key},
        open_timeout=10,
        close_timeout=2,
        ping_interval=10,
        ping_timeout=30,
    )
    try:
        first_msg = json.loads(await asyncio.wait_for(websocket.recv(), timeout=10))
        if first_msg.get("type") != "Begin":
            raise RuntimeError("AssemblyAI não confirmou o início da sessão")
        logger.info("AssemblyAI confirmou o início da sessão")
        return websocket
    except BaseException:
        await terminate(websocket)
        raise


async def terminate(websocket: Any) -> None:
    """End billing explicitly, including when initialization or capture fails."""
    try:
        await asyncio.wait_for(websocket.send(json.dumps({"type": "Terminate"})), timeout=2)
    except Exception:
        logger.warning("Não foi possível enviar Terminate à AssemblyAI")
    finally:
        await asyncio.wait_for(websocket.close(), timeout=3)


async def send_audio(
    audio_buffer: AudioBuffer,
    get_websocket: Callable[[], Any],
    is_active: Callable[[], bool],
) -> None:
    try:
        buffer = bytearray()
        while is_active():
            try:
                data, captured_at = await asyncio.wait_for(
                    audio_buffer.queue.get(),
                    timeout=1.0,
                )
            except asyncio.TimeoutError:
                continue

            if not is_active():
                break
            if asyncio.get_running_loop().time() - captured_at > SETTINGS.max_queue_age_ms / 1000:
                audio_buffer.stats.dropped += 1
                buffer.clear()
                continue
            buffer.extend(data)
            while len(buffer) >= SETTINGS.chunk_size:
                chunk = bytes(buffer[: SETTINGS.chunk_size])
                del buffer[: SETTINGS.chunk_size]

                websocket = get_websocket()
                if websocket and is_active():
                    await websocket.send(chunk)
                    if audio_buffer.stats.sent % 50 == 0:
                        logger.info(
                            "Enviado chunk de áudio %s para AssemblyAI.",
                            audio_buffer.stats.sent,
                        )

                audio_buffer.stats.sent += 1
                audio_buffer.stats.total_bytes_sent += len(chunk)
    except asyncio.CancelledError:
        pass
    except Exception as exc:
        logger.error("Erro ao transmitir áudio para AssemblyAI: %s", exc)
        raise


async def receive_transcripts(
    get_websocket: Callable[[], Any],
    is_active: Callable[[], bool],
    on_turn: Callable[[str, bool, str | None], Awaitable[None]],
) -> None:
    turns = AssemblyTurns()
    try:
        while is_active():
            websocket = get_websocket()
            if not websocket:
                await asyncio.sleep(0.1)
                continue

            raw = await websocket.recv()
            message = json.loads(raw)
            message_type = message.get("type")
            logger.info("Mensagem recebida da AssemblyAI: %s", message_type)

            if message_type == "Turn":
                turn = turns.receive(message)
                if turn:
                    await on_turn(*turn)
            elif message_type in ("SessionBegins", "Begin"):
                logger.info("AssemblyAI SessionBegins: %s", message.get("id"))
            elif message_type in ("Error", "Termination") or message.get("error"):
                raise RuntimeError("A sessão AssemblyAI foi encerrada ou retornou erro")
    except asyncio.CancelledError:
        pass
    except Exception as exc:
        logger.error("Erro ao receber dados da AssemblyAI: %s", exc)
        raise
