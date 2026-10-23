import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LayoutMedico, LayoutPaciente, RutaProtegida } from './componentes/Layouts'
import Bienvenida from './paginas/comun/Bienvenida'
import Demo from './paginas/comun/Demo'
import Login from './paginas/comun/Login'
import Bandeja from './paginas/medico/Bandeja'
import Buscar from './paginas/medico/Buscar'
import DetalleAviso from './paginas/medico/DetalleAviso'
import EditarSeguimiento from './paginas/medico/EditarSeguimiento'
import Ficha from './paginas/medico/Ficha'
import Impacto from './paginas/medico/Impacto'
import ResultadoLlamada from './paginas/medico/ResultadoLlamada'
import Citas from './paginas/paciente/Citas'
import Encuesta from './paginas/paciente/Encuesta'
import Inicio from './paginas/paciente/Inicio'
import PedirRevision from './paginas/paciente/PedirRevision'
import SubirAnalitica from './paginas/paciente/SubirAnalitica'
import Urgencias from './paginas/paciente/Urgencias'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Bienvenida />} />
        <Route path="/login/:rol" element={<Login />} />
        <Route path="/demo" element={<Demo />} />

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
          <Route path="impacto" element={<Impacto />} />
        </Route>

        <Route
          path="/paciente"
          element={
            <RutaProtegida rol="paciente">
              <LayoutPaciente />
            </RutaProtegida>
          }
        >
          <Route index element={<Inicio />} />
          <Route path="encuesta" element={<Encuesta />} />
          <Route path="citas" element={<Citas />} />
          <Route path="analitica" element={<SubirAnalitica />} />
          <Route path="revision" element={<PedirRevision />} />
        </Route>

        <Route
          path="/paciente/urgencias"
          element={
            <RutaProtegida rol="paciente">
              <Urgencias />
            </RutaProtegida>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
