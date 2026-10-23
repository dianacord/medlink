import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LayoutMedico, LayoutPaciente, RutaProtegida } from './componentes/Layouts'
import Bienvenida from './paginas/comun/Bienvenida'
import Login from './paginas/comun/Login'
import EnConstruccion from './paginas/comun/EnConstruccion'

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
          <Route index element={<EnConstruccion titulo="Avisos" />} />
          <Route path="aviso/:id" element={<EnConstruccion titulo="Detalle del aviso" />} />
          <Route path="buscar" element={<EnConstruccion titulo="Pacientes" />} />
          <Route path="paciente/:id" element={<EnConstruccion titulo="Ficha del paciente" />} />
          <Route path="paciente/:id/seguimiento" element={<EnConstruccion titulo="Seguimiento" />} />
          <Route path="cita/:id/resultado" element={<EnConstruccion titulo="Resultado de la llamada" />} />
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
