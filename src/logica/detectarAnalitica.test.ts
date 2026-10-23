import { describe, expect, it } from 'vitest'
import { PLANTILLA_COLITIS } from '../config/plantillas'
import { detectarParametros } from './detectarAnalitica'

const P = PLANTILLA_COLITIS.parametros
const valores = (lineas: string[]) => Object.fromEntries(detectarParametros(lineas, P).map((d) => [d.parametroId, d.valor]))

describe('detectarParametros', () => {
  it('lee un informe típico con comas decimales y rangos de referencia', () => {
    expect(
      valores([
        'HEMOGRAMA',
        'Hemoglobina 13,2 g/dL 12,0 - 16,0',
        'BIOQUÍMICA',
        'Albúmina 41 g/L 35 - 52',
        'Proteína C reactiva (PCR) 2,4 mg/L < 5',
        'Calprotectina fecal 85 µg/g < 50',
      ]),
    ).toEqual({ hemoglobina: 13.2, albumina: 41, pcr: 2.4, calprotectina: 85 })
  })

  it('entiende miles con punto en la calprotectina', () => {
    expect(valores(['Calprotectina en heces 1.250 µg/g'])).toEqual({ calprotectina: 1250 })
  })

  it('pasa a la unidad del seguimiento', () => {
    expect(valores(['Albumina 3,9 g/dL', 'PCR 1,8 mg/dL', 'Hb 128 g/L'])).toEqual({ albumina: 39, pcr: 18, hemoglobina: 12.8 })
  })

  it('no confunde Hb con HbA1c ni encuentra nada en otra analítica', () => {
    expect(valores(['HbA1c 5,6 %', 'Colesterol total 182 mg/dL', 'TSH 2,1 mUI/L'])).toEqual({})
  })
})
