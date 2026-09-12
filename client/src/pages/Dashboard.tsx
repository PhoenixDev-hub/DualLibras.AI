import { Copy, X } from 'lucide-react'
import TeacherShell from '../components/layout/TeacherShell'
import { Modal } from '../components/ui'
import { TeacherContext } from '../contexts/TeacherContext'
import { useTeacherDashboard } from '../features/dashboard/hooks/useTeacherDashboard'
import Home from '../features/dashboard/pages/Home'
import ClassroomList from '../features/classrooms/pages/ClassroomList'
import ClassroomDetails from '../features/classrooms/pages/ClassroomDetails'
import Lessons from '../features/lessons/pages/Lessons'
import LessonDetails from '../features/lessons/pages/LessonDetails'
import LiveLesson from '../features/lessons/pages/LiveLesson'
import StartLessonModal from '../features/lessons/components/StartLessonModal'
import ClassroomFormModal from '../features/classrooms/components/ClassroomFormModal'
import Students from '../features/students/pages/Students'
import Materials from '../features/materials/pages/Materials'
import Glossary from '../features/glossary/pages/Glossary'
import LearnLibras from '../features/libras/pages/LearnLibras'
import Settings from '../features/settings/pages/Settings'
import '../styles/teacher.css'
export default function Dashboard() {
  const {
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
  } = useTeacherDashboard()

  return (
    <TeacherContext.Provider value={contextValue}>
      <TeacherShell
        page={page}
        onNavigate={navigate}
        onBack={lesson || classroom || page !== 'Início' ? goBack : undefined}
        onSearch={searchClassrooms}
        onNotice={setNotice}
      >
        {lesson ? (
          lesson.status === 'live' ? (
            <LiveLesson key={lesson.id} lesson={lesson} />
          ) : (
            <LessonDetails key={lesson.id} lesson={lesson} />
          )
        ) : classroom ? (
          <ClassroomDetails
            key={classroom.id}
            classroom={classroom}
            posts={posts}
            setPosts={setPosts}
          />
        ) : (
          <>
            {page === 'Início' && <Home onNavigate={navigate} />}
            {page === 'Minhas turmas' && (
              <ClassroomList key={searchVersion} initialQuery={search} />
            )}
            {page === 'Minhas aulas' && <Lessons />}
            {page === 'Meus alunos' && <Students />}
            {page === 'Materiais' && <Materials />}
            {page === 'Glossário' && <Glossary />}
            {page === 'Aprender Libras' && <LearnLibras />}
            {page === 'Configurações' && <Settings />}
          </>
        )}
      </TeacherShell>
      {notice && (
        <section role="status" className="teacher-toast">
          <p>{notice}</p>
          <button aria-label="Fechar mensagem" onClick={() => setNotice('')}>
            <X size={18} />
          </button>
        </section>
      )}
      {editor && (
        <ClassroomFormModal
          editor={editor}
          onClose={() => setEditor(null)}
          onCreated={setCreatedCode}
        />
      )}
      {createdCode && (
        <Modal title="Sua turma está pronta!" onClose={() => setCreatedCode('')}>
          <p className="text-sm text-slate-500">
            Compartilhe este código fictício para demonstrar o convite da turma.
          </p>
          <p className="my-7 rounded-xl bg-blue-50 p-6 text-center font-mono text-3xl font-bold tracking-widest text-primary">
            {createdCode}
          </p>
          <button className="t-btn w-full" onClick={() => copy(createdCode)}>
            <Copy size={16} />
            Copiar código
          </button>
        </Modal>
      )}
      {starting !== null && (
        <StartLessonModal starting={starting} onClose={() => setStarting(null)} />
      )}
    </TeacherContext.Provider>
  )
}
