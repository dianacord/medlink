// Genera informes de laboratorio sintéticos en PDF (con texto real, para que pdf.js lo pueda leer).
// Se usa para los PDFs de ejemplo (scripts/generar-pdfs.ts) y para "Llega analítica (PDF)" en /demo.
// Todos llevan la marca "DOCUMENTO SINTÉTICO" y ningún logotipo real.

import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export interface FilaAnalitica {
  prueba: string
  resultado: string
  unidad: string
  referencia: string
}

export interface InformeAnalitica {
  laboratorio: string
  paciente: string
  /** Por ejemplo "NHC 8146737". */
  identificador?: string
  fecha: Date
  secciones: { titulo: string; filas: FilaAnalitica[] }[]
}

const MARINO = rgb(0.075, 0.13, 0.235)
const GRIS = rgb(0.48, 0.53, 0.58)
const AZUL = rgb(0.29, 0.565, 0.85)

export async function generarPdfAnalitica(informe: InformeAnalitica): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(`Analítica · ${informe.laboratorio}`)
  doc.setProducer('Medlink (prototipo) · documento sintético')
  const normal = await doc.embedFont(StandardFonts.Helvetica)
  const negrita = await doc.embedFont(StandardFonts.HelveticaBold)
  const pagina = doc.addPage([595, 842])
  const { width, height } = pagina.getSize()
  const texto = (t: string, x: number, y: number, opciones: { tam?: number; fuente?: typeof normal; color?: typeof GRIS } = {}) =>
    pagina.drawText(t, { x, y, size: opciones.tam ?? 10, font: opciones.fuente ?? normal, color: opciones.color ?? MARINO })

  // Marca de agua
  pagina.drawText('DOCUMENTO SINTÉTICO', {
    x: 95,
    y: 230,
    size: 54,
    font: negrita,
    color: rgb(0.85, 0.25, 0.2),
    opacity: 0.12,
    rotate: degrees(40),
  })

  // Cabecera
  pagina.drawRectangle({ x: 0, y: height - 8, width, height: 8, color: AZUL })
  texto(informe.laboratorio, 48, height - 60, { tam: 16, fuente: negrita })
  texto('Informe de resultados de laboratorio', 48, height - 78, { color: GRIS })
  texto('DOCUMENTO SINTÉTICO · NO ES UN INFORME REAL', 48, height - 32, { tam: 8, fuente: negrita, color: rgb(0.76, 0.25, 0.18) })

  pagina.drawRectangle({ x: 48, y: height - 150, width: width - 96, height: 52, color: rgb(0.933, 0.96, 0.99) })
  texto('Paciente', 60, height - 116, { tam: 8, color: GRIS })
  texto(informe.paciente, 60, height - 132, { tam: 11, fuente: negrita })
  if (informe.identificador) texto(informe.identificador, 60, height - 144, { tam: 8, color: GRIS })
  texto('Fecha de extracción', 360, height - 116, { tam: 8, color: GRIS })
  texto(informe.fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }), 360, height - 132, { tam: 11, fuente: negrita })

  // Tabla
  const COL = { prueba: 48, resultado: 290, unidad: 370, referencia: 450 }
  let y = height - 190
  texto('Prueba', COL.prueba, y, { tam: 8, fuente: negrita, color: GRIS })
  texto('Resultado', COL.resultado, y, { tam: 8, fuente: negrita, color: GRIS })
  texto('Unidades', COL.unidad, y, { tam: 8, fuente: negrita, color: GRIS })
  texto('Valores de referencia', COL.referencia, y, { tam: 8, fuente: negrita, color: GRIS })
  y -= 8
  pagina.drawLine({ start: { x: 48, y }, end: { x: width - 48, y }, thickness: 0.8, color: GRIS })

  for (const seccion of informe.secciones) {
    y -= 26
    texto(seccion.titulo.toUpperCase(), COL.prueba, y, { tam: 9, fuente: negrita, color: AZUL })
    for (const f of seccion.filas) {
      y -= 20
      texto(f.prueba, COL.prueba, y)
      texto(f.resultado, COL.resultado, y, { fuente: negrita })
      texto(f.unidad, COL.unidad, y, { color: GRIS })
      texto(f.referencia, COL.referencia, y, { color: GRIS })
    }
  }

  texto('Documento sintético generado para el prototipo Medlink. No contiene datos de ninguna persona real.', 48, 48, { tam: 8, color: GRIS })
  return doc.save()
}

/** Formato de número de un informe español: 13,4 */
export const numeroInforme = (n: number) => n.toLocaleString('es-ES', { maximumFractionDigits: 1 })
