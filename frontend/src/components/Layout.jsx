import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../api.jsx'
import { CONTACT } from '../data/content.js'
import { Logo } from './ui.jsx'

const NAV = [
  ['/registro', 'Registro'],
  ['/valoracion', 'Valoración IA'],
  ['/gestiones', 'Gestiones'],
  ['/laureados', 'Laureados'],
  ['/reglamento', 'Reglamento'],
]

function Header() {
  const { user, logout, isStaff } = useAuth()
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const loc = useLocation()
  useEffect(() => setOpen(false), [loc.pathname])

  const account = user
    ? <>
        <Link className="btn btn-gold" to={isStaff ? '/evaluador' : '/panel'}>{isStaff ? 'Panel evaluador' : 'Mi panel'}</Link>
        <button className="btn btn-line-light" onClick={() => { logout(); nav('/') }}>Salir</button>
      </>
    : <Link className="btn btn-gold" to="/acceder">Acceder</Link>

  return (
    <header className="header">
      <div className="wrap">
        <Link to="/" className="brand" aria-label="C-IBERICO, inicio">
          <Logo />
          <span>
            <div className="brand-name">C–IBERICO</div>
            <div className="brand-sub">IBERIAN HORSES</div>
          </span>
        </Link>
        <nav className="nav" aria-label="Principal">
          {NAV.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
        </nav>
        <div className="header-cta">
          <Link className="btn btn-line-light" to="/verificar">Verificar certificado</Link>
          {account}
        </div>
        <button className="burger" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menú">{open ? '✕' : '☰'}</button>
      </div>
      {open && (
        <div className="mobile-nav">
          {NAV.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
          <Link to="/verificar">Verificar certificado</Link>
          <div className="row">{account}</div>
        </div>
      )}
    </header>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="cols">
          <div>
            <Link to="/" className="brand"><Logo /><span><div className="brand-name">C–IBERICO</div><div className="brand-sub">IBERIAN HORSES</div></span></Link>
            <p className="mt24">Certificado privado de origen y calidad del caballo ibérico deportivo. Gestión privada, internacional y enteramente digital.</p>
            <p className="mt16 small" style={{ color: 'rgba(255,255,255,.55)' }}>C-IBERICO no es un libro genealógico oficial ni está avalado por ningún organismo público.</p>
          </div>
          <div>
            <h4>Registro</h4>
            <Link to="/registro">Registro C-IBERICO</Link>
            <Link to="/laureados">Lista Laureada Ámbar</Link>
            <Link to="/reglamento">PRE y PSL</Link>
            <Link to="/verificar">Verificar certificado</Link>
          </div>
          <div>
            <h4>Gestiones</h4>
            <Link to="/gestiones#origen">Certificado de Origen</Link>
            <Link to="/gestiones#calidad">Certificado de Calidad</Link>
            <Link to="/gestiones#titularidad">Cambio de titularidad</Link>
            <Link to="/valoracion">Valoración con IA</Link>
          </div>
          <div>
            <h4>Presidencia</h4>
            <p>{CONTACT.place}</p>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>{CONTACT.phone}</a>
            <Link to="/gestiones#yeguada">Yeguadas asociadas</Link>
          </div>
        </div>
        <div className="bottom">
          <span>© {new Date().getFullYear()} C-IBERICO. Certificado privado, gestión no asociativa.</span>
          <span>Razas admitidas: PRE · PSL y cruces · Referencia: reglamento de doma clásica</span>
        </div>
      </div>
    </footer>
  )
}

export default function Layout() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) { setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); return }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return (
    <>
      <Header />
      <main><Outlet /></main>
      <Footer />
    </>
  )
}
