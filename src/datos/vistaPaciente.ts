// Lo único que el paciente ve de su seguimiento. Nunca incluye puntuaciones,
// prioridades, motivos ni el historial: solo tareas, estado neutro y sus citas.

import { encuestaPendiente, preguntasDelPeriodo, proximaEncuesta, proximasAnaliticas } from '../logica/calendario'
import { DIA_MS } from '../logica/formato'
import { aplicaPregunta } from '../logica/preguntas'
import { avisoAbierto, citasDe, estadoAviso, estadoCita, paciente, seguimientoActual, type Estado } from './modelo'

/** Días de margen para avisar de que toca hacerse la analítica. */
const AVISO_ANALITICA_DIAS = 7

export type EstadoPaciente =
  | { tipo: 'cita_propuesta' }
  | { tipo: 'cita_confirmada'; fechaHora: string }
  | { tipo: 'en_revision' }
  | { tipo: 'todo_bien'; proximaEncuesta: string }

export function vistaPaciente(e: Estado, pacienteId: string, ahora = Date.now()) {
  const seg = seguimientoActual(e, pacienteId, ahora)
  if (!seg) return null
  const respuestas = e.respuestas.filter((r) => r.pacienteId === pacienteId)
  const mediciones = e.mediciones.filter((m) => m.pacienteId === pacienteId)
  const citas = citasDe(e, pacienteId)
  const futuras = citas.filter((c) => Date.parse(c.fechaHora) > ahora - DIA_MS)
  const propuesta = futuras.find((c) => estadoCita(e, c.id) === 'propuesta')
  const confirmada = futuras.find((c) => estadoCita(e, c.id) === 'aceptada')
  const aviso = avisoAbierto(e, seg.seguimientoId)
  const proxima = new Date(proximaEncuesta(seg, respuestas, ahora)).toISOString()

  let estado: EstadoPaciente
  if (propuesta) estado = { tipo: 'cita_propuesta' }
  else if (confirmada) estado = { tipo: 'cita_confirmada', fechaHora: confirmada.fechaHora }
  else if (aviso && estadoAviso(e, aviso.id) === 'pendiente') estado = { tipo: 'en_revision' }
  else estado = { tipo: 'todo_bien', proximaEncuesta: proxima }

  const ultimaFecha = <T extends { fecha: string }>(xs: T[]) => xs.map((x) => x.fecha).sort().at(-1)
  const periodo = encuestaPendiente(seg, respuestas, ahora)
  const yo = paciente(e, pacienteId)!
  const analiticas = proximasAnaliticas(seg, mediciones)
  const primera = analiticas[0]?.fecha ?? Infinity
  return {
    seg,
    estado,
    encuestaPendiente: !!periodo,
    /** Preguntas de la encuesta pendiente: las que tocan en este periodo y aplican al paciente. */
    preguntasEncuesta: periodo ? preguntasDelPeriodo(seg, periodo).filter((q) => aplicaPregunta(q, yo)) : [],
    proximaEncuesta: proxima,
    analiticaToca: primera - ahora < AVISO_ANALITICA_DIAS * DIA_MS,
    /** Parámetros que vencen en los próximos días ("Toca analítica: calprotectina y PCR"). */
    parametrosQueTocan: analiticas.filter((a) => a.fecha - ahora < AVISO_ANALITICA_DIAS * DIA_MS).map((a) => a.parametro),
    proximaAnalitica: new Date(Number.isFinite(primera) ? primera : ahora).toISOString(),
    ultimaEncuesta: ultimaFecha(respuestas),
    ultimaAnaliticaSubida: e.documentos
      .filter((d) => d.pacienteId === pacienteId && d.origen === 'pdf_paciente')
      .map((d) => d.subidoEn)
      .sort()
      .at(-1),
    ultimaPeticion: ultimaFecha(e.peticiones.filter((p) => p.pacienteId === pacienteId)),
  }
}
