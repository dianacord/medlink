import { useState } from 'react'
import { CalendarPlus, Phone, Stethoscope } from 'lucide-react'
import { Boton } from '../../componentes/Boton'
import { claseInput } from '../../componentes/estilos'
import { valorFecha } from '../../logica/formato'
import type { TipoCita } from '../../types'

const manana = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return valorFecha(d)
}

/** Selector de fecha y hora para proponer una cita al paciente. */
export function ProgramarCita({
  tipo,
  abierto,
  recomendada,
  onAbrir,
  onProponer,
}: {
  tipo: TipoCita
  abierto: boolean
  recomendada?: string
  onAbrir: () => void
  onProponer: (fechaHora: string) => void
}) {
  const [fecha, setFecha] = useState(manana)
  const [hora, setHora] = useState(tipo === 'telefonica' ? '10:00' : '09:20')
  const icono = tipo === 'telefonica' ? Phone : Stethoscope
  const texto = tipo === 'telefonica' ? 'Cita telefónica' : 'Cita presencial'

  if (!abierto) {
    return (
      <div>
        <Boton icono={icono} variante={recomendada ? 'primario' : 'secundario'} chevron onClick={onAbrir}>
          {texto}
        </Boton>
        {recomendada && <p className="mt-1.5 pl-2 text-xs font-semibold text-primario">Recomendada · {recomendada}</p>}
      </div>
    )
  }
  return (
    <div className="rounded-[20px] bg-primario-suave p-4">
      <p className="flex items-center gap-2 font-bold text-primario">
        {tipo === 'telefonica' ? <Phone className="size-5" /> : <Stethoscope className="size-5" />}
        {texto}
      </p>
      <div className="mt-3 grid grid-cols-[1fr_7rem] gap-2">
        <label className="block">
          <span className="text-xs font-semibold text-gris">Día</span>
          <input type="date" value={fecha} min={valorFecha(new Date())} onChange={(e) => setFecha(e.target.value)} className={claseInput} />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gris">Hora</span>
          <input type="time" value={hora} step={600} onChange={(e) => setHora(e.target.value)} className={claseInput} />
        </label>
      </div>
      <div className="mt-3">
        <Boton icono={CalendarPlus} compacto disabled={!fecha || !hora} onClick={() => onProponer(new Date(`${fecha}T${hora}`).toISOString())}>
          Proponer al paciente
        </Boton>
      </div>
    </div>
  )
}
