// Catálogo de PROMs (cuestionarios que responde el paciente) para colitis ulcerosa.
// Solo lo ve el médico: activa los que quiere y elige cada cuánto se envían.
// Los textos son una adaptación nuestra al español, sin validar. Los cuestionarios con licencia
// (IBDQ, SIBDQ, FACIT-F) o que necesitan permiso del autor (WPAI) no se reproducen.

import type { Pregunta } from '../types'

/** Opciones del desplegable de frecuencia, en días. En semanas para que cuadren con la encuesta quincenal. */
export const FRECUENCIAS = [
  { dias: 7, texto: 'Semanal' },
  { dias: 14, texto: 'Cada 2 semanas' },
  { dias: 28, texto: 'Mensual' },
  { dias: 84, texto: 'Cada 3 meses' },
  { dias: 182, texto: 'Cada 6 meses' },
  { dias: 364, texto: 'Anual' },
]

export const textoFrecuencia = (dias?: number) =>
  dias === undefined ? 'Siempre' : (FRECUENCIAS.find((f) => f.dias === dias)?.texto ?? `Cada ${dias} días`)

export type EstadoProm = 'disponible' | 'proximamente' | 'licencia'

export interface PromDef {
  id: string
  nombre: string
  /** Qué mide, en una línea (solo en los disponibles). */
  descripcion?: string
  estado: EstadoProm
  frecuenciaPorDefecto?: number
  /** Activo al crear un seguimiento con la plantilla de colitis ulcerosa. */
  porDefecto?: boolean
  preguntas?: Pregunta[]
  /** Punto de corte del total: genera un motivo de aviso si se cruza. */
  corte?: { valor: number; alertaSi: 'mayor_o_igual' | 'menor'; texto: string }
}

const opcion = (texto: string, puntos: number) => ({ texto, puntos })

const PRO2: Pregunta[] = [
  {
    id: 'deposiciones',
    prom: 'pro2-uc',
    etiqueta: 'Deposiciones',
    unidad: '/día',
    texto: '¿Cuántas veces vas al baño al día (deposiciones)?',
    ayuda: 'Piensa en un día normal de esta semana.',
    tipo: 'numero',
    umbral: 5,
    cambioRelevante: 2,
    alarma: false,
  },
  {
    id: 'sangre',
    prom: 'pro2-uc',
    etiqueta: 'Sangre en heces',
    texto: '¿Has visto sangre en las heces?',
    tipo: 'si_no',
    respuestaAlerta: true,
    alarma: false,
  },
]

const URGENCIA: Pregunta[] = [
  {
    id: 'urgencia',
    prom: 'urgency-nrs',
    etiqueta: 'Urgencia',
    texto: '¿Cuánta prisa sientes por llegar al baño?',
    ayuda: '0 = ninguna, 10 = no me da tiempo a llegar',
    tipo: 'escala',
    umbral: 6,
    cambioRelevante: 2,
    alarma: false,
  },
]

// SCCAI (Walmsley, 1998). La primera opción de cada pregunta es la mejor.
const SCCAI: Pregunta[] = [
  {
    id: 'sccai_dia',
    etiqueta: 'SCCAI · deposiciones de día',
    texto: 'Durante el día, ¿cuántas veces vas al baño?',
    opciones: [opcion('De 1 a 3', 0), opcion('De 4 a 6', 1), opcion('De 7 a 9', 2), opcion('Más de 9', 3)],
  },
  {
    id: 'sccai_noche',
    etiqueta: 'SCCAI · deposiciones de noche',
    texto: 'Por la noche, ¿cuántas veces te levantas para ir al baño?',
    opciones: [opcion('Ninguna', 0), opcion('De 1 a 3', 1), opcion('De 4 a 6', 2)],
  },
  {
    id: 'sccai_urgencia',
    etiqueta: 'SCCAI · urgencia',
    texto: '¿Con qué prisa tienes que ir al baño?',
    opciones: [opcion('Sin prisa', 0), opcion('Con prisa', 1), opcion('Tengo que ir inmediatamente', 2), opcion('A veces no me da tiempo a llegar', 3)],
  },
  {
    id: 'sccai_sangre',
    etiqueta: 'SCCAI · sangre',
    texto: '¿Hay sangre en tus heces?',
    opciones: [opcion('No', 0), opcion('Solo un rastro', 1), opcion('A veces, sangre clara', 2), opcion('Casi siempre, sangre clara', 3)],
  },
  {
    id: 'sccai_bienestar',
    etiqueta: 'SCCAI · estado general',
    texto: '¿Cómo te encuentras en general?',
    opciones: [opcion('Muy bien', 0), opcion('Un poco peor de lo normal', 1), opcion('Mal', 2), opcion('Muy mal', 3), opcion('Fatal', 4)],
  },
  {
    id: 'sccai_extra',
    etiqueta: 'SCCAI · síntomas fuera del intestino',
    texto: '¿Tienes alguno de estos: dolor en las articulaciones, ojo rojo y doloroso, bultos rojos dolorosos en las piernas o llagas en la piel?',
    opciones: [opcion('Ninguno', 0), opcion('Uno', 1), opcion('Dos o más', 2)],
  },
].map((q) => ({ ...q, prom: 'sccai', tipo: 'opciones' as const, alarma: false }))

// IBD-Control-8 (Bodger, 2014): 0-16 puntos, más es mejor. La primera opción de cada pregunta es la mejor.
const SI_NO_SE = [opcion('Sí', 2), opcion('No estoy seguro/a', 1), opcion('No', 0)]
const FRECUENCIA_IBDC = [opcion('Nunca', 2), opcion('A veces', 1), opcion('A menudo', 0)]
const IBD_CONTROL: Pregunta[] = [
  { id: 'ibdc_control', etiqueta: 'IBD-Control · enfermedad controlada', texto: 'En las últimas 2 semanas, ¿crees que tu enfermedad ha estado bien controlada?', opciones: SI_NO_SE },
  { id: 'ibdc_tratamiento', etiqueta: 'IBD-Control · tratamiento útil', texto: '¿Crees que tu tratamiento actual te ayuda a controlar la enfermedad?', opciones: SI_NO_SE },
  { id: 'ibdc_actividades', etiqueta: 'IBD-Control · deja de hacer cosas', texto: 'En las últimas 2 semanas, ¿cuántas veces has dejado de hacer algo que tenías planeado por la enfermedad?', opciones: FRECUENCIA_IBDC },
  { id: 'ibdc_noche', etiqueta: 'IBD-Control · se despierta', texto: '¿Y cuántas veces te has despertado por la noche por los síntomas?', opciones: FRECUENCIA_IBDC },
  { id: 'ibdc_dolor', etiqueta: 'IBD-Control · dolor o molestias', texto: '¿Cuántas veces has tenido dolor o molestias importantes?', opciones: FRECUENCIA_IBDC },
  { id: 'ibdc_energia', etiqueta: 'IBD-Control · falta de energía', texto: '¿Cuántas veces te has sentido sin energía?', opciones: FRECUENCIA_IBDC },
  { id: 'ibdc_animo', etiqueta: 'IBD-Control · ansiedad o tristeza', texto: '¿Cuántas veces te has sentido ansioso/a o triste por la enfermedad?', opciones: FRECUENCIA_IBDC },
  { id: 'ibdc_cambio', etiqueta: 'IBD-Control · necesita cambiar tratamiento', texto: '¿Cuántas veces has pensado que necesitabas cambiar de tratamiento?', opciones: FRECUENCIA_IBDC },
].map((q) => ({ ...q, prom: 'ibd-control-8', tipo: 'opciones' as const, alarma: false }))

const PROXIMAMENTE = (id: string, nombre: string): PromDef => ({ id, nombre, estado: 'proximamente' })
const LICENCIA = (id: string, nombre: string): PromDef => ({ id, nombre, estado: 'licencia' })

export const PROMS: PromDef[] = [
  {
    id: 'pro2-uc',
    nombre: 'PRO2-UC',
    descripcion: 'Número de deposiciones y sangre en heces.',
    estado: 'disponible',
    frecuenciaPorDefecto: 14,
    porDefecto: true,
    preguntas: PRO2,
  },
  {
    id: 'sccai',
    nombre: 'SCCAI (Simple Clinical Colitis Activity Index)',
    descripcion: 'Actividad de la colitis en 6 preguntas. 5 o más puntos indica actividad.',
    estado: 'disponible',
    frecuenciaPorDefecto: 28,
    porDefecto: true,
    preguntas: SCCAI,
    corte: { valor: 5, alertaSi: 'mayor_o_igual', texto: 'actividad' },
  },
  { id: 'pmayo', nombre: 'pMayo (Partial Mayo Score)', estado: 'proximamente' },
  PROXIMAMENTE('uc-pro-ss', 'UC-PRO/SS'),
  PROXIMAMENTE('siq-uc', 'SIQ-UC'),
  PROXIMAMENTE('uc-sq', 'UC-SQ'),
  PROXIMAMENTE('ducs', 'DUCS'),
  PROXIMAMENTE('prucsi', 'PRUCSI'),
  {
    id: 'ibd-control-8',
    nombre: 'IBD-Control-8',
    descripcion: 'Control de la enfermedad según el paciente (0 a 16). Menos de 13 indica mal control.',
    estado: 'disponible',
    frecuenciaPorDefecto: 28,
    porDefecto: true,
    preguntas: IBD_CONTROL,
    corte: { valor: 13, alertaSi: 'menor', texto: 'mal control' },
  },
  LICENCIA('ibdq-32', 'IBDQ-32'),
  LICENCIA('sibdq', 'SIBDQ'),
  PROXIMAMENTE('ibdq-9', 'IBDQ-9'),
  PROXIMAMENTE('cucq-32', 'CUCQ-32'),
  PROXIMAMENTE('cucq-8', 'CUCQ-8'),
  PROXIMAMENTE('ibd-disk', 'IBD-Disk'),
  PROXIMAMENTE('ibd-di', 'IBD-DI'),
  {
    id: 'urgency-nrs',
    nombre: 'Bowel Urgency NRS',
    descripcion: 'Urgencia para ir al baño, de 0 a 10.',
    estado: 'disponible',
    frecuenciaPorDefecto: 14,
    porDefecto: true,
    preguntas: URGENCIA,
  },
  PROXIMAMENTE('ibd-f', 'IBD-F'),
  LICENCIA('facit-f', 'FACIT-F'),
  LICENCIA('wpai-uc', 'WPAI-UC'),
  PROXIMAMENTE('rfipc', 'RFIPC'),
]

export const promDe = (id?: string) => PROMS.find((p) => p.id === id)

/** Preguntas de un PROM listas para añadir al seguimiento, con su frecuencia. */
export const preguntasDeProm = (prom: PromDef, frecuenciaDias = prom.frecuenciaPorDefecto) =>
  (prom.preguntas ?? []).map((q) => ({ ...q, frecuenciaDias }))

/** Puntos de una respuesta para el total de su PROM. */
export function puntosRespuesta(q: Pregunta, v: number | boolean | undefined): number | undefined {
  if (v === undefined) return undefined
  if (q.tipo === 'opciones') return typeof v === 'number' ? q.opciones?.[v]?.puntos : undefined
  if (q.tipo === 'si_no') return v === q.respuestaAlerta ? 1 : 0
  return typeof v === 'number' ? v : undefined
}

/** Total del PROM en una respuesta, si están contestadas todas sus preguntas del seguimiento. */
export function totalProm(prom: PromDef, preguntas: Pregunta[], respuestas: Record<string, number | boolean>): number | undefined {
  const qs = preguntas.filter((q) => q.prom === prom.id)
  if (!qs.length || qs.some((q) => respuestas[q.id] === undefined)) return undefined
  return qs.reduce((suma, q) => suma + (puntosRespuesta(q, respuestas[q.id]) ?? 0), 0)
}

/** "SCCAI (Simple Clinical…)" → "SCCAI" */
export const nombreCortoProm = (prom: PromDef) => prom.nombre.split(' (')[0]

/** PROMs que tiene activos un seguimiento, con su frecuencia (la de su primera pregunta). */
export function promsActivos(seg: { preguntas: Pregunta[] }): { prom: PromDef; frecuencia?: number }[] {
  return PROMS.flatMap((prom) => {
    const q = seg.preguntas.find((x) => x.prom === prom.id)
    return q ? [{ prom, frecuencia: q.frecuenciaDias }] : []
  })
}
