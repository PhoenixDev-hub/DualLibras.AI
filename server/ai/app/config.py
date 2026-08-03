from __future__ import annotations

import os
from dataclasses import dataclass

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


if load_dotenv:
    load_dotenv()


@dataclass(frozen=True)
class Settings:
    assemblyai_api_key: str = os.getenv("ASSEMBLYAI_API_KEY", "").strip()
    sample_rate: int = int(os.getenv("AUDIO_SAMPLE_RATE", "16000"))
    channels: int = int(os.getenv("AUDIO_CHANNELS", "1"))
    chunk_size: int = int(os.getenv("AUDIO_CHUNK_SIZE", "1600"))
    audio_queue_size: int = int(os.getenv("AUDIO_QUEUE_MAX_SIZE", "8"))
    max_queue_age_ms: float = float(os.getenv("AUDIO_MAX_QUEUE_AGE_MS", "1200"))
    read_timeout: float = float(os.getenv("AUDIO_READ_TIMEOUT_SECONDS", "5"))
    recv_timeout: float = float(os.getenv("TRANSCRIPTION_RECV_TIMEOUT_SECONDS", "30"))
    max_reconnects: int = int(os.getenv("MAX_RECONNECT_ATTEMPTS", "5"))
    reconnect_delay: float = float(os.getenv("INITIAL_RECONNECT_DELAY", "2"))
    max_reconnect_delay: float = float(os.getenv("MAX_RECONNECT_DELAY", "30"))
    speech_model: str = os.getenv("SPEECH_MODEL", "u3-rt-pro")
    audio_device: str = os.getenv("AUDIO_DEVICE", "").strip()
    list_audio_devices: bool = os.getenv("LIST_AUDIO_DEVICES", "0") == "1"
    debug_latency: bool = os.getenv("DEBUG_LATENCY", "0") == "1"
    use_portuguese_prompt: bool = os.getenv("USE_PORTUGUESE_PROMPT", "1") == "1"
    latency_log_interval: float = float(os.getenv("LATENCY_LOG_INTERVAL_SECONDS", "2"))
    metrics_log_interval: float = float(os.getenv("METRICS_LOG_INTERVAL_SECONDS", "5"))
    partial_send_step: int = int(os.getenv("PARTIAL_SEND_STEP", "2"))
    partial_send_interval_ms: int = int(os.getenv("PARTIAL_SEND_INTERVAL_MS", "80"))
    vad_energy_threshold: int = int(os.getenv("VAD_ENERGY_THRESHOLD", "300"))
    vad_hold_silence_ms: int = int(os.getenv("VAD_HOLD_SILENCE_MS", "240"))
    vad_mode: int = int(os.getenv("VAD_MODE", "2"))
    use_webrtc_vad: bool = os.getenv("USE_WEBRTC_VAD", "1") == "1"
    save_transcripts: bool = os.getenv("SAVE_TRANSCRIPTS", "1") == "1"
    transcript_output_dir: str = os.getenv("TRANSCRIPT_OUTPUT_DIR", "transcripts")
    local_fallback: bool = os.getenv("LOCAL_FALLBACK", "1") == "1"
    local_fallback_model: str = os.getenv("LOCAL_FALLBACK_MODEL", "medium")
    local_whisper_device: str = os.getenv("LOCAL_WHISPER_DEVICE", "cpu")
    local_whisper_compute_type: str = os.getenv(
        "LOCAL_WHISPER_COMPUTE_TYPE", "int8"
    )
    local_whisper_cpu_threads: int = int(
        os.getenv("LOCAL_WHISPER_CPU_THREADS", "6")
    )
    local_whisper_beam_size: int = int(os.getenv("LOCAL_WHISPER_BEAM_SIZE", "2"))
    local_whisper_vad_filter: bool = os.getenv("LOCAL_WHISPER_VAD_FILTER", "1") == "1"
    local_whisper_vad_min_silence_ms: int = int(
        os.getenv("LOCAL_WHISPER_VAD_MIN_SILENCE_MS", "300")
    )
    local_whisper_vad_speech_pad_ms: int = int(
        os.getenv("LOCAL_WHISPER_VAD_SPEECH_PAD_MS", "200")
    )
    local_whisper_no_speech_threshold: float = float(
        os.getenv("LOCAL_WHISPER_NO_SPEECH_THRESHOLD", "0.6")
    )
    local_whisper_hotwords: str = os.getenv(
        "LOCAL_WHISPER_HOTWORDS",
        "professor, professora, alunos, alunas, aula, escola, matéria, explicação, dúvida, exercício, prova, conteúdo, turma, questão, conceito, exemplo, teoria, matemática, português, história, geografia, biologia, física, química",
    )
    local_whisper_initial_prompt: str = os.getenv(
        "LOCAL_WHISPER_INITIAL_PROMPT",
        "Transcrição em português do Brasil de uma aula presencial. Fala do professor e dos alunos sobre explicações pedagógicas, matérias escolares, termos didáticos e dúvidas em sala de aula.",
    )
    local_transcription_chunk_seconds: float = float(
        os.getenv("LOCAL_TRANSCRIPTION_CHUNK_SECONDS", "2.5")
    )
    local_transcription_min_seconds: float = float(
        os.getenv("LOCAL_TRANSCRIPTION_MIN_SECONDS", "1.2")
    )
    probe_host: str = os.getenv("INTERNET_PROBE_HOST", "1.1.1.1")
    probe_port: int = int(os.getenv("INTERNET_PROBE_PORT", "53"))
    probe_timeout: float = float(os.getenv("INTERNET_PROBE_TIMEOUT", "2"))
    log_level: str = os.getenv("LOG_LEVEL", "INFO").upper()


SETTINGS = Settings()

PORTUGUESE_PROMPT = os.getenv(
    "TRANSCRIPTION_PROMPT",
    (
        "Transcreva exclusivamente em português do Brasil. "
        "Priorize falas de sala de aula, explicações de professor, perguntas de aluno, "
        "instruções pedagógicas, vocabulário escolar e termos técnicos. "
        "Mantenha a pontuação simples e natural. Não traduza para inglês."
    ),
)

KEYTERMS_PROMPT = os.getenv(
    "KEYTERMS_PROMPT",
    (
        "português do Brasil,aula,professor,aluno,escola,ensino,ensino médio,fundamental,"
        "vestibular,prova,exercício,simulado,apresentação,console,presença,"
        "Libras,inclusão,acessibilidade,exemplo,atividade,conteúdo,projeto,atividade prática,"
        "tarefa,declaração,pergunta,resposta,explicação"
    ),
)
