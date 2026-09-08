import { ArrowLeft, GraduationCap, UserRound, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import logo from '../../assets/Logotipo.png'
import RoomNavButton from '../ui/RoomNavButton'

type Props = { onNavigate: (section: 'Minhas turmas' | 'Meus professores' | 'Usuário') => void }

export default function RoomHeader({ onNavigate }: Props) {
  return (
    <header className="relative z-10 border-b border-text-light/10 bg-background-dark font-ui">
      <nav aria-label="Navegação da sala" className="flex min-h-28 w-full flex-wrap items-center gap-2 px-5 py-5 sm:gap-1 sm:px-1 lg:gap-2 lg:px-14">
        <Link to="/" aria-label="DualLibras — início" className="mr-2 rounded-lg lg:mr-8 focus-visible:outline-2 focus-visible:outline-text-light">
          <img src={logo} alt="DualLibras" className="h-16 w-32 object-contain" />
        </Link>
        <RoomNavButton icon={UsersRound} onClick={() => onNavigate('Minhas turmas')}>Minhas turmas</RoomNavButton>
        <RoomNavButton icon={GraduationCap} onClick={() => onNavigate('Meus professores')}>Meus professores</RoomNavButton>
        <Link to="/" className="inline-flex min-h-12 items-center gap-3 rounded-lg px-4 text-sm lg:px-6 lg:text-base font-semibold hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-text-light">
          <ArrowLeft size={19} aria-hidden="true" /> Voltar
        </Link>
        <RoomNavButton icon={UserRound} onClick={() => onNavigate('Usuário')} className="sm:ml-auto">Usuário</RoomNavButton>
      </nav>
    </header>
  )
}
