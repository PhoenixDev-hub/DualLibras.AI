export type Classroom = {
  id: number
  name: string
  subject: string
  description: string
  code: string
  archived: boolean
  color: string
}
export type Student = { id: number; name: string; classroomIds: number[]; joined: string }
export type Lesson = {
  id: number
  title: string
  classroomId: number
  date: string
  duration: string
  status: 'live' | 'finished'
}
export type Material = {
  id: number
  name: string
  subject: string
  type: string
  classroomId: number
}
export type Term = {
  id: number
  term: string
  definition: string
  subject: string
  example: string
}
export type Post = { id: number; classroomId: number; text: string; date: string }
