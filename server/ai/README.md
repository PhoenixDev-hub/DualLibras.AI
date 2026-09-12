# Serviço de transcrição — FastAPI

O serviço Python recebe áudio do navegador, usa AssemblyAI ou Faster-Whisper e devolve texto. O widget de Libras pertence ao frontend. A API não captura o microfone do servidor; essa função existe somente na CLI opcional.

## Instalação e execução

A partir de `server/ai`:

```sh
python3 -m venv venv
. venv/bin/activate
python -m pip install -r requirements.txt
# Copie apenas se .env ainda não existir:
cp .env.example .env
python main.py
```

O Docker usa Python 3.11. Os imports foram verificados no ambiente existente com Python 3.14.5; instalação limpa de dependências nativas, captura física e modelos não foram testados. PortAudio é necessário para `sounddevice` na CLI. Modelos do Faster-Whisper podem exigir download inicial e recursos de CPU/GPU compatíveis.

A entrada `main.py` inicia Uvicorn em `0.0.0.0`, porta `PORT` ou 5455. Execute desta pasta para resolver `.env` e caminhos relativos de armazenamento. Alternativa equivalente de desenvolvimento: `uvicorn app.api.app:app --host 0.0.0.0 --port 5455`; a porta passada na CLI do Uvicorn deve corresponder à configuração desejada.

Documentação OpenAPI: `/docs`, `/redoc` e `/openapi.json`. Contratos e limitações estão em [docs/API.md](../../docs/API.md).

## Organização

```text
app/
  api/
    app.py                 FastAPI, CORS, HTTP e WebSocket
    schemas.py             modelos Pydantic
  realtime/
    session.py             estado por conexão e seleção de provedor
    audio.py               buffer, métricas, classificação heurística e saída contínua
  services/
    assemblyai.py          integração remota por WebSocket
    local_whisper.py       carregamento e inferência local
    transcripts.py         PDF/TXT/JSON sob demanda
    documentation.py       PDF de documentação com conteúdo estático
  cli/
    transcription_cli.py   captura de hardware, VAD e fluxo de terminal
  config.py                Settings e variáveis de ambiente
main.py                    entrada do servidor
```

Use imports relativos dentro de `app`. Os antigos caminhos `server.app`, `app.transcription`, `app.transcript_manager` e `app.documentation_generator` foram substituídos por estes módulos. Não importe o pacote por caminhos absolutos do computador.

## Configuração

O [exemplo de ambiente](.env.example) contém os nomes lidos pelo código e valores fictícios/padrão. Não copie credenciais reais para documentação.

| Grupo | Variáveis e significado |
| --- | --- |
| Serviço | `PORT`, `LOG_LEVEL` |
| AssemblyAI | `ASSEMBLYAI_API_KEY` (vazia por padrão), `SPEECH_MODEL` |
| PCM | `AUDIO_SAMPLE_RATE=16000`, `AUDIO_CHANNELS=1`, `AUDIO_CHUNK_SIZE=1600`, fila `AUDIO_QUEUE_MAX_SIZE` |
| Modelo local | `LOCAL_FALLBACK`, `LOCAL_FALLBACK_MODEL=medium`, `LOCAL_WHISPER_DEVICE=cpu`, `LOCAL_WHISPER_COMPUTE_TYPE=int8`, threads, beam, VAD, prompt e hotwords |
| Janelas locais | `LOCAL_TRANSCRIPTION_CHUNK_SECONDS=2.5`, `LOCAL_TRANSCRIPTION_MIN_SECONDS=1.2` |
| Conectividade | `INTERNET_PROBE_HOST`, `INTERNET_PROBE_PORT`, `INTERNET_PROBE_TIMEOUT` |
| Gravação contínua | `SAVE_TRANSCRIPTS=1`, `TRANSCRIPT_OUTPUT_DIR=../../storage/transcripts/live` |
| Exportações REST | `OUTPUT_PATH=../../storage` |
| Materiais | `MATERIAL_OUTPUT_DIR=../../storage/materials/ai` |
| Documentação PDF | `DOCUMENTATION_OUTPUT_DIR=../../storage/documentation` |
| Exportação por trecho | `AUTO_SAVE_TRANSCRIPTS=0`, `AUTO_SAVE_FORMATS=pdf,txt,json` |
| CLI | `AUDIO_DEVICE`, `LIST_AUDIO_DEVICES`, `USE_WEBRTC_VAD`, `VAD_MODE`, limiar/hold, timeouts, reconexão, prompts e métricas |

As variáveis de VAD da CLI não controlam o VAD do navegador. A API AssemblyAI envia `sample_rate` e `speech_model`; a CLI monta parâmetros adicionais. Veja [áudio e ruído](../../docs/AMBIENTE_BARULHENTO.md).

A CLI é iniciada com `python -m app.cli.transcription_cli` nesta pasta. Ela pode acessar o microfone e serviços externos; nesta revisão foi validado apenas o import do módulo.

## Persistência e limites

`TranscriptSaver` usa nomes fixos para TXT/JSON/SRT contínuos. `TranscriptManager` exporta PDF/TXT/JSON por timestamp; o padrão aponta para `storage/transcripts/{pdfs,texts,metadata}`. Os caminhos são relativos ao diretório de execução e podem ser sobrescritos no ambiente. Nenhum arquivo existente foi movido ou regenerado.

Não há autenticação na API Python, vínculo persistido de sessão com turma/usuário, nem isolamento multiusuário das saídas. Ingestão de material apenas grava o arquivo e os metadados. O gerador de documentação usa texto estático, não inspeciona automaticamente o código. Consulte [limitações](../../docs/ANALYSIS.md).

Não há suíte Python versionada ou comando próprio de build. Os testes de import/HTTP com armazenamento temporário desta revisão estão descritos em [verificações](../../docs/VERIFICACAO.md).
