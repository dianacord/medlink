// Busca los parámetros del seguimiento en el texto de un informe de laboratorio.
// Funciona línea a línea: nombre del parámetro (o un sinónimo) y el primer número que le sigue.
// El paciente siempre revisa y confirma lo detectado antes de enviarlo.

import type { Parametro } from '../types'
import { normalizar } from './formato'

export interface ValorDetectado {
  parametroId: string
  valor: number
  /** Línea del informe de donde sale, para que el paciente la reconozca. */
  linea: string
  /** Se ha pasado a la unidad del seguimiento (por ejemplo, g/dL → g/L). */
  convertido: boolean
}

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** "1.250" → 1250 (miles), "12,8" → 12.8, "0.5" → 0.5 */
function leerValor(texto: string): number {
  if (/^\d{1,3}(\.\d{3})+$/.test(texto)) return Number(texto.replace(/\./g, ''))
  return Number(texto.replace(',', '.'))
}

/** Pasa el valor a la unidad del seguimiento cuando el informe usa otra habitual. */
function convertir(p: Parametro, valor: number, resto: string): { valor: number; convertido: boolean } {
  const unidad = resto.replace(/\s/g, '')
  const enGdl = /^[^a-z]*g\/dl/.test(unidad)
  const enMgdl = /^[^a-z]*mg\/dl/.test(unidad)
  if (p.unidad === 'g/L' && enGdl) return { valor: Math.round(valor * 100) / 10, convertido: true }
  if (p.unidad === 'mg/L' && enMgdl) return { valor: Math.round(valor * 100) / 10, convertido: true }
  if (p.unidad === 'g/dL' && /^[^a-z]*g\/l(?!\w)/.test(unidad)) return { valor: Math.round(valor) / 10, convertido: true }
  return { valor, convertido: false }
}

export function detectarParametros(lineas: string[], parametros: Parametro[]): ValorDetectado[] {
  const encontrados: ValorDetectado[] = []
  for (const p of parametros) {
    const nombres = [...new Set([p.nombre, ...p.sinonimos].map(normalizar))].sort((a, b) => b.length - a.length)
    const patron = new RegExp(`(?:^|[^a-z0-9])(?:${nombres.map(escapar).join('|')})(?![a-z0-9])`)
    for (const linea of lineas) {
      const normal = normalizar(linea)
      const m = patron.exec(normal)
      if (!m) continue
      const tras = normal.slice(m.index + m[0].length)
      const numero = /(\d+(?:[.,]\d+)*)/.exec(tras)
      if (!numero) continue
      const bruto = leerValor(numero[1])
      if (!Number.isFinite(bruto)) continue
      const { valor, convertido } = convertir(p, bruto, tras.slice(numero.index + numero[1].length))
      encontrados.push({ parametroId: p.id, valor, linea: linea.trim(), convertido })
      break
    }
  }
  return encontrados
}
