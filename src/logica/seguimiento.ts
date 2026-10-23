import type { Parametro, Pregunta, SeguimientoVersion } from '../types'
import { fechaLarga, num } from './formato'
import { objetivoTexto } from './puntuacion'

type Comparable = Pick<
  SeguimientoVersion,
  'parametros' | 'preguntas' | 'frecuenciaAnaliticaSemanas' | 'frecuenciaEncuestaDias' | 'fechaFin' | 'activo'
>

const REGLAS = { fuera_de_rango: 'fuera de rango', cambio_brusco: 'cambio brusco', tendencia: 'tendencia' }
const reglasTexto = (p: Parametro) => p.reglas.map((r) => REGLAS[r]).join(', ') || 'ninguna'

/** Lista legible de lo que cambia entre dos versiones del seguimiento. */
export function describirCambios(antes: Comparable, despues: Comparable): string[] {
  const cambios: string[] = []

  for (const p of despues.parametros) {
    const a = antes.parametros.find((x) => x.id === p.id)
    if (!a) {
      cambios.push(`Parámetro añadido: ${p.nombre} (objetivo ${objetivoTexto(p)} ${p.unidad})`)
      continue
    }
    if (objetivoTexto(a) !== objetivoTexto(p)) cambios.push(`${p.nombre}: objetivo ${objetivoTexto(a)} → ${objetivoTexto(p)} ${p.unidad}`)
    if (a.cambioRelevante !== p.cambioRelevante) cambios.push(`${p.nombre}: cambio relevante ${num(a.cambioRelevante)} → ${num(p.cambioRelevante)}`)
    if (reglasTexto(a) !== reglasTexto(p)) cambios.push(`${p.nombre}: reglas ${reglasTexto(a)} → ${reglasTexto(p)}`)
    if (a.nombre !== p.nombre || a.unidad !== p.unidad) cambios.push(`${a.nombre} renombrado a ${p.nombre} (${p.unidad})`)
  }
  for (const a of antes.parametros) {
    if (!despues.parametros.some((p) => p.id === a.id)) cambios.push(`Parámetro quitado: ${a.nombre}`)
  }

  const umbral = (q: Pregunta) => (q.tipo === 'si_no' ? (q.respuestaAlerta ? 'sí' : 'no') : q.umbral === undefined ? '—' : num(q.umbral))
  for (const q of despues.preguntas) {
    const a = antes.preguntas.find((x) => x.id === q.id)
    if (!a) {
      cambios.push(`Pregunta añadida: «${q.texto}»${q.alarma ? ' (señal de alarma)' : ''}`)
      continue
    }
    if (a.texto !== q.texto) cambios.push(`Pregunta reformulada: «${a.texto}» → «${q.texto}»`)
    if (umbral(a) !== umbral(q)) cambios.push(`${q.etiqueta}: umbral ${umbral(a)} → ${umbral(q)}`)
    if (a.alarma !== q.alarma) cambios.push(`${q.etiqueta}: ${q.alarma ? 'ahora es' : 'ya no es'} señal de alarma`)
  }
  for (const a of antes.preguntas) {
    if (!despues.preguntas.some((q) => q.id === a.id)) cambios.push(`Pregunta quitada: «${a.texto}»`)
  }

  if (antes.frecuenciaAnaliticaSemanas !== despues.frecuenciaAnaliticaSemanas) {
    cambios.push(`Analítica: cada ${antes.frecuenciaAnaliticaSemanas} → ${despues.frecuenciaAnaliticaSemanas} semanas`)
  }
  if (antes.frecuenciaEncuestaDias !== despues.frecuenciaEncuestaDias) {
    cambios.push(`Encuesta: cada ${antes.frecuenciaEncuestaDias} → ${despues.frecuenciaEncuestaDias} días`)
  }
  if (antes.fechaFin.slice(0, 10) !== despues.fechaFin.slice(0, 10)) {
    cambios.push(`Fin del seguimiento: ${fechaLarga(antes.fechaFin)} → ${fechaLarga(despues.fechaFin)}`)
  }
  if (antes.activo !== despues.activo) cambios.push(despues.activo ? 'Seguimiento reactivado' : 'Seguimiento finalizado')
  return cambios.length ? cambios : ['Sin cambios en la configuración']
}
