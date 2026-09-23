import { useAutoRefresh } from '../../../hooks/useAutoRefresh'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, ApiError, type DashboardUser } from '../../../services/authApi'
import type { Student, Lesson, Material, Term } from '../../../types/education'
import type { Classroom, Post } from '../../../types/education'
import type { TeacherState } from '../../../contexts/TeacherContext'

export function useTeacherDashboard() {
  const route = useNavigate()
  const [user, setUser] = useState<DashboardUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState('Início')
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [classroomId, setClassroomId] = useState<string | number | null>(null)
  const [lessonId, setLessonId] = useState<string | number | null>(null)
  const [editor, setEditor] = useState<Classroom | 'new' | null>(null)
  const [createdCode, setCreatedCode] = useState('')
  const [starting, setStarting] = useState<string | number | null>(null)
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [searchVersion, setSearchVersion] = useState(0)
  const [posts] = useState<Post[]>([])
  const refresh = useCallback(async () => {
    const data = await authApi.education()
    setClassrooms(data.classrooms)
    setStudents(data.students)
    setLessons(data.lessons)
    setMaterials(data.materials)
    setTerms(data.terms)
  }, [])
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const account = await authApi.me()
      const data =
        account.role === 'ADMIN'
          ? { classrooms: [], students: [], lessons: [], materials: [], terms: [] }
          : await authApi.education()
      setUser(account)
      if (account.role === 'PROFESSOR') {
        const live = data.lessons.find(item => item.status === 'live' && data.classrooms.some(room => room.id === item.classroomId && room.canAttachMaterials))
        setActiveLesson(live ?? null)
        if (live) setPage('Assistir aula')
      }
      setClassrooms(data.classrooms)
      setStudents(data.students)
      setLessons(data.lessons)
      setMaterials(data.materials)
      setTerms(data.terms)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) route('/entrar', { replace: true })
      else setError(err instanceof Error ? err.message : 'Não foi possível carregar seus dados.')
    } finally {
      setLoading(false)
    }
  }, [route])
  useEffect(() => {
    void load()
  }, [load])
  useAutoRefresh(
    async (isCurrent) => {
      const account = await authApi.me()
      if (!isCurrent()) return
      setUser((current) =>
        JSON.stringify(current) === JSON.stringify(account) ? current : account,
      )
      if (account.role === 'PROFESSOR') {
        const data = await authApi.education()
        if (!isCurrent()) return
        setClassrooms((current) =>
          JSON.stringify(current) === JSON.stringify(data.classrooms) ? current : data.classrooms,
        )
        setStudents((current) =>
          JSON.stringify(current) === JSON.stringify(data.students) ? current : data.students,
        )
        setLessons((current) =>
          JSON.stringify(current) === JSON.stringify(data.lessons) ? current : data.lessons,
        )
        setMaterials((current) =>
          JSON.stringify(current) === JSON.stringify(data.materials) ? current : data.materials,
        )
        setTerms((current) =>
          JSON.stringify(current) === JSON.stringify(data.terms) ? current : data.terms,
        )
      }
    },
    { enabled: !!user && !loading },
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
      route('/entrar', { replace: true })
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Não foi possível sair.')
    }
  }, [route])
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 6000)
    return () => window.clearTimeout(timer)
  }, [notice])
  async function finishActiveLesson() {
    if (!activeLesson) return
    await authApi.finishLesson(activeLesson.id)
    const finished: Lesson = { ...activeLesson, status: 'finished' }
    setLessons(current => current.map(item => item.id === finished.id ? finished : item))
    setActiveLesson(null)
    setPage('Minhas aulas')
    setNotice('Aula finalizada e confirmada pelo servidor.')
  }
  function navigate(next: string) {
    setPage(next)
    setClassroomId(null)
    setLessonId(null)
    window.scrollTo({ top: 0 })
  }
  function openClassroom(id: string | number) {
    setPage('Minhas turmas')
    setClassroomId(id)
    setLessonId(null)
  }
  function openLesson(id: string | number) {
    const selected = lessons.find(item => item.id === id)
    if (selected?.status === 'live' && classrooms.some(room => room.id === selected.classroomId && room.canAttachMaterials)) {
      setActiveLesson(selected)
      setPage('Assistir aula')
      return
    }
    setPage('Minhas aulas')
    setLessonId(id)
  }
  function startLesson(classroomId?: string | number) {
    if (activeLesson) {
      navigate('Assistir aula')
      return
    }
    setStarting(classroomId ?? 'choose')
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

  function unavailable() {
    setNotice('Esta alteração ainda não está disponível. Os dados do banco foram preservados.')
  }
  const contextValue: TeacherState = {
    user,
    refresh,
    logout,
    classrooms,
    students,
    lessons: activeLesson
      ? [activeLesson, ...lessons.filter((item) => item.id !== activeLesson.id)]
      : lessons,
    materials,
    terms,
    setClassrooms: unavailable,
    setStudents: unavailable,
    setLessons: unavailable,
    setMaterials: unavailable,
    setTerms: unavailable,
    openClassroom,
    openLesson,
    startLesson,
    editClassroom: (item) =>
      user?.role === 'PROFESSOR' || user?.role === 'ADMIN'
        ? setEditor(item ?? 'new')
        : setNotice('Somente professores podem criar ou editar turmas.'),
    notify: setNotice,
    copy,
  }

  return {
    loading,
    error,
    retry: () => {
        setPage('Início')
      return load()
    },
    contextValue,
    activeLesson,
    finishActiveLesson,
    beginLesson: (lesson: Lesson) => {
      setActiveLesson(lesson)
      navigate('Assistir aula')
    },
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
    setPosts: unavailable,
    navigate,
    goBack,
    searchClassrooms,
    copy,
  }
}
