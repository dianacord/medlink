import type { Prioridad } from '../types'

export const PRIORIDAD: Record<Prioridad, { texto: string; clases: string; punto: string; orden: number }> = {
  alta: { texto: 'Prioridad alta', clases: 'bg-alta-suave text-alta', punto: 'bg-alta', orden: 0 },
  media: { texto: 'Prioridad media', clases: 'bg-media-suave text-media', punto: 'bg-media', orden: 1 },
  baja: { texto: 'Prioridad baja', clases: 'bg-baja-suave text-baja', punto: 'bg-baja', orden: 2 },
}

export const claseInput =
  'h-12 w-full rounded-xl border border-gris-claro bg-white px-3 text-base outline-none focus:border-primario focus:ring-2 focus:ring-primario/20'
