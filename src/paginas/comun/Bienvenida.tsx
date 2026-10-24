import { Stethoscope, UsersRound, Zap } from 'lucide-react'
import { Boton } from '../../componentes/Boton'
import { Fondo } from '../../componentes/Fondo'
import { Ilustracion } from '../../componentes/Ilustracion'
import { Marca, PieDemo } from '../../componentes/Marca'
import { useEntrarDePrueba } from '../../componentes/entrarDePrueba'

export default function Bienvenida() {
  const probar = useEntrarDePrueba()
  return (
    <div className="flex min-h-dvh flex-col items-center px-4">
      <Fondo />
      <header className="w-full max-w-md pt-6">
        <Marca />
      </header>
      <main className="flex w-full max-w-md flex-1 flex-col justify-center py-8">
        <Ilustracion className="mx-auto w-64 sm:w-72" />
        <h1 className="mt-6 text-center text-5xl font-bold tracking-tight">Bienvenido</h1>
        <p className="mx-auto mt-4 max-w-xs text-center text-lg text-gris">
          Una forma más sencilla de gestionar tus consultas externas
        </p>
        <div className="mt-10 space-y-4">
          <Boton to="/login/medico" icono={Stethoscope}>
            Iniciar sesión como médico
          </Boton>
          <Boton to="/login/paciente" icono={UsersRound} variante="secundario">
            Iniciar sesión como paciente
          </Boton>
        </div>
        <section className="mt-8 rounded-3xl bg-primario-suave/70 p-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-marino">
            <Zap className="size-4 text-primario" /> Prueba rápida, sin contraseña
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => probar('paciente')} className="rounded-xl bg-white px-3 py-3 text-sm font-semibold text-primario shadow-sm hover:bg-primario hover:text-white">
              Soy paciente
            </button>
            <button onClick={() => probar('medico')} className="rounded-xl bg-white px-3 py-3 text-sm font-semibold text-primario shadow-sm hover:bg-primario hover:text-white">
              Soy médico
            </button>
          </div>
          <p className="mt-2 text-xs text-gris">Cada móvil tiene sus propios datos de prueba.</p>
        </section>
      </main>
      <PieDemo />
    </div>
  )
}
