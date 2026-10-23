// Lee los CSV sintéticos del hospital y genera los JSON pequeños que usa la app.
// Uso: npm run datos -- [carpeta de CSV]   (por defecto ~/data)

import { mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { leerCsv } from './csv'
import { generarCapaClinica } from './capa-clinica'
import type { Impacto, ImpactoEspecialidad, Paciente, Usuario } from '../src/types'

const CARPETA_CSV = process.argv[2] ?? join(homedir(), 'data')
const SALIDA = join(import.meta.dirname, '..', 'data')
const ESPECIALIDAD = 'DIG'

// Muestra aprobada: 15 pacientes con revisión (S) en Digestivo, 25-70 años.
// Nombre, apellidos y NHC son ficticios; el resto viene de PACIENTES.csv.
const MUESTRA: { id: string; nombre: string; apellidos: string }[] = [
  { id: 'P0114514', nombre: 'Javier', apellidos: 'Moreno Gil' },
  { id: 'P0058433', nombre: 'Carmen', apellidos: 'López Sanz' },
  { id: 'P0116240', nombre: 'Lucía', apellidos: 'García Prieto' },
  { id: 'P0163423', nombre: 'Ana', apellidos: 'Ruiz Herrero' },
  { id: 'P0105712', nombre: 'Daniel', apellidos: 'Pérez Ortega' },
  { id: 'P0159396', nombre: 'Marta', apellidos: 'Serrano Vidal' },
  { id: 'P0091356', nombre: 'Laura', apellidos: 'Vega Romero' },
  { id: 'P0021303', nombre: 'Isabel', apellidos: 'Castro Molina' },
  { id: 'P0078380', nombre: 'Miguel', apellidos: 'Torres Blanco' },
  { id: 'P0041568', nombre: 'Antonio', apellidos: 'Fernández Rubio' },
  { id: 'P0149508', nombre: 'José', apellidos: 'Ramos Iglesias' },
  { id: 'P0090075', nombre: 'Pilar', apellidos: 'Delgado Núñez' },
  { id: 'P0017909', nombre: 'Rosa', apellidos: 'Martín Cabrera' },
  { id: 'P0169907', nombre: 'Francisco', apellidos: 'Gómez Pastor' },
  { id: 'P0118727', nombre: 'Manuel', apellidos: 'Hidalgo Reyes' },
]
// Dos pacientes más sin seguimiento, para crearlo en directo en el demo.
const NOMBRES_SIN_SEGUIMIENTO = {
  F: { nombre: 'Sofía', apellidos: 'Benítez Lara' },
  M: { nombre: 'Alberto', apellidos: 'Navas Soto' },
}

const csv = (nombre: string) => leerCsv(join(CARPETA_CSV, nombre))
const mediana = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
/** NHC ficticio de 7 dígitos, estable para cada paciente. */
const nhcFicticio = (id: string) => String(1_000_000 + ((Number(id.slice(1)) * 7919) % 9_000_000))

console.log(`Leyendo CSV de ${CARPETA_CSV}…`)

const agendas = csv('AGENDAS.csv')
const especialidadDeAgenda = new Map(agendas.map((a) => [a.id_agenda, a.especialidad]))
const huecos = csv('HUECOS_AGENDA.csv')
const especialidadDeHueco = new Map(huecos.map((h) => [h.id_hueco, especialidadDeAgenda.get(h.id_agenda)!]))
const fechasHuecos = huecos.map((h) => h.fecha).sort()
const citas = csv('CITAS.csv')
const pacientesCsv = new Map(csv('PACIENTES.csv').map((p) => [p.id_paciente, p]))
const derivaciones = csv('DERIVACIONES_AV.csv')
const circuito = csv('CIRCUITO_CONSULTA.csv')

// ---------- Pacientes ----------

const conRevisionDigestivo = new Set(
  citas
    .filter((c) => c.tipo_visita === 'S' && especialidadDeHueco.get(c.id_hueco) === ESPECIALIDAD)
    .map((c) => c.id_paciente),
)
const esCandidato = (id: string) => {
  const p = pacientesCsv.get(id)
  return !!p && conRevisionDigestivo.has(id) && Number(p.edad) >= 25 && Number(p.edad) <= 70
}

for (const { id } of MUESTRA) {
  if (!esCandidato(id)) throw new Error(`${id} ya no cumple los criterios de la muestra`)
}
const enMuestra = new Set(MUESTRA.map((m) => m.id))
const extra = (['F', 'M'] as const).map((sexo) => {
  const id = [...conRevisionDigestivo]
    .sort()
    .find((id) => {
      const p = pacientesCsv.get(id)!
      return !enMuestra.has(id) && esCandidato(id) && p.sexo === sexo && p.necesidades_accesibilidad === 'NINGUNA'
        && Number(p.edad) >= 30 && Number(p.edad) <= 60
    })!
  return { id, ...NOMBRES_SIN_SEGUIMIENTO[sexo] }
})

const pacientes: Paciente[] = [...MUESTRA, ...extra].map(({ id, nombre, apellidos }) => {
  const p = pacientesCsv.get(id)!
  return {
    id,
    nhc: nhcFicticio(id),
    nombre,
    apellidos,
    edad: Number(p.edad),
    sexo: p.sexo as Paciente['sexo'],
    preferenciaContacto: p.preferencias_contacto as Paciente['preferenciaContacto'],
    accesibilidad: p.necesidades_accesibilidad as Paciente['accesibilidad'],
  }
})

// ---------- Impacto ----------

const resumen = (filtro: (esp: string | undefined) => boolean): ImpactoEspecialidad => {
  let total = 0
  let realizadas = 0
  let noRealizadas = 0
  const demorasPrimera: number[] = []
  for (const c of citas) {
    const esp = especialidadDeHueco.get(c.id_hueco)
    if (!filtro(esp)) continue
    if (c.tipo_visita === 'S') {
      total++
      if (c.estado_actual === 'REALIZADA') realizadas++
      if (c.estado_actual === 'NO_REALIZADA') noRealizadas++
    }
    if (c.tipo_visita === 'P' && c.demora_dias_sintetica) demorasPrimera.push(Number(c.demora_dias_sintetica))
  }
  return {
    revisionesTotales: total,
    revisionesRealizadas: realizadas,
    revisionesNoRealizadas: noRealizadas,
    demoraMedianaPrimeraDias: Math.round(mediana(demorasPrimera)),
    derivacionesPendientes: derivaciones.filter(
      (d) => d.estado_solicitud === 'PENDIENTE_CITA' && filtro(d.especialidad_destino),
    ).length,
  }
}

const impacto: Impacto = {
  periodo: { desde: fechasHuecos[0], hasta: fechasHuecos[fechasHuecos.length - 1], meses: 6 },
  minutosPorConsulta: mediana(circuito.map((r) => Number(r.tiempo_atencion)).filter((n) => n > 0)),
  especialidad: 'Digestivo',
  digestivo: resumen((esp) => esp === ESPECIALIDAD),
  hospital: resumen((esp) => !!esp),
}

// ---------- Usuarios de prueba ----------

const agendaMedica = agendas.find((a) => a.id_agenda === 'AG0043')!
const usuarios: Usuario[] = [
  { id: 'u-medico', email: 'medico@demo.es', password: 'demo1234', rol: 'medico', nombre: 'Dra. Elena Navarro', agendaId: agendaMedica.id_agenda },
  { id: 'u-ana', email: 'paciente@demo.es', password: 'demo1234', rol: 'paciente', nombre: 'Ana Ruiz', pacienteId: 'P0163423' },
  { id: 'u-javier', email: 'javier@demo.es', password: 'demo1234', rol: 'paciente', nombre: 'Javier Moreno', pacienteId: 'P0114514' },
  { id: 'u-antonio', email: 'antonio@demo.es', password: 'demo1234', rol: 'paciente', nombre: 'Antonio Fernández', pacienteId: 'P0041568' },
]

// ---------- Escribir ----------

const capa = generarCapaClinica(pacientes.filter((p) => enMuestra.has(p.id)))

mkdirSync(SALIDA, { recursive: true })
const escribir = (nombre: string, datos: unknown) =>
  writeFileSync(join(SALIDA, nombre), JSON.stringify(datos, null, 2) + '\n')
escribir('pacientes.json', pacientes)
escribir('clinico_sintetico.json', capa)
escribir('impacto.json', impacto)
escribir('usuarios.json', usuarios)

console.log(`✔ ${pacientes.length} pacientes (${extra.length} sin seguimiento: ${extra.map((e) => e.id).join(', ')})`)
console.log(`✔ ${capa.mediciones.length} mediciones y ${capa.respuestas.length} respuestas sintéticas`)
console.log('✔ Impacto:', JSON.stringify(impacto))
