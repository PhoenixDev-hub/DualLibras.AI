# Otimização de desempenho — 22/09/2026

## Escopo e condições

Revisão do frontend React 19/TypeScript/Vite 8, API Express 5/Prisma 7/PostgreSQL e serviço FastAPI de áudio/transcrição. Foram lidos os READMEs, os contratos e fluxos implementados, as configurações de build, autenticação, consultas, filas e testes. Os READMEs antigos têm informações desatualizadas: atualmente existem testes, autenticação obrigatória e geração funcional do Prisma. Não foi encontrado AGENTS.md aplicável ao código do projeto.

A árvore de trabalho estava limpa no início desta revisão. Nenhuma migração, seed, operação em produção, download de modelo ou chamada a provedor pago foi executada. Os testes da API substituem Prisma por mocks; os testes de áudio substituem as conexões do provedor. As exportações de teste usam diretórios temporários.

## Evidências e alterações

| Gargalo observado                                                                                            | Alteração e arquivos                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `App.tsx` importava todas as páginas estaticamente, incluindo dashboard e captura de áudio                   | `React.lazy` e `Suspense` em `client/src/App.tsx`; mantém a landing imediata e os mesmos caminhos. Páginas completas são carregadas na navegação.                                                                                                                                                             |
| `cssMinify: false` no build                                                                                  | Removido em `client/vite.config.ts`, usando a minificação padrão. Classes, estilos e imagens foram preservados.                                                                                                                                                                                               |
| Leituras iguais concorrentes podiam ocorrer entre carregamento, atualização manual e automática              | `client/src/services/pendingRequests.ts` e `authApi.ts` compartilham apenas a Promise de GETs padrão em andamento. Não retêm resultados. Limpam referências no início/fim de mutações, em 401 e eventos entre abas. Requisições com opções próprias não são agrupadas. Login/logout também notificam as abas. |
| `logout` mudava de identidade a cada render do hook pai, invalidando callbacks/efeitos do administrador      | `useCallback` em `client/src/features/dashboard/hooks/useTeacherDashboard.ts`. Removida também uma lista em ref que acumulava aulas finalizadas sem ser lida.                                                                                                                                                 |
| Nginx não ativava gzip e atribuía cache imutável a worklets com URL fixa                                     | `client/nginx.conf` ativa gzip para tipos compressíveis; somente arquivos com hash em `/assets/` recebem cache imutável. Assets públicos com nome fixo são revalidados. HTML continua sem cache persistente.                                                                                                  |
| `/education` fazia uma segunda consulta do usuário após a validação da sessão                                | `server/auth/src/middlewares/auth.middleware.ts` guarda a identidade validada na própria requisição; `types/express.d.ts` tipa o valor e `routes/education.routes.ts` o reutiliza. Consulta de conta ativa/versão da sessão continua em cada requisição, sem cache de autorização.                            |
| Consulta de educação carregava campos completos de salas, aulas, resumos e glossários não usados na resposta | Projeções `select` em `education.routes.ts`. Mesmos filtros de acesso e mesmo contrato de resposta, incluindo transcrições e resumos completos.                                                                                                                                                               |
| Operações HTTP de arquivo/PDF eram síncronas dentro de `async def`                                           | Seis handlers em `server/ai/app/api/app.py` passaram a funções síncronas executadas pelo pool de threads do FastAPI: ingestão, exportação, listagem, downloads e status. WebSocket continua assíncrono.                                                                                                       |
| Nome das exportações tinha resolução de um segundo; fonte do PDF era registrada a cada exportação            | `server/ai/app/services/transcripts.py` usa sufixo UUID por exportação, compartilhado por seus formatos. Registro da fonte feito uma vez por processo, protegido por lock.                                                                                                                                    |
| Lint acusava criação de componente durante render no painel legado                                           | `client/src/features/dashboard/legacy/ManagementSection.tsx` acessa diretamente os componentes já existentes no mapa de ícones, mantendo o ícone e o fallback.                                                                                                                                                |

O agrupamento de GETs reduz somente requisições simultâneas idênticas, não todo o tráfego de polling. As atualizações automáticas de 15 segundos, de 5 segundos durante aula ao vivo e ao retornar à aba continuam funcionando.

## Medidas antes/depois

Mesmo ambiente local, Node 20.20.2, mesmas dependências e comando `npm --prefix client run build`. Valores em bytes do build de produção; não representam tempo de carregamento, LCP nem throughput de produção.

| Medida                                                                   |   Antes |  Depois |
| ------------------------------------------------------------------------ | ------: | ------: |
| JavaScript referenciado inicialmente pelo HTML, incluindo modulepreloads | 453.667 | 295.428 |
| CSS referenciado inicialmente pelo HTML                                  | 143.217 | 114.919 |
| Consultas de identidade por GET `/education`                             |       2 |       1 |

A contagem das consultas foi verificada por inspeção e teste com Prisma simulado, não por perfil de SQL em banco real. O restante das consultas de educação permanece necessário.

`node client/scripts/measure-build.mjs` reproduz a soma dos arquivos iniciais e informa também gzip nível 9. Não soma os chunks dinâmicos de páginas ainda não visitadas, imagens, fontes remotas ou scripts externos. Os chunks continuam disponíveis para carregamento posterior; a mudança não elimina seu custo quando usados.

## Validação executada

- `npm --prefix client run build`: aprovado, TypeScript e Vite.
- `npm --prefix client run lint`: aprovado em todo o frontend.
- `node --test client/tests/*.test.mjs`: 6 arquivos aprovados, incluindo áudio, playback, filas, buffer de transcrição e agrupamento de requisições.
- `npm --prefix server/auth test`: Prisma gerado, TypeScript compilado e 21 testes aprovados. Cobre permissões, contas bloqueadas, revogação de sessão, uploads/downloads e contratos de educação/administração.
- Em `server/ai`: `venv/bin/python -m unittest discover -s tests -v`: 17 testes aprovados. Inclui os 12 testes existentes de áudio/provedor e 5 testes novos de concorrência/armazenamento.
- O teste ASGI mantém uma exportação pendente numa thread e verifica que `/health` responde antes de liberá-la. Também verifica validação de texto vazio.
- Vinte exportações concorrentes de TXT/JSON preservam nomes distintos e conteúdo correspondente. Uma exportação real de PDF/TXT/JSON confirma geração dos três formatos e preservação do texto em português nos formatos textuais.
- `git diff --check`: aprovado.

Novos testes: `client/tests/pending-requests.test.mjs`, `server/ai/tests/test_storage_workers.py`; teste de educação ampliado em `server/auth/tests/education.test.cjs`. Dependência de testes ASGI declarada em `server/ai/requirements-dev.txt` (httpx, já disponível no ambiente).

Os testes HTTP Node exigiram execução autorizada fora do sandbox para abrir a porta local. Os testes Python com threads também foram executados fora do sandbox: dentro dele, o retorno da thread para o loop ficou bloqueado. Nenhum teste conectou ao banco ou ao provedor real.

## Limites e próximos pontos a medir

- Não houve medição em navegador de LCP, memória, navegação sob rede lenta ou comparação visual automatizada. A aparência foi preservada no código, mas a validação visual ainda precisa ser realizada.
- Nginx não está instalado no ambiente: configuração de compressão/cache preparada, mas sem `nginx -t` ou medição HTTP do container. Não foi iniciado Docker Compose, que pode alterar o banco pelo fluxo de inicialização existente.
- A imagem de fundo da landing continua com 1.878.555 bytes. Não houve conversão ou recompressão da imagem nesta revisão.
- `/education` ainda devolve todo o histórico autorizado e transcrições completas. Paginar ou separar detalhes exige adaptar o contrato e telas; não foi aplicado limite silencioso que escondesse conteúdo. Não foi identificado loop N+1 explícito nessa rota; existem consultas relacionais aninhadas que precisam de logs SQL/EXPLAIN em base representativa.
- Os índices das principais chaves estrangeiras e filtros já existem no schema. Nenhum índice especulativo ou migração foi criado sem plano de execução e volume real. Contagens do resumo administrativo e listas de opções ainda merecem avaliação com uma base grande.
- O cliente Prisma já é singleton. Limites do pool e desligamento gracioso do servidor Express continuam pontos a avaliar sob carga; não foram escolhidos novos limites sem conhecer a infraestrutura.
- O pipeline de áudio já tem fila limitada, descarte de quadros antigos, cancelamento e fechamento do provedor; o Whisper já executa inferência fora do loop. Modelos, parâmetros de qualidade e regras de descarte não foram modificados.
- A gravação contínua `TranscriptSaver` ainda reescreve JSON/SRT e usa nomes compartilhados; os handlers de documentação e o autosave opcional de PDF no fluxo ao vivo ainda fazem trabalho síncrono. Isolamento das sessões e persistência incremental precisam de uma revisão própria antes de prometer estabilidade multiusuário. As melhorias HTTP desta revisão não resolvem esses pontos.
- Sem avaliação real de microfone, GPU, duração longa, latência de AssemblyAI ou carga multiusuário. Os benefícios nesses cenários são esperados, não medidos.
