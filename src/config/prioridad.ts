// Único sitio donde se ajusta la priorización de avisos.

/** Puntos que suma cada motivo. */
export const PESOS = {
  fueraDeRango: 3,
  cambioBrusco: 2,
  tendencia: 1,
  sintomaUmbral: 2,
  sintomaEmpeora: 1,
  encuestasSinResponder: 1,
  /** Señal de alarma marcada en la encuesta o detectada en el texto libre. */
  alarma: 6,
  /** El paciente pide voluntariamente que le revisen. */
  peticionRevision: 2,
  /** El paciente sube un PDF en el que no se detecta ningún parámetro. */
  analiticaSinDetectar: 1,
}

/** Puntuación mínima de cada prioridad. Con 0 no se crea aviso. */
export const UMBRALES_PRIORIDAD = {
  alta: 6,
  media: 3,
  baja: 1,
}

/** Encuestas seguidas sin responder que generan aviso. */
export const ENCUESTAS_SEGUIDAS_SIN_RESPONDER = 2

/** Una tendencia empeora si cada una de estas mediciones es peor que la anterior. */
export const MEDICIONES_TENDENCIA = 3

// ---------- Texto libre ----------

export interface PalabraClave {
  /** Formas que se buscan en el texto (sin tildes, en minúsculas). */
  patrones: string[]
  /** Etiqueta que ve el médico en el chip. */
  etiqueta: string
  puntos: number
  /** Si aparece, también se muestra la pantalla de Urgencias. */
  alarma?: boolean
}

export const PALABRAS_CLAVE: PalabraClave[] = [
  // Alarma
  { patrones: ['mucha sangre', 'sangro mucho', 'sangrando mucho'], etiqueta: 'mucha sangre', puntos: 6, alarma: true },
  { patrones: ['coagulo', 'coagulos'], etiqueta: 'coágulos', puntos: 6, alarma: true },
  { patrones: ['me he desmayado', 'desmayo', 'me desmaye'], etiqueta: 'desmayo', puntos: 6, alarma: true },
  { patrones: ['fiebre alta'], etiqueta: 'fiebre alta', puntos: 6, alarma: true },
  { patrones: ['no puedo beber', 'no tolero liquidos'], etiqueta: 'no puede beber', puntos: 6, alarma: true },
  { patrones: ['vomito', 'vomitos', 'vomitando'], etiqueta: 'vómitos', puntos: 6, alarma: true },
  { patrones: ['barriga dura', 'barriga hinchada', 'tripa dura', 'tripa hinchada'], etiqueta: 'barriga hinchada', puntos: 6, alarma: true },
  // Suman puntos
  { patrones: ['sangre', 'sangrado'], etiqueta: 'sangre', puntos: 2 },
  { patrones: ['diarrea', 'diarreas'], etiqueta: 'diarrea', puntos: 2 },
  { patrones: ['he dejado la medicacion', 'no tomo', 'deje la medicacion', 'he dejado las pastillas'], etiqueta: 'ha dejado la medicación', puntos: 2 },
  { patrones: ['embarazada'], etiqueta: 'embarazo', puntos: 3 },
  { patrones: ['urgencia', 'no llego al baño', 'no llego al bano'], etiqueta: 'urgencia', puntos: 1 },
  { patrones: ['dolor', 'duele'], etiqueta: 'dolor', puntos: 1 },
  { patrones: ['cansada', 'cansado', 'agotada', 'agotado'], etiqueta: 'cansancio', puntos: 1 },
]

/** Una palabra clave no cuenta si una de estas aparece en las palabras inmediatamente anteriores. */
export const NEGACIONES = ['no', 'sin', 'nada', 'ni', 'nunca']
export const VENTANA_NEGACION = 3
