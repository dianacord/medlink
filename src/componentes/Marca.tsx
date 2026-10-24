import { Link } from 'react-router-dom'

/** Logotipo de Medlink. */
export function Marca({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="inline-flex items-center">
      <img src="/marcas/medlink.png" alt="Medlink" className="h-8 w-auto" />
    </Link>
  )
}

/** Recordatorio fijo de que es un prototipo. */
export function PieDemo() {
  return <p className="py-4 text-center text-xs text-gris/80">Prototipo · datos sintéticos · no usar con pacientes reales</p>
}
