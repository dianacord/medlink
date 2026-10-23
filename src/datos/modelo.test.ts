import { describe, expect, it } from 'vitest'
import { DIA_MS } from '../logica/formato'
import { encuestaPendiente } from '../logica/calendario'
import {
  actualizacionesDe,
  avisoAbierto,
  crearEstadoInicial,
  decidir,
  estadoAviso,
  guardarSeguimiento,
  pedirRevision,
  recalcularTodo,
  registrarAnalitica,
  registrarRespuesta,
  registrarResultado,
  seguimientoActual,
  ultimaActualizacion,
  versionesSeguimiento,
  type Estado,
} from './modelo'

const HOY = new Date('2026-10-23T12:00:00')
const AHORA = HOY.getTime()
const JAVIER = 'P0114514'
const CARMEN = 'P0058433'
const LUCIA = 'P0116240'
const ANA = 'P0163423'
const SIN_SEGUIMIENTO = ['P0000339', 'P0000004']

const abierto = (e: Estado, pacienteId: string) => avisoAbierto(e, `seg-${pacienteId}`)
const prioridad = (e: Estado, pacienteId: string) => {
  const aviso = abierto(e, pacienteId)
  return aviso ? ultimaActualizacion(e, aviso.id).prioridad : null
}
/** Respuestas tranquilas de Ana, para cambiar solo lo que interesa en cada test. */
const tranquila = {
  deposiciones: 2, sangre: false, urgencia: 1, dolor: 1, cansancio: 2, medicacion: true,
  alarma_brote: false, alarma_abdomen: false, alarma_sangrado: false,
}

describe('estado inicial (datos del demo)', () => {
  const e = crearEstadoInicial(HOY)

  it('Javier tiene un aviso de prioridad alta: brote en analítica y luego en la encuesta', () => {
    const aviso = abierto(e, JAVIER)!
    const historia = actualizacionesDe(e, aviso.id)
    expect(historia.at(-1)!.prioridad).toBe('alta')
    expect(historia.at(-1)!.titulo).toBe('Alteración de calprotectina fecal y PCR')
    expect(historia.map((a) => a.causa)).toEqual(['Nueva analítica', 'Encuesta respondida'])
    const textos = historia.at(-1)!.motivos.map((m) => m.texto)
    expect(textos).toContain('Calprotectina fecal 620 µg/g · objetivo < 150')
    expect(textos).toContain('Sangre en heces')
  })

  it('Carmen tiene prioridad media: empieza en baja por la tendencia y sube con la encuesta', () => {
    const aviso = abierto(e, CARMEN)!
    const historia = actualizacionesDe(e, aviso.id)
    expect(historia.map((a) => a.prioridad)).toEqual(['baja', 'media'])
    expect(historia.at(-1)!.motivos.map((m) => m.tipo)).toEqual(['tendencia', 'sintoma_umbral', 'sintoma_empeora'])
    expect(historia.at(-1)!.puntuacion).toBe(4)
  })

  it('Lucía tiene prioridad baja por dos encuestas sin responder', () => {
    const ultima = ultimaActualizacion(e, abierto(e, LUCIA)!.id)
    expect(ultima.prioridad).toBe('baja')
    expect(ultima.motivos.map((m) => m.texto)).toEqual(['2 encuestas sin responder'])
  })

  it('el resto de pacientes está en verde, también al recalcular hoy', () => {
    const conAviso = new Set(e.avisos.map((a) => a.pacienteId))
    expect([...conAviso].sort()).toEqual([JAVIER, CARMEN, LUCIA].sort())
    expect(recalcularTodo(e, AHORA).actualizaciones).toHaveLength(e.actualizaciones.length)
  })

  it('Ana tiene la encuesta pendiente hoy; los pacientes nuevos no tienen seguimiento', () => {
    expect(encuestaPendiente(seguimientoActual(e, ANA, AHORA)!, e.respuestas.filter((r) => r.pacienteId === ANA), AHORA)).toBeDefined()
    for (const id of SIN_SEGUIMIENTO) expect(seguimientoActual(e, id, AHORA)).toBeUndefined()
  })
})

describe('en directo', () => {
  const base = crearEstadoInicial(HOY)

  it('Ana responde con sangre y más deposiciones: aparece un aviso nuevo', () => {
    const { estado, alarma } = registrarRespuesta(base, ANA, { ...tranquila, deposiciones: 5, sangre: true }, '', AHORA)
    expect(alarma).toBe(false)
    expect(prioridad(estado, ANA)).toBe('media')
    expect(estado.avisos).toHaveLength(base.avisos.length + 1)
  })

  it('una señal de alarma muestra Urgencias y crea un aviso alto', () => {
    const { estado, alarma } = registrarRespuesta(base, ANA, { ...tranquila, alarma_sangrado: true }, '', AHORA)
    expect(alarma).toBe(true)
    expect(prioridad(estado, ANA)).toBe('alta')
    expect(ultimaActualizacion(estado, abierto(estado, ANA)!.id).titulo).toBe('Señal de alarma')
  })

  it('una palabra de alarma en el texto libre también muestra Urgencias', () => {
    const { alarma } = registrarRespuesta(base, ANA, tranquila, 'Hoy he tenido coágulos', AHORA)
    expect(alarma).toBe(true)
  })

  it('pedir revisión crea un aviso bajo que el texto puede subir', () => {
    expect(prioridad(pedirRevision(base, ANA, 'Quiero comentar mi tratamiento', AHORA).estado, ANA)).toBe('baja')
    expect(prioridad(pedirRevision(base, ANA, 'Tengo diarrea desde el lunes', AHORA).estado, ANA)).toBe('media')
  })

  it('una analítica con la calprotectina alta crea aviso', () => {
    const e = registrarAnalitica(base, ANA, [{ parametroId: 'calprotectina', valor: 480 }], { origen: 'laboratorio_hospital', ahora: AHORA })
    const ultima = ultimaActualizacion(e, abierto(e, ANA)!.id)
    expect(ultima.prioridad).toBe('media')
    expect(ultima.causa).toBe('Analítica del laboratorio del hospital')
  })
})

describe('decisiones del médico y registro', () => {
  const base = crearEstadoInicial(HOY)
  const avisoJavier = abierto(base, JAVIER)!

  it('al archivar, los datos ya revisados no vuelven a crear aviso', () => {
    const e = recalcularTodo(decidir(base, avisoJavier.id, 'archivar', { ahora: AHORA }), AHORA + DIA_MS)
    expect(estadoAviso(e, avisoJavier.id)).toBe('archivado')
    expect(abierto(e, JAVIER)).toBeUndefined()
  })

  it('tras archivar, datos nuevos crean un aviso nuevo y el anterior se conserva', () => {
    let e = decidir(base, avisoJavier.id, 'archivar', { ahora: AHORA })
    e = registrarAnalitica(e, JAVIER, [{ parametroId: 'calprotectina', valor: 900 }], { origen: 'laboratorio_hospital', ahora: AHORA + DIA_MS })
    expect(abierto(e, JAVIER)!.id).not.toBe(avisoJavier.id)
    expect(e.avisos.find((a) => a.id === avisoJavier.id)).toBeDefined()
    expect(actualizacionesDe(e, avisoJavier.id)).toEqual(actualizacionesDe(base, avisoJavier.id))
  })

  it('cita telefónica → el paciente la ve → resultado estable archiva el aviso', () => {
    let e = decidir(base, avisoJavier.id, 'cita_telefonica', {
      ahora: AHORA,
      cita: { tipo: 'telefonica', fechaHora: new Date(AHORA + 2 * DIA_MS).toISOString() },
    })
    expect(estadoAviso(e, avisoJavier.id)).toBe('cita_telefonica')
    const cita = e.citas.find((c) => c.pacienteId === JAVIER)!
    e = registrarResultado(e, cita.id, 'estable', AHORA + 2 * DIA_MS)
    expect(estadoAviso(e, avisoJavier.id)).toBe('archivado')
    expect(e.decisiones.map((d) => d.tipo)).toEqual(['cita_telefonica', 'archivar'])
  })

  it('datos nuevos después de proponer una cita devuelven el aviso a la bandeja', () => {
    let e = decidir(base, avisoJavier.id, 'cita_presencial', {
      ahora: AHORA,
      cita: { tipo: 'presencial', fechaHora: new Date(AHORA + 7 * DIA_MS).toISOString() },
    })
    e = registrarRespuesta(e, JAVIER, { ...tranquila, deposiciones: 8, sangre: true }, '', AHORA + DIA_MS).estado
    expect(abierto(e, JAVIER)!.id).toBe(avisoJavier.id)
    expect(estadoAviso(e, avisoJavier.id)).toBe('pendiente')
  })

  it('ajustar el seguimiento crea una versión nueva con los cambios y conserva la anterior', () => {
    const v1 = seguimientoActual(base, CARMEN, AHORA)!
    const parametros = v1.parametros.map((p) => (p.id === 'calprotectina' ? { ...p, max: 250 } : p))
    const e = guardarSeguimiento(base, { ...v1, parametros }, AHORA)
    const versiones = versionesSeguimiento(e, v1.seguimientoId)
    expect(versiones.map((v) => v.version)).toEqual([1, 2])
    expect(versiones[1].cambios).toEqual(['Calprotectina fecal: objetivo < 150 → < 250 µg/g'])
  })

  it('activar un seguimiento a un paciente nuevo deja su encuesta pendiente hoy', () => {
    const v1 = seguimientoActual(base, ANA, AHORA)!
    const e = guardarSeguimiento(base, { ...v1, pacienteId: SIN_SEGUIMIENTO[0], fechaInicio: HOY.toISOString() }, AHORA)
    const seg = seguimientoActual(e, SIN_SEGUIMIENTO[0], AHORA)!
    expect(seg.version).toBe(1)
    expect(encuestaPendiente(seg, [], AHORA)).toBeDefined()
  })
})
