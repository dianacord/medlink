import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, type LucideIcon } from 'lucide-react'

type Variante = 'primario' | 'secundario' | 'suave' | 'peligro'

const ESTILOS: Record<Variante, string> = {
  primario: 'bg-primario text-white shadow-[0_8px_20px_-8px_rgba(74,144,217,0.7)] hover:bg-primario-oscuro',
  secundario: 'border-[1.5px] border-primario bg-white text-primario hover:bg-primario-suave',
  suave: 'bg-primario-suave text-primario hover:bg-primario-borde/60',
  peligro: 'bg-alta text-white hover:brightness-95',
}

interface Props {
  children: ReactNode
  icono?: LucideIcon
  variante?: Variante
  /** Chevron a la derecha (por defecto en botones de navegación). */
  chevron?: boolean
  /** Botón más bajo, para acciones dentro de tarjetas. */
  compacto?: boolean
  to?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}

/** Botón grande con esquinas muy redondeadas, icono de línea a la izquierda y chevron a la derecha. */
export function Boton({ children, icono: Icono, variante = 'primario', chevron, compacto, to, onClick, type = 'button', disabled, className = '' }: Props) {
  const conChevron = chevron ?? !!to
  const clases = [
    'flex w-full items-center gap-3 sm:gap-4 rounded-[20px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    compacto ? 'min-h-12 px-4 py-2.5 text-[0.95rem]' : 'min-h-16 px-5 py-4 text-base sm:px-6 sm:text-lg',
    ESTILOS[variante],
    className,
  ].join(' ')
  const contenido = (
    <>
      {Icono && <Icono className={compacto ? 'size-5 shrink-0' : 'size-7 shrink-0'} strokeWidth={1.6} />}
      <span className={conChevron || Icono ? 'flex-1 text-left' : 'flex-1 text-center'}>{children}</span>
      {conChevron && <ChevronRight className="size-5 shrink-0" strokeWidth={2} />}
    </>
  )
  if (to && !disabled) {
    return (
      <Link to={to} className={clases}>
        {contenido}
      </Link>
    )
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={clases}>
      {contenido}
    </button>
  )
}
