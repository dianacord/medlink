// Priorización de avisos por reglas. Es interna: el médico solo ve la prioridad y los motivos.

import { ENCUESTAS_SEGUIDAS_SIN_RESPONDER, MEDICIONES_TENDENCIA, PESOS, UMBRALES_PRIORIDAD } from '../config/prioridad'
import type {
  Documento,
  Medicion,
  Motivo,
  Parametro,
  PeticionRevision,
  Prioridad,
  RespuestaEncuesta,
  SeguimientoVersion,
} from '../types'
import { periodosEncuesta } from './calendario'
import { mes, num, numConSigno } from './formato'
import { analizarTexto } from './textoLibre'

export interface Entrada {
  seg: SeguimientoVersion
  mediciones: Medicion[]
  respuestas: RespuestaEncuesta[]
  peticiones: PeticionRevision[]
  documentos: Documento[]
  /** Solo cuentan los datos posteriores a este instante (la última decisión del médico). */
  desde: number
  ahora: number
}

export interface Evaluacion {
  puntuacion: number
  prioridad: Prioridad | null
  titulo: string
  motivos: Motivo[]
}

const enOrden = <T extends { fecha: string }>(xs: T[], ahora: number) =>
  xs.filter((x) => Date.parse(x.fecha) <= ahora).sort((a, b) => a.fecha.localeCompare(b.fecha))

export const objetivoTexto = (p: Pick<Parametro, 'min' | 'max'>) =>
  p.min !== undefined && p.max !== undefined
    ? `entre ${num(p.min)} y ${num(p.max)}`
    : p.max !== undefined
      ? `< ${num(p.max)}`
      : p.min !== undefined
        ? `≥ ${num(p.min)}`
        : 'sin objetivo'

export const fueraDeRango = (p: Pick<Parametro, 'min' | 'max'>, valor: number) =>
  (p.min !== undefined && valor < p.min) || (p.max !== undefined && valor >= p.max)

/** Cuánto ha empeorado de `a` a `b` (positivo = peor). */
const empeora = (p: Parametro, a: number, b: number) => (p.empeoraAl === 'subir' ? b - a : a - b)

function motivosParametros(e: Entrada): Motivo[] {
  const motivos: Motivo[] = []
  for (const p of e.seg.parametros) {
    const ms = enOrden(e.mediciones.filter((m) => m.parametroId === p.id), e.ahora)
    const ultima = ms.at(-1)
    if (!ultima || Date.parse(ultima.fecha) <= e.desde) continue
    const v = ultima.valor
    const sinVerificar = ultima.verificado ? '' : ' · sin verificar'

    if (p.reglas.includes('fuera_de_rango') && fueraDeRango(p, v)) {
      motivos.push({
        tipo: 'fuera_de_rango',
        texto: `${p.nombre} ${num(v)} ${p.unidad} · objetivo ${objetivoTexto(p)}${sinVerificar}`,
        puntos: PESOS.fueraDeRango,
        refId: p.id,
      })
    }
    const anterior = ms.at(-2)
    if (p.reglas.includes('cambio_brusco') && anterior && empeora(p, anterior.valor, v) >= p.cambioRelevante) {
      motivos.push({
        tipo: 'cambio_brusco',
        texto: `${p.nombre} ${numConSigno(v - anterior.valor)} desde ${mes(anterior.fecha)}`,
        puntos: PESOS.cambioBrusco,
        refId: p.id,
      })
    }
    const ultimas = ms.slice(-MEDICIONES_TENDENCIA)
    if (
      p.reglas.includes('tendencia') &&
      ultimas.length === MEDICIONES_TENDENCIA &&
      ultimas.every((m, i) => i === 0 || empeora(p, ultimas[i - 1].valor, m.valor) > 0)
    ) {
      motivos.push({
        tipo: 'tendencia',
        texto: `${p.nombre} ${p.empeoraAl === 'subir' ? 'al alza' : 'a la baja'} en ${MEDICIONES_TENDENCIA} analíticas`,
        puntos: PESOS.tendencia,
        refId: p.id,
      })
    }
  }
  return motivos
}

function motivosTexto(texto: string): Motivo[] {
  return analizarTexto(texto).map(({ palabra }) => ({
    tipo: palabra.alarma ? 'alarma' : 'palabra_clave',
    texto: `Mensaje: «${palabra.etiqueta}»`,
    puntos: palabra.puntos,
  }))
}

function motivosEncuesta(e: Entrada): Motivo[] {
  const rs = enOrden(e.respuestas, e.ahora)
  const ultima = rs.at(-1)
  if (!ultima || Date.parse(ultima.fecha) <= e.desde) return []
  const anterior = rs.at(-2)
  const motivos: Motivo[] = []

  for (const q of e.seg.preguntas) {
    const v = ultima.respuestas[q.id]
    if (v === undefined) continue
    if (q.tipo === 'si_no') {
      if (v !== q.respuestaAlerta) continue
      motivos.push(
        q.alarma
          ? { tipo: 'alarma', texto: `Señal de alarma: ${q.etiqueta}`, puntos: PESOS.alarma, refId: q.id }
          : { tipo: 'sintoma_umbral', texto: q.etiqueta, puntos: q.peso ?? PESOS.sintomaUmbral, refId: q.id },
      )
      continue
    }
    if (typeof v !== 'number') continue
    const unidad = q.tipo === 'escala' ? '/10' : (q.unidad ?? '')
    if (q.umbral !== undefined && v >= q.umbral) {
      motivos.push(
        q.alarma
          ? { tipo: 'alarma', texto: `Señal de alarma: ${q.etiqueta} ${v}${unidad}`, puntos: PESOS.alarma, refId: q.id }
          : { tipo: 'sintoma_umbral', texto: `${q.etiqueta} ${v}${unidad}`, puntos: q.peso ?? PESOS.sintomaUmbral, refId: q.id },
      )
    }
    const antes = anterior?.respuestas[q.id]
    if (typeof antes === 'number' && v - antes >= (q.cambioRelevante ?? 1)) {
      motivos.push({
        tipo: 'sintoma_empeora',
        texto: `${q.etiqueta} ${v}${unidad} · antes ${antes}`,
        puntos: PESOS.sintomaEmpeora,
        refId: q.id,
      })
    }
  }
  if (ultima.textoLibre) motivos.push(...motivosTexto(ultima.textoLibre))
  return motivos
}

function motivosEncuestasSinResponder(e: Entrada): Motivo[] {
  const cerrados = periodosEncuesta(e.seg, e.respuestas, e.ahora).filter((p) => p.hasta <= e.ahora)
  const ultimos = cerrados.slice(-ENCUESTAS_SEGUIDAS_SIN_RESPONDER)
  const sinResponder =
    ultimos.length === ENCUESTAS_SEGUIDAS_SIN_RESPONDER &&
    ultimos.every((p) => !p.respondida) &&
    ultimos[ultimos.length - 1].hasta > e.desde
  return sinResponder
    ? [{ tipo: 'encuestas_sin_responder', texto: `${ENCUESTAS_SEGUIDAS_SIN_RESPONDER} encuestas sin responder`, puntos: PESOS.encuestasSinResponder }]
    : []
}

function motivosPaciente(e: Entrada): Motivo[] {
  const nuevos = <T extends { fecha: string }>(xs: T[]) =>
    xs.filter((x) => Date.parse(x.fecha) > e.desde && Date.parse(x.fecha) <= e.ahora)
  const motivos: Motivo[] = []
  const peticiones = nuevos(e.peticiones)
  if (peticiones.length) {
    motivos.push({ tipo: 'peticion_revision', texto: 'Pide revisión', puntos: PESOS.peticionRevision })
    for (const p of peticiones) motivos.push(...motivosTexto(p.texto))
  }
  const sinDetectar = nuevos(e.documentos.map((d) => ({ ...d, fecha: d.subidoEn }))).filter((d) => !d.medicionIds.length)
  if (sinDetectar.length) {
    motivos.push({ tipo: 'analitica_sin_detectar', texto: 'Analítica externa para revisar', puntos: PESOS.analiticaSinDetectar })
  }
  return motivos
}

export function prioridadDe(puntuacion: number): Prioridad | null {
  if (puntuacion >= UMBRALES_PRIORIDAD.alta) return 'alta'
  if (puntuacion >= UMBRALES_PRIORIDAD.media) return 'media'
  if (puntuacion >= UMBRALES_PRIORIDAD.baja) return 'baja'
  return null
}

const minusculaInicial = (s: string) => (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s)

export function tituloDe(motivos: Motivo[], parametros: Parametro[]): string {
  const tipos = new Set(motivos.map((m) => m.tipo))
  if (tipos.has('alarma')) return 'Señal de alarma'
  const alterados = parametros.filter((p) => motivos.some((m) => m.refId === p.id)).map((p) => minusculaInicial(p.nombre))
  if (alterados.length === 1) return `Alteración de ${alterados[0]}`
  if (alterados.length === 2) return `Alteración de ${alterados[0]} y ${alterados[1]}`
  if (alterados.length > 2) return `Alteración de ${alterados[0]} y ${alterados.length - 1} parámetros más`
  if (tipos.has('sintoma_umbral') || tipos.has('sintoma_empeora') || tipos.has('palabra_clave')) return 'Empeoramiento de síntomas'
  if (tipos.has('peticion_revision')) return 'Pide revisión'
  if (tipos.has('analitica_sin_detectar')) return 'Analítica externa para revisar'
  if (tipos.has('encuestas_sin_responder')) return 'Encuestas sin responder'
  return 'Sin cambios relevantes'
}

export function evaluar(e: Entrada): Evaluacion {
  const todos = [
    ...motivosParametros(e),
    ...motivosEncuesta(e),
    ...motivosPaciente(e),
    ...motivosEncuestasSinResponder(e),
  ]
  // Una misma palabra clave en la encuesta y en una petición solo cuenta una vez.
  const motivos = todos.filter((m, i) => todos.findIndex((o) => o.tipo === m.tipo && o.texto === m.texto) === i)
  const puntuacion = motivos.reduce((s, m) => s + m.puntos, 0)
  return { puntuacion, prioridad: prioridadDe(puntuacion), titulo: tituloDe(motivos, e.seg.parametros), motivos }
}

/**
 * Textos de los chips de un aviso. Si un síntoma supera el umbral y además empeora,
 * se muestra un solo chip ("Urgencia 7/10 · antes 2"). Las alarmas van primero.
 */
export function chipsDe(motivos: Motivo[]): { texto: string; alarma: boolean }[] {
  const sintomas = new Set(motivos.filter((m) => m.tipo === 'sintoma_empeora').map((m) => m.refId))
  return motivos
    .filter((m) => !(m.tipo === 'sintoma_umbral' && sintomas.has(m.refId)))
    .map((m) => ({ texto: m.texto, alarma: m.tipo === 'alarma' }))
    .sort((a, b) => Number(b.alarma) - Number(a.alarma))
}
