import type { Paciente, Pregunta, ValorRespuesta } from '../types'

/** Si una pregunta se le hace a este paciente (por ejemplo, embarazo solo a mujeres de 18 a 50 años). */
export const aplicaPregunta = (p: Pregunta, paciente: Pick<Paciente, 'sexo' | 'edad'>) =>
  !p.condicion ||
  ((!p.condicion.sexo || p.condicion.sexo === paciente.sexo) &&
    (p.condicion.edadMin === undefined || paciente.edad >= p.condicion.edadMin) &&
    (p.condicion.edadMax === undefined || paciente.edad <= p.condicion.edadMax))

/** Respuesta legible: "Sí", "7/10", "3/día" o el texto de la opción elegida. */
export function valorRespuesta(q: Pregunta, v: ValorRespuesta | undefined): string {
  if (v === undefined) return '—'
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  if (q.tipo === 'opciones') return q.opciones?.[v]?.texto ?? '—'
  return `${v}${q.tipo === 'escala' ? '/10' : (q.unidad ?? '')}`
}
