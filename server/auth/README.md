# API Express — contas, turmas e materiais

Express 5 + TypeScript + Zod + Prisma 7/PostgreSQL. `src/server.ts` inicia o servidor; `src/app.ts` registra middlewares e rotas. Porta padrão: 4000.

## Estrutura

- `routes`: caminhos e associação de middlewares/controllers.
- `controllers`: HTTP, validação contextual e serialização das respostas.
- `services`: regras de negócio e chamadas Prisma; não há camada de repository separada.
- `schemas`: validações Zod para cadastro, login, turma e material.
- `middlewares`: validação, autenticação atual e erros.
- `config`: carregamento do ambiente e cliente Prisma com adapter PostgreSQL.
- `utils`: hash de senha, JWT e logger.
- `types`: extensão de tipos Express.
- `scripts`: seed manual e diagnóstico de conexão.
- `prisma`: schema e SQL existentes; `src/generated/prisma` é saída gerada, não código a editar.

## Configuração e execução

Execute os comandos nesta pasta. Instale com `npm ci`; copie `.env.example` para `.env` somente se ainda não existir e preencha valores próprios. `DATABASE_URL` e `JWT_SECRET` são exigidas na inicialização. `DIRECT_URL` também é lida por `prisma.config.ts`.

```sh
npm run prisma:generate
npm run dev
```

**Bloqueio de instalação limpa:** `prisma validate` encontra 103 erros P1012 nas relações multilinha do schema atual. O build local passou usando o cliente já gerado. A validação/generação precisa ser corrigida antes de assumir uma instalação nova operacional. Schema e dados foram preservados nesta reorganização.

| Script | Efeito |
| --- | --- |
| `dev` | `ts-node-dev` inicia `src/server.ts` |
| `build` | TypeScript gera `dist` |
| `start` | Executa `dist/server.js` após build |
| `prisma:generate` | Gera o cliente Prisma; não cria tabelas |
| `prisma:migrate` | `prisma migrate dev`; modifica banco/histórico, não executado nesta revisão |
| `seed:test-users` | Build e `dist/scripts/seed-test-users.js`; faz upsert de usuários/perfis de teste |
| `check:database` | Build e `dist/scripts/check-database.js`; executa `SELECT 1` |

Não existe script de lint ou suíte de testes configurada neste serviço. O diagnóstico de banco captura erros no console, sem garantir código de saída diferente de zero; não o use como health check automatizado sem revisão.

## Autenticação e permissões reais

Login verifica hash bcrypt e retorna cookie HTTP-only com JWT. O middleware aceita Bearer ou cookie. Contudo, token ausente/inválido recebe a identidade de protótipo `guest-prototype-user-id`; o middleware não encerra com 401. Os controllers consultam esse usuário e podem retornar 404 se ele não existir. Isso é comportamento existente, não garantia de proteção.

Criação de turmas e upload de materiais exigem `PROFESSOR` ou `ADMIN` no serviço. Consulte [rotas e contratos](../../docs/API.md). A API `/dashboard` mistura dados persistidos e dados de exemplo; a tela `/dashboard` do frontend usa sua própria demonstração e não consulta essa rota.

## Banco e deploy

Os arquivos de `prisma` foram mantidos. Não foi constatado histórico versionado em `prisma/migrations`; não invente migrações nem aplique SQL de RLS automaticamente. `prisma/enable_rls.sql` é uma operação manual com impacto no banco.

O Dockerfile existente executa `prisma db push` antes de iniciar a API, portanto subir esse container pode modificar o schema do banco. Esse comportamento não foi executado nem alterado pela reorganização. Veja [deploy](../../docs/DEPLOYMENT.md) antes de usá-lo com dados reais.
