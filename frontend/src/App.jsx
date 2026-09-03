import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from './store.js'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import HorseRegister from './pages/HorseRegister.jsx'
import HorseDetail from './pages/HorseDetail.jsx'
import Ranking from './pages/Ranking.jsx'
import Admin from './pages/Admin.jsx'

function Navbar() {
  const { isAuth, user, logout } = useAuthStore()
  const nav = useNavigate()

  return (
    <nav style={{
      background: '#fff', borderBottom: '1px solid #e5e5e5', padding: '0 24px',
      position: 'sticky', top: 0, zIndex: 100
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#D4A017', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>C</div>
          <span style={{ fontSize: 20, fontWeight: 600, color: '#111' }}>C-IBERICO</span>
        </Link>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link to="/ranking" style={{ color: '#555', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Ranking</Link>
          <Link to="/caballos" style={{ color: '#555', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Caballos</Link>
          {isAuth ? (
            <>
              <Link to="/dashboard" style={{ color: '#555', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Mi cuenta</Link>
              {user?.role === 'ADMIN' && <Link to="/admin" style={{ color: '#D4A017', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Admin</Link>}
              <button onClick={() => { logout(); nav('/'); }} style={{ background: 'none', border: '1px solid #ddd', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Salir</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: '#555', textDecoration: 'none', fontSize: 14 }}>Entrar</Link>
              <Link to="/registro" style={{ background: '#111', color: '#fff', padding: '8px 16px', borderRadius: 6, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Registrarse</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/registrar-caballo" element={<HorseRegister />} />
          <Route path="/caballo/:id" element={<HorseDetail />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <footer style={{ background: '#111', color: '#888', padding: '40px 24px', textAlign: 'center', fontSize: 13 }}>
        <p>© 2026 C-IBERICO Iberian Sport Horses · El Puerto de Santa María, España</p>
        <p style={{ marginTop: 8 }}>Certificado de origen y calidad del caballo ibérico · Gestión 100% online</p>
      </footer>
    </div>
  )
}
