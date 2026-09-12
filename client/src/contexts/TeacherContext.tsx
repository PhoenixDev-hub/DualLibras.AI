import { createContext, useContext } from 'react'
import type { Classroom, Lesson, Material, Student, Term } from '../types/education'
export type TeacherState = {
  classrooms: Classroom[]
  students: Student[]
  lessons: Lesson[]
  materials: Material[]
  terms: Term[]
  setClassrooms: (value: Classroom[]) => void
  setStudents: (value: Student[]) => void
  setLessons: (value: Lesson[]) => void
  setMaterials: (value: Material[]) => void
  setTerms: (value: Term[]) => void
  openClassroom: (id: number) => void
  openLesson: (id: number) => void
  startLesson: (id?: number) => void
  editClassroom: (classroom?: Classroom) => void
  notify: (message: string) => void
  copy: (value: string) => void
}
export const TeacherContext = createContext<TeacherState | null>(null)
export function useTeacher() {
  const context = useContext(TeacherContext)
  if (!context) throw new Error('Área do professor indisponível')
  return context
}
