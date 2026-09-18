# Verificação de áudio e transcrição — 18/09/2026

## Resultado e limites

**Nenhuma chamada real à IA; nenhum áudio enviado ao provedor (0 segundos).**
Existe ASSEMBLYAI_API_KEY em server/ai/.env; seu valor não foi exibido e sua validade não foi testada. Não foi encontrado arquivo de fala em português disponível no projeto. Não foi capturado áudio de um microfone físico. Não foram iniciados servidores nem processos de streaming em segundo plano.

O provedor é AssemblyAI Streaming v3, com modelo configurável SPEECH_MODEL (padrão u3-rt-pro). O modelo e o plano foram preservados. A disponibilidade desse modelo para a conta ainda precisa ser confirmada; páginas públicas consultadas apresentaram informações de versões diferentes.

A documentação de cobrança informa que streaming é cobrado pela duração da sessão aberta e que é necessário enviar Terminate. Não foi confirmado um mínimo específico de cobrança para esta conta. Não foi calculado nem inventado consumo de créditos.
Fonte: https://support.assemblyai.com/articles/3853403741-how-does-pricing-work
Protocolo: https://www.assemblyai.com/docs/coding-agent-prompts

## Fluxo inspecionado e corrigido

Microfone → getUserMedia → AudioContext a 16 kHz → AudioWorklet mono → PCM16 sem contêiner → WebSocket /ws → fila do backend → AssemblyAI v3 → Turn parcial/final → callback React → legenda/histórico.

- Removida abertura de sessão ao montar a página e solicitação de microfone apenas para enumerar dispositivos (o stream dessa solicitação ficava aberto).
- Conexão externa começa no primeiro quadro de áudio. Conectar um cliente ocioso não inicia a IA. Ausência de áudio por 15 segundos fecha a sessão, mesmo com mensagens ping.
- Início duplicado é bloqueado; cancelamento durante permissões/inicialização descarta recursos tardios. Parar, desmontar, perder o microfone ou receber erro fecha a captura e o socket, sem reconexão automática.
- WebSocket é o transporte utilizado pelo hook. Retirada a negociação WebRTC paralela; respostas não são mais duplicadas em dois transportes.
- Removida a etapa RNNoise do caminho a 16 kHz; mantida supressão de ruído nativa do navegador. Isso evita depender de uma etapa adicional sem conversão de taxa. Qualidade em sala barulhenta precisa de avaliação posterior.
- Worklet produz quadros de 800 amostras: 1600 bytes, 50 ms, mono PCM16. Contexto a 16 kHz é verificado e mistura para mono é explícita. O backend valida configuração e tamanho/paridade dos quadros.
- VAD usa explicitamente v5, cujo arquivo está disponível; o padrão da biblioteca era legacy e o respectivo arquivo não estava presente. Gating fica desligado inicialmente para não cortar o começo da fala antes da detecção. Se ativado, preserva tempo com silêncio.
- Proteção contra acúmulo de envio no navegador e descarte de áudio antigo na fila do backend.
- Begin é validado antes de anunciar conexão com a IA. Falhas posteriores chegam à interface e encerram a sessão. Não há troca automática para Whisper na inicialização em caso de falha do serviço.
- Encerramento explícito com Terminate, fechamento em finally e prazos limitados, inclusive em cancelamento da inicialização.
- Corrigido carregamento de server/ai/.env independentemente do diretório de execução. Ajustada versão mínima de websockets para 14, compatível com additional_headers.
- Mantida a normalização de parciais/finais e deduplicação já presente nas alterações locais do projeto; adicionada cobertura do fluxo até o callback do frontend.

## Verificações sem IA

- Build TypeScript/Vite passou.
- Cinco testes de frontend com APIs de navegador simuladas: montagem gratuita, início duplicado, envio/recebimento, bloqueio de áudio tardio, permissão negada, desmontagem durante permissão, erro do provedor e PCM.
- Áudio sintético de 440 Hz: RMS não nulo e duração/tamanho corretos; silêncio preservado. Isso não comprova sinal do microfone físico.
- Dez testes Python passaram (incluindo dois testes preexistentes de turnos). Cobrem PCM, parciais/finais, erro de início, erro durante sessão, cancelamento, Terminate, fechamento e descarte de áudio antigo. Rede externa bloqueada nos novos testes e conexão do provedor substituída por mock.
- Dependências mínimas de teste Python instaladas em /tmp/festival-audio-check, sem modificar o ambiente de produção. Faster-Whisper e aiortc não foram instalados nem executados.
- Mocks existem somente nos arquivos de teste; o fluxo normal usa o serviço real quando o usuário inicia a captura.

Comandos usados:

```sh
npm run build --prefix client
node client/tests/audio-capture.test.mjs
PYTHONPATH=server/ai /tmp/festival-audio-check/bin/python -m unittest discover -s server/ai/tests -v
```

Os testes do frontend executam o hook em um ambiente simulado, sem renderizar uma página real. Os testes do backend executam o endpoint com transporte simulado, sem conexão TCP. Não comprovam funcionamento ponta a ponta, permissões reais, implantação HTTPS/WSS, saldo, acesso ao modelo ou qualidade de transcrição.

## Arquivos alterados nesta verificação

- client/public/pcm-encoder-worklet.js
- client/src/features/transcription/hooks/useAudioCapture.ts
- client/src/features/lessons/pages/LiveLesson.tsx
- client/src/pages/AppPrincipal.tsx
- server/ai/app/api/app.py
- server/ai/app/config.py
- server/ai/app/realtime/session.py
- server/ai/app/services/assemblyai.py
- server/ai/requirements.txt
- client/tests/audio-capture.test.mjs (novo)
- server/ai/tests/test_audio_pipeline.py (novo)
- docs/VERIFICACAO_AUDIO.md (este relatório)

Havia alterações locais anteriores, inclusive nesses arquivos e em componentes de Libras; elas foram preservadas. Outros arquivos exibidos por git status não foram alterados nesta verificação.

## Teste manual curto pendente

1. Confira no painel do provedor saldo, disponibilidade do modelo configurado e eventual cobrança mínima; não altere plano/modelo. Use o frontend em localhost ou HTTPS e configure WSS quando estiver em HTTPS.
2. Abra a página sem iniciar captura. Não deve surgir sessão AssemblyAI nem indicador de microfone ligado.
3. Prepare a frase “Bom dia, esta é uma aula em português”. Inicie uma única captura, espere a confirmação de conexão e fale por 2–3 segundos. Observe nível do microfone, texto parcial e final. Encerre a captura em até 5 segundos de áudio total, mesmo se não houver resultado; não repita automaticamente.
4. Confirme que o indicador de microfone apagou, /ws fechou e o backend encerrou a sessão. Confira a duração registrada no painel do provedor; tempo de sessão pode superar a duração do áudio.

Parar encerra imediatamente o transporte: um último resultado ainda em processamento pode não chegar à interface. No teste curto, observe o final antes de parar se ele chegar dentro do limite; caso contrário, registre a ausência e encerre mesmo assim. O fluxo CLI separado não foi executado nem validado com hardware/IA.
