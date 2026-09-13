import { useState } from 'react'
import { Tabs } from '../../../components/ui'
import { useTeacher } from '../../../contexts/TeacherContext'
import type { Classroom, Post } from '../../../types/education'
import LessonList from '../../lessons/components/LessonList'
import Materials from '../../materials/pages/Materials'
import Students from '../../students/pages/Students'
export default function ClassroomDetails({
  classroom,
}: {
  classroom: Classroom
  posts: Post[]
  setPosts: (posts: Post[]) => void
}) {
  const { lessons, copy, editClassroom, user } = useTeacher()
  const [tab, setTab] = useState('Sobre')
  return (
    <>
      <header className="class-banner banner-blue mb-5 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold">{classroom.name}</h1>
        <p className="my-3">
          {classroom.teacherName} · {classroom.subject}
        </p>
        <button onClick={() => copy(classroom.code)}>Copiar código: {classroom.code}</button>
      </header>
      <Tabs items={['Sobre', 'Aulas', 'Materiais', 'Pessoas']} value={tab} onChange={setTab} />
      {tab === 'Sobre' && (
        <article className="t-card p-7">
          <p className="mb-5">{classroom.description || 'Esta turma ainda não tem descrição.'}</p>
          {(user?.role === 'PROFESSOR' || user?.role === 'ADMIN') && (
            <button className="t-btn" onClick={() => editClassroom(classroom)}>
              Editar turma
            </button>
          )}
        </article>
      )}
      {tab === 'Aulas' && (
        <LessonList lessons={lessons.filter((l) => l.classroomId === classroom.id)} />
      )}
      {tab === 'Materiais' && <Materials classroomId={classroom.id} />}
      {tab === 'Pessoas' && <Students classroomId={classroom.id} />}
    </>
  )
}
