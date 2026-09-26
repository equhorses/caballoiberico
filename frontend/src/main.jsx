import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import './styles.css'
import { AuthProvider } from './api.jsx'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Registry, { HorseDetail } from './pages/Registry.jsx'
import Valoracion from './pages/Valoracion.jsx'
import Gestiones from './pages/Gestiones.jsx'
import Laureados from './pages/Laureados.jsx'
import Reglamento from './pages/Reglamento.jsx'
import Verificar from './pages/Verificar.jsx'
import { Login, Register } from './pages/Auth.jsx'
import Panel from './pages/Panel.jsx'
import Evaluador from './pages/Evaluador.jsx'

function NotFound() {
  return <div className="wrap section center"><h2>Página no encontrada</h2><Link to="/" className="btn btn-ink mt24">Volver al inicio</Link></div>
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/registro" element={<Registry />} />
            <Route path="/registro/:number" element={<HorseDetail />} />
            <Route path="/valoracion" element={<Valoracion />} />
            <Route path="/gestiones" element={<Gestiones />} />
            <Route path="/laureados" element={<Laureados />} />
            <Route path="/reglamento" element={<Reglamento />} />
            <Route path="/verificar" element={<Verificar />} />
            <Route path="/acceder" element={<Login />} />
            <Route path="/alta" element={<Register />} />
            <Route path="/panel" element={<Panel />} />
            <Route path="/evaluador" element={<Evaluador />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
