import type { Paciente, Pregunta } from '../types'

/** Si una pregunta se le hace a este paciente (por ejemplo, embarazo solo a mujeres de 18 a 50 años). */
export const aplicaPregunta = (p: Pregunta, paciente: Pick<Paciente, 'sexo' | 'edad'>) =>
  !p.condicion ||
  ((!p.condicion.sexo || p.condicion.sexo === paciente.sexo) &&
    (p.condicion.edadMin === undefined || paciente.edad >= p.condicion.edadMin) &&
    (p.condicion.edadMax === undefined || paciente.edad <= p.condicion.edadMax))
