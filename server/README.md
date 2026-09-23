# Backend unificado no Render

O Dockerfile nesta pasta inicia Express (contas e banco), FastAPI (IA) e Nginx
em um único serviço. O Nginx usa a variável `PORT` do Render; os processos
internos usam 4000 e 5455. Se qualquer processo encerrar, o container encerra.

## Configuração do serviço

- Runtime: **Docker**.
- Root Directory: **server** (antes `server/ai`).
- Dockerfile Path: **./Dockerfile**; Docker Build Context: **.**.
- Docker Command: vazio, para usar o comando da imagem.
- Health Check Path: **/health**, que verifica também a conexão com o banco.

Se o serviço atual já usa Docker e esses caminhos relativos, basta alterar a
pasta raiz e completar as variáveis abaixo. Um serviço com runtime Python não
passa a executar Node automaticamente ao trocar a pasta: precisa usar Docker.
Referência: https://render.com/docs/docker

No painel Environment, configure:

| Variável | Valor |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL da aplicação |
| `DIRECT_URL` | Conexão direta para operações Prisma, se aplicável |
| `JWT_SECRET` | Segredo aleatório com pelo menos 32 caracteres |
| `AI_INTERNAL_TOKEN` | Outro segredo aleatório com pelo menos 32 caracteres |
| `ASSEMBLYAI_API_KEY` | Chave do provedor de transcrição |
| `CORS_ORIGIN` | `https://duallibrasai.vercel.app` |

Os dois processos recebem o mesmo `AI_INTERNAL_TOKEN`. A imagem já configura
produção, cookies seguros e as URLs internas. Remova overrides antigos de
`AUTH_BACKEND_URL` e `AI_BACKEND_URL`: devem apontar respectivamente para
`http://127.0.0.1:4000` e `http://127.0.0.1:5455`.

O banco precisa estar preparado para o schema de `auth/prisma`. A inicialização
não executa migrações nem `db push` automaticamente. Para um banco existente,
revise o estado das migrações antes de aplicar a baseline.

Arquivos são gravados em `/app/storage`. Para persistência entre deploys,
monte um disco nesse caminho. Use uma instância: os limites de sessões de IA
são mantidos em memória.

## Frontend na Vercel

Use `client` como Root Directory. O arquivo `client/vercel.json` encaminha
`/api/*` para `https://duallibras-ai.onrender.com/api/*`. Mantenha:

```dotenv
VITE_AUTH_BACKEND_HTTP_URL=/api/auth
VITE_BACKEND_HTTP_URL=/api/ai
VITE_BACKEND_WS_URL=wss://duallibras-ai.onrender.com/api/ai/ws
```

Publique novamente o frontend para carregar essa configuração. O login segue
este caminho, preservando os cookies no domínio do frontend:

```text
Vercel /api/auth/auth/login → Render /api/auth/auth/login → Express /auth/login
```

As rotas `/api/auth/internal/*` e `/api/ai/materials/ingest` ficam bloqueadas no
proxy público. Os serviços se comunicam diretamente pelas portas internas.
O WebSocket conecta diretamente ao Render em `/api/ai/ws`. O frontend obtém
um ticket de uso único, válido por 60 segundos, pela sessão HTTP na Vercel.
O ticket viaja no subprotocolo do handshake, sem cookies entre domínios nem
credenciais na URL. O Python troca o ticket pela sessão através da porta
interna do Express e revalida a conta e o acesso à aula durante a captura.
Republique ambos os serviços para ativar esse fluxo. A validação de login
não comprova transcrição ao vivo.

O build do frontend copia os módulos `.mjs`, binários `.wasm` e modelo VAD das
dependências instaladas para `public`. Arquivos ausentes não devem receber o
HTML da SPA; `client/vercel.json` limita o fallback a caminhos sem extensão.

## Verificação

```sh
docker build -t duallibras-server server
# Execute a partir da raiz, com um arquivo de variáveis de produção preenchido:
docker run --rm --env-file /caminho/backend.env -p 10000:10000 duallibras-server
```

`GET /health` deve retornar `{"status":"ready"}` quando o banco estiver
acessível. `GET /api/ai/health` deve informar `authorization_configured: true`.
O healthcheck interno da imagem verifica ambos. Teste login e consulta de sessão
após publicar Render e Vercel.
