import StudentDashboard from '../features/student/StudentDashboard'
import { Copy, X } from 'lucide-react'
import TeacherShell from '../components/layout/TeacherShell'
import { Modal } from '../components/ui'
import { TeacherContext } from '../contexts/TeacherContext'
import { useTeacherDashboard } from '../features/dashboard/hooks/useTeacherDashboard'
import Home from '../features/dashboard/pages/Home'
import ClassroomList from '../features/classrooms/pages/ClassroomList'
import ClassroomDetails from '../features/classrooms/pages/ClassroomDetails'
import Lessons from '../features/lessons/pages/Lessons'
import LiveLesson from '../features/lessons/pages/LiveLesson'
import LessonDetails from '../features/lessons/pages/LessonDetails'
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
    loading,
    error,
    retry,
    contextValue,
    activeLesson,
    beginLesson,
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

  const breadcrumbs: { label: string; onClick?: () => void }[] = [
    { label: 'Início', onClick: () => navigate('Início') },
  ]
  if (page === 'Assistir aula' && activeLesson) {
    breadcrumbs.push({ label: 'Minhas aulas', onClick: () => navigate('Minhas aulas') })
    breadcrumbs.push({ label: activeLesson.title })
  } else if (classroom) {
    breadcrumbs.push({ label: 'Turmas', onClick: () => navigate('Minhas turmas') })
    breadcrumbs.push({
      label: classroom.name,
      onClick: () => contextValue.openClassroom(classroom.id),
    })
    if (lesson) breadcrumbs.push({ label: lesson.title })
  } else if (lesson) {
    breadcrumbs.push({ label: 'Minhas aulas', onClick: () => navigate('Minhas aulas') })
    breadcrumbs.push({ label: lesson.title })
  } else if (page !== 'Início') {
    breadcrumbs.push({ label: page === 'Minhas turmas' ? 'Turmas' : page })
  }

  if (loading)
    return (
      <main className="p-10" role="status">
        Carregando sua conta e suas turmas…
      </main>
    )
  if (error)
    return (
      <main className="p-10">
        <p role="alert">{error}</p>
        <button onClick={() => void retry()}>Tentar novamente</button>
        <a href="/entrar"> Voltar ao login</a>
      </main>
    )
  if (contextValue.user?.role === 'ALUNO') {
    return (
      <>
        {notice && (
          <p role="status" className="teacher-toast">
            {notice}
          </p>
        )}
        <StudentDashboard
          user={contextValue.user}
          initialData={contextValue}
          logout={contextValue.logout}
        />
      </>
    )
  }
  return (
    <TeacherContext.Provider value={contextValue}>
      <TeacherShell
        page={page}
        breadcrumbs={breadcrumbs}
        hasActiveLesson={!!activeLesson}
        onNavigate={navigate}
        onBack={lesson || classroom || page !== 'Início' ? goBack : undefined}
        onSearch={searchClassrooms}
        onNotice={setNotice}
      >
        <div className="mb-5 flex gap-4">
          <button className="t-btn-secondary" onClick={() => void retry()}>
            Atualizar dados
          </button>
          <a className="t-btn-secondary" href="/codigo">
            Entrar com código
          </a>
        </div>
        {page === 'Assistir aula' && activeLesson ? (
          <LiveLesson key={activeLesson.id} lesson={activeLesson} />
        ) : lesson ? (
          <LessonDetails key={lesson.id} lesson={lesson} />
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
            Compartilhe este código para que os alunos entrem na turma.
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
        <StartLessonModal
          starting={starting}
          onClose={() => setStarting(null)}
          onStarted={beginLesson}
        />
      )}
    </TeacherContext.Provider>
  )
}
