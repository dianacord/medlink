import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Archive, BellOff, CalendarCheck, ChevronRight, Phone, Stethoscope } from 'lucide-react'
import { Chip, Confirmacion, EtiquetaPrioridad, Pestanas, Tarjeta, Vacio } from '../../componentes/ui'
import { PRIORIDAD } from '../../componentes/estilos'
import { actualizar, useEstado } from '../../datos/almacen'
import {
  avisoAbierto,
  decidir,
  estadoAviso,
  estadoCita,
  paciente as buscarPaciente,
  seguimientoActual,
  ultimaActualizacion,
  type Estado,
} from '../../datos/modelo'
import { proximaEncuesta } from '../../logica/calendario'
import { fechaCorta, haceTiempo } from '../../logica/formato'
import { nombreCompleto } from '../../logica/paciente'
import { chipsDe } from '../../logica/puntuacion'
import type { Aviso } from '../../types'

type Vista = 'avisos' | 'citas' | 'verde'
/** Lo que ha contestado el paciente a la cita propuesta. */
const RESPUESTA_CITA = {
  propuesta: { texto: 'Sin respuesta', clases: 'bg-gris-claro text-gris' },
  aceptada: { texto: 'Aceptada', clases: 'bg-baja-suave text-baja' },
  cambio_solicitado: { texto: 'Pide otro día', clases: 'bg-media-suave text-media' },
  realizada: { texto: 'Realizada', clases: 'bg-gris-claro text-gris' },
}

const CHIPS_VISIBLES = 3

function avisosEn(e: Estado, estados: string[]) {
  return e.avisos
    .filter((a) => estados.includes(estadoAviso(e, a.id)))
    .map((a) => ({ aviso: a, ultima: ultimaActualizacion(e, a.id) }))
    .sort((x, y) => PRIORIDAD[x.ultima.prioridad].orden - PRIORIDAD[y.ultima.prioridad].orden || y.ultima.fecha.localeCompare(x.ultima.fecha))
}

function TarjetaAviso({ aviso, conAcciones }: { aviso: Aviso; conAcciones: boolean }) {
  const estado = useEstado()
  const navigate = useNavigate()
  const ultima = ultimaActualizacion(estado, aviso.id)
  const p = buscarPaciente(estado, aviso.pacienteId)!
  const seg = seguimientoActual(estado, p.id)
  const chips = chipsDe(ultima.motivos)
  const situacion = estadoAviso(estado, aviso.id)
  const cita = estado.citas.filter((c) => c.avisoId === aviso.id).at(-1)
  const respuesta = cita && RESPUESTA_CITA[estadoCita(estado, cita.id)]

  const archivar = () => {
    actualizar((e) => decidir(e, aviso.id, 'archivar'))
    navigate('.', { state: { mensaje: `Aviso de ${p.nombre} ${p.apellidos} archivado.` }, replace: true })
  }

  return (
    <Tarjeta className="!p-0">
      <Link to={`/medico/aviso/${aviso.id}`} className="block rounded-t-3xl p-5 hover:bg-primario-suave/40">
        <div className="flex flex-wrap items-center gap-2">
          <EtiquetaPrioridad prioridad={ultima.prioridad} />
          {situacion !== 'pendiente' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primario-suave px-2.5 py-1 text-xs font-bold text-primario">
              <CalendarCheck className="size-3.5" />
              {situacion === 'cita_telefonica' ? 'Llamada programada' : 'Cita presencial programada'}
            </span>
          )}
          {situacion !== 'pendiente' && respuesta && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${respuesta.clases}`}>{respuesta.texto}</span>
          )}
          <span className="ml-auto text-xs text-gris">{haceTiempo(ultima.fecha)}</span>
        </div>
        <div className="mt-3 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-[1.05rem] leading-snug font-bold">{ultima.titulo}</h3>
            <p className="mt-0.5 text-sm text-gris">
              {nombreCompleto(p)} · {p.edad} años · {seg?.patologia}
            </p>
          </div>
          <ChevronRight className="mt-1 size-5 shrink-0 text-gris" />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.slice(0, CHIPS_VISIBLES).map((c) => (
            <Chip key={c.texto} alarma={c.alarma}>
              {c.texto}
            </Chip>
          ))}
          {chips.length > CHIPS_VISIBLES && <Chip>+{chips.length - CHIPS_VISIBLES} más</Chip>}
        </div>
      </Link>
      {conAcciones && (
        <div className="grid grid-cols-3 border-t border-gris-claro text-sm font-semibold">
          <Link to={`/medico/aviso/${aviso.id}?accion=telefonica`} className="flex items-center justify-center gap-1.5 py-3 text-primario hover:bg-primario-suave/50">
            <Phone className="size-4" />
            <span>Telefónica</span>
          </Link>
          <Link to={`/medico/aviso/${aviso.id}?accion=presencial`} className="flex items-center justify-center gap-1.5 border-x border-gris-claro py-3 text-primario hover:bg-primario-suave/50">
            <Stethoscope className="size-4" />
            <span>Presencial</span>
          </Link>
          <button onClick={archivar} className="flex items-center justify-center gap-1.5 rounded-br-3xl py-3 text-gris hover:bg-primario-suave/50 hover:text-marino">
            <Archive className="size-4" />
            <span>Archivar</span>
          </button>
        </div>
      )}
    </Tarjeta>
  )
}

function EnVerde() {
  const estado = useEstado()
  const ahora = Date.now()
  const pacientes = estado.pacientes.filter((p) => {
    const seg = seguimientoActual(estado, p.id, ahora)
    return seg?.activo && !avisoAbierto(estado, seg.seguimientoId)
  })
  if (!pacientes.length) return <Vacio icono={<BellOff className="size-8" />} titulo="Ningún seguimiento en verde" />
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {pacientes.map((p) => {
        const seg = seguimientoActual(estado, p.id, ahora)!
        const respuestas = estado.respuestas.filter((r) => r.pacienteId === p.id)
        return (
          <li key={p.id}>
            <Link to={`/medico/paciente/${p.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-gris-claro hover:ring-primario">
              <span className="size-2.5 shrink-0 rounded-full bg-baja" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{nombreCompleto(p)}</span>
                <span className="block text-sm text-gris">
                  {p.edad} años · Próxima encuesta {fechaCorta(new Date(proximaEncuesta(seg, respuestas, ahora)).toISOString())}
                </span>
              </span>
              <ChevronRight className="size-5 text-gris" />
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export default function Bandeja() {
  const estado = useEstado()
  const { state } = useLocation() as { state: { mensaje?: string } | null }
  const [vista, setVista] = useState<Vista>('avisos')
  const pendientes = avisosEn(estado, ['pendiente'])
  const conCita = avisosEn(estado, ['cita_telefonica', 'cita_presencial'])
  const enVerde = estado.pacientes.filter((p) => {
    const seg = seguimientoActual(estado, p.id)
    return seg?.activo && !avisoAbierto(estado, seg.seguimientoId)
  }).length

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Avisos</h1>
      <p className="mt-1 text-gris">
        {pendientes.length ? `${pendientes.length} ${pendientes.length === 1 ? 'aviso necesita' : 'avisos necesitan'} tu revisión` : 'Todo al día'}
      </p>
      <div className="mt-5 mb-5 max-w-lg">
        <Pestanas<Vista>
          valor={vista}
          onCambio={setVista}
          opciones={[
            { valor: 'avisos', texto: 'Por revisar', contador: pendientes.length },
            { valor: 'citas', texto: 'Con cita', contador: conCita.length },
            { valor: 'verde', texto: 'En verde', contador: enVerde },
          ]}
        />
      </div>
      {state?.mensaje && <Confirmacion>{state.mensaje}</Confirmacion>}

      {vista === 'avisos' &&
        (pendientes.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {pendientes.map(({ aviso }) => (
              <TarjetaAviso key={aviso.id} aviso={aviso} conAcciones />
            ))}
          </div>
        ) : (
          <Vacio icono={<BellOff className="size-8" />} titulo="No hay avisos por revisar">
            Los seguimientos siguen su curso. Te avisaremos si algo cambia.
          </Vacio>
        ))}
      {vista === 'citas' &&
        (conCita.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {conCita.map(({ aviso }) => (
              <TarjetaAviso key={aviso.id} aviso={aviso} conAcciones={false} />
            ))}
          </div>
        ) : (
          <Vacio icono={<CalendarCheck className="size-8" />} titulo="No hay citas programadas" />
        ))}
      {vista === 'verde' && <EnVerde />}
    </div>
  )
}
