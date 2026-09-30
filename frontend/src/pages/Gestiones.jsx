import { Link } from 'react-router-dom'
import { useAuth } from '../api.jsx'
import { PageHero } from './Registry.jsx'
import { SERVICES, eur } from '../data/content.js'

export default function Gestiones() {
  const { user } = useAuth()
  const start = (code) => (user ? `/panel?gestion=${code}` : `/acceder?next=${encodeURIComponent(`/panel?gestion=${code}`)}`)
  return (
    <>
      <PageHero eyebrow="Gestiones online" title={<>Todo el expediente,<br />sin salir de casa</>}>
        Solicita, documenta, abona la tarifa y sigue el estado del expediente desde el mismo panel. No se inicia ningún trámite sin el abono previo.
      </PageHero>
      <section className="section">
        <div className="wrap grid g2">
          {SERVICES.map((s, i) => (
            <article key={s.code} id={s.slug} className="card" style={{ gridColumn: i === 0 ? '1 / -1' : undefined, scrollMarginTop: 100 }}>
              <div className={i === 0 ? 'grid g2' : ''} style={{ gap: 40 }}>
                <div>
                  <div className="row between" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <span className="eyebrow">{s.num} · {s.tag}</span>
                      <h3 style={{ fontSize: '1.7rem' }}>{s.name} {s.launch && <span className="badge example" style={{ verticalAlign: 'middle' }}>Lanzamiento</span>}</h3>
                    </div>
                    <div className="price"><strong>{eur(s.price)}</strong><span>◷ {s.days} días hábiles</span></div>
                  </div>
                  <p className="muted mt16">{s.desc}</p>
                </div>
                <div className={i === 0 ? '' : 'mt24'}>
                  <span className="eyebrow">Documentación requerida</span>
                  <ul style={{ paddingLeft: 20, margin: 0 }}>{s.docs.map((d) => <li key={d} className="mt8">{d}</li>)}</ul>
                  <Link to={start(s.code)} className="btn btn-gold btn-block mt24">Iniciar solicitud →</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="wrap mt32">
          <p className="notice info">C-IBERICO es un certificado privado. Estas gestiones no sustituyen los trámites ante las asociaciones oficiales de cada raza (ANCCE, APSL u otras) ni ante las administraciones públicas.</p>
        </div>
      </section>
    </>
  )
}
