import { Link } from 'react-router-dom'
import { Phone, Siren } from 'lucide-react'

/** Aviso a pantalla completa cuando el paciente marca una señal de alarma. Obligatorio. */
export default function Urgencias() {
  return (
    <main role="alertdialog" aria-labelledby="titulo-urgencias" className="flex min-h-dvh flex-col bg-alta px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center text-center">
        <span className="mx-auto flex size-24 items-center justify-center rounded-full bg-white/15">
          <Siren className="size-12" strokeWidth={1.6} />
        </span>
        <h1 id="titulo-urgencias" className="mt-8 text-4xl leading-tight font-bold tracking-tight">
          Acude a Urgencias o llama al 112
        </h1>
        <p className="mt-5 text-xl leading-relaxed text-white/90">Esta app no vigila tus respuestas en tiempo real.</p>
        <p className="mt-3 text-white/80">Hemos guardado lo que nos has contado para tu médico, pero no esperes a que te llame.</p>
      </div>
      <div className="mx-auto w-full max-w-md space-y-3">
        <a
          href="tel:112"
          className="flex min-h-16 w-full items-center justify-center gap-3 rounded-[20px] bg-white text-xl font-bold text-alta"
        >
          <Phone className="size-6" />
          Llamar al 112
        </a>
        <Link
          to="/paciente"
          replace
          className="flex min-h-16 w-full items-center justify-center rounded-[20px] border-2 border-white/70 text-lg font-semibold"
        >
          Entendido
        </Link>
      </div>
    </main>
  )
}
