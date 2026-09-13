# Limitações e análise do estado atual

> Atualização de integração: consulte [contas, turmas e dados persistidos](INTEGRACAO_FRONT_BACK.md). O painel agora consulta o banco, a autenticação exige sessão válida e a geração Prisma foi corrigida. As referências abaixo ao painel local, fallback guest e falha de geração registram o estado anterior.

Revisão de organização e documentação: 12/09/2026. Este documento consolida a análise anterior de 02/08/2026, corrigindo caminhos, padrões e descrições que já não correspondiam ao código. Contratos detalhados foram centralizados em [API.md](API.md), configuração no [guia Python](../server/ai/README.md) e estrutura no [guia de arquitetura](documentacao_arquitetura.md).

## Implementado e demonstrativo

A API Python recebe áudio em sessão por WebSocket, permite troca entre AssemblyAI/local, oferece sinalização WebRTC e exporta arquivos. A CLI é alternativa independente com captura de hardware. O frontend integra VLibras no protótipo `/app`/`/aula`.

O dashboard do professor contém somente estado local e dados fictícios. Não usa o banco, não inicia a sessão Python e não traduz suas transcrições de exemplo. O alfabeto mantém placeholders. A entrada por código não está integrada. Os modelos Prisma de aula, glossário e outras entidades não correspondem a uma API CRUD completa.

A ingestão de materiais apenas grava arquivo e metadados. Não há recuperação de contexto, embeddings, resumo automático ou assistente treinado. O PDF de documentação tem conteúdo estático e não varre o repositório.

## Autenticação e exposição

- Express valida credenciais no login, mas o middleware de rotas usa uma identidade de protótipo quando não há token válido. Controllers consultam esse usuário; não existe rejeição 401 uniforme.
- FastAPI não valida autenticação ou autorização HTTP/WebSocket, e seu CORS é aberto.
- Não há quotas, limitação de sessões ou rate limiting implementados.
- A ingestão Python não limita explicitamente o tamanho do material e usa `material_id` na composição do caminho sem sanitização equivalente à de `filename`.
- A rota PDF não reproduz a validação de nome do download genérico. As respostas de armazenamento podem expor caminhos locais.

Esses comportamentos foram preservados, pois corrigi-los mudaria regras e escopo. Exigem revisão antes de exposição pública.

## Sessão, arquivos e concorrência

- O backend cria `ClientSession` por conexão, mas não persiste `session_id`, usuário, turma ou proprietário.
- Não há broadcast da aula a alunos nem contrato de entrada/saída de turma.
- `TranscriptSaver` grava nomes fixos em `TRANSCRIPT_OUTPUT_DIR`; sessões simultâneas podem misturar ou sobrescrever saídas.
- Exportações usam timestamp com resolução de segundos, permitindo colisões.
- O modelo local é compartilhado; não há escalonamento de recursos entre usuários.
- Não há limpeza, rotação ou backup automático das saídas.
- Salvar cada trecho final com `AUTO_SAVE_TRANSCRIPTS` não equivale a consolidar uma aula.
- O serviço não valida codec/amostragem dos frames binários recebidos.

## Limites das integrações

A API AssemblyAI usa parâmetros mais simples que a CLI. Timeouts/reconexão/prompts configurados para CLI não garantem o mesmo comportamento na API. Algumas falhas do provedor apenas encerram tarefas e são registradas em log. JSON inválido no WebSocket pode ser somente logado; não há confirmação por frame.

WebRTC utiliza DataChannel e STUN configurado no código, sem TURN/deploy validado nesta revisão. Sem aiortc, a oferta é ignorada com log. O modo local depende de bibliotecas/modelos presentes; não garante que toda a aplicação funcione offline, pois o widget VLibras e outros recursos podem precisar da internet.

A identificação de falante inclui heurística, não avaliação biométrica. Simplificação textual e integração de avatar não garantem fidelidade linguística; sinais do alfabeto demonstrativo não foram inventados.

## Instalação, qualidade e operação

O schema Prisma atual falha na validação antes da geração limpa; os builds locais do Express usam cliente já gerado. O lint possui dois erros e um aviso preexistentes. Não há suíte automatizada versionada. Docker/Compose não pôde ser validado em execução e o comando inicial do container Express contém `prisma db push`.

Os [resultados das verificações](VERIFICACAO.md) distinguem aprovação local, falhas existentes e etapas não executadas. Novos recursos e hardening ficam no [planejamento](Update.md), sem serem apresentados como disponíveis.
