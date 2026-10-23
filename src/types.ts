// Modelo de datos de Medlink.
// Todo lo que pasa en un seguimiento se guarda como registros de solo añadir:
// nada se edita ni se borra; el estado actual se deriva del último registro.

export type Rol = 'medico' | 'paciente'

export interface Usuario {
  id: string
  email: string
  password: string
  rol: Rol
  nombre: string
  /** Solo pacientes: id interno del paciente al que corresponde. */
  pacienteId?: string
  /** Solo médicos: agenda de AGENDAS.csv a la que se vincula. */
  agendaId?: string
}

// ---------- Paciente (de PACIENTES.csv + identidad ficticia) ----------

export type Sexo = 'F' | 'M'
export type PreferenciaContacto = 'SMS' | 'LLAMADA' | 'EMAIL' | 'APP' | 'CARTA'
export type NecesidadAccesibilidad =
  | 'NINGUNA'
  | 'MOVILIDAD_REDUCIDA'
  | 'INTERPRETE'
  | 'ACOMPANANTE'
  | 'AUDITIVA'
  | 'VISUAL'

export interface Paciente {
  /** id_paciente del CSV. Clave interna: nunca se muestra. */
  id: string
  /** Número de historia clínica ficticio, el que se muestra y se busca. */
  nhc: string
  nombre: string
  apellidos: string
  edad: number
  sexo: Sexo
  preferenciaContacto: PreferenciaContacto
  accesibilidad: NecesidadAccesibilidad
}

// ---------- Configuración del seguimiento ----------

export type TipoRegla = 'fuera_de_rango' | 'cambio_brusco' | 'tendencia'

export interface Parametro {
  id: string
  nombre: string
  unidad: string
  /** Rango objetivo: en rango si min <= valor < max. */
  min?: number
  max?: number
  /** Cambio respecto a la medición anterior que se considera relevante (valor absoluto). */
  cambioRelevante: number
  /** Dirección en la que el parámetro empeora. */
  empeoraAl: 'subir' | 'bajar'
  reglas: TipoRegla[]
  /** Otros nombres con los que aparece en un informe de laboratorio (lectura de PDF). */
  sinonimos: string[]
}

export type TipoPregunta = 'escala' | 'si_no' | 'numero'

export interface Pregunta {
  id: string
  texto: string
  /** Nombre corto para el médico. En sí/no describe la respuesta que alerta ("Sangre en heces"). */
  etiqueta: string
  /** Solo numero: unidad que se muestra tras el valor ("/día"). */
  unidad?: string
  /** Aclaración corta bajo la pregunta (por ejemplo, qué significa 0 y 10). */
  ayuda?: string
  tipo: TipoPregunta
  /** escala y numero: alerta si valor >= umbral. */
  umbral?: number
  /** escala y numero: subida respecto a la encuesta anterior que cuenta como empeorar. */
  cambioRelevante?: number
  /** si_no: la respuesta que genera alerta. */
  respuestaAlerta?: boolean
  /** Señal de alarma: manda al paciente a Urgencias. */
  alarma: boolean
  /** Puntos que suma en lugar del peso por defecto. */
  peso?: number
  /** Solo se pregunta a pacientes que cumplan esto. */
  condicion?: { sexo?: Sexo; edadMin?: number; edadMax?: number }
}

export interface Plantilla {
  id: string
  nombre: string
  patologia: string
  parametros: Parametro[]
  preguntas: Pregunta[]
  frecuenciaAnaliticaSemanas: number
  frecuenciaEncuestaDias: number
  duracionMeses: number
}

/** Cada cambio del seguimiento crea una versión nueva; las anteriores se conservan. */
export interface SeguimientoVersion {
  /** Id estable del seguimiento (igual en todas sus versiones). */
  seguimientoId: string
  version: number
  pacienteId: string
  plantillaId: string
  patologia: string
  parametros: Parametro[]
  preguntas: Pregunta[]
  frecuenciaAnaliticaSemanas: number
  frecuenciaEncuestaDias: number
  /** ISO. La primera encuesta vence este día y luego cada frecuenciaEncuestaDias. */
  fechaInicio: string
  fechaFin: string
  activo: boolean
  creadoEn: string
  creadoPor: string
  /** Resumen legible de lo que cambió respecto a la versión anterior. */
  cambios: string[]
}

// ---------- Datos que llegan ----------

/** paciente = respondido o escrito por el paciente en la app. */
export type OrigenDato = 'laboratorio_hospital' | 'pdf_paciente' | 'paciente' | 'historico' | 'demo'

export interface Medicion {
  id: string
  pacienteId: string
  parametroId: string
  valor: number
  fecha: string
  origen: OrigenDato
  /** false si viene de un PDF externo que nadie ha verificado. */
  verificado: boolean
  documentoId?: string
}

export type ValorRespuesta = number | boolean

export interface RespuestaEncuesta {
  id: string
  pacienteId: string
  seguimientoId: string
  fecha: string
  respuestas: Record<string, ValorRespuesta>
  textoLibre?: string
  origen: OrigenDato
}

export interface PeticionRevision {
  id: string
  pacienteId: string
  fecha: string
  texto: string
}

export interface Documento {
  id: string
  pacienteId: string
  nombreArchivo: string
  origen: 'laboratorio_hospital' | 'pdf_paciente'
  subidoEn: string
  /** Ids de las mediciones creadas a partir de este PDF. */
  medicionIds: string[]
  /** El PDF se guarda aparte (IndexedDB) con esta clave. */
}

// ---------- Avisos ----------

export type Prioridad = 'alta' | 'media' | 'baja'

export type TipoMotivo =
  | 'fuera_de_rango'
  | 'cambio_brusco'
  | 'tendencia'
  | 'sintoma_umbral'
  | 'sintoma_empeora'
  | 'encuestas_sin_responder'
  | 'alarma'
  | 'palabra_clave'
  | 'peticion_revision'
  | 'analitica_sin_detectar'

export interface Motivo {
  tipo: TipoMotivo
  /** Texto legible para el chip, por ejemplo "Calprotectina 620 µg/g · objetivo < 150". */
  texto: string
  puntos: number
  /** Parámetro o pregunta al que se refiere. */
  refId?: string
}

/** Un aviso existe desde su primera actualización; su estado se deriva de sus registros. */
export interface Aviso {
  id: string
  seguimientoId: string
  pacienteId: string
  creadoEn: string
}

/** Cada recálculo que cambia el aviso añade una actualización. */
export interface ActualizacionAviso {
  id: string
  avisoId: string
  fecha: string
  puntuacion: number
  prioridad: Prioridad
  /** Resumen para la bandeja, por ejemplo "Alteración de calprotectina fecal". */
  titulo: string
  motivos: Motivo[]
  /** Qué provocó el recálculo, en texto legible. */
  causa: string
}

/** Estado derivado de un aviso: pendiente hasta que el médico decide; vuelve a pendiente si llegan datos nuevos tras una cita. */
export type EstadoAviso = 'pendiente' | 'cita_telefonica' | 'cita_presencial' | 'archivado'

export type TipoDecision = 'archivar' | 'cita_telefonica' | 'cita_presencial'

/** Decisión del médico sobre un aviso. Cierra el aviso. */
export interface Decision {
  id: string
  avisoId: string
  tipo: TipoDecision
  fecha: string
  medico: string
  citaId?: string
}

// ---------- Citas ----------

export type TipoCita = 'telefonica' | 'presencial'

export interface Cita {
  id: string
  pacienteId: string
  avisoId?: string
  tipo: TipoCita
  fechaHora: string
  creadaEn: string
}

export type TipoEventoCita = 'aceptada' | 'cambio_solicitado' | 'resultado'
export type ResultadoLlamada = 'estable' | 'ajustar' | 'grave'

export interface EventoCita {
  id: string
  citaId: string
  tipo: TipoEventoCita
  fecha: string
  resultado?: ResultadoLlamada
}

// ---------- Capa clínica sintética (data/clinico_sintetico.json) ----------
// Las fechas son relativas ("hace N días") para que el demo funcione cualquier día.

export interface CapaClinica {
  seguimientos: { pacienteId: string; inicioDiasAtras: number }[]
  mediciones: { pacienteId: string; parametroId: string; valor: number; diasAtras: number }[]
  respuestas: {
    pacienteId: string
    diasAtras: number
    respuestas: Record<string, ValorRespuesta>
    textoLibre?: string
  }[]
}

// ---------- Impacto (agregados de los CSV) ----------

export interface ImpactoEspecialidad {
  revisionesTotales: number
  revisionesRealizadas: number
  revisionesNoRealizadas: number
  demoraMedianaPrimeraDias: number
  derivacionesPendientes: number
}

export interface Impacto {
  periodo: { desde: string; hasta: string; meses: number }
  minutosPorConsulta: number
  especialidad: string
  digestivo: ImpactoEspecialidad
  hospital: ImpactoEspecialidad
}
