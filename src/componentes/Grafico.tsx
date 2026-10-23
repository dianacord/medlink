import { fechaCorta, num } from '../logica/formato'

interface Punto {
  fecha: string
  valor: number
}

interface Props {
  puntos: Punto[]
  min?: number
  max?: number
  unidad?: string
  /** Altura en px del área de dibujo. */
  alto?: number
}

const ANCHO = 320
const MARGEN = { izq: 8, der: 8, arriba: 22, abajo: 22 }

/**
 * Gráfico de línea sencillo. La franja azul es el rango objetivo;
 * los puntos fuera de rango van en rojo.
 */
export function Grafico({ puntos, min, max, unidad = '', alto = 120 }: Props) {
  if (!puntos.length) return <p className="text-sm text-gris">Sin datos todavía.</p>
  const ordenados = [...puntos].sort((a, b) => a.fecha.localeCompare(b.fecha))
  const valores = ordenados.map((p) => p.valor)
  const limites = [...valores, ...(min !== undefined ? [min] : []), ...(max !== undefined ? [max] : [])]
  let bajo = Math.min(...limites)
  let altoV = Math.max(...limites)
  const holgura = (altoV - bajo || Math.abs(altoV) || 1) * 0.15
  bajo -= holgura
  altoV += holgura

  const H = alto + MARGEN.arriba + MARGEN.abajo
  const x = (i: number) =>
    ordenados.length === 1 ? ANCHO / 2 : MARGEN.izq + 14 + (i * (ANCHO - MARGEN.izq - MARGEN.der - 28)) / (ordenados.length - 1)
  const y = (v: number) => MARGEN.arriba + ((altoV - v) / (altoV - bajo)) * alto
  const fuera = (v: number) => (min !== undefined && v < min) || (max !== undefined && v >= max)
  const yMin = min !== undefined ? y(min) : MARGEN.arriba + alto
  const yMax = max !== undefined ? y(max) : MARGEN.arriba

  return (
    <svg viewBox={`0 0 ${ANCHO} ${H}`} className="w-full" role="img" aria-label={`Evolución: ${valores.map(num).join(', ')} ${unidad}`}>
      {(min !== undefined || max !== undefined) && (
        <rect x={MARGEN.izq} y={yMax} width={ANCHO - MARGEN.izq - MARGEN.der} height={Math.max(0, yMin - yMax)} rx="6" fill="#eef5fd" />
      )}
      {max !== undefined && <line x1={MARGEN.izq} x2={ANCHO - MARGEN.der} y1={yMax} y2={yMax} stroke="#cfe2f7" strokeDasharray="4 4" />}
      {min !== undefined && <line x1={MARGEN.izq} x2={ANCHO - MARGEN.der} y1={yMin} y2={yMin} stroke="#cfe2f7" strokeDasharray="4 4" />}
      <polyline
        points={ordenados.map((p, i) => `${x(i)},${y(p.valor)}`).join(' ')}
        fill="none"
        stroke="#4a90d9"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {ordenados.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.valor)} r="5" fill={fuera(p.valor) ? '#c2412d' : '#4a90d9'} stroke="#fff" strokeWidth="2" />
          {(ordenados.length <= 8 || i === ordenados.length - 1 || (i % 3 === 0 && ordenados.length - 1 - i >= 2)) && (
            <>
              <text x={x(i)} y={y(p.valor) - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill={fuera(p.valor) ? '#c2412d' : '#13213c'}>
                {num(p.valor)}
              </text>
              <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#7b8794">
                {fechaCorta(p.fecha)}
              </text>
            </>
          )}
        </g>
      ))}
    </svg>
  )
}
