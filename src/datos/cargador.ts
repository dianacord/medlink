// Convierte los JSON de data/ (generados desde los CSV) a los tipos de la app.
// Las fechas de la capa clínica son relativas a "hoy", así que el demo funciona cualquier día.

import pacientesJson from '../../data/pacientes.json'
import usuariosJson from '../../data/usuarios.json'
import clinicoJson from '../../data/clinico_sintetico.json'
import impactoJson from '../../data/impacto.json'
import { PLANTILLA_COLITIS } from '../config/plantillas'
import type {
  CapaClinica,
  Impacto,
  Medicion,
  Paciente,
  RespuestaEncuesta,
  SeguimientoVersion,
  Usuario,
} from '../types'

export const MEDICO_NOMBRE = 'Dra. Elena Navarro'

export interface DatosIniciales {
  usuarios: Usuario[]
  pacientes: Paciente[]
  seguimientos: SeguimientoVersion[]
  mediciones: Medicion[]
  respuestas: RespuestaEncuesta[]
  impacto: Impacto
}

/** Fecha ISO de hace `dias` días a la hora indicada (hora local). */
export function haceDias(hoy: Date, dias: number, hora = 0, minuto = 0): string {
  const d = new Date(hoy)
  d.setHours(hora, minuto, 0, 0)
  d.setDate(d.getDate() - dias)
  return d.toISOString()
}

export function sumarMeses(iso: string, meses: number): string {
  const d = new Date(iso)
  d.setMonth(d.getMonth() + meses)
  return d.toISOString()
}

export const seguimientoIdDe = (pacienteId: string) => `seg-${pacienteId}`

export function cargarDatos(hoy = new Date()): DatosIniciales {
  const clinico = clinicoJson as CapaClinica
  const pacientes = pacientesJson as Paciente[]

  const seguimientos: SeguimientoVersion[] = clinico.seguimientos.map(({ pacienteId, inicioDiasAtras }) => {
    const fechaInicio = haceDias(hoy, inicioDiasAtras)
    return {
      seguimientoId: seguimientoIdDe(pacienteId),
      version: 1,
      pacienteId,
      plantillaId: PLANTILLA_COLITIS.id,
      patologia: PLANTILLA_COLITIS.patologia,
      parametros: PLANTILLA_COLITIS.parametros,
      preguntas: PLANTILLA_COLITIS.preguntas,
      frecuenciaAnaliticaSemanas: PLANTILLA_COLITIS.frecuenciaAnaliticaSemanas,
      frecuenciaEncuestaDias: PLANTILLA_COLITIS.frecuenciaEncuestaDias,
      fechaInicio,
      fechaFin: sumarMeses(fechaInicio, PLANTILLA_COLITIS.duracionMeses),
      activo: true,
      creadoEn: fechaInicio,
      creadoPor: MEDICO_NOMBRE,
      cambios: ['Seguimiento activado con la plantilla «Colitis ulcerosa»'],
    }
  })

  const mediciones: Medicion[] = clinico.mediciones.map((m, i) => ({
    id: `med-${i}`,
    pacienteId: m.pacienteId,
    parametroId: m.parametroId,
    valor: m.valor,
    fecha: haceDias(hoy, m.diasAtras, 8, 30),
    origen: 'laboratorio_hospital',
    verificado: true,
  }))

  const respuestas: RespuestaEncuesta[] = clinico.respuestas.map((r, i) => ({
    id: `resp-${i}`,
    pacienteId: r.pacienteId,
    seguimientoId: seguimientoIdDe(r.pacienteId),
    fecha: haceDias(hoy, r.diasAtras, 10, 0),
    respuestas: r.respuestas,
    ...(r.textoLibre ? { textoLibre: r.textoLibre } : {}),
    origen: 'historico',
  }))

  return {
    usuarios: usuariosJson as Usuario[],
    pacientes,
    seguimientos,
    mediciones,
    respuestas,
    impacto: impactoJson as Impacto,
  }
}
