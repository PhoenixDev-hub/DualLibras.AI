# Execução com Docker e pendências de deploy

A configuração existente contém quatro serviços: `db` (PostgreSQL 15), `auth` (Express), `backend` (FastAPI) e `frontend` (Nginx). Não foi realizado deploy nesta revisão.

## Preparação

É necessário Docker com o plugin **Compose v2** (`docker compose`) e acesso ao daemon. A partir da raiz, copie `.env.example` para `.env` somente se ainda não existir. Substitua os valores fictícios e mantenha usuário, senha e nome do banco coerentes com `DATABASE_URL`/`DIRECT_URL`.

O Compose usa `.env` da raiz para `db` e `auth`; o serviço Python recebe as variáveis declaradas em seu bloco `environment`. O `.env` de `server/ai` serve à execução local, não é automaticamente carregado pelo container. A chave AssemblyAI é repassada explicitamente pelo Compose.

**Bloqueio atual:** a validação do schema Prisma falha antes da geração em uma instalação limpa. Corrija essa pendência antes de esperar que a imagem `auth` seja construída. O build TypeScript local passou com o cliente já gerado. Consulte [resultados](VERIFICACAO.md).

## Comandos previstos pela configuração

Os comandos abaixo devem ser executados após resolver os bloqueios. Não foram confirmados com containers em execução nesta revisão: o plugin Compose não está disponível no ambiente e o daemon Docker retorna permissão negada.

```sh
docker compose config --quiet
bash build.sh
docker compose up -d
docker compose logs -f auth backend frontend
docker compose down
```

`build.sh` usa os contextos corretos do Compose: `server/auth`, `server/ai` e `client`. Não existe Dockerfile de aplicação diretamente em `server`.

**Efeito no banco:** o comando inicial do container `auth` contém `prisma db push && npm start`. Subir esse serviço pode alterar o schema do PostgreSQL configurado. A reorganização preservou esse comportamento e não executou o comando. Não é um fluxo de migrações de produção auditado.

## Frontend e endereços

As variáveis do Vite são incorporadas durante o build. O Compose as passa como argumentos para o Dockerfile:

- `VITE_BACKEND_HTTP_URL`, padrão `http://localhost:5455`.
- `VITE_BACKEND_WS_URL`, padrão `ws://localhost:5455/ws`.
- `VITE_AUTH_BACKEND_HTTP_URL`, padrão `http://localhost:4000`.

Esses endereços devem ser alcançáveis pelo **navegador**. Nomes internos como `backend` ou `auth` não substituem URLs públicas. Em outro computador, `localhost` aponta para o computador do visitante; configure o host acessível e refaça o build. Em HTTPS, ajuste também HTTP/WebSocket para HTTPS/WSS e configure a terminação TLS; ela não está implementada no Compose.

O Nginx serve a SPA com fallback para `index.html`, `/health.html`, proxy `/ws` e rotas de transcrição/documentação. Não há proxy Express nem cobertura de todos os endpoints FastAPI nessa configuração; as URLs padrão do bundle acessam as portas 4000 e 5455 diretamente. Variáveis no container Nginx após o build não reescrevem o bundle.

## Portas, volumes e diagnóstico

| Serviço | Porta publicada | Persistência |
| --- | --- | --- |
| frontend | 80 | bundle dentro da imagem |
| auth | 4000 | bind mount `./storage:/app/storage` |
| backend | 5455 | bind mount `./storage:/app/storage` |
| db | 5432 | volume `db-data` |

O volume nomeado `transcripts` permanece declarado, mas não é montado por nenhum serviço. Não foi removido, pois pode estar associado a dados anteriores. Diretórios locais antigos também foram preservados.

Após iniciar com sucesso, conferir `/health` nas portas 4000 e 5455 e `/health.html` na porta 80. Saúde HTTP não garante banco inicializado, modelo carregado ou transcrição funcional. Faça backup do PostgreSQL e de `storage` antes de operações de manutenção. Não use `down -v` para uma simples parada.

## Pendências antes de produção

Autenticação completa, isolamento de saídas, limites de payload/conexão, proteção do serviço Python, HTTPS, política de migrações e validação real de áudio precisam de trabalho próprio. A existência dos Dockerfiles não comprova prontidão de produção. Detalhes em [ANALYSIS.md](ANALYSIS.md).
