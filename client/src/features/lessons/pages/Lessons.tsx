import { Video } from 'lucide-react'
import { PageTitle } from '../../../components/ui'
import { useTeacher } from '../../../contexts/TeacherContext'
import LessonList from '../components/LessonList'
export default function Lessons() {
  const { lessons, startLesson } = useTeacher()
  return (
    <>
      <PageTitle
        title="Minhas aulas"
        description="Todos os seus encontros e conteúdos em um só lugar."
        action={
          <button className="t-btn" onClick={() => startLesson()}>
            <Video size={17} />
            Iniciar aula
          </button>
        }
      />
      <LessonList lessons={lessons} />
    </>
  )
}
