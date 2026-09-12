# Áudio, VAD e ambientes com ruído

O projeto tem dois caminhos de captura. Suas configurações não são intercambiáveis:

- **Navegador:** `features/transcription/hooks/useAudioCapture.ts` usa APIs web de áudio, RNNoise e VAD web. Os worklets/modelos ficam em `client/public`.
- **CLI Python:** `app/cli/transcription_cli.py` usa `sounddevice`, WebRTC VAD quando disponível e fallback de energia. A API FastAPI não inicia essa captura.

O VAD detecta atividade de voz; não identifica qual pessoa deve ser ouvida nem garante eliminação de ruído. A classificação de professor/aluno também pode usar heurística textual. Não há medições de precisão ou latência validadas neste repositório.

## Configuração da CLI

Em `server/ai/.env`, os padrões do código são:

```dotenv
USE_WEBRTC_VAD=1
VAD_MODE=2
VAD_ENERGY_THRESHOLD=300
VAD_HOLD_SILENCE_MS=240
```

Aumentar a agressividade ou o limiar pode descartar fala baixa; reduzir pode deixar mais ruído passar. Ajuste com amostras representativas e observe os logs. Estes números são parâmetros de partida, não resultados comprovados para uma sala específica. Execute a CLI com `python -m app.cli.transcription_cli` dentro de `server/ai`; ela acessa o microfone do servidor.

## Transcrição local

O padrão é `LOCAL_FALLBACK_MODEL=medium`, `LOCAL_WHISPER_DEVICE=cpu` e `LOCAL_WHISPER_COMPUTE_TYPE=int8`. A seleção de dispositivo usa `LOCAL_WHISPER_DEVICE`, não `WHISPER_DEVICE`. Mudar para GPU requer ambiente e dependências compatíveis; não foi validado nesta revisão.

O fallback local utiliza suas próprias opções `LOCAL_WHISPER_VAD_*`. As janelas padrão são `LOCAL_TRANSCRIPTION_CHUNK_SECONDS=2.5` e `LOCAL_TRANSCRIPTION_MIN_SECONDS=1.2`. Modelos menores e janelas diferentes podem mudar custo, atraso e qualidade; não há comparação experimental registrada que permita prometer um resultado.

## Diagnóstico

Confira primeiro o microfone selecionado e se a fala está audível sem saturação. No navegador, confirme carregamento dos arquivos públicos e permissão de áudio. Na CLI, `LIST_AUDIO_DEVICES` e `AUDIO_DEVICE` selecionam o hardware. Parâmetros de timeout, prompt e reconexão da CLI não devem ser apresentados como controles automáticos do fluxo `/ws`.

Uma falha de modelo pode depender do download inicial e do cache local. Consulte o [exemplo de ambiente](../server/ai/.env.example) e o [guia Python](../server/ai/README.md). Captura física, desempenho com ruído e comunicação com o provedor externo permanecem pendentes de validação; esta revisão não acessou microfones nem consumiu a API de transcrição.
