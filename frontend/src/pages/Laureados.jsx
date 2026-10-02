import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.jsx'
import { PageHero } from './Registry.jsx'
import { ExampleBadge, Img, LevelBadge, breedLabel } from '../components/ui.jsx'
import { MERIT_LEVELS, fmtDate } from '../data/content.js'
import { EXAMPLE_HORSES, EXAMPLE_RESULTS } from '../data/examples.js'

export default function Laureados() {
  const [data, setData] = useState(null)
  useEffect(() => {
    Promise.all([api('/laureados'), api('/results')])
      .then(([l, results]) => {
        const real = l.ranking.length || l.laureados.length || results.length
        setData(real ? { ...l, results, isExample: false } : null)
      })
      .catch(() => setData(null))
      .finally(() => setData((d) => d || {
        isExample: true,
        laureados: EXAMPLE_HORSES.filter((h) => h.laureado || h.amberStars >= 3),
        ranking: [...EXAMPLE_HORSES].sort((a, b) => (b.level || 0) - (a.level || 0) || (b.score || 0) - (a.score || 0)),
        results: EXAMPLE_RESULTS,
      }))
  }, [])

  return (
    <>
      <PageHero eyebrow="Salón de la fama" title="Lista Laureada Ámbar">
        El máximo reconocimiento C-IBERICO. Lo concedemos a los caballos que han marcado la diferencia en competición o como reproductores.
      </PageHero>
      {!data ? <div className="wrap section"><p className="muted">Cargando…</p></div> : (
        <>
          {data.isExample && <div className="wrap mt32"><p className="notice">Todavía no hay resultados reales publicados. Todo lo que aparece en esta página está marcado como <strong>Ejemplo</strong> y es ilustrativo.</p></div>}
          <section className="section tight">
            <div className="wrap">
              <span className="eyebrow">Ejemplares laureados</span>
              {data.laureados.length ? (
                <div className="grid g2 mt16">
                  {data.laureados.map((h) => (
                    <Link key={h.registrationNumber} to={h.example ? '/laureados' : `/registro/${h.registrationNumber}`} className="card" style={{ display: 'grid', gridTemplateColumns: '160px 1fr', padding: 0, textDecoration: 'none', overflow: 'hidden', borderLeft: '4px solid var(--gold)' }}>
                      <div className="media" style={{ border: 0, borderRadius: 0 }}><Img src={h.photo} alt={h.name} dark label=" " style={{ height: '100%', minHeight: 150 }} /></div>
                      <div style={{ padding: 24 }}>
                        <div className="row" style={{ gap: 8 }}><span style={{ color: 'var(--gold-deep)', fontSize: 22 }}>🏆</span>{h.example && <ExampleBadge />}</div>
                        <h3 className="mt8" style={{ textTransform: 'uppercase' }}>{h.name}</h3>
                        <div className="k mt8">{breedLabel(h.breed)} · Nº {h.registrationNumber}</div>
                        <div className="mt8"><LevelBadge level={h.level} /></div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : <div className="empty mt16">Aún no hay ejemplares laureados.</div>}
            </div>
          </section>

          <section className="section white tight">
            <div className="wrap">
              <span className="eyebrow">Mejor valorados</span>
              <div className="table-scroll mt16">
                <table className="table">
                  <thead><tr><th>#</th><th>Ejemplar</th><th>Estrellas</th><th style={{ textAlign: 'right' }}>Nota</th></tr></thead>
                  <tbody>
                    {data.ranking.map((h, i) => (
                      <tr key={h.registrationNumber}>
                        <td style={{ fontFamily: 'var(--serif)', color: 'var(--gold-deep)', fontSize: '1.3rem' }}>{i + 1}</td>
                        <td><span className="t-name" style={{ textTransform: 'uppercase' }}>{h.name}</span> {h.example && <ExampleBadge />}<div className="k">{breedLabel(h.breed)} · {h.country}</div></td>
                        <td><LevelBadge level={h.level} /></td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--serif)', fontSize: '1.3rem', color: 'var(--gold-deep)' }}>{h.score != null ? h.score.toFixed(1) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="section tight">
            <div className="wrap">
              <span className="eyebrow">Resultados deportivos verificados</span>
              <div className="table-scroll mt16">
                <table className="table">
                  <thead><tr><th>Competición</th><th>Nivel</th><th>Puesto</th><th>Nota</th><th>Fecha</th><th style={{ textAlign: 'right' }}>Estrellas</th></tr></thead>
                  <tbody>
                    {data.results.map((r, i) => (
                      <tr key={i}>
                        <td><span className="t-name">{r.competition}</span> {r.example && <ExampleBadge />}<div className="small muted">{r.horseName} · {r.category}</div></td>
                        <td className="k">{MERIT_LEVELS[r.level]}</td>
                        <td>{r.position}</td>
                        <td>{r.score ?? '—'}</td>
                        <td className="small">{fmtDate(r.date)}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--serif)', fontSize: '1.3rem', color: 'var(--gold-deep)' }}>{r.starsGiven}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="small muted mt16">Solo se publican resultados acreditados con documentación oficial del organismo competente y verificados por la presidencia.</p>
            </div>
          </section>
        </>
      )}
    </>
  )
}
