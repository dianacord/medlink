import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleCheck, House, Send } from 'lucide-react'
import { Boton } from '../../componentes/Boton'
import { Volver } from '../../componentes/ui'
import { actualizar } from '../../datos/almacen'
import { pedirRevision } from '../../datos/modelo'
import { useUsuario } from '../../datos/sesion'

export default function PedirRevision() {
  const usuario = useUsuario()
  const navigate = useNavigate()
  const [texto, setTexto] = useState('')
  const [enviada, setEnviada] = useState(false)

  const enviar = () => {
    let alarma = false
    actualizar((e) => {
      const r = pedirRevision(e, usuario!.pacienteId!, texto)
      alarma = r.alarma
      return r.estado
    })
    if (alarma) navigate('/paciente/urgencias', { replace: true })
    else setEnviada(true)
  }

  if (enviada) {
    return (
      <div className="pt-6 text-center">
        <CircleCheck className="mx-auto size-16 text-baja" strokeWidth={1.5} />
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Petición enviada</h1>
        <p className="mx-auto mt-3 max-w-xs text-lg text-gris">Tu médico la revisará. Si necesita hablar contigo, te propondrá una cita aquí.</p>
        <div className="mt-8">
          <Boton icono={House} to="/paciente">
            Volver al inicio
          </Boton>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Volver to="/paciente">Inicio</Volver>
      <h1 className="text-3xl font-bold tracking-tight">Pedir que me revisen</h1>
      <p className="mt-2 text-lg text-gris">Cuéntale a tu médico por qué quieres que revise tu caso.</p>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={6}
        placeholder="Por ejemplo: desde hace unos días voy más al baño y me noto más cansada…"
        className="mt-6 w-full rounded-[20px] border border-gris-claro bg-white p-4 text-lg outline-none focus:border-primario focus:ring-2 focus:ring-primario/20"
      />
      <p className="mt-3 rounded-2xl bg-alta-suave p-4 text-sm text-alta">
        Si te encuentras muy mal, no esperes: acude a Urgencias o llama al 112.
      </p>
      <div className="mt-4">
        <Boton icono={Send} chevron={false} disabled={!texto.trim()} onClick={enviar}>
          Enviar petición
        </Boton>
      </div>
    </div>
  )
}
