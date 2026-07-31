import {
  Clock3,
  Download,
  FilePlus2,
  FileText,
  GraduationCap,
  History,
  LayoutDashboard,
  LibraryBig,
  Settings,
  SlidersHorizontal,
  Upload,
  UserPlus,
  Video,
} from 'lucide-react'

export const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Minhas Turmas', icon: GraduationCap },
  { label: 'Aulas', icon: Video },
  { label: 'Materiais', icon: FileText },
  { label: 'Glossários', icon: LibraryBig },
  { label: 'Histórico', icon: History },
  { label: 'Configurações', icon: Settings },
]

export const stats = [
  { label: 'Aulas de Matemática', value: '128', detail: '+12 neste mês', icon: Video },
  { label: 'Turmas ativas', value: '18', detail: 'Ensino médio e extensão', icon: GraduationCap },
  { label: 'Horas de transcrição', value: '312h', detail: '98% processadas', icon: Clock3 },
  { label: 'Materiais da disciplina', value: '74', detail: 'PDFs, PPTs e DOCXs', icon: FileText },
]

export const quickActions = [
  { label: 'Criar sala de aula', icon: GraduationCap },
  { label: 'Enviar material', icon: FilePlus2 },
  { label: 'Convidar alunos', icon: UserPlus },
  { label: 'Preferências da turma', icon: SlidersHorizontal },
]

export const upcomingClasses = [
  { className: 'Funções quadráticas', group: '2º Ano A', time: '14:00', status: 'Hoje' },
  { className: 'Geometria plana', group: '3º Ano B', time: '16:20', status: 'Hoje' },
  { className: 'Estatística aplicada', group: 'Extensão', time: '09:30', status: 'Amanhã' },
]

export const recentActivity = [
  { label: 'Aula finalizada', detail: 'Matemática - 1º Ano C', time: 'há 18 min' },
  { label: 'Resumo gerado', detail: 'Matemática - Frações', time: 'há 42 min' },
  { label: 'Material enviado', detail: 'Lista de exercícios em PDF', time: '10:15' },
  { label: 'Glossário atualizado', detail: 'Termos de Álgebra', time: 'Ontem' },
  { label: 'Nova turma criada', detail: '2º Ano A', time: 'Ontem' },
]

export const managementSections = {
  'Minhas Turmas': {
    title: 'Minhas Turmas',
    description: 'Gerencie salas de aula, convites e preferências de acessibilidade por turma.',
    primaryAction: 'Criar sala de aula',
    icon: GraduationCap,
    rows: [
      { title: '2º Ano A', detail: 'Matemática • 32 alunos', meta: 'Transcrição automática ativa', action: 'Configurar' },
      { title: '3º Ano B', detail: 'Matemática • 28 alunos', meta: 'Glossário compartilhado', action: 'Convidar' },
      { title: 'Extensão', detail: 'Introdução à IA • 46 alunos', meta: 'Acesso por convite', action: 'Abrir' },
    ],
    asideTitle: 'Preferências rápidas',
    asideItems: ['Idioma base: Português', 'Libras: ativada', 'Resumo automático: ativado'],
  },
  Aulas: {
    title: 'Aulas',
    description: 'Inicie, acompanhe e encerre transcrições ao vivo da sua disciplina.',
    primaryAction: 'Iniciar transcrição',
    icon: Video,
    rows: [
      { title: 'Funções quadráticas', detail: '2º Ano A • Hoje 14:00', meta: 'Pronta para iniciar', action: 'Iniciar' },
      { title: 'Geometria plana', detail: '3º Ano B • Hoje 16:20', meta: 'Material anexado', action: 'Abrir' },
      { title: 'Estatística aplicada', detail: 'Extensão • Amanhã 09:30', meta: 'Roteiro pendente', action: 'Preparar' },
    ],
    asideTitle: 'Controles permitidos',
    asideItems: ['Iniciar transcrição', 'Encerrar transcrição', 'Gerar resumo da aula'],
  },
  Materiais: {
    title: 'Materiais',
    description: 'Envie PDFs, PPTs e DOCXs para apoiar transcrição, resumo e adaptação das aulas.',
    primaryAction: 'Fazer upload',
    icon: Upload,
    rows: [
      { title: 'Lista de exercícios.pdf', detail: '2º Ano A • PDF', meta: 'Enviado hoje', action: 'Abrir' },
      { title: 'Geometria plana.pptx', detail: '3º Ano B • PPT', meta: 'Usado em aula', action: 'Baixar' },
      { title: 'Roteiro estatística.docx', detail: 'Extensão • DOCX', meta: 'Aguardando revisão', action: 'Revisar' },
    ],
    asideTitle: 'Formatos aceitos',
    asideItems: ['PDF para textos e listas', 'PPT/PPTX para slides', 'DOC/DOCX para roteiros'],
  },
  Glossários: {
    title: 'Glossários',
    description: 'Organize termos da disciplina para melhorar consistência da tradução e dos resumos.',
    primaryAction: 'Criar glossário',
    icon: LibraryBig,
    rows: [
      { title: 'Álgebra', detail: '48 termos cadastrados', meta: 'Atualizado ontem', action: 'Editar' },
      { title: 'Geometria', detail: '36 termos cadastrados', meta: 'Compartilhado com 2 turmas', action: 'Abrir' },
      { title: 'Estatística', detail: '22 termos cadastrados', meta: 'Em construção', action: 'Continuar' },
    ],
    asideTitle: 'Uso do glossário',
    asideItems: ['Termos técnicos da disciplina', 'Sinais e explicações em Libras', 'Padronização entre turmas'],
  },
  Histórico: {
    title: 'Histórico',
    description: 'Consulte aulas finalizadas, transcrições salvas e resumos gerados.',
    primaryAction: 'Exportar histórico',
    icon: Download,
    rows: [
      { title: 'Frações e porcentagem', detail: '2º Ano A • 52 min', meta: 'Resumo gerado', action: 'Ver resumo' },
      { title: 'Equações do 2º grau', detail: '1º Ano C • 48 min', meta: 'Transcrição salva', action: 'Abrir' },
      { title: 'Plano cartesiano', detail: '3º Ano B • 61 min', meta: 'Material vinculado', action: 'Baixar' },
    ],
    asideTitle: 'Arquivos disponíveis',
    asideItems: ['Transcrição completa', 'Resumo da aula', 'Materiais vinculados'],
  },
  Configurações: {
    title: 'Configurações',
    description: 'Defina preferências da turma, notificações, acessibilidade e padrões de resumo.',
    primaryAction: 'Salvar preferências',
    icon: Settings,
    rows: [
      { title: 'Preferências da turma', detail: 'Resumo automático, idioma e visualização', meta: 'Ativo', action: 'Editar' },
      { title: 'Notificações', detail: 'Convites, aulas e uploads', meta: 'E-mail habilitado', action: 'Configurar' },
      { title: 'Acessibilidade', detail: 'Contraste, tamanho de fonte e Libras', meta: 'Alto contraste', action: 'Ajustar' },
    ],
    asideTitle: 'Perfil atual',
    asideItems: ['Professor: João', 'Disciplina: Matemática', 'Permissão: docente'],
  },
}

export type DashboardSection = 'Dashboard' | keyof typeof managementSections
