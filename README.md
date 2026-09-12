# DualLibras.AI — Projeto Festival 2026

Aplicação educacional com uma interface de demonstração para professores e um protótipo de transcrição de voz integrado ao widget VLibras. O repositório contém três aplicações com dependências próprias; não utiliza npm workspaces.

## Estado atual

- **Frontend:** React 19, TypeScript, React Router 7, Vite 8, Tailwind CSS 4 e Lucide React.
- **API de contas:** Express 5, TypeScript, Zod, JWT por cookie/Bearer e Prisma 7 com PostgreSQL.
- **Transcrição:** FastAPI/Uvicorn, AssemblyAI, Faster-Whisper, WebSocket, WebRTC DataChannel opcional e ReportLab.
- `/dashboard` é uma demonstração local do professor: turmas, aulas, materiais, pessoas, glossário e alfabeto com placeholders. Os dados reiniciam ao atualizar a página.
- `/app` e `/aula` abrem o protótipo que captura áudio do navegador, recebe transcrições e aciona o VLibras. Essa experiência é independente das aulas simuladas no dashboard.
- Login e cadastro chamam a API Express. Login de professor segue para `/dashboard`; aluno para `/codigo`; demais perfis para `/app`. Cadastro ainda segue para `/app`.
- `/codigo` apresenta o formulário, mas a entrada real por código ainda não está integrada.

Consulte [limitações verificadas](docs/ANALYSIS.md), [contratos HTTP/WebSocket](docs/API.md) e [resultados de validação](docs/VERIFICACAO.md). Não há comprovação de precisão, latência garantida ou operação multiusuário em produção.

## Estrutura

```text
.
├── client/
│   ├── public/                 # Worklets, WASM e modelo VAD servidos por URL
│   ├── src/
│   │   ├── main.tsx            # Montagem do React
│   │   ├── App.tsx             # Rotas da SPA
│   │   ├── pages/              # Entradas das rotas
│   │   ├── components/
│   │   │   ├── ui/             # Elementos reutilizáveis
│   │   │   └── layout/         # Layout compartilhado do professor
│   │   ├── features/           # auth, classrooms, dashboard, glossary, history,
│   │   │                       # landing, lessons, libras, materials, settings,
│   │   │                       # students, transcription
│   │   ├── config/             # URLs das APIs e WebSocket
│   │   ├── contexts/           # Estado compartilhado da demonstração
│   │   ├── data/               # Dados fictícios compartilhados
│   │   ├── hooks/              # Hooks usados por mais de um componente
│   │   ├── services/           # Cliente HTTP compartilhado da API Express
│   │   ├── types/              # Tipos compartilhados e declarações de bibliotecas
│   │   ├── utils/              # Utilitários compartilhados
│   │   ├── styles/             # Tema global e estilos do professor
│   │   └── assets/             # Imagens importadas pelo Vite
│   └── Dockerfile, nginx.conf, configurações de build/lint
├── server/
│   ├── auth/
│   │   ├── src/
│   │   │   ├── app.ts, server.ts
│   │   │   ├── routes/, controllers/, services/
│   │   │   ├── schemas/, middlewares/, config/, types/, utils/
│   │   │   └── scripts/        # Diagnóstico do banco e seed manual
│   │   └── prisma/             # Schema e SQL preservados; migrações quando existirem
│   └── ai/
│       ├── main.py            # Entrada Uvicorn
│       ├── app/
│       │   ├── api/           # FastAPI e schemas Pydantic
│       │   ├── realtime/      # Sessão, buffer e salvamento contínuo
│       │   ├── services/      # Transcritores, exportação e documentação PDF
│       │   ├── cli/           # Captura opcional pelo microfone do servidor
│       │   └── config.py      # Configuração de áudio e provedores
│       └── requirements.txt
├── docs/                      # Guias, API, arquitetura, limitações e planos
├── storage/                   # Transcrições, materiais e PDFs existentes
├── .env.example               # Exemplo para Docker Compose
├── docker-compose.yml
├── setup.sh                   # Dependências locais; não altera banco
└── build.sh                   # Build das imagens via Docker Compose
```

Pastas locais de saída antigas, ambientes virtuais, dependências e arquivos gerados não aparecem nesta árvore e não foram apagados.

## Instalação local

Use Node.js compatível com os pacotes instalados: **20.19+ na série 20, 22.12+ na série 22 ou 24+**. O Docker do serviço Python usa **3.11**; os imports locais foram verificados em **3.14.5**, mas uma instalação limpa das dependências nativas não foi executada. Para captura via CLI, há dependência de PortAudio; o Docker instala `libportaudio2` e `libsndfile1`.

Na raiz, `bash setup.sh` instala dependências dos três serviços e copia exemplos somente se o `.env` correspondente não existir. A sintaxe do script foi verificada, mas a instalação completa não foi executada nesta revisão. É possível configurar cada aplicação separadamente:

```sh
# Frontend
cd client
npm ci
# Somente se ainda não houver .env:
cp .env.example .env
npm run dev
```

Em outro terminal, a partir da raiz:

```sh
cd server/ai
python3 -m venv venv
. venv/bin/activate
python -m pip install -r requirements.txt
# Somente se ainda não houver .env:
cp .env.example .env
python main.py
```

Para contas persistidas, configure seu PostgreSQL e `server/auth/.env`:

```sh
cd server/auth
npm ci
# Somente se ainda não houver .env:
cp .env.example .env
# Edite DATABASE_URL, DIRECT_URL, JWT_SECRET e CORS_ORIGIN antes de prosseguir.
npm run prisma:generate
npm run dev
```

**Pendência existente:** o schema atual falha em `prisma validate` com P1012 nas relações multilinha. A geração em instalação limpa precisa dessa correção prévia; o build verificado usa um cliente Prisma já existente. Não foram executados `db push`, migrações, seed nem consultas ao banco. Consulte o [guia da API Express](server/auth/README.md).

## Endereços e configuração

| Serviço | Desenvolvimento | Configuração |
| --- | --- | --- |
| Frontend | `http://localhost:5173` (ou porta livre informada pelo Vite) | [client/.env.example](client/.env.example) |
| Express | `http://localhost:4000` | [server/auth/.env.example](server/auth/.env.example) |
| FastAPI | `http://localhost:5455` e `ws://localhost:5455/ws` | [server/ai/.env.example](server/ai/.env.example) |
| Docker Compose | frontend em `http://localhost` | [.env.example](.env.example), [deploy](docs/DEPLOYMENT.md) |

As variáveis `VITE_*` são públicas e incorporadas ao bundle durante o build. A API de contas usa `VITE_AUTH_BACKEND_HTTP_URL`, não `VITE_AUTH_URL`. Nunca coloque tokens privados ou senhas em variáveis do frontend.

## Build e verificações

```sh
npm --prefix client run build
npm --prefix client run lint
npm --prefix client run format:check
npm --prefix server/auth run build
bash -n setup.sh build.sh
```

Frontend e Express têm build TypeScript; o Python executa diretamente, sem etapa de empacotamento configurada. Não há script `test` nem suíte automatizada versionada. O lint completo tem falhas anteriores a esta reorganização; veja os [resultados reais](docs/VERIFICACAO.md). `npm --prefix client run format` aplica o Prettier a todo `src`.

## Onde colocar novos arquivos

Mantenha telas, componentes, hooks, utilitários e serviços exclusivos em `features/<funcionalidade>/`, criando subpastas somente quando houver conteúdo. Elementos visuais usados por vários módulos pertencem a `components/ui`; estruturas compartilhadas de navegação a `components/layout`. Layouts usados somente pela landing page ou pela entrada da turma ficam no próprio módulo. `pages` e `App.tsx` compõem as rotas existentes.

No Express, use as camadas atuais: rota → controller → serviço → Prisma. As validações ficam em `schemas`, o acesso Prisma em `config/prisma.ts` e os serviços já realizam acesso a dados; não há repositório artificial intermediário. No Python, preserve schemas em `api`, ciclo de conexão em `realtime`, integração/exportação em `services` e captura de hardware em `cli`.

## Documentação

- [Frontend e rotas](client/README.md)
- [API Express e banco](server/auth/README.md)
- [Serviço Python e configuração](server/ai/README.md)
- [Arquitetura](docs/documentacao_arquitetura.md)
- [Contratos da API](docs/API.md)
- [Deploy](docs/DEPLOYMENT.md)
- [Salvar transcrições](docs/QUICK_START_TRANSCRICOES.md)
- [Áudio e ruído](docs/AMBIENTE_BARULHENTO.md)
- [Limitações](docs/ANALYSIS.md), [planos](docs/Update.md) e [verificações](docs/VERIFICACAO.md)
