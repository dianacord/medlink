import type { NecesidadAccesibilidad, Paciente, PreferenciaContacto, TipoCita } from '../types'

export const nombreCompleto = (p: Paciente) => `${p.nombre} ${p.apellidos}`
export const nombreCorto = (p: Paciente) => `${p.nombre} ${p.apellidos[0]}.`
export const sexoTexto = (p: Paciente) => (p.sexo === 'F' ? 'Mujer' : 'Hombre')

export const CONTACTO: Record<PreferenciaContacto, string> = {
  SMS: 'SMS',
  LLAMADA: 'Llamada telefónica',
  EMAIL: 'Email',
  APP: 'App',
  CARTA: 'Carta',
}

export const ACCESIBILIDAD: Record<NecesidadAccesibilidad, string | null> = {
  NINGUNA: null,
  MOVILIDAD_REDUCIDA: 'Movilidad reducida',
  INTERPRETE: 'Necesita intérprete',
  ACOMPANANTE: 'Acude con acompañante',
  AUDITIVA: 'Discapacidad auditiva',
  VISUAL: 'Discapacidad visual',
}

/** Tipo de cita que conviene sugerir según la preferencia y las necesidades del paciente. */
export function citaRecomendada(p: Paciente): { tipo: TipoCita; motivo: string } | null {
  if (p.accesibilidad === 'AUDITIVA') return { tipo: 'presencial', motivo: 'Tiene discapacidad auditiva' }
  if (p.accesibilidad === 'MOVILIDAD_REDUCIDA') return { tipo: 'telefonica', motivo: 'Tiene movilidad reducida' }
  if (p.preferenciaContacto === 'LLAMADA') return { tipo: 'telefonica', motivo: 'Prefiere que le llamen' }
  return null
}
