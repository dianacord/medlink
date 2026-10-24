import { ArrowLeftRight } from 'lucide-react'
import { useEntrarDePrueba } from './entrarDePrueba'
import type { Rol } from '../types'

// Solo para el prototipo: quien prueba la app desde el QR puede pasar de paciente a médico
// y ver cómo llega lo que acaba de enviar, sin cerrar sesión.

export function ModoPrueba({ rol }: { rol: Rol }) {
  const entrar = useEntrarDePrueba()
  const otro: Rol = rol === 'medico' ? 'paciente' : 'medico'
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-primario-suave/70 py-1.5 pr-1.5 pl-4 text-sm">
      <span className="whitespace-nowrap text-gris">
        <span className="hidden sm:inline">Prototipo · </span>Vista del{' '}
        <span className="font-semibold text-marino">{rol === 'medico' ? 'médico' : 'paciente'}</span>
      </span>
      <button
        onClick={() => entrar(otro)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 py-2 font-semibold text-primario shadow-sm hover:bg-primario hover:text-white"
      >
        <ArrowLeftRight className="size-4" />
        Ver como {otro === 'medico' ? 'médico' : 'paciente'}
      </button>
    </div>
  )
}
