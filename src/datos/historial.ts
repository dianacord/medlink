// Línea de tiempo de todo lo que ha pasado con un paciente. Solo la ve el médico.

import type { Prioridad, RespuestaEncuesta, SeguimientoVersion } from '../types'
import { periodosEncuesta } from '../logica/calendario'
import { num } from '../logica/formato'
import { chipsDe } from '../logica/puntuacion'
import { citasDe, eventosDeCita, seguimientoActual, versionesSeguimiento, type Estado } from './modelo'

export type TipoEntrada =
  | 'seguimiento'
  | 'analitica'
  | 'encuesta'
  | 'encuesta_sin_responder'
  | 'aviso'
  | 'decision'
  | 'cita'
  | 'peticion'

export interface EntradaHistorial {
  fecha: string
  tipo: TipoEntrada
  titulo: string
  detalle: string[]
  prioridad?: Prioridad
  enlace?: string
  /** PDF de la analítica, si lo hay. */
  documento?: { id: string; nombre: string }
}

const ORIGEN = {
  laboratorio_hospital: 'Laboratorio del hospital',
  pdf_paciente: 'PDF subido por el paciente',
  paciente: 'Introducida por el paciente',
  historico: 'Laboratorio del hospital',
  demo: 'Simulación del demo',
}

/** Respuestas de una encuesta en una línea: "Deposiciones 2/día · Urgencia 1/10 · Sangre en heces". */
export function resumenRespuestas(r: RespuestaEncuesta, seg: SeguimientoVersion | undefined): string {
  if (!seg) return ''
  const partes: string[] = []
  for (const q of seg.preguntas) {
    const v = r.respuestas[q.id]
    if (v === undefined) continue
    if (typeof v === 'number') partes.push(`${q.etiqueta} ${v}${q.tipo === 'escala' ? '/10' : (q.unidad ?? '')}`)
    else if (v === q.respuestaAlerta) partes.push(q.etiqueta)
  }
  return partes.join(' · ')
}

export function historialPaciente(e: Estado, pacienteId: string, ahora = Date.now()): EntradaHistorial[] {
  const entradas: EntradaHistorial[] = []
  const seg = seguimientoActual(e, pacienteId, ahora)
  const versiones = seg ? versionesSeguimiento(e, seg.seguimientoId) : []
  const parametro = (id: string) => versiones.flatMap((v) => v.parametros).find((p) => p.id === id)

  for (const v of versiones) {
    entradas.push({
      fecha: v.creadoEn,
      tipo: 'seguimiento',
      titulo: v.version === 1 ? `Seguimiento activado · ${v.creadoPor}` : `Seguimiento ajustado (versión ${v.version}) · ${v.creadoPor}`,
      detalle: v.cambios,
    })
  }

  // Analíticas: las mediciones del mismo momento y origen forman una analítica.
  const grupos = new Map<string, typeof e.mediciones>()
  for (const m of e.mediciones.filter((m) => m.pacienteId === pacienteId)) {
    const clave = `${m.fecha}|${m.origen}|${m.documentoId ?? ''}`
    grupos.set(clave, [...(grupos.get(clave) ?? []), m])
  }
  for (const ms of grupos.values()) {
    const documento = e.documentos.find((d) => d.id === ms[0].documentoId)
    entradas.push({
      fecha: ms[0].fecha,
      tipo: 'analitica',
      titulo: `Analítica · ${ORIGEN[ms[0].origen]}`,
      documento: documento && { id: documento.id, nombre: documento.nombreArchivo },
      detalle: [
        ...ms.map((m) => {
          const p = parametro(m.parametroId)
          return `${p?.nombre ?? m.parametroId} ${num(m.valor)} ${p?.unidad ?? ''}${m.verificado ? '' : ' (sin verificar)'}`
        }),
      ],
    })
  }

  for (const d of e.documentos.filter((d) => d.pacienteId === pacienteId && !d.medicionIds.length)) {
    entradas.push({
      fecha: d.subidoEn,
      tipo: 'analitica',
      titulo: `Analítica · ${ORIGEN[d.origen]}`,
      documento: { id: d.id, nombre: d.nombreArchivo },
      detalle: ['No se ha detectado ningún parámetro'],
    })
  }

  for (const r of e.respuestas.filter((r) => r.pacienteId === pacienteId)) {
    entradas.push({
      fecha: r.fecha,
      tipo: 'encuesta',
      titulo: 'Encuesta respondida',
      detalle: [resumenRespuestas(r, seg), ...(r.textoLibre ? [`«${r.textoLibre}»`] : [])].filter(Boolean),
    })
  }

  if (seg) {
    const respuestas = e.respuestas.filter((r) => r.pacienteId === pacienteId)
    for (const p of periodosEncuesta(seg, respuestas, ahora)) {
      if (p.hasta <= ahora && !p.respondida) {
        entradas.push({ fecha: new Date(p.hasta).toISOString(), tipo: 'encuesta_sin_responder', titulo: 'Encuesta sin responder', detalle: [] })
      }
    }
  }

  for (const p of e.peticiones.filter((p) => p.pacienteId === pacienteId)) {
    entradas.push({ fecha: p.fecha, tipo: 'peticion', titulo: 'El paciente pide revisión', detalle: [`«${p.texto}»`] })
  }

  for (const aviso of e.avisos.filter((a) => a.pacienteId === pacienteId)) {
    for (const act of e.actualizaciones.filter((a) => a.avisoId === aviso.id)) {
      entradas.push({
        fecha: act.fecha,
        tipo: 'aviso',
        titulo: act.titulo,
        detalle: [act.causa, ...chipsDe(act.motivos).map((c) => c.texto)],
        prioridad: act.prioridad,
        enlace: `/medico/aviso/${aviso.id}`,
      })
    }
    for (const d of e.decisiones.filter((d) => d.avisoId === aviso.id)) {
      const cita = e.citas.find((c) => c.id === d.citaId)
      entradas.push({
        fecha: d.fecha,
        tipo: 'decision',
        titulo:
          d.tipo === 'archivar' ? `Aviso archivado · ${d.medico}` : `Cita ${d.tipo === 'cita_telefonica' ? 'telefónica' : 'presencial'} propuesta · ${d.medico}`,
        detalle: cita ? [`Para el ${new Date(cita.fechaHora).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}`] : [],
        enlace: `/medico/aviso/${aviso.id}`,
      })
    }
  }

  const RESULTADO = { estable: 'Estable', ajustar: 'Ajustar seguimiento', grave: 'Grave: necesita cita presencial' }
  for (const cita of citasDe(e, pacienteId)) {
    for (const ev of eventosDeCita(e, cita.id)) {
      entradas.push({
        fecha: ev.fecha,
        tipo: 'cita',
        titulo:
          ev.tipo === 'aceptada'
            ? 'El paciente acepta la cita'
            : ev.tipo === 'cambio_solicitado'
              ? 'El paciente pide cambiar la cita'
              : `Resultado de la llamada: ${RESULTADO[ev.resultado!]}`,
        detalle: [],
      })
    }
  }

  return entradas.sort((a, b) => b.fecha.localeCompare(a.fecha))
}
