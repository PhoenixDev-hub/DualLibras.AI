# Integração de contas e turmas — 13/09/2026

Esta implementação substitui o painel demonstrativo por consultas autenticadas ao PostgreSQL através do Express. As descrições anteriores de dashboard exclusivamente local, identidade guest e bloqueio de geração Prisma são históricas.

## Fluxos disponíveis

- Cadastro e login usam cookie HTTP-only. Professor e administrador seguem para `/dashboard`; aluno segue para `/codigo`, com acesso às turmas existentes. Logout limpa a sessão.
- `/dashboard` consulta `/users/me` e `/education`, mostra carregamento, erro com nova tentativa e redireciona sessões inválidas ao login. Não preenche listas vazias com exemplos.
- Professor/admin cria sala com nome e descrição. Código e UUID vêm do backend. Edição persiste nome/descrição; a disciplina exibida vem do perfil do professor.
- Entrada por código cria participação com upsert, sem duplicação. Professor responsável/admin pode remover participantes.
- Painel lista salas próprias ou com participação; administrador visualiza todas. Lista alunos vinculados, aulas, transcrições/resumos persistidos, materiais e termos dos glossários acessíveis.
- Materiais podem ser enviados pela conta de professor/admin, até 25 MiB. O upload existente não associa o arquivo a turma/aula. Na sala, são listados apenas materiais associados às suas aulas.
- Botão Atualizar dados recarrega os registros; não há assinatura em tempo real.

## Contratos novos

Todas as rotas exigem sessão válida; token ausente, inválido ou cookie malformado retorna 401. Não existe fallback guest.

| Método | Rota                                        | Entrada/resultado                                                                  |
| ------ | ------------------------------------------- | ---------------------------------------------------------------------------------- |
| GET    | `/education`                                | `{ classrooms, students, lessons, materials, terms }`; somente dados acessíveis    |
| POST   | `/classrooms`                               | `{ name, description? }`; 201 `{ classroom }` com UUID/código gerados              |
| PATCH  | `/education/classrooms/:id`                 | `{ name, description? }`; dono/admin; 204                                          |
| POST   | `/education/join`                           | `{ code }`; normalizado para maiúsculas; `{ classroomId }`; código inexistente 404 |
| DELETE | `/education/classrooms/:id/members/:userId` | dono/admin; 204, idempotente                                                       |

`name` tem mínimo de dois caracteres após trim; descrição até 2000 caracteres. A resposta de turmas existente acrescenta `description`.

## Execução e validação

Configure `server/auth/.env` e `client/.env` usando os exemplos existentes. A URL `VITE_AUTH_BACKEND_HTTP_URL` deve apontar para o Express. Use o mesmo hostname no navegador e na API durante desenvolvimento (por exemplo, localhost) para manter o cookie disponível.

Em terminais separados, na raiz:

```sh
npm --prefix server/auth run dev
npm --prefix client run dev
```

A integração de contas/turmas não depende do Python. O serviço Python continua necessário para transcrição em `/app`.

Checks executados: builds frontend/Express aprovados; geração Prisma aprovada; leitura de usuários e salas no banco configurado aprovada. As relações Prisma foram apenas convertidas para sintaxe aceita: nenhuma tabela/campo foi acrescentado ou removido e nenhum `db push`, seed ou migração foi executado.

Teste versionado: `npm --prefix server/auth test`. Usa HTTP real, JWT e persistência simulada, cobrindo 401, cookie malformado, escopo de consultas, serialização de registros, bloqueio de edição por terceiro, validação, entrada por código, restrição de criação por perfil e criação de sala. Não grava no banco real.

O lint geral ainda acusa os dois erros e um aviso preexistentes em ManagementSection, VLibras e useAudioCapture. A criação real via navegador não foi executada nesta revisão; conexão real e testes com persistência simulada não substituem esse teste.

Roteiro manual: entrar como professor, criar turma, atualizar página, editar descrição, entrar como aluno com o código, atualizar a lista de pessoas, remover participação e confirmar com novo carregamento. Conferir também sessão encerrada e falha da API.

## Limites

Criação/encerramento de aulas, mural, arquivamento, edição de perfil e escrita de glossário ainda não estão integrados. Ações de simulação foram retiradas ou desabilitadas no painel conectado. O schema não possui disciplina/arquivamento próprios de sala. Não há download autenticado de materiais nesta entrega. Áudio/VLibras permanecem independentes; abrir uma aula salva mostra conteúdo persistido, sem simular transcrição ao vivo.

## Correção posterior do acesso do professor

O diagnóstico no serviço em execução identificou dois bloqueios após a autenticação: build antigo sem `/education` (404) e banco existente sem `Classroom.description`/`Glossary.classroomId` (P2022/500). O build Express foi refeito e o processo reiniciado. Foi aplicado o patch transacional [20260913_classroom_fields.sql](../server/auth/prisma/patches/20260913_classroom_fields.sql), que acrescenta somente as colunas opcionais, índice e chave estrangeira ausentes, preservando os registros. Essa aplicação é posterior à verificação inicial sem alterações de banco registrada acima.
