import { Link } from 'react-router-dom'

/** Logotipo de Medlink. */
export function Marca({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-marino">
      <img src="/favicon.svg" alt="" className="size-8" />
      Medlink
    </Link>
  )
}

/** Recordatorio fijo de que es un prototipo. */
export function PieDemo() {
  return <p className="py-4 text-center text-xs text-gris/80">Prototipo · datos sintéticos · no usar con pacientes reales</p>
}
