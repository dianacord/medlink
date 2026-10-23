import type { Medicion, RespuestaEncuesta, SeguimientoVersion } from '../types'
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

/** Fecha en que toca la próxima analítica (la última más la frecuencia). */
export function proximaAnalitica(seg: SeguimientoVersion, mediciones: Medicion[]): number {
  const ultima = Math.max(Date.parse(seg.fechaInicio), ...mediciones.map((m) => Date.parse(m.fecha)))
  return ultima + seg.frecuenciaAnaliticaSemanas * 7 * DIA_MS
}
