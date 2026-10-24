import type { Plantilla, Pregunta } from '../types'
import { preguntasDeProm, promDe } from './proms'

// Valores por defecto de la plantilla. Fuentes: AGA (calprotectina), ECCO (PCR),
// criterios de Truelove-Witts (brote grave) e índice Mayo parcial (síntomas).
// Pendiente de validar por un especialista de Digestivo.

/** Preguntas de los PROMs indicados, con su frecuencia por defecto. */
const activos = (...ids: string[]): Pregunta[] => ids.flatMap((id) => preguntasDeProm(promDe(id)!))

export const PLANTILLA_COLITIS: Plantilla = {
  id: 'colitis-ulcerosa',
  nombre: 'Colitis ulcerosa',
  patologia: 'Colitis ulcerosa',
  frecuenciaAnaliticaSemanas: 12,
  frecuenciaEncuestaDias: 14,
  duracionMeses: 12,
  parametros: [
    {
      id: 'calprotectina',
      nombre: 'Calprotectina fecal',
      unidad: 'µg/g',
      max: 150,
      cambioRelevante: 100,
      empeoraAl: 'subir',
      reglas: ['fuera_de_rango', 'cambio_brusco', 'tendencia'],
      sinonimos: ['calprotectina', 'calprotectina fecal', 'calprotectina en heces'],
      frecuenciaDias: 84,
    },
    {
      id: 'pcr',
      nombre: 'PCR',
      unidad: 'mg/L',
      max: 5,
      cambioRelevante: 5,
      empeoraAl: 'subir',
      reglas: ['fuera_de_rango', 'cambio_brusco'],
      sinonimos: ['pcr', 'proteína c reactiva', 'proteina c reactiva'],
      frecuenciaDias: 84,
    },
    {
      id: 'hemoglobina',
      nombre: 'Hemoglobina',
      unidad: 'g/dL',
      min: 12,
      cambioRelevante: 1.5,
      empeoraAl: 'bajar',
      reglas: ['fuera_de_rango', 'tendencia'],
      sinonimos: ['hemoglobina', 'hb', 'hgb'],
      frecuenciaDias: 84,
    },
    {
      id: 'albumina',
      nombre: 'Albúmina',
      unidad: 'g/L',
      min: 35,
      cambioRelevante: 4,
      empeoraAl: 'bajar',
      reglas: ['fuera_de_rango', 'tendencia'],
      sinonimos: ['albúmina', 'albumina'],
      frecuenciaDias: 182,
    },
  ],
  preguntas: [
    ...activos('pro2-uc', 'urgency-nrs'),
    {
      id: 'dolor',
      frecuenciaDias: 14,
      etiqueta: 'Dolor abdominal',
      texto: '¿Cuánto dolor de barriga tienes?',
      ayuda: '0 = nada, 10 = el peor dolor',
      tipo: 'escala',
      umbral: 6,
      cambioRelevante: 2,
      alarma: false,
    },
    {
      id: 'cansancio',
      frecuenciaDias: 14,
      etiqueta: 'Cansancio',
      texto: '¿Cuánto cansancio tienes?',
      ayuda: '0 = nada, 10 = agotamiento total',
      tipo: 'escala',
      umbral: 7,
      cambioRelevante: 2,
      alarma: false,
    },
    {
      id: 'medicacion',
      frecuenciaDias: 14,
      etiqueta: 'No toma la medicación todos los días',
      texto: '¿Has tomado tu medicación todos los días?',
      tipo: 'si_no',
      respuestaAlerta: false,
      alarma: false,
    },
    {
      id: 'embarazo',
      frecuenciaDias: 14,
      etiqueta: 'Embarazo o búsqueda de embarazo',
      texto: '¿Estás embarazada o buscando un embarazo?',
      tipo: 'si_no',
      respuestaAlerta: true,
      alarma: false,
      peso: 3,
      condicion: { sexo: 'F', edadMin: 18, edadMax: 50 },
    },
    ...activos('sccai', 'ibd-control-8'),
    {
      id: 'alarma_brote',
      etiqueta: 'Brote grave',
      texto: '¿Vas al baño 6 o más veces al día con sangre y tienes fiebre, mareo o el corazón acelerado?',
      tipo: 'si_no',
      respuestaAlerta: true,
      alarma: true,
    },
    {
      id: 'alarma_abdomen',
      etiqueta: 'Dolor abdominal muy fuerte con barriga dura',
      texto: '¿Tienes un dolor de barriga muy fuerte, con la barriga hinchada y dura?',
      tipo: 'si_no',
      respuestaAlerta: true,
      alarma: true,
    },
    {
      id: 'alarma_sangrado',
      etiqueta: 'Sangrado abundante o mareo',
      texto: '¿Estás sangrando mucho (con coágulos) o te mareas al ponerte de pie?',
      tipo: 'si_no',
      respuestaAlerta: true,
      alarma: true,
    },
  ],
}

export const PLANTILLA_EN_BLANCO: Plantilla = {
  id: 'en-blanco',
  nombre: 'En blanco',
  patologia: '',
  frecuenciaAnaliticaSemanas: 12,
  frecuenciaEncuestaDias: 14,
  duracionMeses: 12,
  parametros: [],
  preguntas: [],
}

export const PLANTILLAS: Plantilla[] = [PLANTILLA_COLITIS, PLANTILLA_EN_BLANCO]
