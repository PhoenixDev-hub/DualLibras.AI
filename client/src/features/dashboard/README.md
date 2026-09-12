# Dashboard do professor

Acesse `/dashboard`. A página utiliza um professor fictício e dados em memória. Atualizar o navegador restaura os exemplos. Não há chamadas à API, captura de microfone ou tradução real nesta demonstração.

## Onde fica cada responsabilidade

A área do professor está organizada por funcionalidade, em vez de concentrada em uma pasta `teacher`:

```text
src/
├── components/
│   ├── layout/TeacherShell.tsx
│   └── ui/                       # Modal, Empty, PageTitle, SearchInput, Tabs
├── contexts/TeacherContext.tsx   # Dados e ações compartilhados pelas funcionalidades
├── data/teacherDemo.ts           # Exemplos usados na demonstração
├── features/
│   ├── classrooms/
│   │   ├── components/           # Card e formulário de turma
│   │   └── pages/                # Lista e detalhes da turma
│   ├── dashboard/
│   │   ├── hooks/                # Estado e navegação da demonstração
│   │   ├── legacy/               # Componentes antigos ligados à API, fora da tela atual
│   │   └── pages/                # Início do professor
│   ├── glossary/pages/
│   ├── lessons/
│   │   ├── components/           # Lista reutilizável e modal de início
│   │   └── pages/                # Aulas, aula em andamento e aula finalizada
│   ├── libras/                  # Alfabeto, widget e simplificação textual
│   ├── materials/pages/
│   ├── settings/pages/
│   └── students/pages/
├── pages/Dashboard.tsx           # Entrada da rota e composição das seções
├── styles/                      # global.css e teacher.css
├── types/education.ts            # Tipos compartilhados de turma, aula, aluno etc.
└── utils/initials.ts             # Função reutilizável para iniciais do avatar
```

Autenticação e landing page ficam em `features/auth` e `features/landing`; captura e transporte de áudio em `features/transcription`; histórico em `features/history`. Layouts exclusivos ficam no respectivo módulo.

## Convenções

- `pages/` dentro de uma funcionalidade contém suas telas; `src/pages/` contém as entradas usadas pelas rotas.
- `components/` dentro de uma funcionalidade contém elementos específicos dela.
- `components/ui/` reúne os elementos reutilizáveis, exportados por `index.ts`.
- `components/layout/` reúne a estrutura de navegação e os cabeçalhos.
- `hooks/` contém a lógica de estado e comportamento da funcionalidade.
- `contexts/`, `types/`, `data/` e `utils/` contêm recursos compartilhados por mais de uma funcionalidade.
- `legacy/` preserva o dashboard anterior, que não é importado pela rota atual.

Para remover uma seção, retire sua entrada de `navigation` em `components/layout/TeacherShell.tsx` e sua importação/renderização em `pages/Dashboard.tsx`. Verifique também os acessos rápidos que apontam para ela.

## Formatação e validação

Dentro de `client`:

```sh
npm run format
npm run format:check
npm run build
```

O Prettier está configurado em `.prettierrc.json`. Os comandos de formatação cobrem todo `client/src`. A estrutura completa fica no [README principal](../../../../README.md).

## Demonstração manual

1. Criar uma turma, copiar o código e conferir os estados vazios.
2. Publicar e excluir um aviso; adicionar um material fictício.
3. Buscar alunos, abrir suas informações e confirmar uma remoção.
4. Retomar a aula, pausar, ajustar os controles visuais e finalizar.
5. Editar o título de uma aula finalizada, baixar a transcrição fictícia e disponibilizá-la localmente.
6. Adicionar um termo, filtrar o glossário e abrir uma letra do alfabeto.
7. Conferir menu móvel, navegação com Tab e fechamento de modais com Escape.

Uploads e compartilhamento são simulados. O download gera um texto fictício. A cópia de código utiliza a área de transferência do navegador e apresenta uma mensagem caso não seja possível copiar.
