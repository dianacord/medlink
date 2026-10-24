import { Link } from 'react-router-dom'
import {
  CalendarCheck,
  CalendarClock,
  CircleCheck,
  ClipboardList,
  FlaskConical,
  HandHeart,
  Hourglass,
  MessageCircleQuestion,
  Upload,
  type LucideIcon,
} from 'lucide-react'
import { Boton } from '../../componentes/Boton'
import { Tarjeta } from '../../componentes/ui'
import { useEstado } from '../../datos/almacen'
import { paciente as buscarPaciente } from '../../datos/modelo'
import { useUsuario } from '../../datos/sesion'
import { vistaPaciente, type EstadoPaciente } from '../../datos/vistaPaciente'
import { fechaConDia, fechaCorta, hora } from '../../logica/formato'

function textoEstado(estado: EstadoPaciente, encuestaPendiente: boolean): { icono: LucideIcon; titulo: string; texto: string } {
  switch (estado.tipo) {
    case 'cita_propuesta':
      return { icono: CalendarClock, titulo: 'Tienes una propuesta de cita', texto: 'Tu médico quiere hablar contigo. Revísala y acéptala o pide otro día.' }
    case 'cita_confirmada':
      return { icono: CalendarCheck, titulo: 'Tienes una cita', texto: `${fechaConDia(estado.fechaHora)} a las ${hora(estado.fechaHora)}.` }
    case 'en_revision':
      return { icono: Hourglass, titulo: 'Tu médico lo revisará', texto: 'Hemos recibido tus datos. Si necesita hablar contigo, te propondrá una cita aquí.' }
    case 'todo_bien':
      return encuestaPendiente
        ? { icono: CircleCheck, titulo: 'Todo bien', texto: 'Hoy toca responder tu encuesta. Son menos de 2 minutos.' }
        : { icono: CircleCheck, titulo: 'Todo bien', texto: `Tu próxima encuesta es el ${fechaConDia(estado.proximaEncuesta)}.` }
  }
}

function Confirmado({ children }: { children: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-gris">
      <CircleCheck className="size-4 shrink-0 text-baja" />
      {children}
    </li>
  )
}

export default function Inicio() {
  const estado = useEstado()
  const usuario = useUsuario()
  const yo = buscarPaciente(estado, usuario!.pacienteId!)!
  const vista = vistaPaciente(estado, yo.id)

  if (!vista) {
    return (
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hola, {yo.nombre}</h1>
        <Tarjeta className="mt-6 text-center">
          <ClipboardList className="mx-auto size-10 text-primario" strokeWidth={1.5} />
          <p className="mt-3 text-lg font-bold">Todavía no tienes seguimiento</p>
          <p className="mt-1 text-gris">Cuando tu médico lo active, aquí verás tus encuestas y analíticas.</p>
        </Tarjeta>
      </div>
    )
  }

  const { icono: Icono, titulo, texto } = textoEstado(vista.estado, !!vista.encuestaPendiente)
  const tarjetaEstado = (
    <section className="flex gap-4 rounded-3xl bg-primario-suave p-5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-primario">
        <Icono className="size-6" strokeWidth={1.8} />
      </span>
      <span>
        <span className="block text-lg font-bold">{titulo}</span>
        <span className="mt-0.5 block text-[0.95rem] text-marino/80 first-letter:uppercase">{texto}</span>
      </span>
    </section>
  )
  const hechos = [
    vista.ultimaEncuesta && `Encuesta enviada el ${fechaCorta(vista.ultimaEncuesta)}`,
    vista.ultimaAnaliticaSubida && `Analítica subida el ${fechaCorta(vista.ultimaAnaliticaSubida)}`,
    vista.ultimaPeticion && `Petición de revisión enviada el ${fechaCorta(vista.ultimaPeticion)}`,
  ].filter(Boolean) as string[]

  return (
    <div>
      <p className="text-gris">Mi seguimiento · {vista.seg.patologia}</p>
      <h1 className="text-3xl font-bold tracking-tight">Hola, {yo.nombre}</h1>

      {vista.estado.tipo.startsWith('cita') ? (
        <Link to="/paciente/citas" className="mt-6 block">
          {tarjetaEstado}
        </Link>
      ) : (
        <div className="mt-6">{tarjetaEstado}</div>
      )}

      <h2 className="mt-8 mb-3 text-lg font-bold">Pendiente</h2>
      <div className="space-y-3">
        {vista.estado.tipo === 'cita_propuesta' && (
          <Boton icono={CalendarClock} to="/paciente/citas">
            Ver la propuesta de cita
          </Boton>
        )}
        {vista.encuestaPendiente ? (
          <Boton icono={MessageCircleQuestion} to="/paciente/encuesta" variante={vista.estado.tipo === 'cita_propuesta' ? 'secundario' : 'primario'}>
            Responder la encuesta
          </Boton>
        ) : (
          <p className="flex items-center gap-3 rounded-[20px] bg-white p-4 ring-1 ring-gris-claro">
            <MessageCircleQuestion className="size-6 text-gris" strokeWidth={1.6} />
            <span>
              <span className="block font-semibold">Encuesta al día</span>
              <span className="block text-sm text-gris">La próxima es el {fechaCorta(vista.proximaEncuesta)}</span>
            </span>
          </p>
        )}
        {vista.analiticaToca ? (
          <Boton icono={Upload} to="/paciente/analitica" variante="secundario">
            Toca analítica: súbela aquí
          </Boton>
        ) : (
          <p className="flex items-center gap-3 rounded-[20px] bg-white p-4 ring-1 ring-gris-claro">
            <FlaskConical className="size-6 text-gris" strokeWidth={1.6} />
            <span>
              <span className="block font-semibold">Próxima analítica</span>
              <span className="block text-sm text-gris">Hacia el {fechaCorta(vista.proximaAnalitica)}</span>
            </span>
          </p>
        )}
      </div>

      {hechos.length > 0 && (
        <ul className="mt-5 space-y-1.5 px-1">
          {hechos.map((h) => (
            <Confirmado key={h}>{h}</Confirmado>
          ))}
        </ul>
      )}

      <h2 className="mt-8 mb-3 text-lg font-bold">¿Necesitas algo?</h2>
      <div className="space-y-3">
        <Boton icono={HandHeart} to="/paciente/revision" variante="secundario">
          Pedir que me revisen
        </Boton>
        {!vista.analiticaToca && (
          <Boton icono={Upload} to="/paciente/analitica" variante="suave">
            Subir una analítica (PDF)
          </Boton>
        )}
      </div>
    </div>
  )
}
