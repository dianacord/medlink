import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CircleCheck, ClipboardList, FileText, FlaskConical, Lock, MessageCircleQuestion, Plus, Save, Siren, Trash2 } from 'lucide-react'
import { Boton } from '../../componentes/Boton'
import { Pestanas, Tarjeta, TituloSeccion, Volver } from '../../componentes/ui'
import { claseInput } from '../../componentes/estilos'
import { PLANTILLAS } from '../../config/plantillas'
import { FRECUENCIAS, PROMS, preguntasDeProm, promsActivos, type PromDef } from '../../config/proms'
import { actualizar, useEstado } from '../../datos/almacen'
import { sumarMeses } from '../../datos/cargador'
import { guardarSeguimiento, paciente as buscarPaciente, seguimientoActual, type BorradorSeguimiento } from '../../datos/modelo'
import { leerNumero, normalizar, valorFecha } from '../../logica/formato'
import { nombreCompleto } from '../../logica/paciente'
import { describirCambios, frecuenciasGenerales } from '../../logica/seguimiento'
import type { Parametro, Plantilla, Pregunta, TipoPregunta, TipoRegla } from '../../types'

const nuevoId = (prefijo: string) => `${prefijo}-${crypto.randomUUID().slice(0, 6)}`

type Vista = 'proms' | 'analitica'

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

function SelectorFrecuencia({ valor, onCambio, disabled }: { valor?: number; onCambio: (dias: number) => void; disabled?: boolean }) {
  return (
    <select
      value={valor ?? ''}
      disabled={disabled}
      onChange={(e) => onCambio(Number(e.target.value))}
      aria-label="Frecuencia"
      className={`${claseInput} disabled:opacity-50`}
    >
      {FRECUENCIAS.map((f) => (
        <option key={f.dias} value={f.dias}>
          {f.texto}
        </option>
      ))}
    </select>
  )
}

function Interruptor({ activo, onCambio, etiqueta }: { activo: boolean; onCambio: (v: boolean) => void; etiqueta: string }) {
  return (
    <button
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      onClick={() => onCambio(!activo)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${activo ? 'bg-primario' : 'bg-gris-claro'}`}
    >
      <span className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-all ${activo ? 'left-[1.375rem]' : 'left-0.5'}`} />
    </button>
  )
}

/** Un PROM del catálogo: interruptor, frecuencia y sus preguntas. */
function FilaProm({ prom, frecuencia, onActivar, onFrecuencia }: { prom: PromDef; frecuencia?: number; onActivar: (v: boolean) => void; onFrecuencia: (dias: number) => void }) {
  const activo = frecuencia !== undefined
  return (
    <div className={`rounded-2xl p-4 ring-1 transition ${activo ? 'bg-primario-suave/50 ring-primario-borde' : 'bg-white ring-gris-claro'}`}>
      <div className="flex items-start gap-3">
        <Interruptor activo={activo} onCambio={onActivar} etiqueta={`Enviar ${prom.nombre}`} />
        <div className="min-w-0 flex-1">
          <p className="font-bold">{prom.nombre}</p>
          <p className="text-sm text-gris">{prom.descripcion}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 pl-15">
        <div className="w-44">
          <SelectorFrecuencia valor={frecuencia ?? prom.frecuenciaPorDefecto} onCambio={onFrecuencia} disabled={!activo} />
        </div>
        <details className="text-sm text-gris">
          <summary className="cursor-pointer font-semibold text-primario">Ver {prom.preguntas?.length === 1 ? '1 pregunta' : `${prom.preguntas?.length} preguntas`}</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            {prom.preguntas?.map((q) => (
              <li key={q.id}>{q.texto}</li>
            ))}
          </ol>
          <p className="mt-2 text-xs">Adaptación al español sin validar.</p>
        </details>
      </div>
    </div>
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
      <Campo etiqueta="Frecuencia" className="mt-3 sm:w-56">
        <SelectorFrecuencia valor={p.frecuenciaDias} onCambio={(frecuenciaDias) => set({ frecuenciaDias })} />
      </Campo>
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
        {!q.alarma && (
          <div className="w-44">
            <SelectorFrecuencia valor={q.frecuenciaDias} onCambio={(frecuenciaDias) => set({ frecuenciaDias })} />
          </div>
        )}
        <Casilla marcada={q.alarma} onCambio={(alarma) => set({ alarma, frecuenciaDias: alarma ? undefined : 14 })}>
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
    else if ((q.tipo === 'escala' || q.tipo === 'numero') && q.umbral === undefined) lista.push(`«${q.texto}»: indica el umbral.`)
  })
  return lista
}

/** Completa lo que el médico no ha rellenado: nombre corto y sinónimos para leer PDFs. */
function completar(b: BorradorSeguimiento): BorradorSeguimiento {
  const completo = {
    ...b,
    parametros: b.parametros.map((p) => ({ ...p, nombre: p.nombre.trim(), sinonimos: p.sinonimos.length ? p.sinonimos : [normalizar(p.nombre.trim())] })),
    preguntas: b.preguntas.map((q) => ({ ...q, texto: q.texto.trim(), etiqueta: q.etiqueta.trim() || q.texto.trim() })),
  }
  return { ...completo, ...frecuenciasGenerales(completo) }
}

export default function EditarSeguimiento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const estado = useEstado()
  const p = id ? buscarPaciente(estado, id) : undefined
  const actual = p ? seguimientoActual(estado, p.id) : undefined
  const [borrador, setBorrador] = useState<BorradorSeguimiento | null>(() => (actual ? { ...actual } : null))
  const [vista, setVista] = useState<Vista>('proms')
  if (!p) return <Navigate to="/medico/buscar" replace />

  const esNuevo = !actual
  const b = borrador
  const activos = b ? promsActivos(b) : []
  const set = (cambios: Partial<BorradorSeguimiento>) => setBorrador((x) => (x ? { ...x, ...cambios } : x))
  const listaErrores = b ? errores(b) : []
  const cambios = b && actual ? describirCambios(actual, completar(b)) : []
  const sinCambios = !esNuevo && cambios.length === 1 && cambios[0] === 'Sin cambios en la configuración'

  const cambiarPregunta = (i: number) => (nueva: Pregunta) => set({ preguntas: b!.preguntas.map((x, j) => (j === i ? nueva : x)) })

  /** Activa un PROM (sus preguntas van antes de las alarmas) o lo quita. */
  const activarProm = (prom: PromDef, activo: boolean) => {
    if (!b) return
    if (!activo) return set({ preguntas: b.preguntas.filter((q) => q.prom !== prom.id) })
    const alarmas = b.preguntas.findIndex((q) => q.alarma)
    const corte = alarmas === -1 ? b.preguntas.length : alarmas
    set({ preguntas: [...b.preguntas.slice(0, corte), ...preguntasDeProm(prom), ...b.preguntas.slice(corte)] })
  }

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
                      {pl.parametros.length ? `${promsActivos(pl).length} PROMs · ${pl.parametros.length} parámetros analíticos` : 'Empieza de cero'}
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

          <div className="mt-5">
            <Pestanas<Vista>
              opciones={[
                { valor: 'proms', texto: 'PROMs y preguntas', contador: activos.length },
                { valor: 'analitica', texto: 'Analítica', contador: b.parametros.length },
              ]}
              valor={vista}
              onCambio={setVista}
            />
          </div>

          {vista === 'proms' ? (
            <>
              <Tarjeta className="mt-5">
                <TituloSeccion>
                  <span className="inline-flex items-center gap-2">
                    <ClipboardList className="size-5 text-primario" /> Cuestionarios validados (PROMs)
                  </span>
                </TituloSeccion>
                <p className="-mt-1 mb-4 text-sm text-gris">Activa los que le llegan al paciente y elige cada cuánto. Si coinciden el mismo día, van en una sola encuesta.</p>
                <div className="space-y-3">
                  {PROMS.filter((x) => x.estado === 'disponible').map((prom) => (
                    <FilaProm
                      key={prom.id}
                      prom={prom}
                      frecuencia={activos.find((x) => x.prom.id === prom.id)?.frecuencia}
                      onActivar={(v) => activarProm(prom, v)}
                      onFrecuencia={(dias) => set({ preguntas: b.preguntas.map((q) => (q.prom === prom.id ? { ...q, frecuenciaDias: dias } : q)) })}
                    />
                  ))}
                </div>
                <p className="mt-5 text-sm font-semibold text-gris">Más cuestionarios</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {PROMS.filter((x) => x.estado !== 'disponible').map((prom) => (
                    <li key={prom.id} className="inline-flex items-center gap-1.5 rounded-full bg-gris-claro/50 px-3 py-1.5 text-sm text-gris" title={prom.estado === 'licencia' ? 'Necesita licencia del autor' : 'Próximamente'}>
                      {prom.estado === 'licencia' && <Lock className="size-3.5" />}
                      {prom.nombre}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-gris">Próximamente. Los marcados con candado necesitan licencia del autor.</p>
              </Tarjeta>

              <Tarjeta className="mt-5">
                <TituloSeccion>
                  <span className="inline-flex items-center gap-2">
                    <MessageCircleQuestion className="size-5 text-primario" /> Preguntas propias
                  </span>
                </TituloSeccion>
                <div className="space-y-3">
                  {b.preguntas.map((q, i) =>
                    q.prom || q.alarma ? null : (
                      <FilaPregunta key={q.id} q={q} onCambio={cambiarPregunta(i)} onQuitar={() => set({ preguntas: b.preguntas.filter((_, j) => j !== i) })} />
                    ),
                  )}
                </div>
                <button
                  onClick={() =>
                    set({
                      preguntas: [
                        ...b.preguntas,
                        { id: nuevoId('preg'), texto: '', etiqueta: '', tipo: 'escala', umbral: 6, cambioRelevante: 2, alarma: false, frecuenciaDias: 14 },
                      ],
                    })
                  }
                  className="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold text-primario hover:bg-primario-suave"
                >
                  <Plus className="size-4" /> Añadir pregunta
                </button>
              </Tarjeta>

              <Tarjeta className="mt-5">
                <TituloSeccion>
                  <span className="inline-flex items-center gap-2">
                    <Siren className="size-5 text-alta" /> Señales de alarma
                  </span>
                </TituloSeccion>
                <p className="-mt-1 mb-4 text-sm text-gris">Van en todas las encuestas. Si el paciente responde que sí, ve la pantalla de Urgencias.</p>
                <div className="space-y-3">
                  {b.preguntas.map((q, i) =>
                    q.alarma ? <FilaPregunta key={q.id} q={q} onCambio={cambiarPregunta(i)} onQuitar={() => set({ preguntas: b.preguntas.filter((_, j) => j !== i) })} /> : null,
                  )}
                </div>
              </Tarjeta>
            </>
          ) : (
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
                      { id: nuevoId('par'), nombre: '', unidad: '', cambioRelevante: 0, empeoraAl: 'subir', reglas: ['fuera_de_rango'], sinonimos: [], frecuenciaDias: 84 },
                    ],
                  })
                }
                className="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold text-primario hover:bg-primario-suave"
              >
                <Plus className="size-4" /> Añadir parámetro
              </button>
            </Tarjeta>
          )}

          <Tarjeta className="mt-5">
            <Campo etiqueta="Fecha de fin del seguimiento" className="sm:w-64">
              <input
                type="date"
                value={valorFecha(new Date(b.fechaFin))}
                onChange={(e) => e.target.value && set({ fechaFin: new Date(`${e.target.value}T00:00`).toISOString() })}
                className={claseInput}
              />
            </Campo>
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
