# Contratos das APIs

> Atualização de integração: consulte [contas, turmas e dados persistidos](INTEGRACAO_FRONT_BACK.md). O painel agora consulta o banco, a autenticação exige sessão válida e a geração Prisma foi corrigida. As referências abaixo ao painel local, fallback guest e falha de geração registram o estado anterior.

Referência derivada das rotas, controllers, schemas e serviços existentes. Exemplos são fictícios. A interface demonstrativa do professor não chama estas APIs. Portas e URLs podem ser alteradas pelo ambiente.

## Express — `http://localhost:4000`

JSON de entrada limitado a `35mb` por `express.json`. Erros de aplicação: `{ "error": "mensagem" }`; erros inesperados: 500 com mensagem genérica. Cadastro/login usam validação Zod com 400 e `{ "error": "dados invalidos", "details": { ... } }`. As demais validações retornam a primeira mensagem em `error`.

### Sessão

`POST /auth/login` e `POST /auth/cadastro` retornam `{ user }` e definem cookie HTTP-only, nome padrão `festival_session`. O JWT não é retornado no JSON. O cookie dura sete dias; o token usa `JWT_EXPIRES_IN` (padrão `7d`). `COOKIE_SECURE=true` ativa `secure` e `sameSite=none`; caso contrário, `sameSite=lax`.

As rotas de usuários, dashboard, turmas e materiais passam por middleware que aceita `Authorization: Bearer <token>` ou cookie. **Comportamento de protótipo preservado:** ausência/falha do token define `guest-prototype-user-id`, sem rejeição imediata. Os controllers consultam o usuário e retornam 404 se não existir. Não considere essas rotas protegidas de forma completa em produção.

### Rotas

| Método e caminho | Entrada | Sucesso e regras |
| --- | --- | --- |
| `GET /health` | Nenhuma | 200 `{ "status": "ok" }`; não consulta banco |
| `POST /auth/cadastro` | `name` (mín. 2), `email`, `password` (mín. 8), `role`; campos opcionais abaixo | 201 `{ user }`; e-mail duplicado: 409 |
| `POST /auth/login` | `email`, `password` não vazia | 200 `{ user }`; credenciais inválidas: 401 |
| `POST /auth/logout` | Nenhuma | 204, limpa cookie; não invalida outros JWTs já emitidos |
| `GET /users/me` | Cookie/Bearer ou fallback | 200 usuário, perfis e `access`; 404 se ausente |
| `GET /dashboard` | Cookie/Bearer ou fallback | 200 dados de dashboard; combinação de consultas e exemplos estáticos |
| `GET /classrooms` | Cookie/Bearer ou fallback | 200 `{ classrooms: [...] }` |
| `POST /classrooms` | `{ "name": "Turma de exemplo" }`, nome aparado mín. 2 | 201 `{ classroom }`; somente PROFESSOR/ADMIN, demais 403 |
| `GET /materials` | Cookie/Bearer ou fallback | 200 `{ materials: [...] }` |
| `POST /materials` | `filename`, `contentBase64`, `classroomId?` UUID | 201 `{ material, ai: { sent, status } }`; somente PROFESSOR/ADMIN |

`role` no cadastro aceita `PROFESSOR`, `ALUNO` e `SOCIEDADE`, não `ADMIN`. Professor exige `discipline`; aluno exige `registrationNumber`; `institution` é opcional. Os campos de perfil são criados de acordo com o papel.

Exemplo de cadastro:

```json
{
  "name": "Professor Exemplo",
  "email": "professor@example.com",
  "password": "senha_apenas_de_exemplo",
  "role": "PROFESSOR",
  "discipline": "Programação",
  "institution": "Escola Exemplo"
}
```

Usuário de login: `id`, `name`, `email`, `role`, `discipline?`, `institution?`, `registrationNumber?`. Cadastro retorna os dados cadastrados, mas não inclui `registrationNumber` na resposta atual. `/users/me` acrescenta `createdAt` e `access: { roleLabel, sections, capabilities }`. Campos `undefined` podem ser omitidos no JSON.

Dashboard retorna `access`, `menuItems`, `stats`, `quickActions`, `upcomingClasses`, `recentActivity`, `weeklyClasses`, `transcriptionTime` e `managementSections`. Capacidades declaradas na resposta não significam que exista um endpoint para cada ação.

Turma serializada: `id`, `name`, `code`, `studentsCount`, `lessonsCount`, `createdAt`. Professor lista suas turmas; ADMIN lista todas; outros papéis listam turmas nas quais são membros. Criação gera código a partir do nome e sufixo aleatório, verificando colisões. **Não há rota de entrar por código, editar, arquivar ou remover turma.**

Material serializado: `id`, `name`, `url`, `type`, `displayType`, `createdAt`. ADMIN lista todos; demais listam os que enviaram. Tipos aceitos: PDF, DOC, DOCX, PPT, PPTX e TXT. O conteúdo aceita Base64 simples ou data URL; limite padrão de arquivo decodificado: 25 MiB. `url` é um caminho de disco, não uma URL pública de download. O serviço não utiliza `classroomId`, embora o schema valide esse campo.

O upload grava no disco e no Prisma, depois tenta enviar a `/materials/ingest` da IA. Falha nesse envio mantém o upload e retorna `ai.sent=false`, `status="pendente"`; não há worker de reenvio configurado. Sucesso retorna `status="enviado"`.

Não existem rotas CRUD de aulas, alunos ou glossários nesta API, apesar de haver modelos e telas de exemplo.

## FastAPI — `http://localhost:5455`

Rotas definidas em [app/api/app.py](../server/ai/app/api/app.py), schemas em [schemas.py](../server/ai/app/api/schemas.py). Não há autenticação HTTP/WebSocket. Validação Pydantic retorna 422; erros de rota usam `{ "detail": ... }`.

| Método e caminho | Entrada | Resposta |
| --- | --- | --- |
| `GET /health` | Nenhuma | `{ status: "ok", porta, webrtc_suportado }` |
| `POST /test-message` | Nenhuma | `{ status: "ok", message }`; não envia áudio |
| `POST /save-transcript` | Modelo descrito abaixo | `{ success, message, files, metadata }` |
| `GET /transcripts` | Nenhuma | `{ total, pdfs, texts, metadata }`; arrays de nomes |
| `GET /transcripts/download/{filename}` | Nome de arquivo | PDF ou `text/plain` para TXT/JSON; 400 para nome inválido, 404 se ausente |
| `GET /transcripts/pdf/{filename}` | Nome de PDF | `application/pdf`; 404 se ausente |
| `GET /upload-status` | Nenhuma | `{ paths: { base, pdfs, texts, metadata }, counts: { pdfs, texts, metadata }, total_size_mb, status }` |
| `POST /materials/ingest` | Modelo descrito abaixo | `{ success, message, file }` |
| `GET /documentation/generate` | Nenhuma | Gera PDF; `{ success, message, file, download_url }` |
| `GET /documentation/download` | Nenhuma | PDF; gera se ainda não existir |
| `GET /docs`, `/redoc`, `/openapi.json` | Nenhuma | Documentação automática do FastAPI |
| `WS /ws` | Áudio e mensagens descritos abaixo | Sessão de transcrição por conexão |

### Transcrições

```json
{
  "text": "Texto fictício de uma aula.",
  "title": "Aula de exemplo",
  "formats": ["pdf", "txt", "json"],
  "metadata": { "disciplina": "Programação" }
}
```

`text` é obrigatório e tem tamanho mínimo 1; somente espaços resulta em 400. `title` padrão: `Transcrição`; `formats`: PDF/TXT/JSON; `metadata`: objeto vazio. Formatos desconhecidos são ignorados pelo gerenciador, não rejeitados pelo schema. Falhas de escrita/geração resultam em 500.

`formats: []` também usa os três formatos padrão. Os identificadores são minúsculos e sensíveis a maiúsculas: uma lista contendo apenas formatos desconhecidos, como `["DOCX"]`, retorna sucesso com `files: {}` e nenhum arquivo salvo.

`files` mapeia os formatos salvos para caminhos relativos a `OUTPUT_PATH`, como `transcripts/pdfs/transcricao_<timestamp>.pdf`. `metadata` inclui título, tamanho e formatos salvos, além dos dados fornecidos. Evite campos reservados como `text`, `title` e `formats` dentro de `metadata`, pois ele é expandido como argumentos da função de salvamento.

O arquivo JSON contém `title`, `text`, `timestamp`, `filename_base`, `formats` e os metadados adicionais. Seu campo `formats` é montado antes de registrar o próprio JSON: normalmente contém `["pdf", "txt"]`, ou `[]` numa exportação somente JSON. Para saber todos os formatos efetivamente salvos, use `files` ou `metadata.formats_saved` da resposta HTTP. Metadados fornecidos podem sobrescrever campos calculados; evite também `formats_saved`, `text_length`, `timestamp` e `filename_base`.

`GET /transcripts` conta arquivos, não aulas: uma exportação em três formatos pode aumentar `total` em três. Saídas contínuas TXT/JSON/SRT em `TRANSCRIPT_OUTPUT_DIR` são separadas dessa listagem. A rota PDF não possui a mesma validação explícita do nome implementada na rota de download genérica.

### Ingestão de material

```json
{
  "material_id": "material-exemplo",
  "filename": "anotacoes.txt",
  "display_type": "Texto",
  "content_base64": "RXhlbXBsbw==",
  "uploaded_by": "usuario-exemplo"
}
```

Os quatro primeiros campos são obrigatórios; `uploaded_by` é opcional. A rota grava o arquivo e um JSON de metadados em `MATERIAL_OUTPUT_DIR`. Não extrai texto, não gera resumo e não vincula o material ao modelo de transcrição. `filename` usa o nome-base do caminho, mas `material_id` não recebe validação equivalente. Não há limite explícito de tamanho nessa API.

### WebSocket

O navegador envia PCM binário mono, 16 bits, compatível com a amostragem configurada (padrão 16 kHz). A API não valida o formato binário recebido. Também aceita JSON:

```json
{ "type": "ping" }
```

```json
{ "type": "set_provider", "provider": "local" }
```

```json
{ "type": "webrtc_offer", "sdp": "SDP produzido pelo navegador" }
```

Provedores permitidos: `assemblyai` e `local`; valor inválido produz mensagem `error`. WebRTC utiliza um DataChannel para áudio, com sinalização pelo WebSocket. Sem aiortc, a oferta é ignorada com log. Não há protocolo de turma, token, identificador persistido de aula ou broadcast entre alunos.

Respostas possíveis: `status` com `mode`/`connected`/`text`, `transcript`, `webrtc_answer` com `sdp`, `pong` e `error` com `text`/`error`/`is_final`. Exemplo:

```json
{
  "type": "transcript",
  "text": "Hoje vamos estudar algoritmos.",
  "is_final": true,
  "speaker": "Professor"
}
```

A propriedade na rede é `is_final`; o cliente a normaliza para `isFinal`. Identificação de falante pode usar heurística textual e não comprova reconhecimento biométrico. Cada conexão possui uma sessão, encerrada ao fechar o WebSocket. Vários clientes podem disputar os mesmos arquivos contínuos; veja [limitações](ANALYSIS.md).
