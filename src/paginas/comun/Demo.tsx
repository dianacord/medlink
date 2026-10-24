import { useState } from 'react'
import { ClipboardList, ExternalLink, FlaskConical, RotateCcw, Send, Siren, Sparkles, TrendingDown, TriangleAlert } from 'lucide-react'
import { Boton } from '../../componentes/Boton'
import { claseInput } from '../../componentes/estilos'
import { Fondo } from '../../componentes/Fondo'
import { Marca, PieDemo } from '../../componentes/Marca'
import { EtiquetaPrioridad, Tarjeta } from '../../componentes/ui'
import { actualizar, leerEstado, reiniciarDatos, useEstado } from '../../datos/almacen'
import {
  avisoAbierto,
  nuevoId,
  registrarAnalitica,
  registrarRespuesta,
  seguimientoActual,
  ultimaActualizacion,
  type Estado,
} from '../../datos/modelo'
import { guardarPdf } from '../../datos/pdf'
import { leerNumero, num, valorFecha } from '../../logica/formato'
import { nombreCompleto } from '../../logica/paciente'
import { aplicaPregunta } from '../../logica/preguntas'
import type { Paciente, Parametro, Pregunta, SeguimientoVersion, ValorRespuesta } from '../../types'

// Panel para presentar: simula lo que llega de fuera (el paciente o el laboratorio del hospital)
// sin tener que rellenar la encuesta a mano. No forma parte del producto.

type Escenario = 'normal' | 'sintomas' | 'analitica' | 'alarma'

const ESCENARIOS: { id: Escenario; texto: string; icono: typeof Sparkles }[] = [
  { id: 'normal', texto: 'Todo normal', icono: Sparkles },
  { id: 'sintomas', texto: 'Empeoran los síntomas', icono: TrendingDown },
  { id: 'analitica', texto: 'Analítica alterada', icono: FlaskConical },
  { id: 'alarma', texto: 'Señal de alarma', icono: Siren },
]

/** Intervalo de referencia para el informe (la fuente estándar del PDF no tiene "≥"). */
function referencia(p: Parametro) {
  if (p.min !== undefined && p.max !== undefined) return `${num(p.min)} - ${num(p.max)}`
  return p.max !== undefined ? `< ${num(p.max)}` : `>= ${num(p.min ?? 0)}`
}

const redondear = (n: number) => Math.round(n * 10) / 10

function valorNormal(p: Parametro) {
  if (p.max !== undefined && p.min !== undefined) return redondear((p.min + p.max) / 2)
  return redondear(p.max !== undefined ? p.max * 0.4 : (p.min ?? 0) * 1.15)
}
const valorAlterado = (p: Parametro) => redondear(p.empeoraAl === 'subir' ? (p.max ?? valorNormal(p)) * 4 : (p.min ?? valorNormal(p)) * 0.85)

// En las preguntas de opciones la primera es la mejor y la última la peor (ver config/proms.ts).
function respuestaNormal(q: Pregunta): ValorRespuesta {
  if (q.tipo === 'opciones') return 0
  if (q.tipo === 'si_no') return !q.respuestaAlerta
  return q.tipo === 'numero' ? 2 : 1
}
function respuestaPeor(q: Pregunta): ValorRespuesta {
  if (q.alarma || q.condicion) return respuestaNormal(q)
  if (q.tipo === 'opciones') return (q.opciones?.length ?? 1) - 1
  if (q.tipo === 'si_no') return q.respuestaAlerta!
  return q.tipo === 'numero' ? (q.umbral ?? 5) + 2 : Math.min(10, (q.umbral ?? 6) + 1)
}

/** Últimos valores del paciente, para partir de ellos. */
function valoresActuales(e: Estado, p: Paciente, seg: SeguimientoVersion) {
  const ultimaRespuesta = e.respuestas.filter((r) => r.pacienteId === p.id).sort((a, b) => a.fecha.localeCompare(b.fecha)).at(-1)
  const respuestas: Record<string, ValorRespuesta> = {}
  for (const q of seg.preguntas.filter((q) => aplicaPregunta(q, p))) respuestas[q.id] = ultimaRespuesta?.respuestas[q.id] ?? respuestaNormal(q)
  const analitica: Record<string, string> = {}
  for (const par of seg.parametros) {
    const ultima = e.mediciones.filter((m) => m.pacienteId === p.id && m.parametroId === par.id).sort((a, b) => a.fecha.localeCompare(b.fecha)).at(-1)
    analitica[par.id] = num(ultima?.valor ?? valorNormal(par))
  }
  return { respuestas, analitica }
}

function Situacion({ estado, p, seg }: { estado: Estado; p: Paciente; seg: SeguimientoVersion }) {
  const aviso = avisoAbierto(estado, seg.seguimientoId)
  if (!aviso) return <p className="text-sm font-semibold text-baja">En verde · sin avisos abiertos</p>
  const ultima = ultimaActualizacion(estado, aviso.id)
  return (
    <p className="flex flex-wrap items-center gap-2 text-sm">
      <EtiquetaPrioridad prioridad={ultima.prioridad} />
      <span className="font-semibold">{ultima.titulo}</span>
      <span className="text-gris">· aviso para {p.nombre}</span>
    </p>
  )
}

function PanelPaciente({ p, seg }: { p: Paciente; seg: SeguimientoVersion }) {
  const estado = useEstado()
  const [inicial] = useState(() => valoresActuales(leerEstado(), p, seg))
  const [respuestas, setRespuestas] = useState(inicial.respuestas)
  const [analitica, setAnalitica] = useState(inicial.analitica)
  const [texto, setTexto] = useState('')
  const [hecho, setHecho] = useState<string>()
  const preguntas = seg.preguntas.filter((q) => aplicaPregunta(q, p))

  const aplicar = (esc: Escenario) => {
    if (esc === 'normal') {
      setRespuestas(Object.fromEntries(preguntas.map((q) => [q.id, respuestaNormal(q)])))
      setAnalitica(Object.fromEntries(seg.parametros.map((par) => [par.id, num(valorNormal(par))])))
    }
    if (esc === 'sintomas') setRespuestas(Object.fromEntries(preguntas.map((q) => [q.id, respuestaPeor(q)])))
    if (esc === 'analitica') setAnalitica(Object.fromEntries(seg.parametros.map((par) => [par.id, num(valorAlterado(par))])))
    if (esc === 'alarma') {
      const q = preguntas.find((q) => q.alarma)
      if (q) setRespuestas((r) => ({ ...r, [q.id]: q.respuestaAlerta ?? true }))
    }
    setHecho(undefined)
  }

  const enviarEncuesta = () => {
    let alarma = false
    actualizar((e) => {
      const r = registrarRespuesta(e, p.id, respuestas, texto, Date.now(), 'demo')
      alarma = r.alarma
      return r.estado
    })
    setTexto('')
    setHecho(alarma ? 'Encuesta registrada con señal de alarma: el paciente vería la pantalla de Urgencias.' : 'Encuesta registrada.')
  }

  const llegaAnalitica = async () => {
    const valores = seg.parametros.flatMap((par) => {
      const v = leerNumero(analitica[par.id] ?? '')
      return v === undefined ? [] : [{ parametro: par, valor: v }]
    })
    const ahora = new Date()
    const { generarPdfAnalitica, numeroInforme } = await import('../../logica/pdfAnalitica')
    const pdf = await generarPdfAnalitica({
      laboratorio: 'Laboratorio del hospital (simulado)',
      paciente: nombreCompleto(p),
      identificador: `NHC ${p.nhc}`,
      fecha: ahora,
      secciones: [
        {
          titulo: seg.patologia,
          filas: valores.map(({ parametro: par, valor }) => ({
            prueba: par.nombre,
            resultado: numeroInforme(valor),
            unidad: par.unidad,
            referencia: referencia(par),
          })),
        },
      ],
    })
    const documento = { id: nuevoId('doc'), nombreArchivo: `analitica-hospital-${valorFecha(ahora)}.pdf` }
    await guardarPdf(documento.id, new Blob([pdf as BlobPart], { type: 'application/pdf' }))
    actualizar((e) =>
      registrarAnalitica(
        e,
        p.id,
        valores.map(({ parametro, valor }) => ({ parametroId: parametro.id, valor })),
        { origen: 'laboratorio_hospital', documento },
      ),
    )
    setHecho('Analítica del laboratorio del hospital registrada (PDF incluido).')
  }

  return (
    <div className="space-y-5">
      <Tarjeta>
        <p className="text-sm text-gris">
          {p.edad} años · NHC {p.nhc} · {seg.patologia}
        </p>
        <div className="mt-2">
          <Situacion estado={estado} p={p} seg={seg} />
        </div>
        {hecho && <p className="mt-3 rounded-2xl bg-baja-suave p-3 text-sm font-semibold text-baja">✓ {hecho}</p>}
        <p className="mt-5 text-sm font-semibold text-gris">Rellenar con un caso</p>
        <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {ESCENARIOS.map(({ id, texto, icono: Icono }) => (
            <button
              key={id}
              onClick={() => aplicar(id)}
              className={`flex items-center gap-2 rounded-2xl px-3 py-3 text-left text-sm font-semibold ring-1 ${id === 'alarma' ? 'text-alta ring-alta/30 hover:bg-alta-suave' : 'text-primario ring-primario-borde hover:bg-primario-suave'}`}
            >
              <Icono className="size-4 shrink-0" />
              {texto}
            </button>
          ))}
        </div>
      </Tarjeta>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <Tarjeta>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ClipboardList className="size-5 text-primario" /> Encuesta del paciente
          </h2>
          <div className="mt-4 divide-y divide-gris-claro">
            {preguntas.map((q) => (
              <label key={q.id} className="flex items-center justify-between gap-3 py-2">
                <span className={`text-sm ${q.alarma ? 'font-semibold text-alta' : ''}`}>
                  {q.alarma && <TriangleAlert className="mr-1 inline size-3.5" />}
                  {q.etiqueta}
                </span>
                {q.tipo === 'opciones' ? (
                  <select
                    value={Number(respuestas[q.id])}
                    onChange={(ev) => setRespuestas({ ...respuestas, [q.id]: Number(ev.target.value) })}
                    className={`${claseInput} !h-10 !w-44 text-sm`}
                  >
                    {q.opciones?.map((o, i) => (
                      <option key={o.texto} value={i}>
                        {o.texto}
                      </option>
                    ))}
                  </select>
                ) : q.tipo === 'si_no' ? (
                  // Sí/No responde a la etiqueta ("No toma la medicación"), no a la pregunta al paciente.
                  <select
                    value={String(respuestas[q.id] === q.respuestaAlerta)}
                    onChange={(ev) => setRespuestas({ ...respuestas, [q.id]: ev.target.value === 'true' ? q.respuestaAlerta! : !q.respuestaAlerta })}
                    className={`${claseInput} !h-10 !w-24`}
                  >
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={q.tipo === 'escala' ? 10 : 30}
                      value={Number(respuestas[q.id])}
                      onChange={(ev) => setRespuestas({ ...respuestas, [q.id]: Number(ev.target.value) })}
                      className={`${claseInput} !h-10 !w-20 text-right`}
                    />
                    <span className="w-8 text-xs text-gris">{q.tipo === 'escala' ? '/10' : q.unidad}</span>
                  </span>
                )}
              </label>
            ))}
          </div>
          <textarea
            value={texto}
            onChange={(ev) => setTexto(ev.target.value)}
            rows={2}
            placeholder="Texto libre del paciente (opcional)"
            className="mt-3 w-full rounded-xl border border-gris-claro bg-white p-3 text-sm outline-none focus:border-primario"
          />
          <div className="mt-3">
            <Boton icono={Send} compacto chevron={false} onClick={enviarEncuesta}>
              Enviar encuesta
            </Boton>
          </div>
        </Tarjeta>

        <Tarjeta>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <FlaskConical className="size-5 text-primario" /> Analítica del hospital
          </h2>
          <div className="mt-4 divide-y divide-gris-claro">
            {seg.parametros.map((par) => (
              <label key={par.id} className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm">{par.nombre}</span>
                <span className="flex items-center gap-1.5">
                  <input
                    inputMode="decimal"
                    value={analitica[par.id] ?? ''}
                    onChange={(ev) => setAnalitica({ ...analitica, [par.id]: ev.target.value })}
                    className={`${claseInput} !h-10 !w-24 text-right`}
                  />
                  <span className="w-10 text-xs text-gris">{par.unidad}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="mt-3">
            <Boton icono={FlaskConical} compacto chevron={false} onClick={llegaAnalitica}>
              Llega analítica (PDF)
            </Boton>
          </div>
        </Tarjeta>
      </div>
    </div>
  )
}

export default function Demo() {
  const estado = useEstado()
  const conSeguimiento = estado.pacientes
    .map((p) => ({ p, seg: seguimientoActual(estado, p.id) }))
    .filter((x): x is { p: Paciente; seg: SeguimientoVersion } => !!x.seg?.activo)
    .sort((a, b) => a.p.nombre.localeCompare(b.p.nombre))
  const [elegido, setElegido] = useState('P0163423')
  const actual = conSeguimiento.find((x) => x.p.id === elegido) ?? conSeguimiento[0]

  const reiniciar = () => {
    if (confirm('¿Volver a los datos iniciales del demo? Se borra todo lo que se ha hecho.')) reiniciarDatos()
  }

  return (
    <div className="flex min-h-dvh flex-col items-center px-4">
      <Fondo />
      <header className="flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 pt-6">
        <Marca />
        <nav className="flex flex-wrap gap-2 text-sm font-semibold">
          <a href="/login/medico" target="_blank" className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-primario ring-1 ring-primario-borde">
            App del médico <ExternalLink className="size-3.5" />
          </a>
          <a href="/login/paciente" target="_blank" className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-primario ring-1 ring-primario-borde">
            App del paciente <ExternalLink className="size-3.5" />
          </a>
        </nav>
      </header>
      <main className="w-full max-w-5xl flex-1 py-6">
        <h1 className="text-3xl font-bold tracking-tight">Panel de demo</h1>
        <p className="mt-1 text-gris">Simula lo que llega del paciente o del laboratorio. Los cambios aparecen al momento en las otras pestañas.</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="text-sm font-semibold text-gris">Paciente</span>
            <select value={actual?.p.id} onChange={(ev) => setElegido(ev.target.value)} className={`${claseInput} mt-1`}>
              {conSeguimiento.map(({ p }) => (
                <option key={p.id} value={p.id}>
                  {nombreCompleto(p)}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={reiniciar}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 font-semibold text-alta ring-1 ring-alta/30 hover:bg-alta-suave"
          >
            <RotateCcw className="size-4" /> Reiniciar datos
          </button>
        </div>

        {actual && (
          <div className="mt-5">
            <PanelPaciente key={actual.p.id} p={actual.p} seg={actual.seg} />
          </div>
        )}
      </main>
      <PieDemo />
    </div>
  )
}
