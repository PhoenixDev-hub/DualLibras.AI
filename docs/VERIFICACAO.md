# Relatório de verificação — 13/09/2026

> Atualização de integração: consulte [contas, turmas e dados persistidos](INTEGRACAO_FRONT_BACK.md). O painel agora consulta o banco, a autenticação exige sessão válida e a geração Prisma foi corrigida. As referências abaixo ao painel local, fallback guest e falha de geração registram o estado anterior.

Conferência da documentação e do código do commit `988482e`, com complementos documentais nesta revisão. Os resultados abaixo são locais e não comprovam instalação limpa, funcionamento em produção ou qualidade da transcrição.

## Ambiente e escopo

- Node.js `20.20.2`, npm `11.16.0` e Python `3.14.5` no ambiente virtual existente em `server/ai/venv`.
- Prisma CLI `7.9.1`; dependências e cliente Prisma já presentes no computador.
- Comparação dos READMEs e guias com manifests, rotas React/Express/FastAPI, configuração, scripts, armazenamento e arquivos Docker.
- Sem instalação de dependências, consultas ao PostgreSQL, migrações, seed, captura de microfone ou consumo da AssemblyAI.
- Arquivos fictícios de verificação Python foram gerados em diretórios temporários, sem alterar `storage`.

## Resultados executados

| Verificação                            | Resultado                 | Alcance                                                                       |
| -------------------------------------- | ------------------------- | ----------------------------------------------------------------------------- |
| `npm --prefix client run build`        | Aprovado                  | TypeScript e bundle Vite                                                      |
| `npm --prefix server/auth run build`   | Aprovado                  | TypeScript com cliente Prisma já gerado                                       |
| `npm --prefix client run format:check` | Aprovado                  | Todos os arquivos cobertos por Prettier em `src`                              |
| `npm --prefix client run lint`         | Falhou                    | Dois erros e um aviso, detalhados abaixo                                      |
| `bash -n setup.sh build.sh`            | Aprovado                  | Sintaxe; os scripts não foram executados                                      |
| `prisma validate`                      | Falhou                    | P1012, 103 erros de validação no schema                                       |
| Imports Python                         | Aprovado                  | `main`, `app.api.app` e `app.cli.transcription_cli`                           |
| Funções de rota Python e arquivos      | Aprovado                  | Chamadas diretas, conforme escopo abaixo                                      |
| Transporte HTTP via `TestClient`       | Inconclusivo              | A tentativa não concluiu e foi interrompida; não contabilizada como aprovação |
| `docker compose version`               | Indisponível              | Docker respondeu `unknown command: docker compose`                            |
| Links locais Markdown                  | Aprovado após complemento | O relatório ausente foi criado; destinos relativos conferidos                 |

### Lint e Prisma

O lint aponta:

- `client/src/features/dashboard/legacy/ManagementSection.tsx:40`: `react-hooks/static-components`, componente obtido durante renderização.
- `client/src/features/libras/components/VLibras.tsx:253`: `no-empty`, bloco vazio.
- `client/src/features/transcription/hooks/useAudioCapture.ts:392`: aviso `react-hooks/exhaustive-deps`, dependência `conectarSocket` ausente.

A validação Prisma falha nas declarações de relação multilinha de `server/auth/prisma/schema.prisma`. O build Express aprovado não elimina esse bloqueio: depende do cliente existente. Esta revisão documental não corrige o código nem altera o banco.

### Verificação Python

Foi executado um script pontual com `asyncio.run`, imports dos módulos reais e chamadas diretas às funções das rotas. O ambiente usou `DOTENV_DISABLED=1`, chave AssemblyAI vazia e caminhos temporários para `OUTPUT_PATH`, `TRANSCRIPT_OUTPUT_DIR`, `MATERIAL_OUTPUT_DIR` e `DOCUMENTATION_OUTPUT_DIR`.

Foram conferidos:

1. Saúde retornando `status=ok`.
2. Salvamento de texto fictício em PDF, TXT e JSON; existência e leitura dos arquivos retornados pelo download; assinatura `%PDF` do PDF.
3. Listagem com três arquivos e contadores de um arquivo por formato.
4. Exceções com status 400 para texto composto de espaços e nome inválido; 404 para download inexistente.
5. Ingestão de TXT em Base64 e correspondência do conteúdo gravado.
6. Geração do PDF de documentação e resolução do arquivo pela função de download.

Essas chamadas não passam pelo transporte HTTP, pela validação automática de requisições do FastAPI ou pelo envio de `FileResponse`. A tentativa separada com `TestClient` não concluiu; sua causa não foi determinada. Não houve validação do WebSocket, WebRTC, modelo local, áudio ou comportamento no navegador. O script foi pontual e não constitui suíte automatizada versionada.

## Como repetir os checks locais

Na raiz, execute cada comando separadamente para observar seu código de saída:

```sh
npm --prefix client run build
npm --prefix client run lint
npm --prefix client run format:check
npm --prefix server/auth run build
bash -n setup.sh build.sh
```

Para validar somente o schema, dentro de `server/auth`, use URLs fictícias fornecidas ao processo; esse comando não aplica alterações nem precisa consultar o banco:

```sh
DATABASE_URL=postgresql://example:example@localhost:5432/example \
DIRECT_URL=postgresql://example:example@localhost:5432/example \
./node_modules/.bin/prisma validate
```

Para uma conferência HTTP manual, inicie o serviço Python conforme seu [README](../server/ai/README.md), direcionando as quatro variáveis de armazenamento acima para uma pasta de teste. Siga os exemplos de [exportação](QUICK_START_TRANSCRICOES.md) e compare entradas e respostas com os [contratos](API.md). Use nomes retornados pela listagem para baixar os arquivos. Não confunda essa sequência proposta com um teste HTTP aprovado nesta revisão.

## Validações ainda pendentes

| Área             | O que falta conferir                                                                 |
| ---------------- | ------------------------------------------------------------------------------------ |
| Instalação limpa | Dependências em ambiente novo e geração Prisma após correção do schema               |
| Banco e contas   | Cadastro, login, logout, permissões e persistência contra banco de teste             |
| HTTP Python      | Requisições e downloads completos com serviço iniciado                               |
| Áudio            | Permissão do navegador, captura física, AssemblyAI, modelo local e troca de provedor |
| WebRTC           | Negociação e transporte nas condições reais de rede                                  |
| Interface        | Roteiro manual do dashboard, responsividade, teclado e integração VLibras            |
| Docker           | Instalação do Compose v2, build e execução dos quatro serviços                       |
| Produção         | Isolamento de usuários, concorrência de arquivos e demais limites da análise         |

Não há script `test` nos manifests npm nem suíte Python versionada. Os guias da revisão de 12/09/2026 são contexto histórico; este relatório registra o que foi efetivamente repetido em 13/09/2026, sem reconstruir evidências ausentes. Consulte [limitações](ANALYSIS.md), [deploy](DEPLOYMENT.md) e [planejamento](Update.md) para as pendências de implementação.
