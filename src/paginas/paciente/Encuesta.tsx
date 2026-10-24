import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CircleCheck, House, Minus, Plus, Send } from 'lucide-react'
import { Boton } from '../../componentes/Boton'
import { Tarjeta } from '../../componentes/ui'
import { actualizar, useEstado } from '../../datos/almacen'
import { paciente as buscarPaciente, registrarRespuesta } from '../../datos/modelo'
import { useUsuario } from '../../datos/sesion'
import { vistaPaciente } from '../../datos/vistaPaciente'
import { fechaConDia } from '../../logica/formato'
import type { Pregunta, ValorRespuesta } from '../../types'

/** Si esta respuesta es una señal de alarma (manda a Urgencias). */
const esAlarma = (q: Pregunta, v: ValorRespuesta) =>
  q.alarma && (q.tipo === 'si_no' ? v === q.respuestaAlerta : typeof v === 'number' && q.umbral !== undefined && v >= q.umbral)

function Escala({ q, valor, onElegir }: { q: Pregunta; valor?: ValorRespuesta; onElegir: (v: number) => void }) {
  const [min, max] = (q.ayuda ?? '0 = nada, 10 = mucho').split(',').map((s) => s.split('=')[1]?.trim())
  return (
    <div>
      <div className="grid grid-cols-4 gap-2.5">
        {Array.from({ length: 11 }, (_, n) => (
          <button
            key={n}
            onClick={() => onElegir(n)}
            className={`h-16 rounded-2xl text-2xl font-bold ring-1 transition ${valor === n ? 'bg-primario text-white ring-primario' : 'bg-white text-marino ring-gris-claro hover:ring-primario'}`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-sm text-gris">
        <span>0 = {min}</span>
        <span>10 = {max}</span>
      </div>
    </div>
  )
}

function SiNo({ valor, onElegir }: { valor?: ValorRespuesta; onElegir: (v: boolean) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          onClick={() => onElegir(v)}
          className={`h-24 rounded-[20px] text-2xl font-bold ring-1 transition ${valor === v ? 'bg-primario text-white ring-primario' : 'bg-white text-marino ring-gris-claro hover:ring-primario'}`}
        >
          {v ? 'Sí' : 'No'}
        </button>
      ))}
    </div>
  )
}

function Opciones({ q, valor, onElegir }: { q: Pregunta; valor?: ValorRespuesta; onElegir: (v: number) => void }) {
  return (
    <div className="space-y-2.5">
      {q.opciones?.map((o, i) => (
        <button
          key={o.texto}
          onClick={() => onElegir(i)}
          className={`flex min-h-16 w-full items-center rounded-[20px] px-5 py-3 text-left text-lg font-semibold ring-1 transition ${valor === i ? 'bg-primario text-white ring-primario' : 'bg-white text-marino ring-gris-claro hover:ring-primario'}`}
        >
          {o.texto}
        </button>
      ))}
    </div>
  )
}

function Numero({ q, inicial, onElegir }: { q: Pregunta; inicial: number; onElegir: (v: number) => void }) {
  const [n, setN] = useState(inicial)
  return (
    <div>
      <div className="flex items-center justify-between gap-3 rounded-[20px] bg-white p-3 ring-1 ring-gris-claro">
        <button onClick={() => setN((x) => Math.max(0, x - 1))} className="flex size-16 items-center justify-center rounded-2xl bg-primario-suave text-primario" aria-label="Menos">
          <Minus className="size-7" />
        </button>
        <span className="text-5xl font-bold tabular-nums">
          {n}
          {q.unidad && <span className="ml-1 text-xl font-semibold text-gris">{q.unidad}</span>}
        </span>
        <button onClick={() => setN((x) => Math.min(30, x + 1))} className="flex size-16 items-center justify-center rounded-2xl bg-primario-suave text-primario" aria-label="Más">
          <Plus className="size-7" />
        </button>
      </div>
      <div className="mt-4">
        <Boton chevron onClick={() => onElegir(n)}>
          Siguiente
        </Boton>
      </div>
    </div>
  )
}

export default function Encuesta() {
  const estado = useEstado()
  const usuario = useUsuario()
  const navigate = useNavigate()
  const yo = buscarPaciente(estado, usuario!.pacienteId!)!
  const [vistaInicial] = useState(() => vistaPaciente(estado, yo.id))
  const [paso, setPaso] = useState(0)
  const [respuestas, setRespuestas] = useState<Record<string, ValorRespuesta>>({})
  const [texto, setTexto] = useState('')
  const [enviada, setEnviada] = useState(false)

  if (!vistaInicial) return null
  const preguntas = vistaInicial.preguntasEncuesta
  const ultima = estado.respuestas.filter((r) => r.pacienteId === yo.id).sort((a, b) => a.fecha.localeCompare(b.fecha)).at(-1)

  /** Guarda la encuesta. Devuelve si hay que mandar al paciente a Urgencias. */
  const enviar = (finales: Record<string, ValorRespuesta>, textoLibre: string) => {
    let alarma = false
    actualizar((e) => {
      const r = registrarRespuesta(e, yo.id, finales, textoLibre)
      alarma = r.alarma
      return r.estado
    })
    return alarma
  }

  const responder = (q: Pregunta, v: ValorRespuesta) => {
    const nuevas = { ...respuestas, [q.id]: v }
    setRespuestas(nuevas)
    if (esAlarma(q, v)) {
      // Señal de alarma: se guarda lo respondido y se avisa al momento.
      enviar(nuevas, '')
      navigate('/paciente/urgencias', { replace: true })
      return
    }
    setTimeout(() => setPaso((x) => x + 1), q.tipo === 'numero' ? 0 : 180)
  }

  const terminar = () => {
    if (enviar(respuestas, texto)) navigate('/paciente/urgencias', { replace: true })
    else setEnviada(true)
  }

  if (enviada) {
    const ahora = vistaPaciente(estado, yo.id)!
    return (
      <div className="pt-6 text-center">
        <CircleCheck className="mx-auto size-16 text-baja" strokeWidth={1.5} />
        <h1 className="mt-4 text-3xl font-bold tracking-tight">¡Gracias, {yo.nombre}!</h1>
        <p className="mx-auto mt-3 max-w-xs text-lg text-gris">
          {ahora.estado.tipo === 'en_revision'
            ? 'Tu médico revisará tus respuestas. Si necesita hablar contigo, te propondrá una cita aquí.'
            : `Todo bien. Tu próxima encuesta es el ${fechaConDia(ahora.proximaEncuesta)}.`}
        </p>
        <div className="mt-8">
          <Boton icono={House} to="/paciente">
            Volver al inicio
          </Boton>
        </div>
      </div>
    )
  }

  if (!vistaInicial.encuestaPendiente) {
    return (
      <Tarjeta className="mt-4 text-center">
        <CircleCheck className="mx-auto size-10 text-baja" strokeWidth={1.5} />
        <p className="mt-3 text-lg font-bold">No tienes encuestas pendientes</p>
        <p className="mt-1 text-gris">La próxima es el {fechaConDia(vistaInicial.proximaEncuesta)}.</p>
        <div className="mt-5">
          <Boton icono={House} variante="secundario" to="/paciente">
            Volver al inicio
          </Boton>
        </div>
      </Tarjeta>
    )
  }

  const total = preguntas.length + 1
  const q = preguntas[paso]
  const anteriorNumero = q && typeof ultima?.respuestas[q.id] === 'number' ? (ultima.respuestas[q.id] as number) : 1

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => (paso > 0 ? setPaso(paso - 1) : navigate('/paciente'))}
          className="inline-flex items-center gap-2 rounded-full py-2 pr-3 font-semibold text-gris hover:text-primario"
        >
          <ArrowLeft className="size-5" /> {paso > 0 ? 'Atrás' : 'Salir'}
        </button>
        <span className="text-sm font-semibold text-gris">
          {Math.min(paso + 1, total)} de {total}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-primario-suave">
        <div className="h-full rounded-full bg-primario transition-all" style={{ width: `${((paso + 1) / total) * 100}%` }} />
      </div>

      {q ? (
        <div key={q.id} className="mt-8">
          <h1 className="text-[1.6rem] leading-tight font-bold tracking-tight">{q.texto}</h1>
          {q.ayuda && q.tipo !== 'escala' && <p className="mt-2 text-gris">{q.ayuda}</p>}
          <div className="mt-8">
            {q.tipo === 'escala' && <Escala q={q} valor={respuestas[q.id]} onElegir={(v) => responder(q, v)} />}
            {q.tipo === 'si_no' && <SiNo valor={respuestas[q.id]} onElegir={(v) => responder(q, v)} />}
            {q.tipo === 'opciones' && <Opciones q={q} valor={respuestas[q.id]} onElegir={(v) => responder(q, v)} />}
            {q.tipo === 'numero' && <Numero q={q} inicial={(respuestas[q.id] as number | undefined) ?? anteriorNumero} onElegir={(v) => responder(q, v)} />}
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <h1 className="text-[1.6rem] leading-tight font-bold tracking-tight">¿Quieres contarnos algo más?</h1>
          <p className="mt-2 text-gris">Es opcional. Escribe con tus palabras cómo te encuentras.</p>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={5}
            placeholder="Por ejemplo: esta semana he tenido más molestias por la noche…"
            className="mt-6 w-full rounded-[20px] border border-gris-claro bg-white p-4 text-lg outline-none focus:border-primario focus:ring-2 focus:ring-primario/20"
          />
          <div className="mt-4">
            <Boton icono={Send} chevron={false} onClick={terminar}>
              Enviar encuesta
            </Boton>
          </div>
        </div>
      )}
    </div>
  )
}
