import type { Classroom, Student, Lesson, Material, Term, Post } from '../types/education'

export const teacher = {
  name: 'Marina Oliveira',
  initials: 'MO',
  email: 'marina.oliveira@escola.edu.br',
}
export const initialClassrooms: Classroom[] = [
  {
    id: 1,
    name: '2º Informática A',
    subject: 'Programação',
    description:
      'Um espaço para aprender, compartilhar ideias e dar os primeiros passos no desenvolvimento de sistemas.',
    code: 'DL-4827',
    archived: false,
    color: 'blue',
  },
  {
    id: 2,
    name: '1º Informática B',
    subject: 'Fundamentos da Informática',
    description: 'Tecnologia e pensamento computacional no dia a dia.',
    code: 'DL-1936',
    archived: false,
    color: 'teal',
  },
  {
    id: 3,
    name: '3º Administração',
    subject: 'Gestão de Projetos',
    description: 'Planejamento, colaboração e organização de projetos.',
    code: 'DL-7052',
    archived: false,
    color: 'violet',
  },
]
export const initialStudents: Student[] = [
  { id: 1, name: 'Ana Beatriz Santos', classroomIds: [1, 2], joined: '02/09/2026' },
  { id: 2, name: 'Lucas Ferreira', classroomIds: [1], joined: '02/09/2026' },
  { id: 3, name: 'Maria Eduarda Costa', classroomIds: [1, 3], joined: '03/09/2026' },
  { id: 4, name: 'Pedro Henrique Lima', classroomIds: [2], joined: '04/09/2026' },
  { id: 5, name: 'Júlia Rodrigues', classroomIds: [3], joined: '04/09/2026' },
]
export const initialLessons: Lesson[] = [
  {
    id: 1,
    title: 'Introdução à Programação',
    classroomId: 1,
    date: '12/09/2026',
    duration: '12 min',
    status: 'live',
  },
  {
    id: 2,
    title: 'Algoritmos no cotidiano',
    classroomId: 1,
    date: '11/09/2026',
    duration: '45 min',
    status: 'finished',
  },
  {
    id: 3,
    title: 'Hardware e software',
    classroomId: 2,
    date: '10/09/2026',
    duration: '50 min',
    status: 'finished',
  },
  {
    id: 4,
    title: 'Planejando um projeto',
    classroomId: 3,
    date: '09/09/2026',
    duration: '40 min',
    status: 'finished',
  },
]
export const initialMaterials: Material[] = [
  { id: 1, name: 'Guia de lógica de programação', subject: 'Lógica', type: 'PDF', classroomId: 1 },
  {
    id: 2,
    name: 'Introdução aos algoritmos',
    subject: 'Lógica',
    type: 'Apresentação',
    classroomId: 1,
  },
  {
    id: 3,
    name: 'Exercícios de variáveis',
    subject: 'Variáveis',
    type: 'Documento',
    classroomId: 1,
  },
  { id: 4, name: 'Biblioteca de estudos', subject: 'Referências', type: 'Link', classroomId: 2 },
]
export const initialTerms: Term[] = [
  {
    id: 1,
    term: 'Algoritmo',
    definition: 'Sequência organizada de passos para resolver um problema.',
    subject: 'Programação',
    example: 'Uma receita pode ser descrita como um algoritmo.',
  },
  {
    id: 2,
    term: 'Variável',
    definition: 'Espaço identificado por um nome que armazena um valor.',
    subject: 'Programação',
    example: 'A variável idade armazena o número 17.',
  },
  {
    id: 3,
    term: 'Banco de dados',
    definition: 'Coleção organizada de informações relacionadas.',
    subject: 'Informática',
    example: 'A escola organiza as matrículas em um banco de dados.',
  },
]
export const transcript =
  'Hoje vamos entender como organizar uma solução em etapas. Um algoritmo é uma sequência de instruções para resolver um problema. Pensem no caminho de casa até a escola: cada decisão faz parte dessa sequência. Na programação, usamos variáveis para guardar informações e estruturas de decisão para escolher o próximo passo.'
export const initialPosts: Post[] = [
  {
    id: 1,
    classroomId: 1,
    text: 'Bem-vindos ao nosso espaço de aprendizagem! Aqui vamos compartilhar avisos, materiais e descobertas. Nossa aula de Introdução à Programação está em andamento.',
    date: '12 de setembro de 2026, às 08:00',
  },
  {
    id: 2,
    classroomId: 1,
    text: 'Material adicionado: Guia de lógica de programação. Consulte a aba Materiais para revisar o conteúdo antes do próximo encontro.',
    date: '11 de setembro de 2026, às 14:30',
  },
]
