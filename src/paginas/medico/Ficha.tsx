import { useState, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import {
  Activity,
  Bell,
  CalendarClock,
  CalendarX,
  ClipboardCheck,
  FileText,
  FlaskConical,
  MessageCircleQuestion,
  Plus,
  Settings2,
  SlidersHorizontal,
  UserRound,
} from 'lucide-react'
import { Boton } from '../../componentes/Boton'
import { Grafico } from '../../componentes/Grafico'
import { EnlacePdf } from '../../componentes/EnlacePdf'
import { Confirmacion, EtiquetaPrioridad, Pestanas, Tarjeta, TituloSeccion, Vacio, Volver } from '../../componentes/ui'
import { useEstado } from '../../datos/almacen'
import { historialPaciente, resumenRespuestas, type TipoEntrada } from '../../datos/historial'
import { avisoAbierto, paciente as buscarPaciente, seguimientoActual, ultimaActualizacion, type Estado } from '../../datos/modelo'
import { encuestaPendiente, proximaAnalitica, proximaEncuesta } from '../../logica/calendario'
import { fechaConDia, fechaCorta, fechaLarga, hora } from '../../logica/formato'
import { ACCESIBILIDAD, CONTACTO, nombreCompleto, sexoTexto } from '../../logica/paciente'
import { objetivoTexto } from '../../logica/puntuacion'
import type { Paciente, SeguimientoVersion } from '../../types'

type Vista = 'resumen' | 'evolucion' | 'encuestas' | 'historial'

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-gris">{etiqueta}</dt>
      <dd className="mt-0.5 font-semibold">{children}</dd>
    </div>
  )
}

function Resumen({ estado, p, seg }: { estado: Estado; p: Paciente; seg?: SeguimientoVersion }) {
  if (!seg) {
    return (
      <Vacio icono={<ClipboardCheck className="size-8" />} titulo="Este paciente no tiene seguimiento remoto">
        <p>Configura los parámetros y las preguntas que quieres vigilar.</p>
        <div className="mx-auto mt-5 max-w-xs">
          <Boton icono={Plus} to={`/medico/paciente/${p.id}/seguimiento`}>
            Crear seguimiento
          </Boton>
        </div>
      </Vacio>
    )
  }
  const ahora = Date.now()
  const respuestas = estado.respuestas.filter((r) => r.pacienteId === p.id)
  const mediciones = estado.mediciones.filter((m) => m.pacienteId === p.id)
  const aviso = avisoAbierto(estado, seg.seguimientoId)
  const pendiente = encuestaPendiente(seg, respuestas, ahora)
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Tarjeta>
        <TituloSeccion
          accion={
            <Link to={`/medico/paciente/${p.id}/seguimiento`} className="inline-flex items-center gap-1 text-sm font-semibold text-primario">
              <SlidersHorizontal className="size-4" /> Ajustar
            </Link>
          }
        >
          Seguimiento activo
        </TituloSeccion>
        <dl className="grid grid-cols-2 gap-4">
          <Dato etiqueta="Patología">{seg.patologia}</Dato>
          <Dato etiqueta="Versión">
            {seg.version} · desde {fechaCorta(seg.creadoEn)}
          </Dato>
          <Dato etiqueta="Analítica">Cada {seg.frecuenciaAnaliticaSemanas} semanas</Dato>
          <Dato etiqueta="Encuesta">Cada {seg.frecuenciaEncuestaDias} días</Dato>
          <Dato etiqueta="Próxima encuesta">{pendiente ? 'Pendiente ahora' : fechaCorta(new Date(proximaEncuesta(seg, respuestas, ahora)).toISOString())}</Dato>
          <Dato etiqueta="Próxima analítica">{fechaCorta(new Date(proximaAnalitica(seg, mediciones)).toISOString())}</Dato>
          <Dato etiqueta="Fin">{fechaLarga(seg.fechaFin)}</Dato>
        </dl>
      </Tarjeta>
      <div className="space-y-5">
        {aviso && (
          <Link to={`/medico/aviso/${aviso.id}`} className="block">
            <Tarjeta className="hover:ring-primario">
              <p className="text-sm font-semibold text-gris">Aviso abierto</p>
              <div className="mt-2">
                <EtiquetaPrioridad prioridad={ultimaActualizacion(estado, aviso.id).prioridad} />
              </div>
              <p className="mt-2 font-bold">{ultimaActualizacion(estado, aviso.id).titulo}</p>
            </Tarjeta>
          </Link>
        )}
        <Tarjeta>
          <TituloSeccion>Vigilando</TituloSeccion>
          <ul className="space-y-2 text-sm">
            {seg.parametros.map((par) => (
              <li key={par.id} className="flex justify-between gap-3">
                <span>{par.nombre}</span>
                <span className="text-gris">
                  {objetivoTexto(par)} {par.unidad}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-gris">
            {seg.preguntas.length} preguntas en la encuesta · {seg.preguntas.filter((q) => q.alarma).length} señales de alarma
          </p>
        </Tarjeta>
      </div>
    </div>
  )
}

function Evolucion({ estado, p, seg }: { estado: Estado; p: Paciente; seg: SeguimientoVersion }) {
  const respuestas = estado.respuestas.filter((r) => r.pacienteId === p.id)
  const numericas = seg.preguntas.filter((q) => q.tipo !== 'si_no')
  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        {seg.parametros.map((par) => (
          <Tarjeta key={par.id}>
            <p className="font-bold">{par.nombre}</p>
            <p className="mb-2 text-sm text-gris">
              {par.unidad} · objetivo {objetivoTexto(par)}
            </p>
            <Grafico
              puntos={estado.mediciones.filter((m) => m.pacienteId === p.id && m.parametroId === par.id)}
              min={par.min}
              max={par.max}
              unidad={par.unidad}
            />
          </Tarjeta>
        ))}
      </div>
      {numericas.length > 0 && (
        <>
          <h2 className="text-lg font-bold">Síntomas</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {numericas.map((q) => (
              <Tarjeta key={q.id}>
                <p className="font-bold">{q.etiqueta}</p>
                <p className="mb-2 text-sm text-gris">
                  {q.tipo === 'escala' ? 'Escala 0-10' : `Número${q.unidad ? ` (${q.unidad.replace('/', 'por ')})` : ''}`} · alerta desde {q.umbral}
                </p>
                <Grafico
                  puntos={respuestas
                    .filter((r) => typeof r.respuestas[q.id] === 'number')
                    .map((r) => ({ fecha: r.fecha, valor: r.respuestas[q.id] as number }))}
                  max={q.umbral}
                  alto={80}
                />
              </Tarjeta>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Encuestas({ estado, p, seg }: { estado: Estado; p: Paciente; seg: SeguimientoVersion }) {
  const respuestas = estado.respuestas.filter((r) => r.pacienteId === p.id).sort((a, b) => b.fecha.localeCompare(a.fecha))
  if (!respuestas.length) return <Vacio icono={<MessageCircleQuestion className="size-8" />} titulo="Todavía no hay encuestas respondidas" />
  return (
    <ul className="space-y-3">
      {respuestas.map((r) => (
        <li key={r.id}>
          <Tarjeta className="!p-4">
            <p className="text-sm font-semibold first-letter:uppercase">{fechaConDia(r.fecha)}</p>
            <p className="mt-1 text-sm text-gris">{resumenRespuestas(r, seg)}</p>
            {r.textoLibre && <p className="mt-2 rounded-xl bg-primario-suave/60 p-3 text-sm">«{r.textoLibre}»</p>}
          </Tarjeta>
        </li>
      ))}
    </ul>
  )
}

const ICONOS: Record<TipoEntrada, typeof Bell> = {
  seguimiento: Settings2,
  analitica: FlaskConical,
  encuesta: MessageCircleQuestion,
  encuesta_sin_responder: CalendarX,
  aviso: Bell,
  decision: ClipboardCheck,
  cita: CalendarClock,
  peticion: FileText,
}

function Historial({ estado, p }: { estado: Estado; p: Paciente }) {
  const entradas = historialPaciente(estado, p.id)
  if (!entradas.length) return <Vacio icono={<Activity className="size-8" />} titulo="Todavía no hay actividad" />
  return (
    <Tarjeta>
      <p className="mb-4 text-sm text-gris">Registro completo de este paciente. Nada se sobrescribe: cada cambio queda guardado con su fecha.</p>
      <ol className="relative space-y-5 border-l-2 border-primario-suave pl-6">
        {entradas.map((en, i) => {
          const Icono = ICONOS[en.tipo]
          const contenido = (
            <>
              <p className="text-xs text-gris">
                {fechaCorta(en.fecha)} · {hora(en.fecha)}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-2 font-semibold">
                {en.prioridad && <EtiquetaPrioridad prioridad={en.prioridad} />}
                {en.titulo}
              </p>
              {en.detalle.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-sm text-gris">
                  {en.detalle.map((d, j) => (
                    <li key={j}>{d}</li>
                  ))}
                </ul>
              )}
              {en.documento && (
                <p className="mt-1 text-sm">
                  <EnlacePdf documentoId={en.documento.id}>{en.documento.nombre}</EnlacePdf>
                </p>
              )}
            </>
          )
          return (
            <li key={i} className="relative">
              <span className="absolute top-0 -left-[2.3rem] flex size-7 items-center justify-center rounded-full bg-white text-primario ring-2 ring-primario-suave">
                <Icono className="size-3.5" />
              </span>
              {en.enlace ? (
                <Link to={en.enlace} className="block hover:text-primario">
                  {contenido}
                </Link>
              ) : (
                contenido
              )}
            </li>
          )
        })}
      </ol>
    </Tarjeta>
  )
}

export default function Ficha() {
  const { id } = useParams()
  const estado = useEstado()
  const { state } = useLocation() as { state: { mensaje?: string } | null }
  const [vista, setVista] = useState<Vista>('resumen')
  const p = id ? buscarPaciente(estado, id) : undefined
  if (!p) return <Navigate to="/medico/buscar" replace />
  const seg = seguimientoActual(estado, p.id)
  const accesibilidad = ACCESIBILIDAD[p.accesibilidad]

  return (
    <div>
      <Volver to="/medico/buscar">Pacientes</Volver>
      {state?.mensaje && <Confirmacion>{state.mensaje}</Confirmacion>}
      <div className="flex items-start gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-[18px] bg-primario-suave text-primario">
          <UserRound className="size-7" strokeWidth={1.6} />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{nombreCompleto(p)}</h1>
          <p className="mt-0.5 text-gris">
            {p.edad} años · {sexoTexto(p)} · NHC {p.nhc}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold">
            <span className="rounded-full bg-primario-suave px-2.5 py-1 text-primario">Contacto: {CONTACTO[p.preferenciaContacto]}</span>
            {accesibilidad && <span className="rounded-full bg-media-suave px-2.5 py-1 text-media">{accesibilidad}</span>}
          </div>
        </div>
      </div>

      <div className="mt-6 mb-5 max-w-xl">
        <Pestanas<Vista>
          valor={vista}
          onCambio={setVista}
          opciones={[
            { valor: 'resumen', texto: 'Resumen' },
            ...(seg
              ? [
                  { valor: 'evolucion' as const, texto: 'Evolución' },
                  { valor: 'encuestas' as const, texto: 'Encuestas' },
                ]
              : []),
            { valor: 'historial', texto: 'Historial' },
          ]}
        />
      </div>
      {vista === 'resumen' && <Resumen estado={estado} p={p} seg={seg} />}
      {vista === 'evolucion' && seg && <Evolucion estado={estado} p={p} seg={seg} />}
      {vista === 'encuestas' && seg && <Encuestas estado={estado} p={p} seg={seg} />}
      {vista === 'historial' && <Historial estado={estado} p={p} />}
    </div>
  )
}
