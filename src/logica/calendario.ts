import type { Medicion, Parametro, Pregunta, RespuestaEncuesta, SeguimientoVersion } from '../types'
import { DIA_MS } from './formato'

export interface PeriodoEncuesta {
  /** Día en que vence la encuesta. */
  desde: number
  /** Día en que vence la siguiente (fin del periodo). */
  hasta: number
  respondida: boolean
}

/** Periodos de encuesta que ya han empezado en `ahora`, del más antiguo al más reciente. */
export function periodosEncuesta(
  seg: SeguimientoVersion,
  respuestas: RespuestaEncuesta[],
  ahora: number,
): PeriodoEncuesta[] {
  const paso = seg.frecuenciaEncuestaDias * DIA_MS
  const inicio = Date.parse(seg.fechaInicio)
  const fin = Date.parse(seg.fechaFin)
  const fechas = respuestas.map((r) => Date.parse(r.fecha))
  const periodos: PeriodoEncuesta[] = []
  for (let desde = inicio; desde <= ahora && desde < fin; desde += paso) {
    const hasta = desde + paso
    periodos.push({ desde, hasta, respondida: fechas.some((f) => f >= desde && f < hasta) })
  }
  return periodos
}

/** La encuesta del periodo actual, si está pendiente. */
export function encuestaPendiente(seg: SeguimientoVersion, respuestas: RespuestaEncuesta[], ahora: number) {
  const actual = periodosEncuesta(seg, respuestas, ahora).at(-1)
  return actual && !actual.respondida ? actual : undefined
}

/** Fecha en que vence la próxima encuesta todavía no abierta. */
export function proximaEncuesta(seg: SeguimientoVersion, respuestas: RespuestaEncuesta[], ahora: number): number {
  const actual = periodosEncuesta(seg, respuestas, ahora).at(-1)
  return actual ? actual.hasta : Date.parse(seg.fechaInicio)
}

/** Si algo que empieza en `inicio` y se repite cada `dias` vence dentro de [desde, hasta). */
function venceEntre(inicio: number, dias: number, desde: number, hasta: number) {
  const paso = dias * DIA_MS
  const n = Math.max(0, Math.ceil((desde - inicio) / paso))
  return inicio + n * paso < hasta
}

/**
 * Preguntas que tocan en un periodo de encuesta: las que vencen en él según su frecuencia,
 * más las señales de alarma, que van siempre.
 */
export function preguntasDelPeriodo(seg: SeguimientoVersion, periodo: Pick<PeriodoEncuesta, 'desde' | 'hasta'>): Pregunta[] {
  const inicio = Date.parse(seg.fechaInicio)
  return seg.preguntas.filter((q) => q.frecuenciaDias === undefined || venceEntre(inicio, q.frecuenciaDias, periodo.desde, periodo.hasta))
}

/** Cuándo toca cada parámetro: su última medición (o el inicio) más su frecuencia. Ordenado por fecha. */
export function proximasAnaliticas(seg: SeguimientoVersion, mediciones: Medicion[]): { parametro: Parametro; fecha: number }[] {
  const inicio = Date.parse(seg.fechaInicio)
  return seg.parametros
    .map((parametro) => {
      const ultima = Math.max(inicio, ...mediciones.filter((m) => m.parametroId === parametro.id).map((m) => Date.parse(m.fecha)))
      return { parametro, fecha: ultima + parametro.frecuenciaDias * DIA_MS }
    })
    .sort((a, b) => a.fecha - b.fecha)
}

/** Fecha en que toca la próxima analítica (el primer parámetro que vence). */
export function proximaAnalitica(seg: SeguimientoVersion, mediciones: Medicion[]): number {
  return proximasAnaliticas(seg, mediciones)[0]?.fecha ?? Date.parse(seg.fechaInicio) + seg.frecuenciaAnaliticaSemanas * 7 * DIA_MS
}
