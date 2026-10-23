import { useRef, useState } from 'react'
import { CircleCheck, FileSearch, FileText, House, LoaderCircle, Send, Upload } from 'lucide-react'
import { Boton } from '../../componentes/Boton'
import { claseInput } from '../../componentes/estilos'
import { Tarjeta, Volver } from '../../componentes/ui'
import { actualizar, useEstado } from '../../datos/almacen'
import { nuevoId, registrarAnalitica } from '../../datos/modelo'
import { guardarPdf, leerLineasPdf } from '../../datos/pdf'
import { useUsuario } from '../../datos/sesion'
import { vistaPaciente } from '../../datos/vistaPaciente'
import { detectarParametros } from '../../logica/detectarAnalitica'
import { leerNumero, num } from '../../logica/formato'

const EJEMPLOS = [
  { archivo: 'analitica-externa-normal.pdf', titulo: 'Analítica con valores normales' },
  { archivo: 'analitica-externa-alterada.pdf', titulo: 'Analítica con valores alterados' },
  { archivo: 'analitica-otra-prueba.pdf', titulo: 'Otra analítica (sin estos valores)' },
]

const MAX_BYTES = 10 * 1024 * 1024

type Paso =
  | { tipo: 'elegir'; error?: string }
  | { tipo: 'leyendo' }
  | { tipo: 'confirmar'; archivo: File; valores: Record<string, string>; lineas: Record<string, string> }
  | { tipo: 'enviada' }

export default function SubirAnalitica() {
  const estado = useEstado()
  const usuario = useUsuario()
  const pacienteId = usuario!.pacienteId!
  const vista = vistaPaciente(estado, pacienteId)
  const entrada = useRef<HTMLInputElement>(null)
  const [paso, setPaso] = useState<Paso>({ tipo: 'elegir' })

  if (!vista) return null
  const parametros = vista.seg.parametros

  const leer = async (archivo: File) => {
    if (archivo.type !== 'application/pdf' && !archivo.name.toLowerCase().endsWith('.pdf')) {
      return setPaso({ tipo: 'elegir', error: 'El archivo tiene que ser un PDF.' })
    }
    if (archivo.size > MAX_BYTES) return setPaso({ tipo: 'elegir', error: 'El PDF es demasiado grande (máximo 10 MB).' })
    setPaso({ tipo: 'leyendo' })
    try {
      const detectados = detectarParametros(await leerLineasPdf(await archivo.arrayBuffer()), parametros)
      setPaso({
        tipo: 'confirmar',
        archivo,
        valores: Object.fromEntries(detectados.map((d) => [d.parametroId, num(d.valor)])),
        lineas: Object.fromEntries(detectados.map((d) => [d.parametroId, d.linea])),
      })
    } catch {
      setPaso({ tipo: 'elegir', error: 'No hemos podido abrir este PDF. Prueba con otro archivo.' })
    }
  }

  const usarEjemplo = async (nombre: string) => {
    setPaso({ tipo: 'leyendo' })
    const datos = await (await fetch(`/ejemplos/${nombre}`)).blob()
    await leer(new File([datos], nombre, { type: 'application/pdf' }))
  }

  if (paso.tipo === 'enviada') {
    const ahora = vistaPaciente(estado, pacienteId)!
    return (
      <div className="pt-6 text-center">
        <CircleCheck className="mx-auto size-16 text-baja" strokeWidth={1.5} />
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Analítica enviada</h1>
        <p className="mx-auto mt-3 max-w-xs text-lg text-gris">
          {ahora.estado.tipo === 'en_revision'
            ? 'Tu médico la revisará. Si necesita hablar contigo, te propondrá una cita aquí.'
            : 'La hemos guardado en tu seguimiento. Gracias.'}
        </p>
        <div className="mt-8">
          <Boton icono={House} to="/paciente">
            Volver al inicio
          </Boton>
        </div>
      </div>
    )
  }

  if (paso.tipo === 'leyendo') {
    return (
      <div className="pt-16 text-center">
        <LoaderCircle className="mx-auto size-12 animate-spin text-primario" />
        <p className="mt-4 text-lg font-semibold">Leyendo tu analítica…</p>
      </div>
    )
  }

  if (paso.tipo === 'confirmar') {
    const { archivo, valores, lineas } = paso
    const detectados = parametros.filter((p) => p.id in valores)
    const aEnviar = detectados.flatMap((p) => {
      const v = leerNumero(valores[p.id])
      return v === undefined ? [] : [{ parametroId: p.id, valor: v }]
    })
    const enviar = async () => {
      const documento = { id: nuevoId('doc'), nombreArchivo: archivo.name }
      await guardarPdf(documento.id, archivo)
      actualizar((e) => registrarAnalitica(e, pacienteId, aEnviar, { origen: 'pdf_paciente', documento }))
      setPaso({ tipo: 'enviada' })
    }

    return (
      <div>
        <button onClick={() => setPaso({ tipo: 'elegir' })} className="mb-4 text-sm font-semibold text-gris hover:text-primario">
          ← Elegir otro archivo
        </button>
        <p className="flex items-center gap-2 text-sm text-gris">
          <FileText className="size-4" /> {archivo.name}
        </p>
        {detectados.length ? (
          <>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Revisa los valores</h1>
            <p className="mt-2 text-lg text-gris">Comprueba que coinciden con tu analítica. Puedes corregirlos si hace falta.</p>
            <div className="mt-6 space-y-3">
              {detectados.map((p) => (
                <Tarjeta key={p.id} className="!p-4">
                  <label className="block">
                    <span className="font-semibold">{p.nombre}</span>
                    <span className="mt-2 flex items-center gap-3">
                      <input
                        inputMode="decimal"
                        value={valores[p.id]}
                        onChange={(ev) => setPaso({ ...paso, valores: { ...valores, [p.id]: ev.target.value } })}
                        className={`${claseInput} max-w-36 text-lg font-bold`}
                      />
                      <span className="text-gris">{p.unidad}</span>
                    </span>
                  </label>
                  <p className="mt-2 truncate text-xs text-gris">En el PDF: «{lineas[p.id]}»</p>
                </Tarjeta>
              ))}
            </div>
            {detectados.length < parametros.length && (
              <p className="mt-3 text-sm text-gris">
                No aparecen: {parametros.filter((p) => !(p.id in valores)).map((p) => p.nombre).join(', ')}.
              </p>
            )}
            <div className="mt-6">
              <Boton icono={Send} chevron={false} disabled={!aEnviar.length} onClick={enviar}>
                Enviar a mi médico
              </Boton>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">No hemos encontrado los valores</h1>
            <p className="mt-2 text-lg text-gris">
              Este PDF no tiene los valores de tu seguimiento o no los hemos podido leer. Puedes enviarlo igualmente y tu médico lo revisará.
            </p>
            <div className="mt-6 space-y-3">
              <Boton icono={Send} chevron={false} onClick={enviar}>
                Enviar el PDF a mi médico
              </Boton>
              <Boton icono={Upload} variante="secundario" chevron={false} onClick={() => setPaso({ tipo: 'elegir' })}>
                Elegir otro archivo
              </Boton>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <Volver to="/paciente">Inicio</Volver>
      <h1 className="text-3xl font-bold tracking-tight">Subir una analítica</h1>
      <p className="mt-2 text-lg text-gris">Si te has hecho la analítica fuera del hospital, sube el PDF. Leeremos los valores y podrás revisarlos antes de enviarlos.</p>

      <input
        ref={entrada}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(ev) => {
          const archivo = ev.target.files?.[0]
          ev.target.value = ''
          if (archivo) leer(archivo)
        }}
      />
      <button
        onClick={() => entrada.current?.click()}
        className="mt-6 flex w-full flex-col items-center rounded-3xl border-2 border-dashed border-primario-borde bg-primario-suave/50 px-6 py-10 text-center hover:bg-primario-suave"
      >
        <FileSearch className="size-12 text-primario" strokeWidth={1.5} />
        <span className="mt-3 text-lg font-bold text-primario">Elegir el PDF</span>
        <span className="mt-1 text-sm text-gris">Máximo 10 MB</span>
      </button>
      {paso.error && <p className="mt-3 rounded-2xl bg-alta-suave p-4 text-sm font-semibold text-alta">{paso.error}</p>}

      <section className="mt-8">
        <h2 className="text-sm font-bold text-gris">Prototipo: prueba con un PDF de ejemplo</h2>
        <ul className="mt-2 space-y-2">
          {EJEMPLOS.map((ej) => (
            <li key={ej.archivo}>
              <button
                onClick={() => usarEjemplo(ej.archivo)}
                className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left ring-1 ring-gris-claro hover:ring-primario"
              >
                <FileText className="size-5 shrink-0 text-primario" />
                <span className="font-semibold">{ej.titulo}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
