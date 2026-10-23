// Login simulado. La sesión vive en sessionStorage, así cada pestaña puede tener su usuario
// (por ejemplo, el médico en una ventana y el paciente en otra).

import { useSyncExternalStore } from 'react'
import { leerEstado, useEstado } from './almacen'
import type { Usuario } from '../types'

const CLAVE = 'medlink:sesion'
const oyentes = new Set<() => void>()

function leer(): string | null {
  try {
    return sessionStorage.getItem(CLAVE)
  } catch {
    return null
  }
}

let usuarioId = leer()

function cambiar(id: string | null) {
  usuarioId = id
  try {
    if (id) sessionStorage.setItem(CLAVE, id)
    else sessionStorage.removeItem(CLAVE)
  } catch {
    // Sin almacenamiento: la sesión dura lo que la página.
  }
  oyentes.forEach((o) => o())
}

/** Devuelve el usuario si el email y la contraseña son de un usuario de prueba. */
export function iniciarSesion(email: string, password: string): Usuario | null {
  const usuario = leerEstado().usuarios.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
  )
  if (usuario) cambiar(usuario.id)
  return usuario ?? null
}

export const entrarComo = (usuario: Usuario) => cambiar(usuario.id)
export const cerrarSesion = () => cambiar(null)

export function useUsuario(): Usuario | undefined {
  const id = useSyncExternalStore(
    (oyente) => {
      oyentes.add(oyente)
      return () => oyentes.delete(oyente)
    },
    () => usuarioId,
  )
  return useEstado().usuarios.find((u) => u.id === id)
}
