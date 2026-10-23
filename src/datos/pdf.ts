// PDFs de analíticas: lectura del texto con pdf.js y guardado del archivo en IndexedDB
// (localStorage no admite archivos). El estado solo guarda el id y el nombre del documento.

import { get, set } from 'idb-keyval'

const clave = (documentoId: string) => `medlink:pdf:${documentoId}`

/** Une los trozos de texto de cada página en líneas, de arriba abajo y de izquierda a derecha. */
export function agruparEnLineas(trozos: { texto: string; x: number; y: number }[]): string[] {
  const ordenados = [...trozos].filter((t) => t.texto.trim()).sort((a, b) => b.y - a.y || a.x - b.x)
  const lineas: { y: number; trozos: typeof ordenados }[] = []
  for (const t of ordenados) {
    const linea = lineas.find((l) => Math.abs(l.y - t.y) < 3)
    if (linea) linea.trozos.push(t)
    else lineas.push({ y: t.y, trozos: [t] })
  }
  return lineas.map((l) =>
    l.trozos
      .sort((a, b) => a.x - b.x)
      .map((t) => t.texto.trim())
      .join(' '),
  )
}

/** Extrae las líneas de texto de un PDF. Si es una foto escaneada, devuelve una lista vacía. */
export async function leerLineasPdf(datos: ArrayBuffer): Promise<string[]> {
  const pdfjs = await import('pdfjs-dist')
  const { default: worker } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(datos) }).promise
  const lineas: string[] = []
  for (let n = 1; n <= Math.min(pdf.numPages, 5); n++) {
    const contenido = await (await pdf.getPage(n)).getTextContent()
    const trozos = contenido.items.flatMap((i) => ('str' in i ? [{ texto: i.str, x: i.transform[4], y: i.transform[5] }] : []))
    lineas.push(...agruparEnLineas(trozos))
  }
  return lineas
}

export async function guardarPdf(documentoId: string, archivo: Blob) {
  try {
    await set(clave(documentoId), archivo)
  } catch {
    // Sin IndexedDB (modo privado): se registran los valores pero no el archivo.
  }
}

/** Abre el PDF guardado en una pestaña nueva. Devuelve false si no está en este navegador. */
export async function abrirPdf(documentoId: string): Promise<boolean> {
  const ventana = window.open('', '_blank')
  const archivo = await get<Blob>(clave(documentoId)).catch(() => undefined)
  if (!archivo) {
    ventana?.close()
    return false
  }
  const url = URL.createObjectURL(new Blob([archivo], { type: 'application/pdf' }))
  if (ventana) ventana.location.href = url
  else window.location.href = url
  return true
}
