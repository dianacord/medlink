// Estado de la app y todas sus operaciones, sin dependencias del navegador.
// Cada operación devuelve un estado nuevo que solo AÑADE registros: nada se edita ni se borra.

import type {
  ActualizacionAviso,
  Aviso,
  Cita,
  Decision,
  Documento,
  EstadoAviso,
  EventoCita,
  Medicion,
  OrigenDato,
  Paciente,
  PeticionRevision,
  RespuestaEncuesta,
  ResultadoLlamada,
  SeguimientoVersion,
  TipoCita,
  TipoDecision,
  TipoEventoCita,
  Usuario,
  ValorRespuesta,
} from '../types'
import { cargarDatos, MEDICO_NOMBRE } from './cargador'
import { periodosEncuesta } from '../logica/calendario'
import { evaluar } from '../logica/puntuacion'
import { hayAlarmaEnTexto } from '../logica/textoLibre'
import { describirCambios } from '../logica/seguimiento'

export const ESQUEMA = 1

export interface Estado {
  esquema: number
  usuarios: Usuario[]
  pacientes: Paciente[]
  seguimientos: SeguimientoVersion[]
  mediciones: Medicion[]
  respuestas: RespuestaEncuesta[]
  peticiones: PeticionRevision[]
  documentos: Documento[]
  avisos: Aviso[]
  actualizaciones: ActualizacionAviso[]
  decisiones: Decision[]
  citas: Cita[]
  eventosCita: EventoCita[]
}

export const nuevoId = (prefijo: string) => `${prefijo}-${crypto.randomUUID().slice(0, 8)}`
const iso = (ms: number) => new Date(ms).toISOString()
const t = (fecha: string) => Date.parse(fecha)

// ---------- Consultas ----------

export const paciente = (e: Estado, id: string) => e.pacientes.find((p) => p.id === id)

/** Versión vigente del seguimiento del paciente (la más reciente creada antes de `ahora`). */
export function seguimientoActual(e: Estado, pacienteId: string, ahora = Date.now()) {
  return e.seguimientos
    .filter((s) => s.pacienteId === pacienteId && t(s.creadoEn) <= ahora)
    .sort((a, b) => a.version - b.version)
    .at(-1)
}

export const versionesSeguimiento = (e: Estado, seguimientoId: string) =>
  e.seguimientos.filter((s) => s.seguimientoId === seguimientoId).sort((a, b) => a.version - b.version)

export const actualizacionesDe = (e: Estado, avisoId: string) =>
  e.actualizaciones.filter((a) => a.avisoId === avisoId).sort((a, b) => a.fecha.localeCompare(b.fecha))

export const ultimaActualizacion = (e: Estado, avisoId: string) => actualizacionesDe(e, avisoId).at(-1)!

export const decisionesDe = (e: Estado, avisoId: string) =>
  e.decisiones.filter((d) => d.avisoId === avisoId).sort((a, b) => a.fecha.localeCompare(b.fecha))

export function estadoAviso(e: Estado, avisoId: string): EstadoAviso {
  const decision = decisionesDe(e, avisoId).at(-1)
  if (!decision) return 'pendiente'
  if (decision.tipo === 'archivar') return 'archivado'
  // Si llegan datos nuevos después de proponer una cita, el aviso vuelve a la bandeja.
  if (ultimaActualizacion(e, avisoId).fecha > decision.fecha) return 'pendiente'
  return decision.tipo
}

/** Aviso no archivado del seguimiento, si lo hay. */
export function avisoAbierto(e: Estado, seguimientoId: string) {
  return e.avisos
    .filter((a) => a.seguimientoId === seguimientoId && estadoAviso(e, a.id) !== 'archivado')
    .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn))
    .at(-1)
}

/** Instante de la última decisión del médico en el seguimiento: lo anterior ya está revisado. */
function ultimaDecision(e: Estado, seguimientoId: string) {
  const avisos = new Set(e.avisos.filter((a) => a.seguimientoId === seguimientoId).map((a) => a.id))
  return Math.max(-Infinity, ...e.decisiones.filter((d) => avisos.has(d.avisoId)).map((d) => t(d.fecha)))
}

export const citasDe = (e: Estado, pacienteId: string) =>
  e.citas.filter((c) => c.pacienteId === pacienteId).sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))

export const eventosDeCita = (e: Estado, citaId: string) =>
  e.eventosCita.filter((ev) => ev.citaId === citaId).sort((a, b) => a.fecha.localeCompare(b.fecha))

export type EstadoCita = 'propuesta' | 'aceptada' | 'cambio_solicitado' | 'realizada'

export function estadoCita(e: Estado, citaId: string): EstadoCita {
  const eventos = eventosDeCita(e, citaId)
  if (eventos.some((ev) => ev.tipo === 'resultado')) return 'realizada'
  const ultimo = eventos.at(-1)
  return ultimo ? (ultimo.tipo as Exclude<EstadoCita, 'propuesta' | 'realizada'>) : 'propuesta'
}

export const avisosPendientes = (e: Estado) => e.avisos.filter((a) => estadoAviso(e, a.id) === 'pendiente')

// ---------- Recalcular avisos ----------

/** Recalcula la prioridad del seguimiento del paciente y añade una actualización si cambia. */
export function recalcular(e: Estado, pacienteId: string, ahora: number, causa: string): Estado {
  const seg = seguimientoActual(e, pacienteId, ahora)
  if (!seg || !seg.activo) return e
  const delPaciente = <T extends { pacienteId: string }>(xs: T[]) => xs.filter((x) => x.pacienteId === pacienteId)
  const ev = evaluar({
    seg,
    mediciones: delPaciente(e.mediciones),
    respuestas: delPaciente(e.respuestas).filter((r) => r.seguimientoId === seg.seguimientoId),
    peticiones: delPaciente(e.peticiones),
    documentos: delPaciente(e.documentos),
    desde: ultimaDecision(e, seg.seguimientoId),
    ahora,
  })
  if (!ev.prioridad) return e

  let aviso = avisoAbierto(e, seg.seguimientoId)
  const avisos = [...e.avisos]
  if (aviso) {
    const ultima = ultimaActualizacion(e, aviso.id)
    const igual =
      ultima.puntuacion === ev.puntuacion &&
      ultima.motivos.map((m) => m.texto).join('|') === ev.motivos.map((m) => m.texto).join('|')
    if (igual) return e
  } else {
    aviso = { id: nuevoId('aviso'), seguimientoId: seg.seguimientoId, pacienteId, creadoEn: iso(ahora) }
    avisos.push(aviso)
  }
  const actualizacion: ActualizacionAviso = {
    id: nuevoId('act'),
    avisoId: aviso.id,
    fecha: iso(ahora),
    puntuacion: ev.puntuacion,
    prioridad: ev.prioridad,
    titulo: ev.titulo,
    motivos: ev.motivos,
    causa,
  }
  return { ...e, avisos, actualizaciones: [...e.actualizaciones, actualizacion] }
}

/** Recalcula todos los seguimientos (por ejemplo al abrir la app, por si han vencido encuestas). */
export function recalcularTodo(e: Estado, ahora = Date.now()): Estado {
  return e.pacientes.reduce((acc, p) => recalcular(acc, p.id, ahora, 'Encuesta sin responder'), e)
}

// ---------- Estado inicial ----------

/**
 * Carga los datos y reproduce su historia en orden: cada analítica, cada encuesta y cada
 * vencimiento de encuesta se evalúa en su momento, igual que si hubiera pasado en directo.
 */
export function crearEstadoInicial(hoy = new Date()): Estado {
  const d = cargarDatos(hoy)
  let e: Estado = {
    esquema: ESQUEMA,
    usuarios: d.usuarios,
    pacientes: d.pacientes,
    seguimientos: d.seguimientos,
    mediciones: d.mediciones,
    respuestas: d.respuestas,
    peticiones: [],
    documentos: [],
    avisos: [],
    actualizaciones: [],
    decisiones: [],
    citas: [],
    eventosCita: [],
  }
  const ahora = hoy.getTime()
  const momentos: { pacienteId: string; ms: number; causa: string }[] = []
  for (const seg of d.seguimientos) {
    const id = seg.pacienteId
    for (const m of d.mediciones.filter((m) => m.pacienteId === id)) momentos.push({ pacienteId: id, ms: t(m.fecha), causa: 'Nueva analítica' })
    for (const r of d.respuestas.filter((r) => r.pacienteId === id)) momentos.push({ pacienteId: id, ms: t(r.fecha), causa: 'Encuesta respondida' })
    for (const p of periodosEncuesta(seg, [], ahora)) {
      if (p.hasta <= ahora) momentos.push({ pacienteId: id, ms: p.hasta, causa: 'Encuesta sin responder' })
    }
  }
  momentos.sort((a, b) => a.ms - b.ms)
  for (const m of momentos) e = recalcular(e, m.pacienteId, m.ms, m.causa)
  return e
}

// ---------- Lo que hace el paciente ----------

export function registrarRespuesta(
  e: Estado,
  pacienteId: string,
  respuestas: Record<string, ValorRespuesta>,
  textoLibre: string | undefined,
  ahora = Date.now(),
  origen: 'paciente' | 'demo' = 'paciente',
): { estado: Estado; alarma: boolean } {
  const seg = seguimientoActual(e, pacienteId, ahora)
  if (!seg) throw new Error('El paciente no tiene seguimiento activo')
  const respuesta: RespuestaEncuesta = {
    id: nuevoId('resp'),
    pacienteId,
    seguimientoId: seg.seguimientoId,
    fecha: iso(ahora),
    respuestas,
    ...(textoLibre?.trim() ? { textoLibre: textoLibre.trim() } : {}),
    origen,
  }
  const alarma =
    seg.preguntas.some((q) => q.alarma && respuestas[q.id] !== undefined && respuestas[q.id] === q.respuestaAlerta) ||
    (!!textoLibre && hayAlarmaEnTexto(textoLibre))
  const estado = recalcular({ ...e, respuestas: [...e.respuestas, respuesta] }, pacienteId, ahora, 'Encuesta respondida')
  return { estado, alarma }
}

export function pedirRevision(e: Estado, pacienteId: string, texto: string, ahora = Date.now()) {
  const peticion: PeticionRevision = { id: nuevoId('pet'), pacienteId, fecha: iso(ahora), texto: texto.trim() }
  const estado = recalcular({ ...e, peticiones: [...e.peticiones, peticion] }, pacienteId, ahora, 'El paciente pide revisión')
  return { estado, alarma: hayAlarmaEnTexto(texto) }
}

const CAUSA_ORIGEN: Record<OrigenDato, string> = {
  laboratorio_hospital: 'Analítica del laboratorio del hospital',
  pdf_paciente: 'Analítica subida por el paciente',
  paciente: 'Nueva analítica',
  historico: 'Nueva analítica',
  demo: 'Nueva analítica',
}

/** Añade mediciones (y opcionalmente el documento PDF del que salen) y recalcula. */
export function registrarAnalitica(
  e: Estado,
  pacienteId: string,
  valores: { parametroId: string; valor: number }[],
  opciones: { origen: OrigenDato; documento?: { id: string; nombreArchivo: string }; ahora?: number },
): Estado {
  const ahora = opciones.ahora ?? Date.now()
  const mediciones: Medicion[] = valores.map((v) => ({
    id: nuevoId('med'),
    pacienteId,
    parametroId: v.parametroId,
    valor: v.valor,
    fecha: iso(ahora),
    origen: opciones.origen,
    verificado: opciones.origen !== 'pdf_paciente',
    ...(opciones.documento ? { documentoId: opciones.documento.id } : {}),
  }))
  const documentos = opciones.documento
    ? [
        ...e.documentos,
        {
          id: opciones.documento.id,
          pacienteId,
          nombreArchivo: opciones.documento.nombreArchivo,
          origen: opciones.origen === 'pdf_paciente' ? ('pdf_paciente' as const) : ('laboratorio_hospital' as const),
          subidoEn: iso(ahora),
          medicionIds: mediciones.map((m) => m.id),
        },
      ]
    : e.documentos
  return recalcular(
    { ...e, mediciones: [...e.mediciones, ...mediciones], documentos },
    pacienteId,
    ahora,
    CAUSA_ORIGEN[opciones.origen],
  )
}

export function responderCita(e: Estado, citaId: string, tipo: Exclude<TipoEventoCita, 'resultado'>, ahora = Date.now()): Estado {
  return { ...e, eventosCita: [...e.eventosCita, { id: nuevoId('evc'), citaId, tipo, fecha: iso(ahora) }] }
}

// ---------- Lo que hace el médico ----------

export function decidir(
  e: Estado,
  avisoId: string,
  tipo: TipoDecision,
  opciones: { cita?: { tipo: TipoCita; fechaHora: string }; ahora?: number; medico?: string } = {},
): Estado {
  const ahora = opciones.ahora ?? Date.now()
  const aviso = e.avisos.find((a) => a.id === avisoId)!
  let citas = e.citas
  let citaId: string | undefined
  if (opciones.cita) {
    citaId = nuevoId('cita')
    citas = [
      ...citas,
      { id: citaId, pacienteId: aviso.pacienteId, avisoId, tipo: opciones.cita.tipo, fechaHora: opciones.cita.fechaHora, creadaEn: iso(ahora) },
    ]
  }
  const decision: Decision = {
    id: nuevoId('dec'),
    avisoId,
    tipo,
    fecha: iso(ahora),
    medico: opciones.medico ?? MEDICO_NOMBRE,
    ...(citaId ? { citaId } : {}),
  }
  return { ...e, citas, decisiones: [...e.decisiones, decision] }
}

/** Resultado de la cita telefónica. "Estable" archiva el aviso; las otras opciones las continúa la interfaz. */
export function registrarResultado(e: Estado, citaId: string, resultado: ResultadoLlamada, ahora = Date.now()): Estado {
  const cita = e.citas.find((c) => c.id === citaId)!
  let estado: Estado = {
    ...e,
    eventosCita: [...e.eventosCita, { id: nuevoId('evc'), citaId, tipo: 'resultado', resultado, fecha: iso(ahora) }],
  }
  if (resultado !== 'grave' && cita.avisoId) estado = decidir(estado, cita.avisoId, 'archivar', { ahora })
  return estado
}

export type BorradorSeguimiento = Pick<
  SeguimientoVersion,
  'pacienteId' | 'plantillaId' | 'patologia' | 'parametros' | 'preguntas' | 'frecuenciaAnaliticaSemanas' | 'frecuenciaEncuestaDias' | 'fechaInicio' | 'fechaFin' | 'activo'
>

/** Crea la primera versión del seguimiento o una nueva versión con lo que ha cambiado. */
export function guardarSeguimiento(e: Estado, borrador: BorradorSeguimiento, ahora = Date.now(), medico = MEDICO_NOMBRE): Estado {
  const anterior = seguimientoActual(e, borrador.pacienteId, ahora)
  const version: SeguimientoVersion = {
    ...borrador,
    seguimientoId: anterior?.seguimientoId ?? `seg-${borrador.pacienteId}`,
    version: (anterior?.version ?? 0) + 1,
    creadoEn: iso(ahora),
    creadoPor: medico,
    cambios: anterior ? describirCambios(anterior, borrador) : [`Seguimiento activado (${borrador.patologia || 'sin plantilla'})`],
  }
  return recalcular({ ...e, seguimientos: [...e.seguimientos, version] }, borrador.pacienteId, ahora, 'Seguimiento ajustado')
}
