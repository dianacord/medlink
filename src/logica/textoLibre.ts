import { NEGACIONES, PALABRAS_CLAVE, VENTANA_NEGACION, type PalabraClave } from '../config/prioridad'
import { normalizar } from './formato'

export interface Coincidencia {
  palabra: PalabraClave
}

const palabrasDe = (texto: string) => normalizar(texto).split(/[^a-z0-9ñ]+/).filter(Boolean)

/**
 * Busca las palabras clave del diccionario en un texto libre.
 * Ignora las que van negadas ("no he visto sangre") y, si una frase de alarma
 * contiene otra más corta ("mucha sangre" ⊃ "sangre"), solo cuenta la larga.
 */
export function analizarTexto(texto: string): Coincidencia[] {
  const palabras = palabrasDe(texto)
  const encontradas: { palabra: PalabraClave; desde: number; hasta: number }[] = []

  for (const palabra of PALABRAS_CLAVE) {
    for (const patron of palabra.patrones) {
      const buscado = palabrasDe(patron)
      for (let i = 0; i + buscado.length <= palabras.length; i++) {
        if (!buscado.every((p, j) => palabras[i + j] === p)) continue
        const anteriores = palabras.slice(Math.max(0, i - VENTANA_NEGACION), i)
        if (anteriores.some((p) => NEGACIONES.includes(p))) continue
        encontradas.push({ palabra, desde: i, hasta: i + buscado.length })
      }
    }
  }

  // Las coincidencias más largas tienen preferencia sobre las que solapan con ellas.
  encontradas.sort((a, b) => b.hasta - b.desde - (a.hasta - a.desde))
  const aceptadas: typeof encontradas = []
  for (const e of encontradas) {
    const solapa = aceptadas.some((a) => e.desde < a.hasta && a.desde < e.hasta)
    const repetida = aceptadas.some((a) => a.palabra === e.palabra)
    if (!solapa && !repetida) aceptadas.push(e)
  }
  return aceptadas.map(({ palabra }) => ({ palabra }))
}

export const hayAlarmaEnTexto = (texto: string) => analizarTexto(texto).some((c) => c.palabra.alarma)
