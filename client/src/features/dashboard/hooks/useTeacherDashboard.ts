import { useEffect, useState } from 'react'
import {
  initialClassrooms,
  initialStudents,
  initialLessons,
  initialMaterials,
  initialTerms,
  initialPosts,
} from '../../../data/teacherDemo'
import type { Classroom, Post } from '../../../types/education'
import type { TeacherState } from '../../../contexts/TeacherContext'

export function useTeacherDashboard() {
  const [page, setPage] = useState('Início')
  const [classrooms, setClassrooms] = useState(initialClassrooms)
  const [students, setStudents] = useState(initialStudents)
  const [lessons, setLessons] = useState(initialLessons)
  const [materials, setMaterials] = useState(initialMaterials)
  const [terms, setTerms] = useState(initialTerms)
  const [classroomId, setClassroomId] = useState<number | null>(null)
  const [lessonId, setLessonId] = useState<number | null>(null)
  const [editor, setEditor] = useState<Classroom | 'new' | null>(null)
  const [createdCode, setCreatedCode] = useState('')
  const [starting, setStarting] = useState<number | 'choose' | null>(null)
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [searchVersion, setSearchVersion] = useState(0)
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 6000)
    return () => window.clearTimeout(timer)
  }, [notice])
  function navigate(next: string) {
    setPage(next)
    setClassroomId(null)
    setLessonId(null)
    window.scrollTo({ top: 0 })
  }
  function openClassroom(id: number) {
    setPage('Minhas turmas')
    setClassroomId(id)
    setLessonId(null)
  }
  function openLesson(id: number) {
    setLessonId(id)
  }
  function startLesson(id?: number) {
    if (id && classrooms.find((item) => item.id === id)?.archived) {
      setNotice('Reative a turma para iniciar uma nova aula.')
      return
    }
    const live = lessons.find((item) => item.status === 'live' && (!id || item.classroomId === id))
    if (live) openLesson(live.id)
    else setStarting(id ?? 'choose')
  }
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setNotice('Copiado para a área de transferência.')
    } catch {
      setNotice(`Não foi possível copiar automaticamente. Copie este conteúdo: ${value}`)
    }
  }
  const classroom = classrooms.find((item) => item.id === classroomId)
  const lesson = lessons.find((item) => item.id === lessonId)
  function goBack() {
    if (lesson) setLessonId(null)
    else if (classroom) setClassroomId(null)
    else navigate('Início')
  }

  function searchClassrooms(query: string) {
    setSearch(query)
    setSearchVersion((value) => value + 1)
    navigate('Minhas turmas')
  }

  const contextValue: TeacherState = {
    classrooms,
    students,
    lessons,
    materials,
    terms,
    setClassrooms,
    setStudents,
    setLessons,
    setMaterials,
    setTerms,
    openClassroom,
    openLesson,
    startLesson,
    editClassroom: (item) => setEditor(item ?? 'new'),
    notify: setNotice,
    copy,
  }

  return {
    contextValue,
    page,
    classroom,
    lesson,
    editor,
    setEditor,
    createdCode,
    setCreatedCode,
    starting,
    setStarting,
    notice,
    setNotice,
    search,
    searchVersion,
    posts,
    setPosts,
    navigate,
    goBack,
    searchClassrooms,
    copy,
  }
}
