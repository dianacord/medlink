import { useEffect, type ReactNode } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BarChart3, Bell, CalendarDays, House, LogOut, Search, type LucideIcon } from 'lucide-react'
import { Fondo } from './Fondo'
import { Marca, PieDemo } from './Marca'
import { useEstado } from '../datos/almacen'
import { avisosPendientes, citasDe, estadoCita, paciente } from '../datos/modelo'
import { cerrarSesion, useUsuario } from '../datos/sesion'
import type { Rol } from '../types'

/** Exige sesión con el rol indicado. Con sesión de otro rol, lleva a su propio inicio. */
export function RutaProtegida({ rol, children }: { rol: Rol; children: ReactNode }) {
  const usuario = useUsuario()
  if (!usuario) return <Navigate to={`/login/${rol}`} replace />
  if (usuario.rol !== rol) return <Navigate to={`/${usuario.rol}`} replace />
  return children
}

/** Vuelve arriba al cambiar de pantalla. */
function ArribaAlNavegar() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

interface Enlace {
  to: string
  texto: string
  icono: LucideIcon
  contador?: number
  exacto?: boolean
}

function Insignia({ n }: { n?: number }) {
  if (!n) return null
  return (
    <span className="ml-auto min-w-6 rounded-full bg-alta px-1.5 text-center text-xs leading-6 font-bold text-white">{n}</span>
  )
}

/** Barra inferior para móvil. */
function BarraInferior({ enlaces, ancho }: { enlaces: Enlace[]; ancho: string }) {
  return (
    <nav className={`fixed inset-x-0 bottom-0 z-20 border-t border-gris-claro bg-white/95 backdrop-blur ${ancho}`}>
      <ul className="mx-auto flex max-w-md">
        {enlaces.map(({ to, texto, icono: Icono, contador, exacto }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={exacto}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 py-2.5 text-xs font-semibold ${isActive ? 'text-primario' : 'text-gris'}`
              }
            >
              <Icono className="size-6" strokeWidth={1.8} />
              {texto}
              {!!contador && (
                <span className="absolute top-1.5 left-1/2 ml-2 min-w-5 rounded-full bg-alta px-1 text-center text-[0.7rem] leading-5 font-bold text-white">
                  {contador}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function BotonSalir({ conTexto }: { conTexto?: boolean }) {
  const navigate = useNavigate()
  const salir = () => {
    cerrarSesion()
    navigate('/')
  }
  return (
    <button
      onClick={salir}
      className="inline-flex items-center gap-2 rounded-full p-2.5 text-sm font-semibold text-gris hover:bg-primario-suave hover:text-primario"
      aria-label="Cerrar sesión"
    >
      <LogOut className="size-5" />
      {conTexto && 'Cerrar sesión'}
    </button>
  )
}

/** Médico: barra lateral en tablet y escritorio, barra inferior en móvil. */
export function LayoutMedico() {
  const usuario = useUsuario()
  const estado = useEstado()
  const enlaces: Enlace[] = [
    { to: '/medico', texto: 'Avisos', icono: Bell, contador: avisosPendientes(estado).length, exacto: true },
    { to: '/medico/buscar', texto: 'Pacientes', icono: Search },
    { to: '/medico/impacto', texto: 'Impacto', icono: BarChart3 },
  ]
  return (
    <div className="min-h-dvh md:flex">
      <Fondo />
      <ArribaAlNavegar />
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-gris-claro bg-white/80 px-4 py-6 backdrop-blur md:flex">
        <Marca to="/medico" />
        <nav className="mt-10 space-y-1">
          {enlaces.map(({ to, texto, icono: Icono, contador, exacto }) => (
            <NavLink
              key={to}
              to={to}
              end={exacto}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold ${isActive ? 'bg-primario-suave text-primario' : 'text-gris hover:bg-primario-suave/60 hover:text-marino'}`
              }
            >
              <Icono className="size-5" strokeWidth={1.8} />
              {texto}
              <Insignia n={contador} />
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-gris-claro pt-4">
          <p className="px-2 font-semibold">{usuario?.nombre}</p>
          <p className="px-2 text-sm text-gris">Aparato Digestivo</p>
          <div className="mt-2">
            <BotonSalir conTexto />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between px-4 pt-4 md:hidden">
          <Marca to="/medico" />
          <BotonSalir />
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-6 md:px-8 md:pt-6">
          <Outlet />
        </main>
        <div className="pb-20 md:pb-0">
          <PieDemo />
        </div>
      </div>
      <BarraInferior enlaces={enlaces} ancho="md:hidden" />
    </div>
  )
}

/** Paciente: una columna centrada, pensada para el móvil. Letra grande si tiene necesidad visual. */
export function LayoutPaciente() {
  const usuario = useUsuario()
  const estado = useEstado()
  const yo = usuario?.pacienteId ? paciente(estado, usuario.pacienteId) : undefined
  const letraGrande = yo?.accesibilidad === 'VISUAL'

  useEffect(() => {
    document.documentElement.style.fontSize = letraGrande ? '125%' : ''
    return () => {
      document.documentElement.style.fontSize = ''
    }
  }, [letraGrande])

  const citasPorResponder = yo
    ? citasDe(estado, yo.id).filter((c) => estadoCita(estado, c.id) === 'propuesta').length
    : 0
  const enlaces: Enlace[] = [
    { to: '/paciente', texto: 'Inicio', icono: House, exacto: true },
    { to: '/paciente/citas', texto: 'Citas', icono: CalendarDays, contador: citasPorResponder },
  ]
  return (
    <div className="flex min-h-dvh flex-col items-center px-4">
      <Fondo />
      <ArribaAlNavegar />
      <header className="flex w-full max-w-md items-center justify-between pt-4">
        <Marca to="/paciente" />
        <BotonSalir />
      </header>
      <main className="w-full max-w-md flex-1 pt-4 pb-6">
        <Outlet />
      </main>
      <div className="pb-20">
        <PieDemo />
      </div>
      <BarraInferior enlaces={enlaces} ancho="" />
    </div>
  )
}
