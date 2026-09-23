import icon from '../../assets/IconLogo.png'
import './project-logo.css'

type ProjectLogoProps = { iconOnly?: boolean; className?: string }

export default function ProjectLogo({ iconOnly = false, className = '' }: ProjectLogoProps) {
  return (
    <span className={`project-logo ${className}`}>
      <img
        className="project-logo-icon"
        src={icon}
        alt={iconOnly ? 'duallibras.ai' : ''}
        width={40}
        height={40}
      />
      {!iconOnly && <span className="project-logo-name">duallibras.ai</span>}
    </span>
  )
}
