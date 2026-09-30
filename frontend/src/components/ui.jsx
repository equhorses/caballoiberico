import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fileUrl } from '../api.jsx'
import { BREEDS, ROMAN } from '../data/content.js'

// Imagen con respaldo: si el archivo no existe todavía, muestra un marcador elegante
export function Img({ src, alt, dark, label, style, className }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return <div className={`placeholder ${dark ? 'dark' : ''} ${className || ''}`} style={style} role="img" aria-label={alt}>{label || alt}</div>
  }
  return <img src={src.startsWith('/uploads') ? fileUrl(src) : src} alt={alt} onError={() => setFailed(true)} style={style} className={className} loading="lazy" />
}

export function Logo({ size = 46 }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className="brand-mark" style={{ width: size, height: size }}>
      {failed ? (
        <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
          <circle cx="32" cy="32" r="26" fill="none" stroke="#9a6a12" strokeWidth="2" />
          <text x="32" y="42" textAnchor="middle" fontFamily="Georgia,serif" fontSize="28" fontWeight="700" fill="#9a6a12">C</text>
        </svg>
      ) : (
        <img src="/images/logo.png" alt="" onError={() => setFailed(true)} />
      )}
    </span>
  )
}

// Estrellas: azules/oscuras por mérito, ámbar las heredadas de la descendencia
export function Stars({ n = 0, amber = 0, max = 12 }) {
  if (!n && !amber) return <span className="muted small">—</span>
  const shown = Math.min(n, max)
  return (
    <span className="stars" aria-label={`${n} estrellas${amber ? ` y ${amber} ámbar` : ''}`}>
      {Array.from({ length: shown }, (_, i) => <span key={i}>★</span>)}
      {Array.from({ length: amber }, (_, i) => <span key={`a${i}`} className="amber">★</span>)}
      {n > max && <span className="x">×{n}</span>}
    </span>
  )
}

export function LevelBadge({ level = 0, big }) {
  if (!level) return <span className={`level-badge none ${big ? 'big' : ''}`} title="Sin nivel todavía">Sin nivel</span>
  return <span className={`level-badge l${level} ${big ? 'big' : ''}`} title={`Nivel ${ROMAN[level]} de V`}>Nivel {ROMAN[level]}</span>
}

export const breedLabel = (b) => BREEDS[b] || b

export function ExampleBadge() {
  return <span className="badge example" title="Dato ficticio para mostrar el formato. No es un ejemplar real.">Ejemplo</span>
}

const hrefOf = (h) => (h.example ? '/registro#ejemplos' : `/registro/${h.registrationNumber}`)

export function HorseCard({ h }) {
  return (
    <Link to={hrefOf(h)} className="horse-card">
      <div className="media"><Img src={h.photo} alt={h.name} dark label="Fotografía del ejemplar" /></div>
      <span className="corner badge">{breedLabel(h.breed)}</span>
      {h.example && <span className="corner-l"><ExampleBadge /></span>}
      <div className="body">
        <h3>{h.name}</h3>
        <div className="reg">Nº {h.registrationNumber} · {new Date(h.birthDate).getFullYear()}</div>
        <div className="row mt8" style={{ gap: 10 }}><LevelBadge level={h.level} /><Stars n={h.stars} amber={h.amberStars} /></div>
        <div className="score">Valoración {h.score != null ? <><strong>{h.score.toFixed(1)}</strong> / 100</> : 'pendiente'}</div>
      </div>
    </Link>
  )
}

export function HorseRow({ h }) {
  return (
    <Link to={hrefOf(h)} className="list-row">
      <div className="thumb"><Img src={h.photo} alt={h.name} dark label=" " /></div>
      <div>
        <div className="row" style={{ gap: 10 }}>
          <h3>{h.name}</h3>
          {h.example && <ExampleBadge />}
        </div>
        <div className="k mt8">Nº {h.registrationNumber} · {breedLabel(h.breed)}</div>
      </div>
      <div className="hide-m"><span className="k">Nacimiento</span><span className="v">{new Date(h.birthDate).getFullYear()} · {h.age} años</span></div>
      <div className="hide-m"><span className="k">Nivel</span><LevelBadge level={h.level} /></div>
      <div className="hide-m"><span className="k">País</span><span className="v">{h.country}</span></div>
      <div className="hide-m"><span className="k">Estrellas</span><Stars n={h.stars} amber={h.amberStars} /></div>
      <div className="bignum"><span className="k" style={{ textAlign: 'right' }}>Nota</span>{h.score != null ? h.score.toFixed(1) : '—'}</div>
    </Link>
  )
}

export function Toast({ msg, onDone }) {
  useEffect(() => {
    if (!msg) return undefined
    const t = setTimeout(onDone, 3500)
    return () => clearTimeout(t)
  }, [msg])
  if (!msg) return null
  return <div className="toast" role="status">{msg}</div>
}

export function Spinner() {
  return <p className="muted">Cargando…</p>
}
