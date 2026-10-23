import { readFileSync } from 'node:fs'

/** Parte una línea CSV respetando comillas ("" dentro de comillas es una comilla literal). */
function partirLinea(linea: string): string[] {
  const campos: string[] = []
  let actual = ''
  let entreComillas = false
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i]
    if (entreComillas) {
      if (c === '"' && linea[i + 1] === '"') {
        actual += '"'
        i++
      } else if (c === '"') {
        entreComillas = false
      } else {
        actual += c
      }
    } else if (c === '"') {
      entreComillas = true
    } else if (c === ',') {
      campos.push(actual)
      actual = ''
    } else {
      actual += c
    }
  }
  campos.push(actual)
  return campos
}

/**
 * Lee un CSV completo como objetos. Corrige las filas de DERIVACIONES_AV.csv
 * que vienen enteras entre comillas (una sola columna que contiene comas).
 */
export function leerCsv(ruta: string): Record<string, string>[] {
  const texto = readFileSync(ruta, 'utf8').replace(/^\uFEFF/, '')
  const lineas = texto.split(/\r?\n/).filter((l) => l.length > 0)
  const cabecera = partirLinea(lineas[0])
  const filas: Record<string, string>[] = []
  for (const linea of lineas.slice(1)) {
    let campos = partirLinea(linea)
    if (campos.length === 1 && campos[0].includes(',')) campos = partirLinea(campos[0])
    const fila: Record<string, string> = {}
    cabecera.forEach((col, i) => (fila[col] = campos[i] ?? ''))
    filas.push(fila)
  }
  return filas
}
