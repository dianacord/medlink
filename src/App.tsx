import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LayoutMedico, LayoutPaciente, RutaProtegida } from './componentes/Layouts'
import Bienvenida from './paginas/comun/Bienvenida'
import Login from './paginas/comun/Login'
import EnConstruccion from './paginas/comun/EnConstruccion'
import Bandeja from './paginas/medico/Bandeja'
import Buscar from './paginas/medico/Buscar'
import DetalleAviso from './paginas/medico/DetalleAviso'
import EditarSeguimiento from './paginas/medico/EditarSeguimiento'
import Ficha from './paginas/medico/Ficha'
import ResultadoLlamada from './paginas/medico/ResultadoLlamada'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Bienvenida />} />
        <Route path="/login/:rol" element={<Login />} />

        <Route
          path="/medico"
          element={
            <RutaProtegida rol="medico">
              <LayoutMedico />
            </RutaProtegida>
          }
        >
          <Route index element={<Bandeja />} />
          <Route path="aviso/:id" element={<DetalleAviso />} />
          <Route path="buscar" element={<Buscar />} />
          <Route path="paciente/:id" element={<Ficha />} />
          <Route path="paciente/:id/seguimiento" element={<EditarSeguimiento />} />
          <Route path="cita/:id/resultado" element={<ResultadoLlamada />} />
          <Route path="impacto" element={<EnConstruccion titulo="Impacto" />} />
        </Route>

        <Route
          path="/paciente"
          element={
            <RutaProtegida rol="paciente">
              <LayoutPaciente />
            </RutaProtegida>
          }
        >
          <Route index element={<EnConstruccion titulo="Mi seguimiento" />} />
          <Route path="encuesta" element={<EnConstruccion titulo="Encuesta" />} />
          <Route path="citas" element={<EnConstruccion titulo="Mis citas" />} />
          <Route path="analitica" element={<EnConstruccion titulo="Subir analítica" />} />
          <Route path="revision" element={<EnConstruccion titulo="Pedir revisión" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
