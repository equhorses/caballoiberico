import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useFetch } from '../api.jsx'
import { HorseRow, Img, Stars, breedLabel, Spinner } from '../components/ui.jsx'
import { CRITERIA, MERIT_LEVELS, PHOTO_VIEWS, fmtDate } from '../data/content.js'
import { useRegistry, filterHorses } from '../data/useRegistry.js'

export function PageHero({ eyebrow, title, children, image = '/images/pista.jpg' }) {
  return (
    <section className="hero page-hero">
      <div className="hero-bg" style={{ backgroundImage: `url(${image})` }} />
      <div className="wrap">
        <span className="eyebrow" style={{ color: 'var(--gold)' }}>{eyebrow}</span>
        <h1>{title}</h1>
        {children && <p className="lead">{children}</p>}
      </div>
    </section>
  )
}

export default function Registry() {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('score')
  const [breed, setBreed] = useState('')
  const { horses, isExample, loading } = useRegistry()
  const list = useMemo(() => filterHorses(horses, { q, breed, sort }), [horses, q, breed, sort])

  return (
    <>
      <PageHero eyebrow="Registro digital" title="Registro C-IBERICO">
        Consulta cualquier ejemplar certificado, su ascendencia declarada y sus méritos deportivos. Un único registro, sin divisiones por categorías cerradas.
      </PageHero>
      <section className="section tight" id="ejemplos">
        <div className="wrap">
          <div className="search">
            <input className="input" placeholder="Buscar por nombre, número de registro, padre, madre o criador" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar en el registro" />
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar">
              <option value="score">Mejor valoración</option>
              <option value="stars">Más estrellas</option>
              <option value="name">Nombre</option>
              <option value="age">Más jóvenes</option>
            </select>
          </div>
          <div className="chips mt16">
            {[['', 'Todas'], ['PRE', 'PRE'], ['PSL', 'PSL'], ['PRE_PSL', 'PRE/PSL'], ['CRUZADO', 'Cruzados']].map(([v, l]) => (
              <button key={v} className={`chip ${breed === v ? 'on' : ''}`} onClick={() => setBreed(v)}>{l}</button>
            ))}
          </div>
          {isExample && <p className="notice mt24">Todavía no hay ejemplares certificados publicados. Los que ves están marcados como <strong>Ejemplo</strong>: son fichas ilustrativas, no caballos reales.</p>}
          <p className="muted mt24">{loading ? 'Buscando…' : `${list.length} ${list.length === 1 ? 'ejemplar' : 'ejemplares'}${isExample ? ' de ejemplo' : ' en el registro'}`}</p>
          <div className="mt16">
            {list.map((h) => <HorseRow key={h.registrationNumber} h={h} />)}
            {!loading && !list.length && <div className="empty">No hay ejemplares que coincidan con la búsqueda.</div>}
          </div>
        </div>
      </section>
    </>
  )
}

export function HorseDetail() {
  const { number } = useParams()
  const { data: h, error, loading } = useFetch(`/registry/${encodeURIComponent(number)}`)
  if (loading) return <div className="wrap section"><Spinner /></div>
  if (error) return <div className="wrap section"><div className="empty">{error.message}. <Link to="/registro" className="link">Volver al registro</Link></div></div>
  const main = h.photos.find((p) => p.view === 'LATERAL_IZQUIERDO') || h.photos[0]
  return (
    <>
      <section className="section white tight">
        <div className="wrap">
          <Link to="/registro" className="link small">← Registro C-IBERICO</Link>
          <div className="split mt24" style={{ alignItems: 'start' }}>
            <div>
              <span className="badge">{breedLabel(h.breed)}</span>
              <h1 className="mt16" style={{ textTransform: 'uppercase', fontSize: 'clamp(2rem,4.5vw,3.4rem)' }}>{h.name}</h1>
              <p className="k mt8">Nº {h.registrationNumber}</p>
              <div className="mt16"><Stars n={h.stars} amber={h.amberStars} max={24} /></div>
              <dl className="kv">
                <dt>Nacimiento</dt><dd>{fmtDate(h.birthDate)} · {h.age} años</dd>
                <dt>Sexo</dt><dd>{h.sex?.toLowerCase()}</dd>
                <dt>Capa</dt><dd>{h.coat}</dd>
                <dt>País</dt><dd>{h.country}</dd>
                <dt>Padre (declarado)</dt><dd>{h.sireName || '—'}</dd>
                <dt>Madre (declarada)</dt><dd>{h.damName || '—'}</dd>
                <dt>Criador</dt><dd>{h.breederName || '—'}</dd>
                <dt>Sangre ibérica</dt><dd>{h.ibericBloodPct} %</dd>
              </dl>
            </div>
            <div>
              <div className="media"><Img src={main?.url} alt={h.name} dark label="Sin fotografía publicada" style={{ aspectRatio: '4 / 3' }} /></div>
              <div className="photo-slots mt16">
                {PHOTO_VIEWS.map((v) => {
                  const p = h.photos.find((x) => x.view === v.key)
                  return <div key={v.key} className="slot" style={{ cursor: 'default' }}>{p ? <Img src={p.url} alt={v.label} /> : 'Sin foto'}<span className="slot-label">{v.label}</span></div>
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="wrap grid g2" style={{ alignItems: 'start' }}>
          <div className="card">
            <span className="eyebrow">Valoración morfo-deportiva</span>
            {h.evaluation ? (
              <>
                <div className="row between"><h3>Nota final</h3><span className="bignum" style={{ padding: 0 }}>{h.score != null ? h.score.toFixed(1) : '—'} <span className="small muted">/ 100</span></span></div>
                <table className="table mt16">
                  <tbody>
                    {CRITERIA.map((c) => {
                      const d = h.evaluation.criteria.find((x) => x.key === c.key)
                      return <tr key={c.key}><td>{c.name}<div className="small muted">{c.area}</div></td><td style={{ textAlign: 'right', fontWeight: 700 }}>{d?.score != null ? d.score.toFixed(1) : <span className="muted small">no evaluable</span>}</td></tr>
                    })}
                  </tbody>
                </table>
                {h.evaluation.summary && <p className="mt16">{h.evaluation.summary}</p>}
                <p className="small muted mt16">Resuelto por evaluador el {fmtDate(h.evaluation.resolvedAt)} · rúbrica v{h.evaluation.rubricVersion} (pesos en fase experimental).</p>
              </>
            ) : <p className="muted">Este ejemplar aún no tiene una valoración resuelta.</p>}
          </div>
          <div className="stack">
            <div className="card">
              <span className="eyebrow">Certificados vigentes</span>
              {h.certificates.length ? h.certificates.map((c) => (
                <div key={c.code} className="row between" style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                  <div><strong>{c.type === 'ORIGEN' ? 'Certificado de Origen' : `Certificado de Calidad · ${c.stars} estrellas`}</strong><div className="small muted">Expedido el {fmtDate(c.issuedAt)}</div></div>
                  <Link to={`/verificar?c=${c.code}`} className="badge ok" style={{ textDecoration: 'none' }}>{c.code}</Link>
                </div>
              )) : <p className="muted">Sin certificados vigentes.</p>}
            </div>
            <div className="card">
              <span className="eyebrow">Méritos deportivos acreditados</span>
              {h.merits.length ? h.merits.map((m) => (
                <div key={m.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                  <strong>{m.competition}</strong> · {m.category}
                  <div className="small muted">{MERIT_LEVELS[m.level]} · {m.position}{m.score ? ` · ${m.score}` : ''} · {fmtDate(m.date)} · {m.starsGiven} estrellas</div>
                </div>
              )) : <p className="muted">Sin méritos registrados.</p>}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
