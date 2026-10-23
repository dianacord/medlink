import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, TriangleAlert } from 'lucide-react'
import type { Prioridad } from '../types'
import { PRIORIDAD } from './estilos'

export function EtiquetaPrioridad({ prioridad }: { prioridad: Prioridad }) {
  const p = PRIORIDAD[prioridad]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${p.clases}`}>
      <span className={`size-2 rounded-full ${p.punto}`} />
      {p.texto}
    </span>
  )
}

export function Chip({ children, alarma }: { children: ReactNode; alarma?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.8rem] font-medium ${alarma ? 'bg-alta text-white' : 'bg-primario-suave text-marino'}`}
    >
      {alarma && <TriangleAlert className="size-3.5" />}
      {children}
    </span>
  )
}

export function Tarjeta({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl bg-white p-5 shadow-[0_2px_12px_-4px_rgba(19,33,60,0.08)] ring-1 ring-gris-claro ${className}`}>{children}</section>
}

export function TituloSeccion({ children, accion }: { children: ReactNode; accion?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold">{children}</h2>
      {accion}
    </div>
  )
}

export function Volver({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gris hover:text-primario">
      <ArrowLeft className="size-4" />
      {children}
    </Link>
  )
}

/** Control segmentado para pestañas. */
export function Pestanas<T extends string>({
  opciones,
  valor,
  onCambio,
}: {
  opciones: { valor: T; texto: string; contador?: number }[]
  valor: T
  onCambio: (v: T) => void
}) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto rounded-2xl bg-primario-suave p-1">
      {opciones.map((o) => (
        <button
          key={o.valor}
          role="tab"
          aria-selected={o.valor === valor}
          onClick={() => onCambio(o.valor)}
          className={`flex-1 shrink-0 rounded-xl px-3 py-2 text-sm font-semibold whitespace-nowrap transition ${o.valor === valor ? 'bg-white text-primario shadow-sm' : 'text-gris hover:text-marino'}`}
        >
          {o.texto}
          {o.contador !== undefined && <span className="ml-1.5 text-xs opacity-70">{o.contador}</span>}
        </button>
      ))}
    </div>
  )
}

export function Vacio({ icono, titulo, children }: { icono: ReactNode; titulo: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl bg-primario-suave/60 px-6 py-12 text-center">
      <div className="text-primario">{icono}</div>
      <p className="mt-3 font-bold">{titulo}</p>
      {children && <div className="mt-1 text-sm text-gris">{children}</div>}
    </div>
  )
}

/** Mensaje de confirmación tras una acción. */
export function Confirmacion({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="mb-4 rounded-2xl bg-baja-suave px-4 py-3 text-sm font-semibold text-baja">
      {children}
    </p>
  )
}
