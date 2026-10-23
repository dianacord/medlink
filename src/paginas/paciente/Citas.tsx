import { CalendarCheck, CalendarClock, CalendarDays, CalendarSync, Check, Phone, Stethoscope } from 'lucide-react'
import { Boton } from '../../componentes/Boton'
import { Tarjeta, Vacio } from '../../componentes/ui'
import { actualizar, useEstado } from '../../datos/almacen'
import { citasDe, estadoCita, responderCita } from '../../datos/modelo'
import { useUsuario } from '../../datos/sesion'
import { fechaConDia, hora } from '../../logica/formato'
import type { Cita } from '../../types'

const ESTADO = {
  propuesta: { texto: 'Pendiente de que respondas', icono: CalendarClock, clases: 'bg-media-suave text-media' },
  aceptada: { texto: 'Confirmada', icono: CalendarCheck, clases: 'bg-baja-suave text-baja' },
  cambio_solicitado: { texto: 'Has pedido otro día. Te propondremos una nueva fecha.', icono: CalendarSync, clases: 'bg-primario-suave text-primario' },
  realizada: { texto: 'Realizada', icono: Check, clases: 'bg-gris-claro text-gris' },
}

function TarjetaCita({ cita }: { cita: Cita }) {
  const estado = useEstado()
  const situacion = estadoCita(estado, cita.id)
  const { texto, icono: Icono, clases } = ESTADO[situacion]
  const telefonica = cita.tipo === 'telefonica'
  return (
    <Tarjeta>
      <p className="flex items-center gap-2 font-semibold text-primario">
        {telefonica ? <Phone className="size-5" /> : <Stethoscope className="size-5" />}
        {telefonica ? 'Llamada de tu médico' : 'Cita en consulta'}
      </p>
      <p className="mt-2 text-2xl font-bold first-letter:uppercase">{fechaConDia(cita.fechaHora)}</p>
      <p className="text-xl font-semibold text-marino/80">a las {hora(cita.fechaHora)}</p>
      <p className="mt-2 text-gris">
        {telefonica ? 'Te llamaremos al teléfono que tienes en tu ficha.' : 'Consultas externas de Aparato Digestivo.'}
      </p>
      <p className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${clases}`}>
        <Icono className="size-4" />
        {texto}
      </p>
      {situacion === 'propuesta' && (
        <div className="mt-5 space-y-3">
          <Boton icono={Check} chevron={false} onClick={() => actualizar((e) => responderCita(e, cita.id, 'aceptada'))}>
            Aceptar
          </Boton>
          <Boton icono={CalendarSync} variante="secundario" chevron={false} onClick={() => actualizar((e) => responderCita(e, cita.id, 'cambio_solicitado'))}>
            Pedir otro día
          </Boton>
        </div>
      )}
    </Tarjeta>
  )
}

export default function Citas() {
  const estado = useEstado()
  const usuario = useUsuario()
  const citas = citasDe(estado, usuario!.pacienteId!)
  const proximas = citas.filter((c) => estadoCita(estado, c.id) !== 'realizada')
  const pasadas = citas.filter((c) => estadoCita(estado, c.id) === 'realizada').reverse()

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Mis citas</h1>
      <div className="mt-6 space-y-4">
        {proximas.length ? (
          proximas.map((c) => <TarjetaCita key={c.id} cita={c} />)
        ) : (
          <Vacio icono={<CalendarDays className="size-8" />} titulo="No tienes citas pendientes">
            Si tu médico necesita verte o llamarte, te lo propondrá aquí.
          </Vacio>
        )}
      </div>
      {pasadas.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 text-lg font-bold">Anteriores</h2>
          <ul className="space-y-2">
            {pasadas.map((c) => (
              <li key={c.id} className="rounded-2xl bg-white p-4 text-sm ring-1 ring-gris-claro">
                <span className="font-semibold">{c.tipo === 'telefonica' ? 'Llamada' : 'Consulta'}</span>
                <span className="text-gris first-letter:uppercase"> · {fechaConDia(c.fechaHora)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
