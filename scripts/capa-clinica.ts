// Capa clínica sintética de colitis ulcerosa para los pacientes de la muestra.
// Los casos clave del demo están escritos a mano; los pacientes en verde se generan
// con valores estables que no disparan ninguna regla (lo comprueba un test).

import { PLANTILLA_COLITIS } from '../src/config/plantillas'
import { aplicaPregunta } from '../src/logica/preguntas'
import type { CapaClinica, Paciente, ValorRespuesta } from '../src/types'

const FRECUENCIA = PLANTILLA_COLITIS.frecuenciaEncuestaDias
const PERIODOS_PREVIOS = 13 // unos 6 meses de encuestas

/** Generador pseudoaleatorio con semilla, para que la capa sea siempre igual. */
function aleatorio(semilla: string) {
  let a = [...semilla].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7)
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const entre = (r: () => number, min: number, max: number, decimales = 0) =>
  Number((min + r() * (max - min)).toFixed(decimales))

type Sintomas = { deposiciones: number; urgencia: number; dolor: number; cansancio: number }

interface Caso {
  /** Días desde que vence la encuesta actual (la de este periodo). */
  desfase: number
  /** Días desde la última analítica; las anteriores van cada 12 semanas. */
  ultimaAnalitica: number
  /** Tres analíticas, de la más antigua a la más reciente. Si falta, se generan estables. */
  analiticas?: Record<string, [number, number, number]>
  sintomas?: Sintomas
  /** Periodos (contando desde el actual = 0) sin responder. */
  sinResponder?: number[]
  /** Respuesta del periodo actual, si difiere de la habitual. */
  ultima?: Partial<Sintomas> & { sangre?: boolean; textoLibre?: string }
}

const CASOS: Record<string, Caso> = {
  // ALTA: brote. Calprotectina y PCR se disparan; dos días después empeoran los síntomas.
  P0114514: {
    desfase: 3,
    ultimaAnalitica: 3,
    analiticas: {
      calprotectina: [85, 90, 620],
      pcr: [2, 3, 18],
      hemoglobina: [14.6, 14.8, 13.9],
      albumina: [41, 43, 40],
    },
    sintomas: { deposiciones: 2, urgencia: 2, dolor: 1, cansancio: 3 },
    ultima: { deposiciones: 6, urgencia: 7, dolor: 5, cansancio: 5, sangre: true },
  },
  // MEDIA: calprotectina en tendencia al alza (aún en rango) y más urgencia.
  P0058433: {
    desfase: 5,
    ultimaAnalitica: 12,
    analiticas: {
      calprotectina: [80, 120, 145],
      pcr: [2, 3, 3],
      hemoglobina: [12.8, 12.9, 12.8],
      albumina: [40, 41, 40],
    },
    sintomas: { deposiciones: 3, urgencia: 3, dolor: 2, cansancio: 3 },
    ultima: { urgencia: 6, textoLibre: 'Últimamente tengo más prisa por ir al baño, sobre todo por las mañanas.' },
  },
  // BAJA: dejó de responder las dos últimas encuestas (y la actual sigue abierta).
  P0116240: { desfase: 6, ultimaAnalitica: 40, sinResponder: [0, 1, 2] },
  // Paciente de prueba: todo bien y la encuesta vence hoy.
  P0163423: { desfase: 0, ultimaAnalitica: 20, sinResponder: [0] },
}

/** Analíticas estables: suben y bajan un poco, sin cruzar el objetivo ni encadenar 3 empeoramientos. */
function analiticasEstables(r: () => number, sexo: Paciente['sexo']): Record<string, [number, number, number]> {
  const patron = (base: number, delta: number, d: number): [number, number, number] => [
    base,
    Number((base + delta).toFixed(d)),
    Number((base + delta / 2).toFixed(d)),
  ]
  return {
    calprotectina: patron(entre(r, 35, 105), entre(r, 10, 30), 0),
    pcr: patron(entre(r, 0.5, 3, 1), entre(r, 0.2, 1, 1), 1),
    hemoglobina: patron(sexo === 'F' ? entre(r, 12.8, 14.2, 1) : entre(r, 13.8, 15.8, 1), -entre(r, 0.2, 0.6, 1), 1),
    albumina: patron(entre(r, 38, 45), -entre(r, 1, 2), 0),
  }
}

export function generarCapaClinica(pacientes: Paciente[]): CapaClinica {
  const capa: CapaClinica = { seguimientos: [], mediciones: [], respuestas: [] }

  for (const paciente of pacientes) {
    const r = aleatorio(paciente.id)
    const caso: Caso = CASOS[paciente.id] ?? {
      desfase: 2 + Math.floor(r() * 11),
      ultimaAnalitica: 2 + Math.floor(r() * 40),
    }
    const inicio = caso.desfase + PERIODOS_PREVIOS * FRECUENCIA
    capa.seguimientos.push({ pacienteId: paciente.id, inicioDiasAtras: inicio })

    const analiticas = caso.analiticas ?? analiticasEstables(r, paciente.sexo)
    for (const [parametroId, valores] of Object.entries(analiticas)) {
      valores.forEach((valor, i) => {
        capa.mediciones.push({
          pacienteId: paciente.id,
          parametroId,
          valor,
          diasAtras: caso.ultimaAnalitica + (2 - i) * PLANTILLA_COLITIS.frecuenciaAnaliticaSemanas * 7,
        })
      })
    }

    const base: Sintomas = caso.sintomas ?? {
      deposiciones: 1 + Math.floor(r() * 2),
      urgencia: Math.floor(r() * 3),
      dolor: Math.floor(r() * 3),
      cansancio: 1 + Math.floor(r() * 3),
    }
    const preguntas = PLANTILLA_COLITIS.preguntas.filter((p) => aplicaPregunta(p, paciente))

    // Periodo k vence hace (desfase + k * 14) días; se responde al día siguiente.
    for (let k = PERIODOS_PREVIOS; k >= 0; k--) {
      if (caso.sinResponder?.includes(k)) continue
      const diasAtras = caso.desfase + k * FRECUENCIA - 1
      if (diasAtras < 0) continue
      const actual = k === 0 && caso.ultima ? caso.ultima : {}
      // Variación de como mucho 1 punto: nunca cuenta como empeorar (hace falta subir 2).
      const varia = (v: number) => v + (r() < 0.5 ? 0 : 1)
      const respuestas: Record<string, ValorRespuesta> = {}
      for (const p of preguntas) {
        if (p.id in base) {
          const clave = p.id as keyof Sintomas
          respuestas[p.id] = actual[clave] ?? (caso.sintomas ? base[clave] : varia(base[clave]))
        } else if (p.id === 'sangre') {
          respuestas[p.id] = actual.sangre ?? false
        } else if (p.id === 'medicacion') {
          respuestas[p.id] = true
        } else {
          respuestas[p.id] = false
        }
      }
      capa.respuestas.push({
        pacienteId: paciente.id,
        diasAtras,
        respuestas,
        ...(actual.textoLibre ? { textoLibre: actual.textoLibre } : {}),
      })
    }
  }
  return capa
}
