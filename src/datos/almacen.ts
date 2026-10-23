// Guarda el estado en localStorage y avisa a React de cada cambio.
// Si el médico y el paciente están abiertos en dos pestañas, ambas se actualizan solas.

import { useSyncExternalStore } from 'react'
import { crearEstadoInicial, ESQUEMA, recalcularTodo, type Estado } from './modelo'

const CLAVE = 'medlink:estado'
const oyentes = new Set<() => void>()

function leerGuardado(): Estado | null {
  try {
    const guardado = localStorage.getItem(CLAVE)
    if (!guardado) return null
    const e = JSON.parse(guardado) as Estado
    return e.esquema === ESQUEMA ? e : null
  } catch {
    return null
  }
}

function guardar() {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado))
  } catch {
    // Sin almacenamiento (modo privado): la app sigue funcionando en memoria.
  }
}

const avisar = () => oyentes.forEach((o) => o())

let estado: Estado = (() => {
  const guardado = leerGuardado()
  // Al abrir, recalcula por si desde la última vez ha vencido alguna encuesta.
  return guardado ? recalcularTodo(guardado) : crearEstadoInicial()
})()
guardar()

window.addEventListener('storage', (ev) => {
  if (ev.key !== CLAVE) return
  const otro = leerGuardado()
  if (otro) {
    estado = otro
    avisar()
  }
})

export const leerEstado = () => estado

/** Aplica una operación de modelo.ts, la guarda y refresca la interfaz. */
export function actualizar(operacion: (e: Estado) => Estado) {
  estado = operacion(estado)
  guardar()
  avisar()
}

/** Vuelve a los datos del demo (fechas relativas a hoy). */
export function reiniciarDatos() {
  estado = crearEstadoInicial()
  guardar()
  avisar()
}

export function useEstado(): Estado {
  return useSyncExternalStore(
    (oyente) => {
      oyentes.add(oyente)
      return () => oyentes.delete(oyente)
    },
    () => estado,
  )
}
