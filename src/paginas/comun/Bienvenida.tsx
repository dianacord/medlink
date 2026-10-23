import { Stethoscope, UsersRound } from 'lucide-react'
import { Boton } from '../../componentes/Boton'
import { Fondo } from '../../componentes/Fondo'
import { Ilustracion } from '../../componentes/Ilustracion'
import { Marca, PieDemo } from '../../componentes/Marca'

export default function Bienvenida() {
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
      </main>
      <PieDemo />
    </div>
  )
}
