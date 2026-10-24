import { useNavigate } from 'react-router-dom'
import { leerEstado } from '../datos/almacen'
import { entrarComo } from '../datos/sesion'
import type { Rol } from '../types'

const USUARIO_DE_PRUEBA: Record<Rol, string> = { medico: 'u-medico', paciente: 'u-ana' }

/** Entra con el usuario de prueba del rol y va a su inicio. */
export function useEntrarDePrueba() {
  const navigate = useNavigate()
  return (rol: Rol) => {
    const usuario = leerEstado().usuarios.find((u) => u.id === USUARIO_DE_PRUEBA[rol])
    if (!usuario) return
    entrarComo(usuario)
    navigate(`/${rol}`)
  }
}

