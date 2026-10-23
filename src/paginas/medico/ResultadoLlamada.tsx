import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CircleCheck, SlidersHorizontal, TriangleAlert } from 'lucide-react'
import { Volver } from '../../componentes/ui'
import { actualizar, useEstado } from '../../datos/almacen'
import { estadoCita, paciente as buscarPaciente, registrarResultado } from '../../datos/modelo'
import { fechaConDia, hora } from '../../logica/formato'
import { nombreCompleto } from '../../logica/paciente'
import type { ResultadoLlamada as Resultado } from '../../types'

const OPCIONES: { valor: Resultado; titulo: string; texto: string; icono: typeof CircleCheck; clases: string }[] = [
  { valor: 'estable', titulo: 'Estable', texto: 'Se archiva el aviso y el seguimiento continúa igual.', icono: CircleCheck, clases: 'bg-baja-suave text-baja' },
  { valor: 'ajustar', titulo: 'Ajustar seguimiento', texto: 'Se archiva el aviso y abres la configuración del seguimiento.', icono: SlidersHorizontal, clases: 'bg-primario-suave text-primario' },
  { valor: 'grave', titulo: 'Grave', texto: 'Necesita verle en persona: programas una cita presencial.', icono: TriangleAlert, clases: 'bg-alta-suave text-alta' },
]

export default function ResultadoLlamada() {
  const { id } = useParams()
  const navigate = useNavigate()
  const estado = useEstado()
  const cita = estado.citas.find((c) => c.id === id)
  if (!cita) return <Navigate to="/medico" replace />
  const p = buscarPaciente(estado, cita.pacienteId)!

  const realizada = estadoCita(estado, cita.id) === 'realizada'

  const elegir = (resultado: Resultado) => {
    actualizar((e) => registrarResultado(e, cita.id, resultado))
    if (resultado === 'estable') navigate('/medico', { state: { mensaje: `${nombreCompleto(p)}: estable. Aviso archivado.` } })
    if (resultado === 'ajustar') navigate(`/medico/paciente/${p.id}/seguimiento`)
    if (resultado === 'grave') navigate(`/medico/aviso/${cita.avisoId}?accion=presencial`)
  }

  return (
    <div className="max-w-xl">
      <Volver to={cita.avisoId ? `/medico/aviso/${cita.avisoId}` : '/medico'}>Aviso</Volver>
      <h1 className="text-3xl font-bold tracking-tight">¿Cómo ha ido la llamada?</h1>
      <p className="mt-2 text-gris first-letter:uppercase">
        {nombreCompleto(p)} · {fechaConDia(cita.fechaHora)}, {hora(cita.fechaHora)}
      </p>
      {realizada && <p className="mt-4 rounded-2xl bg-primario-suave p-4 text-sm font-semibold">Esta llamada ya tiene un resultado registrado.</p>}
      <div className="mt-6 space-y-3">
        {!realizada && OPCIONES.map(({ valor, titulo, texto, icono: Icono, clases }) => (
          <button
            key={valor}
            onClick={() => elegir(valor)}
            className="flex w-full items-center gap-4 rounded-[20px] bg-white p-5 text-left ring-1 ring-gris-claro transition hover:ring-2 hover:ring-primario"
          >
            <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${clases}`}>
              <Icono className="size-6" strokeWidth={1.8} />
            </span>
            <span>
              <span className="block text-lg font-bold">{titulo}</span>
              <span className="block text-sm text-gris">{texto}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
