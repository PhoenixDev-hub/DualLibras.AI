export type Classroom = {
  id: string | number
  name: string
  teacherName?: string
  subject: string
  description: string
  code: string
  archived: boolean
  color: string
}
export type Student = {
  id: string | number
  name: string
  classroomIds: (string | number)[]
  joined: string
}
export type Lesson = {
  id: string | number
  transcript?: string
  summary?: string
  title: string
  classroomId: string | number
  date: string
  duration: string
  status: 'live' | 'finished' | 'scheduled' | 'cancelled'
}
export type Material = {
  lessonId?: string | number | null
  id: string | number
  name: string
  subject: string
  type: string
  classroomId: string | number
}
export type Term = {
  id: string | number
  term: string
  definition: string
  subject: string
  example: string
}
export type Post = { id: string | number; classroomId: string | number; text: string; date: string }
