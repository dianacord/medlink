const numero = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 })

/** 620 → "620", 13.9 → "13,9" */
export const num = (n: number) => numero.format(n)

/** Con signo: 530 → "+530", -1.5 → "−1,5" */
export const numConSigno = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + numero.format(Math.abs(n))

/** "julio" */
export const mes = (iso: string) => new Date(iso).toLocaleDateString('es-ES', { month: 'long' })

/** "23 oct" */
export const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '')

/** "23 de octubre de 2026" */
export const fechaLarga = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

/** "jueves, 23 de octubre" */
export const fechaConDia = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

/** "10:30" */
export const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

export const DIA_MS = 24 * 60 * 60 * 1000

export const sumarDias = (iso: string, dias: number) => new Date(new Date(iso).getTime() + dias * DIA_MS).toISOString()

/** Minúsculas y sin tildes, para comparar textos. */
export const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
