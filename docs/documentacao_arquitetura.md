# Arquitetura — DualLibras.AI

## Aplicações e pontos de entrada

| Aplicação | Stack observada | Entrada |
| --- | --- | --- |
| `client` | React 19, TypeScript, React Router 7, Vite 8, Tailwind 4 | `index.html`, `src/main.tsx`, `src/App.tsx` |
| `server/auth` | Express 5, TypeScript, Zod, Prisma 7 e adapter PostgreSQL | `src/server.ts`, `src/app.ts` |
| `server/ai` | FastAPI, Uvicorn, asyncio, AssemblyAI, Faster-Whisper, ReportLab | `main.py`, `app/api/app.py` |

Cada aplicação mantém suas dependências e configuração; não há orquestrador de monorepo ou framework de páginas implícitas. O Docker Compose descreve PostgreSQL, Express, IA e Nginx/frontend.

## Fluxos separados

1. **Contas:** formulário React → `services/authApi.ts` → Express → validação Zod → serviço → Prisma/PostgreSQL. O login devolve cookie e dados do usuário. O redirecionamento depende do papel retornado.
2. **Demonstração do professor:** `/dashboard` → hook de estado local → módulos de turmas, aulas, pessoas, materiais, glossário e Libras. Não há chamadas de API nesse fluxo. Resumos, transcrições e estatísticas são exemplos.
3. **Transcrição real:** `/app` ou `/aula` → `features/transcription/hooks/useAudioCapture.ts` → WebSocket/WebRTC → `ClientSession` no Python → AssemblyAI/Faster-Whisper → texto de volta ao cliente.
4. **Visualização Libras:** texto recebido → `features/libras/utils/simplify.ts` → componente `features/libras/components/VLibras.tsx`. O Python não traduz para Libras. A simplificação usa substituições textuais, não um tradutor linguístico validado.
5. **Histórico/exportação:** `features/history` consulta a API Python para listar, salvar e baixar arquivos. As aulas fictícias do professor usam outro estado.
6. **Materiais persistidos:** Express grava material no disco/Prisma e tenta enviar cópia à IA. A IA armazena arquivo e metadados, sem análise semântica.

## Organização por responsabilidade

A árvore completa e as regras para novos arquivos ficam no [README principal](../README.md). Componentes exclusivos ficam próximos ao módulo; apenas os usados por várias funcionalidades permanecem em `components`, `contexts`, `data`, `types` ou `utils` compartilhados. `features/dashboard/legacy` preserva a implementação anterior sem utilizá-la na rota atual.

No Express, controllers lidam com HTTP e serviços encapsulam regras e consultas. Essa separação já existia e foi mantida. Não foi adicionada uma camada de repository. O schema Prisma descreve mais entidades do que as rotas implementam; a presença de um modelo não torna seu CRUD disponível.

No Python, `api` define contratos HTTP/Pydantic; `realtime` cuida da sessão, buffer e saída contínua; `services` integra provedores e gera documentos; `cli` contém a captura opcional do hardware. Imports internos são relativos ao pacote `app`.

## Áudio e concorrência

O navegador é responsável pela captura web, incluindo recursos de processamento e VAD configurados em seu hook. Os arquivos em `client/public` são usados por URL e devem manter os nomes esperados. Na CLI, `sounddevice` captura o microfone do servidor e utiliza seu próprio VAD/reconexão; ela não é iniciada pelo FastAPI.

Cada WebSocket cria uma sessão e um buffer. Não há broadcast de aula por código. O caminho local usa um modelo compartilhado e executa inferência em thread. Seleção e fallback dependem das configurações e da disponibilidade de dependências/modelos, sem garantia de latência ou precisão.

## Persistência

- PostgreSQL: usuários, perfis e entidades do schema Prisma. Só as operações expostas na [API](API.md) estão disponíveis.
- `storage/transcripts/live`: saída contínua em nomes fixos.
- `storage/transcripts/{pdfs,texts,metadata}`: exportações REST por timestamp.
- `storage/materials/{auth,ai}`: cópias de materiais de cada serviço.
- `storage/documentation`: PDF de documentação estática.

Os diretórios padrão do Python são relativos a `server/ai`, e o Compose fornece caminhos absolutos dentro do container. Diretórios e documentos históricos existentes foram preservados.

## Limites da arquitetura atual

O middleware Express mantém um fallback de convidado; a API Python não autentica nem isola transcrições por usuário. Arquivos contínuos podem colidir entre sessões. Não há fila distribuída, múltiplas réplicas coordenadas, avaliação de qualidade de Libras ou integração entre a aula simulada e a aula real. Veja [ANALYSIS.md](ANALYSIS.md) e [verificações](VERIFICACAO.md).
