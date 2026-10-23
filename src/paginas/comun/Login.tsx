import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight, LogIn, Sparkles, Stethoscope, UserRound, UsersRound } from 'lucide-react'
import { Boton } from '../../componentes/Boton'
import { Fondo } from '../../componentes/Fondo'
import { PieDemo } from '../../componentes/Marca'
import { useEstado } from '../../datos/almacen'
import { entrarComo, iniciarSesion } from '../../datos/sesion'
import type { Rol, Usuario } from '../../types'

const TEXTOS: Record<Rol, { titulo: string; icono: typeof Stethoscope }> = {
  medico: { titulo: 'Acceso médico', icono: Stethoscope },
  paciente: { titulo: 'Acceso paciente', icono: UsersRound },
}

/** Qué enseña cada paciente de prueba en el demo. */
const NOTAS_PRUEBA: Record<string, string> = {
  'u-ana': 'Tiene la encuesta pendiente hoy',
  'u-javier': 'Paciente con brote',
  'u-antonio': 'Letra grande (necesidad visual)',
}

export default function Login() {
  const { rol } = useParams()
  const navigate = useNavigate()
  const { usuarios } = useEstado()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [verPrueba, setVerPrueba] = useState(false)

  if (rol !== 'medico' && rol !== 'paciente') return <Navigate to="/" replace />
  const { titulo, icono: Icono } = TEXTOS[rol]
  const dePrueba = usuarios.filter((u) => u.rol === rol)

  const entrar = (u: Usuario) => {
    entrarComo(u)
    navigate(`/${u.rol}`)
  }

  const enviar = (ev: FormEvent) => {
    ev.preventDefault()
    const u = iniciarSesion(email, password)
    if (!u) return setError('El email o la contraseña no son correctos.')
    if (u.rol !== rol) return setError(`Este usuario no es de ${rol === 'medico' ? 'médico' : 'paciente'}.`)
    navigate(`/${u.rol}`)
  }

  const probar = () => (rol === 'medico' ? entrar(dePrueba[0]) : setVerPrueba(true))

  return (
    <div className="flex min-h-dvh flex-col items-center px-4">
      <Fondo />
      <main className="w-full max-w-md flex-1 pt-6 pb-8">
        <Link to="/" className="inline-flex size-11 items-center justify-center rounded-full bg-white text-marino shadow-sm ring-1 ring-gris-claro" aria-label="Volver">
          <ArrowLeft className="size-5" />
        </Link>

        <div className="mt-8 flex size-16 items-center justify-center rounded-[20px] bg-primario-suave text-primario">
          <Icono className="size-8" strokeWidth={1.6} />
        </div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">{titulo}</h1>
        <p className="mt-2 text-gris">Entra con tu email y tu contraseña.</p>

        <form onSubmit={enviar} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold">Email</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@ejemplo.es"
              className="mt-1.5 h-14 w-full rounded-2xl border border-gris-claro bg-white px-4 text-base outline-none focus:border-primario focus:ring-2 focus:ring-primario/20"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 h-14 w-full rounded-2xl border border-gris-claro bg-white px-4 text-base outline-none focus:border-primario focus:ring-2 focus:ring-primario/20"
              required
            />
          </label>
          {error && (
            <p role="alert" className="rounded-xl bg-alta-suave px-4 py-3 text-sm font-medium text-alta">
              {error}
            </p>
          )}
          <div className="space-y-3 pt-2">
            <Boton type="submit" icono={LogIn} chevron>
              Entrar
            </Boton>
            <Boton icono={Sparkles} variante="secundario" chevron onClick={probar}>
              Entrar con usuario de prueba
            </Boton>
          </div>
        </form>

        {verPrueba && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-gris">Elige un paciente de prueba</h2>
            <ul className="mt-3 space-y-2">
              {dePrueba.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => entrar(u)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left ring-1 ring-gris-claro hover:ring-primario"
                  >
                    <span className="flex size-10 items-center justify-center rounded-full bg-primario-suave text-primario">
                      <UserRound className="size-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold">{u.nombre}</span>
                      <span className="block text-sm text-gris">{NOTAS_PRUEBA[u.id]}</span>
                    </span>
                    <ChevronRight className="size-5 text-gris" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <PieDemo />
    </div>
  )
}
