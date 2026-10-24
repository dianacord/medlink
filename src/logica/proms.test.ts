import { describe, expect, it } from 'vitest'
import { PLANTILLA_COLITIS } from '../config/plantillas'
import { promDe, totalProm } from '../config/proms'
import { crearEstadoInicial, registrarRespuesta, seguimientoActual } from '../datos/modelo'
import { vistaPaciente } from '../datos/vistaPaciente'
import { preguntasDelPeriodo, proximasAnaliticas } from './calendario'
import { DIA_MS } from './formato'
import { aplicaPregunta } from './preguntas'
import type { SeguimientoVersion } from '../types'

const HOY = new Date('2026-10-23T12:00:00')
const AHORA = HOY.getTime()
const INICIO = Date.parse('2026-01-05T00:00:00')
const seg = { ...PLANTILLA_COLITIS, fechaInicio: new Date(INICIO).toISOString() } as unknown as SeguimientoVersion
const periodo = (n: number) => ({ desde: INICIO + n * 14 * DIA_MS, hasta: INICIO + (n + 1) * 14 * DIA_MS })
const ids = (n: number) => preguntasDelPeriodo(seg, periodo(n)).map((q) => q.id)

describe('frecuencia de cada PROM y pregunta', () => {
  it('lo quincenal y las alarmas van siempre; lo mensual, una encuesta sí y otra no', () => {
    for (const n of [0, 1, 2, 3]) {
      expect(ids(n)).toEqual(expect.arrayContaining(['deposiciones', 'urgencia', 'dolor', 'alarma_brote', 'alarma_sangrado']))
    }
    expect(ids(0)).toContain('sccai_dia')
    expect(ids(1)).not.toContain('sccai_dia')
    expect(ids(2)).toContain('ibdc_control')
    expect(ids(3)).not.toContain('ibdc_control')
  })

  it('cada parámetro vence según su frecuencia: la albúmina cada 6 meses', () => {
    const proximas = proximasAnaliticas(seg, [])
    const dias = (id: string) => (proximas.find((p) => p.parametro.id === id)!.fecha - INICIO) / DIA_MS
    expect(dias('calprotectina')).toBe(84)
    expect(dias('albumina')).toBe(182)
  })
})

describe('preguntas según el paciente', () => {
  it('a los hombres nunca les sale la pregunta de embarazo', () => {
    const embarazo = PLANTILLA_COLITIS.preguntas.find((q) => q.id === 'embarazo')!
    expect(aplicaPregunta(embarazo, { sexo: 'M', edad: 30 })).toBe(false)
    expect(aplicaPregunta(embarazo, { sexo: 'F', edad: 30 })).toBe(true)
    expect(aplicaPregunta(embarazo, { sexo: 'F', edad: 51 })).toBe(false)
    const e = crearEstadoInicial(HOY)
    for (const p of e.pacientes.filter((x) => x.sexo === 'M')) {
      const vista = vistaPaciente(e, p.id, AHORA)
      expect(vista?.preguntasEncuesta.some((q) => q.id === 'embarazo') ?? false).toBe(false)
    }
  })
})

describe('puntuación de los PROMs', () => {
  const sccai = promDe('sccai')!
  const ibdc = promDe('ibd-control-8')!
  const todas = (prom: typeof sccai, indice: number) => Object.fromEntries(prom.preguntas!.map((q) => [q.id, indice]))

  it('suma los puntos de las opciones y solo si están todas respondidas', () => {
    expect(totalProm(sccai, PLANTILLA_COLITIS.preguntas, todas(sccai, 0))).toBe(0)
    expect(totalProm(sccai, PLANTILLA_COLITIS.preguntas, todas(sccai, 1))).toBe(6)
    expect(totalProm(ibdc, PLANTILLA_COLITIS.preguntas, todas(ibdc, 0))).toBe(16)
    expect(totalProm(sccai, PLANTILLA_COLITIS.preguntas, { sccai_dia: 1 })).toBeUndefined()
  })

  it('SCCAI ≥ 5 e IBD-Control-8 < 13 son motivos de aviso; con buen control, no', () => {
    const e = crearEstadoInicial(HOY)
    const daniel = 'P0105712'
    const base = Object.fromEntries(seguimientoActual(e, daniel)!.preguntas.filter((q) => q.tipo !== 'opciones').map((q) => [q.id, q.tipo === 'si_no' ? !q.respuestaAlerta : 1]))
    const antes = e.actualizaciones.length
    const bien = registrarRespuesta(e, daniel, { ...base, medicacion: true, ...todas(sccai, 0), ...todas(ibdc, 0) }, '', AHORA).estado
    expect(bien.actualizaciones.slice(antes).flatMap((a) => a.motivos).filter((m) => m.tipo === 'prom_alterado')).toHaveLength(0)

    const mal = registrarRespuesta(e, daniel, { ...base, medicacion: true, ...todas(sccai, 1), ...todas(ibdc, 2) }, '', AHORA).estado
    const motivos = mal.actualizaciones.at(-1)!.motivos.filter((m) => m.tipo === 'prom_alterado').map((m) => m.texto)
    expect(motivos).toEqual(['SCCAI 6 · actividad', 'IBD-Control-8 0 · mal control'])
  })
})
