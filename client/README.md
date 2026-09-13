# Frontend — DualLibras.AI

> Atualização de integração: consulte [contas, turmas e dados persistidos](../docs/INTEGRACAO_FRONT_BACK.md). O painel agora consulta o banco, a autenticação exige sessão válida e a geração Prisma foi corrigida. As referências abaixo ao painel local, fallback guest e falha de geração registram o estado anterior.

SPA React 19 + TypeScript, React Router 7, Vite 8, Tailwind CSS 4 e Lucide. Entrada: `index.html` → `src/main.tsx` → `src/App.tsx`. Não utiliza Next.js, SSR em produção ou roteamento por nomes de arquivos.

## Executar

Dentro de `client`, use `npm ci` e `npm run dev`. Requisitos de Node e estado da instalação estão no [README principal](../README.md). Se precisar alterar os endereços, copie `.env.example` para `.env` apenas se ainda não existir e ajuste as URLs públicas. Reinicie o Vite após mudar o ambiente.

| Comando | Função |
| --- | --- |
| `npm run dev` | Servidor Vite; porta padrão 5173 |
| `npm run build` | `tsc -b` e bundle Vite em `dist` |
| `npm run preview` | Visualiza o build local; não é servidor de produção |
| `npm run lint` | ESLint do projeto |
| `npm run format` | Prettier em todo `src` |
| `npm run format:check` | Confere formatação sem editar |

Não existe comando `npm test`. Os [resultados de verificação](../docs/VERIFICACAO.md) distinguem build aprovado e falhas de lint preexistentes.

## Rotas existentes

| Rota | Componente | Comportamento |
| --- | --- | --- |
| `/` | `pages/LandingPage.tsx` | Apresentação do projeto |
| `/entrar` | `pages/Auth.tsx` → `features/auth/pages/Login.tsx` | Login na API Express |
| `/cadastrar` | `pages/Auth.tsx` → `features/auth/pages/Cadastro.tsx` | Cadastro na API Express; redireciona a `/app` |
| `/dashboard` | `pages/Dashboard.tsx` | Demonstração do professor, sem consulta de sessão |
| `/codigo` | `pages/RoomCode.tsx` | Formulário de código; entrada real não integrada |
| `/app`, `/aula` | `pages/AppPrincipal.tsx` | Captura, transcrição e VLibras do protótipo |
| Demais caminhos | `Navigate` | Redirecionam a `/` |

O link de recuperação de senha aponta para uma rota ainda não implementada. Não há guardas de autenticação no roteador atual. A área demonstrativa não representa autorização de backend.

## Organização

- `pages`: composição das rotas.
- `features/auth/pages`: login e cadastro.
- `features/classrooms`: cards, formulários, páginas de turma e layout específico da entrada por código.
- `features/dashboard`: início, hook de navegação e componentes antigos preservados em `legacy`.
- `features/{lessons,students,materials,glossary,settings}`: seções demonstrativas do professor.
- `features/landing/{sections,layout}`: seções, cabeçalho e rodapé exclusivos da apresentação.
- `features/transcription/{hooks,services}`: captura no navegador e cliente WebSocket/WebRTC.
- `features/history/{components,hooks}`: histórico e exportação pela API Python.
- `features/libras`: widget real em `components`, simplificação textual em `utils` e alfabeto demonstrativo em `pages`.
- `components/ui`, `components/layout`: elementos compartilhados; não criar outra pasta concorrente de componentes genéricos.
- `contexts`, `data`, `types`: estado, exemplos e tipos compartilhados por várias seções da demonstração.
- `services/authApi.ts`: cliente HTTP compartilhado do Express e seus contratos.
- `config/backend.ts`: endereços dos dois serviços.
- `styles/global.css`: Tailwind, tema e regras globais do widget; `styles/teacher.css`: área do professor.
- `assets`: imagens importadas pelo bundler; `public`: arquivos acessados por URL, incluindo WASM, ONNX e worklets. Seus nomes públicos foram preservados.

`tailwind.config.js` foi preservado, mas o tema ativo está no CSS com `@theme`, e o build usa `@tailwindcss/vite`. Nenhuma configuração JavaScript foi adicionada à cadeia CSS.

O dashboard mantém dados em memória; a transcrição real não está integrada a ele. Leia o [guia da demonstração](src/features/dashboard/README.md). A integração VLibras depende de script externo; nenhuma qualidade linguística foi validada nesta revisão.

## Produção

`dist` é servido pelo Nginx do Dockerfile. As URLs Vite são argumentos de **build**, não variáveis de execução do container Nginx. Veja [deploy e limitações](../docs/DEPLOYMENT.md).
