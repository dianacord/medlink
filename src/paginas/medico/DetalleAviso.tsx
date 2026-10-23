import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Archive, CalendarCheck, ClipboardList, MessageSquareText, PhoneCall, SlidersHorizontal, UserRound } from 'lucide-react'
import { Boton } from '../../componentes/Boton'
import { EnlacePdf } from '../../componentes/EnlacePdf'
import { Grafico } from '../../componentes/Grafico'
import { Chip, EtiquetaPrioridad, Tarjeta, TituloSeccion, Volver } from '../../componentes/ui'
import { actualizar, useEstado } from '../../datos/almacen'
import {
  actualizacionesDe,
  decidir,
  decisionesDe,
  estadoAviso,
  estadoCita,
  paciente as buscarPaciente,
  seguimientoActual,
  type Estado,
} from '../../datos/modelo'
import { fechaConDia, fechaCorta, haceTiempo, hora, num } from '../../logica/formato'
import { citaRecomendada, CONTACTO, nombreCompleto, sexoTexto, ACCESIBILIDAD } from '../../logica/paciente'
import { chipsDe, fueraDeRango, objetivoTexto } from '../../logica/puntuacion'
import { aplicaPregunta } from '../../logica/preguntas'
import type { Aviso, Paciente, SeguimientoVersion, TipoCita } from '../../types'
import { ProgramarCita } from './ProgramarCita'

const ESTADO_CITA = {
  propuesta: 'Pendiente de respuesta del paciente',
  aceptada: 'Aceptada por el paciente',
  cambio_solicitado: 'El paciente pide cambiarla',
  realizada: 'Realizada',
}

function Cabecera({ p, seg }: { p: Paciente; seg?: SeguimientoVersion }) {
  const accesibilidad = ACCESIBILIDAD[p.accesibilidad]
  return (
    <Link to={`/medico/paciente/${p.id}`} className="flex items-center gap-3 rounded-2xl bg-primario-suave/60 p-3 hover:bg-primario-suave">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-primario">
        <UserRound className="size-5" />
      </span>
      <span className="min-w-0 flex-1 text-sm">
        <span className="block font-bold text-marino">{nombreCompleto(p)}</span>
        <span className="block text-gris">
          {p.edad} años · {sexoTexto(p)} · NHC {p.nhc} · {seg?.patologia}
        </span>
        <span className="block text-gris">
          Contacto preferido: {CONTACTO[p.preferenciaContacto]}
          {accesibilidad && ` · ${accesibilidad}`}
        </span>
      </span>
      <span className="text-sm font-semibold text-primario">Ver ficha</span>
    </Link>
  )
}

/** Parámetros que han provocado el aviso, con sus últimas mediciones. */
function QueHaCambiado({ estado, aviso, seg }: { estado: Estado; aviso: Aviso; seg: SeguimientoVersion }) {
  const ultima = actualizacionesDe(estado, aviso.id).at(-1)!
  const alterados = seg.parametros.filter((p) => ultima.motivos.some((m) => m.refId === p.id))
  const documentos = estado.documentos.filter((d) => d.pacienteId === aviso.pacienteId && d.subidoEn >= aviso.creadoEn)
  return (
    <Tarjeta>
      <TituloSeccion>Qué ha cambiado</TituloSeccion>
      <div className="flex flex-wrap gap-1.5">
        {chipsDe(ultima.motivos).map((c) => (
          <Chip key={c.texto} alarma={c.alarma}>
            {c.texto}
          </Chip>
        ))}
      </div>
      {documentos.length > 0 && (
        <ul className="mt-4 space-y-1.5 text-sm">
          {documentos.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-x-2">
              <EnlacePdf documentoId={d.id}>{d.nombreArchivo}</EnlacePdf>
              <span className="text-gris">
                · {d.origen === 'pdf_paciente' ? 'subido por el paciente' : 'laboratorio del hospital'}
                {!d.medicionIds.length && ' · no se ha detectado ningún parámetro'}
              </span>
            </li>
          ))}
        </ul>
      )}
      {alterados.length > 0 && (
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {alterados.map((p) => {
            const ms = estado.mediciones
              .filter((m) => m.pacienteId === aviso.pacienteId && m.parametroId === p.id)
              .sort((a, b) => a.fecha.localeCompare(b.fecha))
              .slice(-4)
            return (
              <div key={p.id}>
                <p className="font-semibold">
                  {p.nombre} <span className="font-normal text-gris">· objetivo {objetivoTexto(p)} {p.unidad}</span>
                </p>
                <Grafico puntos={ms} min={p.min} max={p.max} unidad={p.unidad} alto={90} />
                <ul className="mt-1 divide-y divide-gris-claro text-sm">
                  {[...ms].reverse().map((m) => (
                    <li key={m.id} className="flex justify-between py-1.5">
                      <span className="text-gris">{fechaCorta(m.fecha)}</span>
                      <span className={`font-semibold ${fueraDeRango(p, m.valor) ? 'text-alta' : ''}`}>
                        {num(m.valor)} {p.unidad}
                        {!m.verificado && <span className="ml-1 text-xs font-normal text-gris">(sin verificar)</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </Tarjeta>
  )
}

/** Última encuesta comparada con la anterior, más lo que el paciente ha escrito. */
function RespuestasPaciente({ estado, aviso, seg, p }: { estado: Estado; aviso: Aviso; seg: SeguimientoVersion; p: Paciente }) {
  const respuestas = estado.respuestas.filter((r) => r.pacienteId === p.id).sort((a, b) => a.fecha.localeCompare(b.fecha))
  const ultima = respuestas.at(-1)
  const anterior = respuestas.at(-2)
  const motivos = actualizacionesDe(estado, aviso.id).at(-1)!.motivos
  const peticiones = estado.peticiones.filter((x) => x.pacienteId === p.id && x.fecha >= aviso.creadoEn)
  const valor = (v: number | boolean | undefined, tipo: string, unidad?: string) =>
    v === undefined ? '—' : typeof v === 'boolean' ? (v ? 'Sí' : 'No') : `${v}${tipo === 'escala' ? '/10' : (unidad ?? '')}`

  return (
    <Tarjeta>
      <TituloSeccion>Respuestas del paciente</TituloSeccion>
      {!ultima ? (
        <p className="text-sm text-gris">Todavía no ha respondido ninguna encuesta.</p>
      ) : (
        <>
          <p className="mb-2 text-sm text-gris">
            Última encuesta: {fechaConDia(ultima.fecha)}
            {anterior && ` · comparada con la del ${fechaCorta(anterior.fecha)}`}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gris">
                  <th className="py-1.5 font-semibold">Pregunta</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Antes</th>
                  <th className="py-1.5 text-right font-semibold">Ahora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gris-claro">
                {seg.preguntas
                  .filter((q) => aplicaPregunta(q, p))
                  .map((q) => {
                    const destacada = motivos.some((m) => m.refId === q.id)
                    return (
                      <tr key={q.id} className={destacada ? 'font-semibold text-alta' : ''}>
                        <td className="py-2 pr-2">{q.tipo === 'si_no' ? q.texto : q.etiqueta}</td>
                        <td className="px-2 py-2 text-right whitespace-nowrap text-gris">{valor(anterior?.respuestas[q.id], q.tipo, q.unidad)}</td>
                        <td className="py-2 text-right whitespace-nowrap">{valor(ultima.respuestas[q.id], q.tipo, q.unidad)}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
          {ultima.textoLibre && (
            <blockquote className="mt-4 flex gap-2 rounded-2xl bg-primario-suave/60 p-4 text-sm">
              <MessageSquareText className="size-4 shrink-0 text-primario" />
              <span>«{ultima.textoLibre}»</span>
            </blockquote>
          )}
        </>
      )}
      {peticiones.map((x) => (
        <blockquote key={x.id} className="mt-3 rounded-2xl bg-media-suave p-4 text-sm">
          <p className="font-semibold text-media">Pide revisión · {haceTiempo(x.fecha)}</p>
          <p className="mt-1">«{x.texto}»</p>
        </blockquote>
      ))}
    </Tarjeta>
  )
}

function HistoriaAviso({ estado, aviso }: { estado: Estado; aviso: Aviso }) {
  const items = [
    ...actualizacionesDe(estado, aviso.id).map((a) => ({
      fecha: a.fecha,
      contenido: (
        <>
          <EtiquetaPrioridad prioridad={a.prioridad} />
          <span className="ml-2">{a.causa}</span>
        </>
      ),
    })),
    ...decisionesDe(estado, aviso.id).map((d) => ({
      fecha: d.fecha,
      contenido: (
        <span className="font-semibold">
          {d.tipo === 'archivar' ? 'Archivado' : d.tipo === 'cita_telefonica' ? 'Cita telefónica propuesta' : 'Cita presencial propuesta'} · {d.medico}
        </span>
      ),
    })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha))
  return (
    <Tarjeta>
      <TituloSeccion>Historia de este aviso</TituloSeccion>
      <ol className="space-y-3 border-l-2 border-primario-suave pl-4 text-sm">
        {items.map((it, i) => (
          <li key={i}>
            <p className="text-xs text-gris">
              {fechaCorta(it.fecha)} · {hora(it.fecha)}
            </p>
            <div className="mt-0.5">{it.contenido}</div>
          </li>
        ))}
      </ol>
    </Tarjeta>
  )
}

export default function DetalleAviso() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const estado = useEstado()
  const accionInicial = params.get('accion')
  const [abierto, setAbierto] = useState<TipoCita | null>(
    accionInicial === 'telefonica' || accionInicial === 'presencial' ? accionInicial : null,
  )

  const aviso = estado.avisos.find((a) => a.id === id)
  if (!aviso) return <Navigate to="/medico" replace />
  const p = buscarPaciente(estado, aviso.pacienteId)!
  const seg = seguimientoActual(estado, p.id)!
  const ultima = actualizacionesDe(estado, aviso.id).at(-1)!
  const situacion = estadoAviso(estado, aviso.id)
  const citaDecision = decisionesDe(estado, aviso.id).filter((d) => d.citaId).at(-1)
  const cita = citaDecision && estado.citas.find((c) => c.id === citaDecision.citaId)
  const recomendada = citaRecomendada(p)

  const proponer = (tipo: TipoCita) => (fechaHora: string) => {
    actualizar((e) => decidir(e, aviso.id, tipo === 'telefonica' ? 'cita_telefonica' : 'cita_presencial', { cita: { tipo, fechaHora } }))
    setAbierto(null)
  }
  const archivar = () => {
    actualizar((e) => decidir(e, aviso.id, 'archivar'))
    navigate('/medico', { state: { mensaje: `Aviso de ${nombreCompleto(p)} archivado.` } })
  }

  return (
    <div>
      <Volver to="/medico">Avisos</Volver>
      <div className="flex flex-wrap items-center gap-2">
        <EtiquetaPrioridad prioridad={ultima.prioridad} />
        <span className="text-sm text-gris">
          Recibido {haceTiempo(aviso.creadoEn)}
          {ultima.fecha !== aviso.creadoEn && ` · actualizado ${haceTiempo(ultima.fecha)}`}
        </span>
      </div>
      <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{ultima.titulo}</h1>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="space-y-5">
          <Cabecera p={p} seg={seg} />
          <QueHaCambiado estado={estado} aviso={aviso} seg={seg} />
          <RespuestasPaciente estado={estado} aviso={aviso} seg={seg} p={p} />
          <HistoriaAviso estado={estado} aviso={aviso} />
        </div>

        <aside className="space-y-3 lg:sticky lg:top-6">
          {cita && (
            <Tarjeta className="!bg-primario-suave/60">
              <p className="flex items-center gap-2 text-sm font-bold text-primario">
                <CalendarCheck className="size-4" />
                {cita.tipo === 'telefonica' ? 'Cita telefónica' : 'Cita presencial'}
              </p>
              <p className="mt-1 font-semibold first-letter:uppercase">
                {fechaConDia(cita.fechaHora)} · {hora(cita.fechaHora)}
              </p>
              <p className="text-sm text-gris">{ESTADO_CITA[estadoCita(estado, cita.id)]}</p>
              {cita.tipo === 'telefonica' && estadoCita(estado, cita.id) !== 'realizada' && (
                <div className="mt-3">
                  <Boton icono={PhoneCall} compacto chevron to={`/medico/cita/${cita.id}/resultado`}>
                    Registrar resultado de la llamada
                  </Boton>
                </div>
              )}
            </Tarjeta>
          )}

          {situacion === 'archivado' ? (
            <Tarjeta>
              <p className="flex items-center gap-2 font-semibold">
                <Archive className="size-5 text-gris" />
                Aviso archivado
              </p>
              <p className="mt-1 text-sm text-gris">{fechaConDia(decisionesDe(estado, aviso.id).at(-1)!.fecha)}</p>
            </Tarjeta>
          ) : (
            <>
              <p className="pt-1 text-sm font-semibold text-gris">¿Cómo quieres seguir?</p>
              {(['telefonica', 'presencial'] as const).map((tipo) => (
                <ProgramarCita
                  key={tipo}
                  tipo={tipo}
                  abierto={abierto === tipo}
                  recomendada={recomendada?.tipo === tipo ? recomendada.motivo : undefined}
                  onAbrir={() => setAbierto(tipo)}
                  onProponer={proponer(tipo)}
                />
              ))}
              <Boton icono={Archive} variante="suave" chevron={false} onClick={archivar}>
                Archivar
              </Boton>
              <Boton icono={SlidersHorizontal} variante="suave" to={`/medico/paciente/${p.id}/seguimiento`}>
                Ajustar seguimiento
              </Boton>
            </>
          )}
          <Boton icono={ClipboardList} variante="suave" to={`/medico/paciente/${p.id}`}>
            Ficha del paciente
          </Boton>
        </aside>
      </div>
    </div>
  )
}
