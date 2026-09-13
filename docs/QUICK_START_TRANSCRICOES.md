# Salvar e consultar transcrições

Este guia se aplica ao protótipo `/app`/`/aula` e à API Python, não às aulas fictícias do dashboard. Prepare o ambiente conforme [server/ai/README.md](../server/ai/README.md) e execute `python main.py` dentro de `server/ai`.

## Exportar um texto

Com o serviço disponível, envie:

```sh
curl -X POST http://localhost:5455/save-transcript \
  -H 'Content-Type: application/json' \
  -d '{"text":"Texto fictício de uma aula.","title":"Aula de exemplo","formats":["pdf","txt","json"],"metadata":{"disciplina":"Programação"}}'
```

A resposta contém `success`, `message`, `files` e `metadata`. `files` informa os caminhos relativos a `OUTPUT_PATH` de cada formato gerado. Use somente `["pdf"]` para exportar apenas PDF. Os nomes incluem timestamp e são definidos pelo servidor; não copie nomes de arquivos antigos dos exemplos.

```sh
curl http://localhost:5455/transcripts
curl http://localhost:5455/upload-status
```

Para baixar, use `/transcripts/download/<filename>` com o nome retornado pela listagem. A resposta pode ser salva com a opção `-o` do curl escolhendo um caminho próprio. `total` conta arquivos, não aulas; PDF, TXT e JSON podem corresponder ao mesmo texto.

## Onde ficam os arquivos

```text
storage/transcripts/
  live/       TXT, JSON e SRT contínuos, controlados por SAVE_TRANSCRIPTS
  pdfs/       exportações PDF
  texts/      exportações TXT
  metadata/   exportações JSON com texto e metadados
```

`OUTPUT_PATH` controla exportações REST; `TRANSCRIPT_OUTPUT_DIR` controla a saída contínua. `AUTO_SAVE_TRANSCRIPTS=1` habilita exportações adicionais por trecho final, não uma aula consolidada. O padrão dessa opção é desligado.

O frontend possui painel de histórico em `features/history` que chama essas rotas. No dashboard demonstrativo, o download de transcrição é gerado localmente no navegador.

## Verificação e limitações

Em 13/09/2026, as funções de rota, gravação e resolução dos arquivos de download foram conferidas por chamadas diretas com dados fictícios em diretório temporário. A tentativa separada de teste HTTP não concluiu; os comandos curl acima continuam sendo um roteiro para validação com o serviço iniciado. Não existe `test_api.py` ou `test_transcript_manager.py` versionado. Não apague ambientes, arquivos ou processos para seguir este guia.

Verifique permissão de escrita nos diretórios configurados e mantenha o serviço iniciado a partir da pasta indicada. Os nomes contínuos são compartilhados e exportações no mesmo segundo podem colidir; o serviço não isola dados por usuário. Leia [API](API.md), [limitações](ANALYSIS.md) e [resultados](VERIFICACAO.md).
