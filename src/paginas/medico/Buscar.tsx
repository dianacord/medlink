import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Search, UserRoundX } from 'lucide-react'
import { EtiquetaPrioridad, Vacio } from '../../componentes/ui'
import { useEstado } from '../../datos/almacen'
import { avisoAbierto, seguimientoActual, ultimaActualizacion } from '../../datos/modelo'
import { normalizar } from '../../logica/formato'
import { nombreCompleto } from '../../logica/paciente'

export default function Buscar() {
  const estado = useEstado()
  const [texto, setTexto] = useState('')
  const busqueda = normalizar(texto.trim())
  const resultados = estado.pacientes
    .filter((p) => !busqueda || normalizar(nombreCompleto(p)).includes(busqueda) || p.nhc.includes(busqueda))
    .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es'))

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
      <label className="relative mt-5 block max-w-xl">
        <span className="sr-only">Buscar por nombre o número de historia clínica</span>
        <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-gris" />
        <input
          type="search"
          autoFocus
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Nombre o nº de historia clínica"
          className="h-14 w-full rounded-2xl border border-gris-claro bg-white pr-4 pl-12 text-base outline-none focus:border-primario focus:ring-2 focus:ring-primario/20"
        />
      </label>

      <ul className="mt-5 grid gap-3 md:grid-cols-2">
        {resultados.map((p) => {
          const seg = seguimientoActual(estado, p.id)
          const aviso = seg && avisoAbierto(estado, seg.seguimientoId)
          return (
            <li key={p.id}>
              <Link to={`/medico/paciente/${p.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-gris-claro hover:ring-primario">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{nombreCompleto(p)}</span>
                  <span className="block text-sm text-gris">
                    NHC {p.nhc} · {p.edad} años
                  </span>
                </span>
                {aviso ? (
                  <EtiquetaPrioridad prioridad={ultimaActualizacion(estado, aviso.id).prioridad} />
                ) : seg ? (
                  <span className="rounded-full bg-baja-suave px-2.5 py-1 text-xs font-bold text-baja">En verde</span>
                ) : (
                  <span className="rounded-full bg-gris-claro px-2.5 py-1 text-xs font-bold text-gris">Sin seguimiento</span>
                )}
                <ChevronRight className="size-5 shrink-0 text-gris" />
              </Link>
            </li>
          )
        })}
      </ul>
      {!resultados.length && (
        <Vacio icono={<UserRoundX className="size-8" />} titulo="No hay pacientes con ese nombre o NHC" />
      )}
    </div>
  )
}
