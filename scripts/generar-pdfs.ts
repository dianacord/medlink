// Genera los 3 PDFs de analítica de ejemplo en public/ejemplos/. Uso: npm run pdfs
// Son de un laboratorio externo inventado: el paciente los sube desde su app para probar la lectura.

import { mkdirSync, writeFileSync } from 'node:fs'
import { generarPdfAnalitica, type InformeAnalitica } from '../src/logica/pdfAnalitica'

const LABORATORIO = 'Laboratorio de Análisis Clínicos Ejemplo'
const fecha = new Date(2026, 9, 20)
const paciente = 'Paciente de ejemplo'

const EJEMPLOS: Record<string, InformeAnalitica> = {
  // Todo en rango. La albúmina viene en g/dL: la app la pasa a g/L.
  'analitica-externa-normal.pdf': {
    laboratorio: LABORATORIO,
    paciente,
    fecha,
    secciones: [
      {
        titulo: 'Hemograma',
        filas: [
          { prueba: 'Hemoglobina', resultado: '13,4', unidad: 'g/dL', referencia: '12,0 - 16,0' },
          { prueba: 'Leucocitos', resultado: '6,8', unidad: 'x10^3/µL', referencia: '4,0 - 11,0' },
          { prueba: 'Plaquetas', resultado: '254', unidad: 'x10^3/µL', referencia: '150 - 400' },
        ],
      },
      {
        titulo: 'Bioquímica',
        filas: [
          { prueba: 'Albúmina', resultado: '4,2', unidad: 'g/dL', referencia: '3,5 - 5,2' },
          { prueba: 'Proteína C reactiva', resultado: '1,9', unidad: 'mg/L', referencia: '< 5,0' },
          { prueba: 'Ferritina', resultado: '64', unidad: 'ng/mL', referencia: '15 - 150' },
        ],
      },
      {
        titulo: 'Heces',
        filas: [{ prueba: 'Calprotectina fecal', resultado: '62', unidad: 'µg/g', referencia: '< 50' }],
      },
    ],
  },
  // Brote: calprotectina y PCR altas, hemoglobina y albúmina bajas.
  'analitica-externa-alterada.pdf': {
    laboratorio: LABORATORIO,
    paciente,
    fecha,
    secciones: [
      {
        titulo: 'Hemograma',
        filas: [
          { prueba: 'Hemoglobina', resultado: '11,1', unidad: 'g/dL', referencia: '12,0 - 16,0' },
          { prueba: 'Leucocitos', resultado: '10,9', unidad: 'x10^3/µL', referencia: '4,0 - 11,0' },
          { prueba: 'Plaquetas', resultado: '462', unidad: 'x10^3/µL', referencia: '150 - 400' },
        ],
      },
      {
        titulo: 'Bioquímica',
        filas: [
          { prueba: 'Albúmina', resultado: '33', unidad: 'g/L', referencia: '35 - 52' },
          { prueba: 'Proteína C reactiva (PCR)', resultado: '14,6', unidad: 'mg/L', referencia: '< 5,0' },
          { prueba: 'Ferritina', resultado: '18', unidad: 'ng/mL', referencia: '15 - 150' },
        ],
      },
      {
        titulo: 'Heces',
        filas: [{ prueba: 'Calprotectina fecal', resultado: '1.180', unidad: 'µg/g', referencia: '< 50' }],
      },
    ],
  },
  // Otra analítica (perfil lipídico y tiroides): no trae ningún parámetro del seguimiento.
  'analitica-otra-prueba.pdf': {
    laboratorio: LABORATORIO,
    paciente,
    fecha,
    secciones: [
      {
        titulo: 'Perfil lipídico',
        filas: [
          { prueba: 'Colesterol total', resultado: '186', unidad: 'mg/dL', referencia: '< 200' },
          { prueba: 'Colesterol LDL', resultado: '112', unidad: 'mg/dL', referencia: '< 130' },
          { prueba: 'Triglicéridos', resultado: '98', unidad: 'mg/dL', referencia: '< 150' },
        ],
      },
      {
        titulo: 'Hormonas tiroideas',
        filas: [{ prueba: 'TSH', resultado: '2,1', unidad: 'mUI/L', referencia: '0,4 - 4,0' }],
      },
    ],
  },
}

mkdirSync('public/ejemplos', { recursive: true })
for (const [nombre, informe] of Object.entries(EJEMPLOS)) {
  writeFileSync(`public/ejemplos/${nombre}`, await generarPdfAnalitica(informe))
  console.log(`public/ejemplos/${nombre}`)
}
