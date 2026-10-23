import { useState } from 'react'
import { FileText } from 'lucide-react'
import { abrirPdf } from '../datos/pdf'

/** Abre un PDF de analítica guardado en este navegador. */
export function EnlacePdf({ documentoId, children }: { documentoId: string; children: string }) {
  const [noDisponible, setNoDisponible] = useState(false)
  if (noDisponible) return <span className="text-xs text-gris">{children} (archivo no disponible en este navegador)</span>
  return (
    <button
      onClick={async () => setNoDisponible(!(await abrirPdf(documentoId)))}
      className="inline-flex items-center gap-1.5 font-semibold text-primario hover:underline"
    >
      <FileText className="size-4 shrink-0" />
      {children}
    </button>
  )
}
