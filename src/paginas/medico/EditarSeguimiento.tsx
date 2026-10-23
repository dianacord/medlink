import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CircleCheck, FileText, FlaskConical, MessageCircleQuestion, Plus, Save, Siren, Trash2 } from 'lucide-react'
import { Boton } from '../../componentes/Boton'
import { Tarjeta, TituloSeccion, Volver } from '../../componentes/ui'
import { claseInput } from '../../componentes/estilos'
import { PLANTILLAS } from '../../config/plantillas'
import { actualizar, useEstado } from '../../datos/almacen'
import { sumarMeses } from '../../datos/cargador'
import { guardarSeguimiento, paciente as buscarPaciente, seguimientoActual, type BorradorSeguimiento } from '../../datos/modelo'
import { leerNumero, normalizar, valorFecha } from '../../logica/formato'
import { nombreCompleto } from '../../logica/paciente'
import { describirCambios } from '../../logica/seguimiento'
import type { Parametro, Plantilla, Pregunta, TipoPregunta, TipoRegla } from '../../types'

const nuevoId = (prefijo: string) => `${prefijo}-${crypto.randomUUID().slice(0, 6)}`

const REGLAS: { valor: TipoRegla; texto: string }[] = [
  { valor: 'fuera_de_rango', texto: 'Fuera de rango' },
  { valor: 'cambio_brusco', texto: 'Cambio brusco' },
  { valor: 'tendencia', texto: 'Empeora en 3 mediciones' },
]

const TIPOS: { valor: TipoPregunta; texto: string }[] = [
  { valor: 'escala', texto: 'Escala 0-10' },
  { valor: 'si_no', texto: 'Sí / no' },
  { valor: 'numero', texto: 'Número' },
]

function desdePlantilla(plantilla: Plantilla, pacienteId: string): BorradorSeguimiento {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return {
    pacienteId,
    plantillaId: plantilla.id,
    patologia: plantilla.patologia,
    parametros: plantilla.parametros,
    preguntas: plantilla.preguntas,
    frecuenciaAnaliticaSemanas: plantilla.frecuenciaAnaliticaSemanas,
    frecuenciaEncuestaDias: plantilla.frecuenciaEncuestaDias,
    fechaInicio: hoy.toISOString(),
    fechaFin: sumarMeses(hoy.toISOString(), plantilla.duracionMeses),
    activo: true,
  }
}

function Campo({ etiqueta, children, className = '' }: { etiqueta: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-semibold text-gris">{etiqueta}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

/** Campo numérico que admite coma decimal y dejarlo vacío. */
function CampoNumero({ valor, onCambio }: { valor?: number; onCambio: (n: number | undefined) => void }) {
  const [texto, setTexto] = useState(valor === undefined ? '' : String(valor).replace('.', ','))
  return (
    <input
      inputMode="decimal"
      value={texto}
      onChange={(e) => {
        setTexto(e.target.value)
        onCambio(leerNumero(e.target.value))
      }}
      className={claseInput}
    />
  )
}

function Casilla({ marcada, onCambio, children }: { marcada: boolean; onCambio: (v: boolean) => void; children: ReactNode }) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition ${marcada ? 'bg-primario-suave text-primario ring-primario' : 'bg-white text-gris ring-gris-claro'}`}
    >
      <input type="checkbox" checked={marcada} onChange={(e) => onCambio(e.target.checked)} className="size-4 accent-[#4a90d9]" />
      {children}
    </label>
  )
}

function FilaParametro({ p, onCambio, onQuitar }: { p: Parametro; onCambio: (p: Parametro) => void; onQuitar: () => void }) {
  const set = (cambios: Partial<Parametro>) => onCambio({ ...p, ...cambios })
  return (
    <div className="rounded-2xl bg-primario-suave/40 p-4 ring-1 ring-gris-claro">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[2fr_1fr_auto]">
        <Campo etiqueta="Nombre" className="col-span-2 sm:col-span-1">
          <input value={p.nombre} onChange={(e) => set({ nombre: e.target.value })} className={claseInput} placeholder="Ej. Calprotectina fecal" />
        </Campo>
        <Campo etiqueta="Unidad">
          <input value={p.unidad} onChange={(e) => set({ unidad: e.target.value })} className={claseInput} placeholder="mg/L" />
        </Campo>
        <button onClick={onQuitar} className="mt-5 inline-flex h-12 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-gris hover:bg-alta-suave hover:text-alta" aria-label={`Quitar ${p.nombre}`}>
          <Trash2 className="size-4" /> <span className="sm:hidden">Quitar</span>
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Campo etiqueta="Mínimo objetivo">
          <CampoNumero valor={p.min} onCambio={(min) => set({ min })} />
        </Campo>
        <Campo etiqueta="Máximo objetivo">
          <CampoNumero valor={p.max} onCambio={(max) => set({ max })} />
        </Campo>
        <Campo etiqueta="Cambio relevante">
          <CampoNumero valor={p.cambioRelevante} onCambio={(n) => set({ cambioRelevante: n ?? 0 })} />
        </Campo>
        <Campo etiqueta="Empeora al">
          <select value={p.empeoraAl} onChange={(e) => set({ empeoraAl: e.target.value as Parametro['empeoraAl'] })} className={claseInput}>
            <option value="subir">Subir</option>
            <option value="bajar">Bajar</option>
          </select>
        </Campo>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {REGLAS.map((r) => (
          <Casilla
            key={r.valor}
            marcada={p.reglas.includes(r.valor)}
            onCambio={(v) => set({ reglas: v ? [...p.reglas, r.valor] : p.reglas.filter((x) => x !== r.valor) })}
          >
            {r.texto}
          </Casilla>
        ))}
      </div>
    </div>
  )
}

function FilaPregunta({ q, onCambio, onQuitar }: { q: Pregunta; onCambio: (q: Pregunta) => void; onQuitar: () => void }) {
  const set = (cambios: Partial<Pregunta>) => onCambio({ ...q, ...cambios })
  return (
    <div className={`rounded-2xl p-4 ring-1 ${q.alarma ? 'bg-alta-suave/50 ring-alta/30' : 'bg-primario-suave/40 ring-gris-claro'}`}>
      <div className="flex gap-3">
        <Campo etiqueta="Pregunta para el paciente" className="flex-1">
          <input value={q.texto} onChange={(e) => set({ texto: e.target.value })} className={claseInput} placeholder="Ej. ¿Cuánto cansancio tienes?" />
        </Campo>
        <button onClick={onQuitar} className="mt-5 inline-flex h-12 items-center rounded-xl px-3 text-gris hover:bg-alta-suave hover:text-alta" aria-label="Quitar pregunta">
          <Trash2 className="size-4" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-[2fr_1fr_1fr]">
        <Campo etiqueta="Nombre corto (lo ves tú)" className="col-span-2 sm:col-span-1">
          <input value={q.etiqueta} onChange={(e) => set({ etiqueta: e.target.value })} className={claseInput} placeholder="Ej. Cansancio" />
        </Campo>
        <Campo etiqueta="Tipo">
          <select
            value={q.tipo}
            onChange={(e) => {
              const tipo = e.target.value as TipoPregunta
              set(tipo === 'si_no' ? { tipo, respuestaAlerta: true, umbral: undefined } : { tipo, umbral: q.umbral ?? 6, cambioRelevante: q.cambioRelevante ?? 2 })
            }}
            className={claseInput}
          >
            {TIPOS.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.texto}
              </option>
            ))}
          </select>
        </Campo>
        {q.tipo === 'si_no' ? (
          <Campo etiqueta="Alerta si responde">
            <select value={q.respuestaAlerta ? 'si' : 'no'} onChange={(e) => set({ respuestaAlerta: e.target.value === 'si' })} className={claseInput}>
              <option value="si">Sí</option>
              <option value="no">No</option>
            </select>
          </Campo>
        ) : (
          <Campo etiqueta="Umbral (alerta desde)">
            <CampoNumero valor={q.umbral} onCambio={(umbral) => set({ umbral })} />
          </Campo>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Casilla marcada={q.alarma} onCambio={(alarma) => set({ alarma })}>
          <Siren className="size-4" /> Señal de alarma (manda a Urgencias)
        </Casilla>
        {q.condicion && <span className="text-xs text-gris">Solo se pregunta a mujeres de {q.condicion.edadMin} a {q.condicion.edadMax} años</span>}
      </div>
    </div>
  )
}

function errores(b: BorradorSeguimiento): string[] {
  const lista: string[] = []
  if (!b.parametros.length && !b.preguntas.length) lista.push('Añade al menos un parámetro o una pregunta.')
  b.parametros.forEach((p, i) => {
    if (!p.nombre.trim()) lista.push(`El parámetro ${i + 1} no tiene nombre.`)
    else if (p.reglas.includes('fuera_de_rango') && p.min === undefined && p.max === undefined) lista.push(`${p.nombre}: indica un mínimo o un máximo objetivo.`)
  })
  b.preguntas.forEach((q, i) => {
    if (!q.texto.trim()) lista.push(`La pregunta ${i + 1} no tiene texto.`)
    else if (q.tipo !== 'si_no' && q.umbral === undefined) lista.push(`«${q.texto}»: indica el umbral.`)
  })
  if (!b.frecuenciaAnaliticaSemanas || !b.frecuenciaEncuestaDias) lista.push('Indica la frecuencia de la analítica y de la encuesta.')
  return lista
}

/** Completa lo que el médico no ha rellenado: nombre corto y sinónimos para leer PDFs. */
function completar(b: BorradorSeguimiento): BorradorSeguimiento {
  return {
    ...b,
    parametros: b.parametros.map((p) => ({ ...p, nombre: p.nombre.trim(), sinonimos: p.sinonimos.length ? p.sinonimos : [normalizar(p.nombre.trim())] })),
    preguntas: b.preguntas.map((q) => ({ ...q, texto: q.texto.trim(), etiqueta: q.etiqueta.trim() || q.texto.trim() })),
  }
}

export default function EditarSeguimiento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const estado = useEstado()
  const p = id ? buscarPaciente(estado, id) : undefined
  const actual = p ? seguimientoActual(estado, p.id) : undefined
  const [borrador, setBorrador] = useState<BorradorSeguimiento | null>(() => (actual ? { ...actual } : null))
  if (!p) return <Navigate to="/medico/buscar" replace />

  const esNuevo = !actual
  const b = borrador
  const set = (cambios: Partial<BorradorSeguimiento>) => setBorrador((x) => (x ? { ...x, ...cambios } : x))
  const listaErrores = b ? errores(b) : []
  const cambios = b && actual ? describirCambios(actual, completar(b)) : []
  const sinCambios = !esNuevo && cambios.length === 1 && cambios[0] === 'Sin cambios en la configuración'

  const guardar = () => {
    if (!b) return
    actualizar((e) => guardarSeguimiento(e, completar(b)))
    navigate(`/medico/paciente/${p.id}`, {
      state: { mensaje: esNuevo ? 'Seguimiento activado. El paciente ya puede responder su primera encuesta.' : 'Cambios guardados. La versión anterior queda en el historial.' },
    })
  }

  return (
    <div className="max-w-3xl">
      <Volver to={`/medico/paciente/${p.id}`}>{nombreCompleto(p)}</Volver>
      <h1 className="text-3xl font-bold tracking-tight">{esNuevo ? 'Crear seguimiento' : 'Ajustar seguimiento'}</h1>
      <p className="mt-1 text-gris">
        {nombreCompleto(p)} · {p.edad} años{actual && ` · versión ${actual.version}`}
      </p>

      {esNuevo && (
        <Tarjeta className="mt-6">
          <TituloSeccion>1. Elige una plantilla</TituloSeccion>
          <div className="grid gap-3 sm:grid-cols-2">
            {PLANTILLAS.map((pl) => {
              const elegida = b?.plantillaId === pl.id
              return (
                <button
                  key={pl.id}
                  onClick={() => setBorrador(desdePlantilla(pl, p.id))}
                  className={`flex items-start gap-3 rounded-2xl p-4 text-left ring-1 transition ${elegida ? 'bg-primario-suave ring-2 ring-primario' : 'bg-white ring-gris-claro hover:ring-primario'}`}
                >
                  <FileText className="mt-0.5 size-5 shrink-0 text-primario" />
                  <span>
                    <span className="block font-bold">{pl.nombre}</span>
                    <span className="block text-sm text-gris">
                      {pl.parametros.length ? `${pl.parametros.length} parámetros · ${pl.preguntas.length} preguntas` : 'Empieza de cero'}
                    </span>
                  </span>
                  {elegida && <CircleCheck className="ml-auto size-5 text-primario" />}
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-sm text-gris">La plantilla rellena valores por defecto. Puedes cambiarlo todo.</p>
        </Tarjeta>
      )}

      {b && (
        <>
          {(!esNuevo || b.plantillaId === 'en-blanco') && (
            <Tarjeta className="mt-5">
              <Campo etiqueta="Patología">
                <input value={b.patologia} onChange={(e) => set({ patologia: e.target.value })} className={claseInput} placeholder="Ej. Colitis ulcerosa" />
              </Campo>
            </Tarjeta>
          )}

          <Tarjeta className="mt-5">
            <TituloSeccion>
              <span className="inline-flex items-center gap-2">
                <FlaskConical className="size-5 text-primario" /> Parámetros analíticos
              </span>
            </TituloSeccion>
            <div className="space-y-3">
              {b.parametros.map((par, i) => (
                <FilaParametro
                  key={par.id}
                  p={par}
                  onCambio={(nuevo) => set({ parametros: b.parametros.map((x, j) => (j === i ? nuevo : x)) })}
                  onQuitar={() => set({ parametros: b.parametros.filter((_, j) => j !== i) })}
                />
              ))}
            </div>
            <button
              onClick={() =>
                set({
                  parametros: [
                    ...b.parametros,
                    { id: nuevoId('par'), nombre: '', unidad: '', cambioRelevante: 0, empeoraAl: 'subir', reglas: ['fuera_de_rango'], sinonimos: [] },
                  ],
                })
              }
              className="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold text-primario hover:bg-primario-suave"
            >
              <Plus className="size-4" /> Añadir parámetro
            </button>
          </Tarjeta>

          <Tarjeta className="mt-5">
            <TituloSeccion>
              <span className="inline-flex items-center gap-2">
                <MessageCircleQuestion className="size-5 text-primario" /> Preguntas de síntomas
              </span>
            </TituloSeccion>
            <div className="space-y-3">
              {b.preguntas.map((q, i) => (
                <FilaPregunta
                  key={q.id}
                  q={q}
                  onCambio={(nueva) => set({ preguntas: b.preguntas.map((x, j) => (j === i ? nueva : x)) })}
                  onQuitar={() => set({ preguntas: b.preguntas.filter((_, j) => j !== i) })}
                />
              ))}
            </div>
            <button
              onClick={() =>
                set({
                  preguntas: [
                    ...b.preguntas,
                    { id: nuevoId('preg'), texto: '', etiqueta: '', tipo: 'escala', umbral: 6, cambioRelevante: 2, alarma: false },
                  ],
                })
              }
              className="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold text-primario hover:bg-primario-suave"
            >
              <Plus className="size-4" /> Añadir pregunta
            </button>
          </Tarjeta>

          <Tarjeta className="mt-5">
            <TituloSeccion>Frecuencia</TituloSeccion>
            <div className="grid gap-3 sm:grid-cols-3">
              <Campo etiqueta="Analítica cada (semanas)">
                <CampoNumero valor={b.frecuenciaAnaliticaSemanas} onCambio={(n) => set({ frecuenciaAnaliticaSemanas: n ?? 0 })} />
              </Campo>
              <Campo etiqueta="Encuesta cada (días)">
                <CampoNumero valor={b.frecuenciaEncuestaDias} onCambio={(n) => set({ frecuenciaEncuestaDias: n ?? 0 })} />
              </Campo>
              <Campo etiqueta="Fecha de fin">
                <input
                  type="date"
                  value={valorFecha(new Date(b.fechaFin))}
                  onChange={(e) => e.target.value && set({ fechaFin: new Date(`${e.target.value}T00:00`).toISOString() })}
                  className={claseInput}
                />
              </Campo>
            </div>
          </Tarjeta>

          <div className="mt-6 space-y-3">
            {listaErrores.length > 0 && (
              <ul className="rounded-2xl bg-media-suave p-4 text-sm font-medium text-media">
                {listaErrores.map((x) => (
                  <li key={x}>· {x}</li>
                ))}
              </ul>
            )}
            {!esNuevo && !sinCambios && (
              <div className="rounded-2xl bg-primario-suave/60 p-4 text-sm">
                <p className="font-semibold">Se guardará como versión {actual!.version + 1}:</p>
                <ul className="mt-1 text-gris">
                  {cambios.map((x) => (
                    <li key={x}>· {x}</li>
                  ))}
                </ul>
              </div>
            )}
            <Boton icono={esNuevo ? CircleCheck : Save} disabled={listaErrores.length > 0 || sinCambios} onClick={guardar}>
              {esNuevo ? 'Activar seguimiento' : 'Guardar cambios'}
            </Boton>
          </div>
        </>
      )}
    </div>
  )
}
