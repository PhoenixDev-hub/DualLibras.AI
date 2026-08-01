type UserRole = 'PROFESSOR' | 'ALUNO' | 'SOCIEDADE' | 'ADMIN';

export type DashboardSection =
  | 'Dashboard'
  | 'Minhas Turmas'
  | 'Aulas'
  | 'Materiais'
  | 'Glossários'
  | 'Histórico'
  | 'Configurações';

export const roleLabels: Record<UserRole, string> = {
  PROFESSOR: 'Professor',
  ALUNO: 'Aluno',
  SOCIEDADE: 'Sociedade',
  ADMIN: 'Administrador',
};

const allSections: DashboardSection[] = [
  'Dashboard',
  'Minhas Turmas',
  'Aulas',
  'Materiais',
  'Glossários',
  'Histórico',
  'Configurações',
];

const sectionsByRole: Record<UserRole, DashboardSection[]> = {
  PROFESSOR: allSections,
  ADMIN: allSections,
  ALUNO: ['Dashboard', 'Minhas Turmas', 'Aulas', 'Materiais', 'Glossários', 'Histórico', 'Configurações'],
  SOCIEDADE: ['Dashboard', 'Materiais', 'Histórico', 'Configurações'],
};

export const roleCapabilities: Record<UserRole, Record<string, boolean>> = {
  PROFESSOR: {
    createClass: true,
    editClass: true,
    joinClass: true,
    createLesson: true,
    startTranscription: true,
    uploadMaterial: true,
    linkMaterial: true,
    createGlossary: true,
    editGlossary: true,
    exportHistory: true,
  },
  ADMIN: {
    createClass: true,
    editClass: true,
    joinClass: true,
    createLesson: true,
    startTranscription: true,
    uploadMaterial: true,
    linkMaterial: true,
    createGlossary: true,
    editGlossary: true,
    exportHistory: true,
  },
  ALUNO: {
    createClass: false,
    editClass: false,
    joinClass: true,
    createLesson: false,
    startTranscription: false,
    uploadMaterial: false,
    linkMaterial: false,
    createGlossary: false,
    editGlossary: false,
    exportHistory: true,
  },
  SOCIEDADE: {
    createClass: false,
    editClass: false,
    joinClass: false,
    createLesson: false,
    startTranscription: false,
    uploadMaterial: false,
    linkMaterial: false,
    createGlossary: false,
    editGlossary: false,
    exportHistory: false,
  },
};

const menuItems = [
  { label: 'Dashboard', icon: 'LayoutDashboard' },
  { label: 'Minhas Turmas', icon: 'GraduationCap' },
  { label: 'Aulas', icon: 'Video' },
  { label: 'Materiais', icon: 'FileText' },
  { label: 'Glossários', icon: 'LibraryBig' },
  { label: 'Histórico', icon: 'History' },
  { label: 'Configurações', icon: 'Settings' },
];

const dashboardData = {
  stats: [
    { label: 'Aulas de Matemática', value: '128', detail: '+12 neste mês', icon: 'Video' },
    { label: 'Turmas ativas', value: '18', detail: 'Ensino médio e extensão', icon: 'GraduationCap' },
    { label: 'Horas de transcrição', value: '312h', detail: '98% processadas', icon: 'Clock3' },
    { label: 'Materiais da disciplina', value: '74', detail: 'PDFs, PPTs e DOCXs', icon: 'FileText' },
  ],
  quickActions: [
    { label: 'Criar sala de aula', icon: 'GraduationCap', capability: 'createClass' },
    { label: 'Enviar material', icon: 'FilePlus2', capability: 'uploadMaterial' },
    { label: 'Convidar alunos', icon: 'UserPlus', capability: 'editClass' },
    { label: 'Preferências da turma', icon: 'SlidersHorizontal', capability: 'editClass' },
  ],
  upcomingClasses: [
    { className: 'Funções quadráticas', group: '2º Ano A', time: '14:00', status: 'Hoje' },
    { className: 'Geometria plana', group: '3º Ano B', time: '16:20', status: 'Hoje' },
    { className: 'Estatística aplicada', group: 'Extensão', time: '09:30', status: 'Amanhã' },
  ],
  recentActivity: [
    { label: 'Aula finalizada', detail: 'Matemática - 1º Ano C', time: 'há 18 min' },
    { label: 'Resumo gerado', detail: 'Matemática - Frações', time: 'há 42 min' },
    { label: 'Material enviado', detail: 'Lista de exercícios em PDF', time: '10:15' },
    { label: 'Glossário atualizado', detail: 'Termos de Álgebra', time: 'Ontem' },
    { label: 'Nova turma criada', detail: '2º Ano A', time: 'Ontem' },
  ],
  weeklyClasses: [58, 76, 64, 92, 83, 108, 96],
  transcriptionTime: [34, 48, 42, 61, 57, 72, 66],
  managementSections: {
    'Minhas Turmas': {
      title: 'Minhas Turmas',
      description: 'Gerencie salas de aula, convites e preferências de acessibilidade por turma.',
      primaryAction: 'Criar sala de aula',
      primaryCapability: 'createClass',
      icon: 'GraduationCap',
      rows: [
        { title: '2º Ano A', detail: 'Matemática • 32 alunos', meta: 'Transcrição automática ativa', action: 'Configurar', capability: 'editClass' },
        { title: '3º Ano B', detail: 'Matemática • 28 alunos', meta: 'Glossário compartilhado', action: 'Convidar', capability: 'editClass' },
        { title: 'Extensão', detail: 'Introdução à IA • 46 alunos', meta: 'Acesso por convite', action: 'Abrir', capability: 'joinClass' },
      ],
      asideTitle: 'Preferências rápidas',
      asideItems: ['Idioma base: Português', 'Libras: ativada', 'Resumo automático: ativado'],
    },
    Aulas: {
      title: 'Aulas',
      description: 'Inicie, acompanhe e encerre transcrições ao vivo da sua disciplina.',
      primaryAction: 'Iniciar transcrição',
      primaryCapability: 'startTranscription',
      icon: 'Video',
      rows: [
        { title: 'Funções quadráticas', detail: '2º Ano A • Hoje 14:00', meta: 'Pronta para iniciar', action: 'Iniciar', capability: 'startTranscription' },
        { title: 'Geometria plana', detail: '3º Ano B • Hoje 16:20', meta: 'Material anexado', action: 'Abrir', capability: 'startTranscription' },
        { title: 'Estatística aplicada', detail: 'Extensão • Amanhã 09:30', meta: 'Roteiro pendente', action: 'Preparar', capability: 'createLesson' },
      ],
      asideTitle: 'Controles permitidos',
      asideItems: ['Iniciar transcrição', 'Encerrar transcrição', 'Gerar resumo da aula'],
    },
    Materiais: {
      title: 'Materiais',
      description: 'Envie PDFs, PPTs e DOCXs para apoiar transcrição, resumo e adaptação das aulas.',
      primaryAction: 'Fazer upload',
      primaryCapability: 'uploadMaterial',
      icon: 'Upload',
      rows: [
        { title: 'Lista de exercícios.pdf', detail: '2º Ano A • PDF', meta: 'Enviado hoje', action: 'Abrir' },
        { title: 'Geometria plana.pptx', detail: '3º Ano B • PPT', meta: 'Usado em aula', action: 'Baixar' },
        { title: 'Roteiro estatística.docx', detail: 'Extensão • DOCX', meta: 'Aguardando revisão', action: 'Revisar', capability: 'linkMaterial' },
      ],
      asideTitle: 'Formatos aceitos',
      asideItems: ['PDF para textos e listas', 'PPT/PPTX para slides', 'DOC/DOCX para roteiros'],
    },
    Glossários: {
      title: 'Glossários',
      description: 'Organize termos da disciplina para melhorar consistência da tradução e dos resumos.',
      primaryAction: 'Criar glossário',
      primaryCapability: 'createGlossary',
      icon: 'LibraryBig',
      rows: [
        { title: 'Álgebra', detail: '48 termos cadastrados', meta: 'Atualizado ontem', action: 'Editar', capability: 'editGlossary' },
        { title: 'Geometria', detail: '36 termos cadastrados', meta: 'Compartilhado com 2 turmas', action: 'Abrir' },
        { title: 'Estatística', detail: '22 termos cadastrados', meta: 'Em construção', action: 'Continuar', capability: 'editGlossary' },
      ],
      asideTitle: 'Uso do glossário',
      asideItems: ['Termos técnicos da disciplina', 'Sinais e explicações em Libras', 'Padronização entre turmas'],
    },
    Histórico: {
      title: 'Histórico',
      description: 'Consulte aulas finalizadas, transcrições salvas e resumos gerados.',
      primaryAction: 'Exportar histórico',
      primaryCapability: 'exportHistory',
      icon: 'Download',
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
      icon: 'Settings',
      rows: [
        { title: 'Preferências da turma', detail: 'Resumo automático, idioma e visualização', meta: 'Ativo', action: 'Editar' },
        { title: 'Notificações', detail: 'Convites, aulas e uploads', meta: 'E-mail habilitado', action: 'Configurar' },
        { title: 'Acessibilidade', detail: 'Contraste, tamanho de fonte e Libras', meta: 'Alto contraste', action: 'Ajustar' },
      ],
      asideTitle: 'Perfil atual',
      asideItems: ['Professor: João', 'Disciplina: Matemática', 'Permissão: docente'],
    },
  },
};

export const dashboardService = {
  getAccess(role: string) {
    const normalizedRole = role.toUpperCase() as UserRole;
    const safeRole = roleCapabilities[normalizedRole] ? normalizedRole : 'ALUNO';

    return {
      roleLabel: roleLabels[safeRole],
      sections: sectionsByRole[safeRole],
      capabilities: roleCapabilities[safeRole],
    };
  },

  getDashboard(role: string) {
    const access = this.getAccess(role);
    return {
      access,
      menuItems: menuItems.filter((item) => access.sections.includes(item.label as DashboardSection)),
      ...dashboardData,
    };
  },
};
