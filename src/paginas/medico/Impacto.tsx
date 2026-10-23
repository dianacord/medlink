import { useState, type CSSProperties } from 'react'
import { CalendarCheck, Clock, Hourglass, PhoneCall, Database } from 'lucide-react'
import impactoJson from '../../../data/impacto.json'
import { Pestanas, Tarjeta } from '../../componentes/ui'
import { useEstado } from '../../datos/almacen'
import { avisoAbierto, estadoAviso, seguimientoActual, type Estado } from '../../datos/modelo'
import { fechaCorta } from '../../logica/formato'
import type { Impacto as DatosImpacto } from '../../types'

const IMPACTO = impactoJson as DatosImpacto
const SEMANAS = (IMPACTO.periodo.meses * 52) / 12

type Ambito = 'digestivo' | 'hospital'

const entero = (n: number) => Math.round(n).toLocaleString('es-ES')

/** Avisos cerrados sin consulta presencial: el médico archivó o resolvió por teléfono. */
function presencialesEvitadas(e: Estado) {
  return e.avisos.filter(
    (a) => estadoAviso(e, a.id) === 'archivado' && !e.citas.some((c) => c.avisoId === a.id && c.tipo === 'presencial'),
  ).length
}

function enVerde(e: Estado) {
  return e.pacientes.filter((p) => {
    const seg = seguimientoActual(e, p.id)
    return seg?.activo && !avisoAbierto(e, seg.seguimientoId)
  }).length
}

function Dato({ icono: Icono, etiqueta, valor, nota }: { icono: typeof Clock; etiqueta: string; valor: string; nota: string }) {
  return (
    <Tarjeta>
      <p className="flex items-center gap-2 text-sm font-semibold text-gris">
        <Icono className="size-4 text-primario" /> {etiqueta}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{valor}</p>
      <p className="mt-1 text-sm text-gris">{nota}</p>
    </Tarjeta>
  )
}

export default function Impacto() {
  const estado = useEstado()
  const [ambito, setAmbito] = useState<Ambito>('digestivo')
  const [porcentaje, setPorcentaje] = useState(20)
  const d = IMPACTO[ambito]

  const liberadas = d.revisionesRealizadas * (porcentaje / 100)
  const horas = (liberadas * IMPACTO.minutosPorConsulta) / 60
  const porSemana = liberadas / SEMANAS
  const semanasListaEspera = d.derivacionesPendientes / porSemana
  const noRealizadas = d.revisionesNoRealizadas / d.revisionesTotales
  const nombre = ambito === 'digestivo' ? 'Aparato Digestivo' : 'todo el hospital'

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Impacto</h1>
      <p className="mt-1 text-gris">Qué supondría pasar parte de las revisiones a seguimiento remoto.</p>

      <div className="mt-6 max-w-md">
        <Pestanas<Ambito>
          opciones={[
            { valor: 'digestivo', texto: 'Aparato Digestivo' },
            { valor: 'hospital', texto: 'Todo el hospital' },
          ]}
          valor={ambito}
          onCambio={setAmbito}
        />
      </div>

      <Tarjeta className="mt-5">
        <label htmlFor="porcentaje" className="flex items-baseline justify-between gap-3">
          <span className="font-semibold">Revisiones que pasan a seguimiento remoto</span>
          <span className="shrink-0 text-2xl font-bold whitespace-nowrap text-primario">{porcentaje} %</span>
        </label>
        <input
          id="porcentaje"
          type="range"
          min={5}
          max={50}
          step={5}
          value={porcentaje}
          onChange={(ev) => setPorcentaje(Number(ev.target.value))}
          className="deslizador mt-4 w-full"
          style={{ '--progreso': `${((porcentaje - 5) / 45) * 100}%` } as CSSProperties}
        />
        <div className="mt-6 border-t border-gris-claro pt-5">
          <p className="text-sm font-semibold text-gris">Consultas presenciales liberadas en {IMPACTO.periodo.meses} meses</p>
          <p className="mt-1 text-6xl font-bold tracking-tight text-marino">{entero(liberadas)}</p>
          <p className="mt-1 text-gris">
            de {entero(d.revisionesRealizadas)} revisiones realizadas en {nombre}
          </p>
        </div>
      </Tarjeta>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Dato icono={Clock} etiqueta="Horas de consulta" valor={`${entero(horas)} h`} nota={`a ${IMPACTO.minutosPorConsulta} min por revisión`} />
        <Dato icono={CalendarCheck} etiqueta="Huecos libres por semana" valor={entero(porSemana)} nota="para primeras consultas o casos que lo necesitan" />
        <Dato
          icono={Hourglass}
          etiqueta="Lista de espera"
          valor={`${entero(Math.max(1, semanasListaEspera))} sem.`}
          nota={`para absorber las ${entero(d.derivacionesPendientes)} derivaciones pendientes con esos huecos`}
        />
      </div>

      <Tarjeta className="mt-5 !bg-primario-suave/60">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <PhoneCall className="size-5 text-primario" /> En esta demo
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-5xl font-bold tracking-tight text-primario">{presencialesEvitadas(estado)}</p>
            <p className="mt-1 text-sm text-gris">consultas presenciales evitadas (avisos resueltos sin cita en consulta)</p>
          </div>
          <div>
            <p className="text-5xl font-bold tracking-tight text-baja">{enVerde(estado)}</p>
            <p className="mt-1 text-sm text-gris">pacientes en verde que no han necesitado consulta</p>
          </div>
        </div>
      </Tarjeta>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Database className="size-5 text-primario" /> Datos de partida · {nombre}
        </h2>
        <table className="mt-3 w-full max-w-xl text-sm">
          <tbody className="divide-y divide-gris-claro">
            {[
              ['Revisiones programadas', entero(d.revisionesTotales)],
              ['Revisiones realizadas', entero(d.revisionesRealizadas)],
              ['Revisiones no realizadas', `${entero(d.revisionesNoRealizadas)} (${Math.round(noRealizadas * 100)} %)`],
              ['Demora mediana hasta la primera consulta', `${d.demoraMedianaPrimeraDias} días`],
              ['Derivaciones pendientes', entero(d.derivacionesPendientes)],
            ].map(([k, v]) => (
              <tr key={k}>
                <td className="py-2 text-gris">{k}</td>
                <td className="py-2 pl-3 text-right font-semibold whitespace-nowrap tabular-nums">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 max-w-xl text-xs text-gris">
          Datos de actividad del hackathon (sintéticos), del {fechaCorta(IMPACTO.periodo.desde)} al {fechaCorta(IMPACTO.periodo.hasta)}{' '}
          {IMPACTO.periodo.hasta.slice(0, 4)}. Estimación orientativa: supone que cada revisión remota sustituye a una presencial de {IMPACTO.minutosPorConsulta}{' '}
          minutos.
        </p>
      </section>
    </div>
  )
}
