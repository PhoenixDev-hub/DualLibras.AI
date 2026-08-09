import asyncio
import logging
from collections.abc import Awaitable, Callable
from typing import Any

import numpy as np

try:
    from server.app.config import SETTINGS
    from server.app.transcription import AudioBuffer, TranscriptSaver, classify_speaker
except ImportError:
    from app.config import SETTINGS
    from app.transcription import AudioBuffer, TranscriptSaver, classify_speaker

logger = logging.getLogger(__name__)

local_model = None


def get_local_model() -> Any:
    global local_model
    if local_model is None:
        from faster_whisper import WhisperModel

        logger.info(
            "Carregando Faster-Whisper model=%s device=%s compute=%s",
            SETTINGS.local_fallback_model,
            SETTINGS.local_whisper_device,
            SETTINGS.local_whisper_compute_type,
        )
        local_model = WhisperModel(
            SETTINGS.local_fallback_model,
            device=SETTINGS.local_whisper_device,
            compute_type=SETTINGS.local_whisper_compute_type,
            cpu_threads=SETTINGS.local_whisper_cpu_threads,
            num_workers=1,
        )
    return local_model


def transcribe_audio(model: Any, audio_bytes: bytes, previous_text: str = "") -> list[str]:
    audio_np = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    prompt = SETTINGS.local_whisper_initial_prompt
    if previous_text:
        recent_context = previous_text[-150:]
        prompt = f"{prompt} {recent_context}".strip()

    segments, _ = model.transcribe(
        audio_np,
        beam_size=SETTINGS.local_whisper_beam_size,
        language="pt",
        word_timestamps=False,
        vad_filter=SETTINGS.local_whisper_vad_filter,
        vad_parameters={
            "min_silence_duration_ms": SETTINGS.local_whisper_vad_min_silence_ms,
            "speech_pad_ms": SETTINGS.local_whisper_vad_speech_pad_ms,
        },
        condition_on_previous_text=False,
        initial_prompt=prompt,
        hotwords=SETTINGS.local_whisper_hotwords,
        no_speech_threshold=SETTINGS.local_whisper_no_speech_threshold,
        temperature=0.0,
    )
    return [segment.text.strip() for segment in segments if segment.text.strip()]


async def run_local_transcription(
    audio_buffer: AudioBuffer,
    saver: TranscriptSaver | None,
    is_active: Callable[[], bool],
    send_to_client: Callable[[dict[str, Any]], Awaitable[None]],
    model: Any = None,
) -> None:
    try:
        if model is None:
            await send_to_client(
                {
                    "type": "status",
                    "text": "Carregando Faster-Whisper local",
                    "connected": True,
                    "mode": "local",
                }
            )
            model = await asyncio.to_thread(get_local_model)
    except Exception as exc:
        logger.error("Não foi possível carregar o modelo local Faster-Whisper: %s", exc)
        await send_to_client(
            {
                "type": "error",
                "text": f"Erro no modelo local: {exc}",
                "error": True,
                "is_final": True,
            }
        )
        return

    await send_to_client(
        {
            "type": "status",
            "text": "Faster-Whisper local pronto",
            "connected": True,
            "mode": "local",
        }
    )
    local_data = bytearray()
    last_text = ""
    chunk_bytes = int(SETTINGS.sample_rate * 2 * SETTINGS.local_transcription_chunk_seconds)
    min_chunk_bytes = int(SETTINGS.sample_rate * 2 * SETTINGS.local_transcription_min_seconds)
    logger.info("Fallback local de transcrição iniciado.")

    while is_active():
        try:
            try:
                data, _ = await asyncio.wait_for(audio_buffer.queue.get(), timeout=1.5)
                local_data.extend(data)

                if len(local_data) >= chunk_bytes:
                    chunk = bytes(local_data)
                    local_data.clear()
                    last_text = await _send_texts(
                        model, chunk, saver, send_to_client, last_text
                    )
            except asyncio.TimeoutError:
                if len(local_data) >= min_chunk_bytes:
                    chunk = bytes(local_data)
                    local_data.clear()
                    try:
                        last_text = await _send_texts(
                            model, chunk, saver, send_to_client, last_text
                        )
                    except Exception as exc:
                        logger.error(
                            "Erro ao processar áudio acumulado no silêncio: %s",
                            exc,
                        )
        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.error("Erro no loop do fallback local: %s", exc)
            await asyncio.sleep(1)


async def _send_texts(
    model: Any,
    chunk: bytes,
    saver: TranscriptSaver | None,
    send_to_client: Callable[[dict[str, Any]], Awaitable[None]],
    last_text: str = "",
) -> str:
    texts = await asyncio.to_thread(transcribe_audio, model, chunk, last_text)
    emitted_text = last_text
    for text in texts:
        normalized = " ".join(text.lower().split())
        if not normalized or normalized == " ".join(emitted_text.lower().split()):
            continue
        speaker = classify_speaker(text)
        if saver:
            saver.save_final(text, speaker)
        await send_to_client(
            {
                "type": "transcript",
                "text": text,
                "is_final": True,
                "speaker": speaker,
            }
        )
        emitted_text = text
    return emitted_text
