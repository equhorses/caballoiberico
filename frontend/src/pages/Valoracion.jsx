import { Link } from 'react-router-dom'
import { useAuth } from '../api.jsx'
import { PageHero } from './Registry.jsx'
import { AGE_WHEEL, AI_RULES, AI_TRUST, CRITERIA, LEVELS, PHOTO_VIEWS, STANDARD_TEXT } from '../data/content.js'
import { LevelBadge } from '../components/ui.jsx'

export default function Valoracion() {
  const { user, isStaff } = useAuth()
  return (
    <>
      <PageHero eyebrow="Inteligencia artificial C-IBERICO" title={<>Valoración morfo-deportiva<br />del ejemplar</>} image="/images/valoracion.jpg">
        Desde los 6 meses. Nueve bloques puntuados de 0 a 10 según el reglamento de doma clásica y los criterios de selección
        centroeuropeos, calibrados por la edad. El resultado es un nivel de calidad, del I al V, que el ejemplar conserva y puede mejorar.
      </PageHero>

      <section className="section white">
        <div className="wrap split" style={{ alignItems: 'start' }}>
          <div>
            <span className="eyebrow">Nuestra vara de medir</span>
            <h2>{STANDARD_TEXT.title}</h2>
            <p className="lead">{STANDARD_TEXT.lead}</p>
          </div>
          <div className="card soft">
            <ul style={{ paddingLeft: 20, margin: 0 }}>{STANDARD_TEXT.points.map((t) => <li key={t} className="mt8">{t}</li>)}</ul>
            <p className="notice mt24">{STANDARD_TEXT.honest}</p>
            <Link to="/gestiones#prevaloracion" className="btn btn-gold mt24">Pide una pre-valoración gratis</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <span className="eyebrow">Cómo funciona</span>
          <h2>La IA valora, C-IBERICO expide</h2>
          <div className="steps mt48">
            <div><h3>Material</h3><p>El titular sube las cinco fotografías reglamentarias y un vídeo de máximo un minuto: montado desde los 3 años; a la mano o en libertad en potros.</p></div>
            <div><h3>Revisión del material</h3><p>Se comprueba, criterio por criterio, si el material permite valorar. Si no, se pide material nuevo: nunca se penaliza.</p></div>
            <div><h3>Valoración de la IA</h3><p>La IA analiza las fotos y el vídeo con la misma rúbrica para todos. Para cada bloque da una observación, una nota, la foto o el minuto que la sustenta y su nivel de confianza.</p></div>
            <div><h3>Ficha final</h3><p>Comprobamos que el material es del caballo y es válido, y expedimos la ficha con el resultado de la IA tal cual. La nota y el nivel no los retoca nadie.</p></div>
          </div>
        </div>
      </section>

      <section className="section white">
        <div className="wrap">
          <span className="eyebrow">Confianza</span>
          <h2>Cómo trabaja nuestra IA</h2>
          <p className="lead">Una IA instruida con reglamentos, vídeo y texto especializado para valorar al caballo ibérico con claridad y con la misma seguridad para todos.</p>
          <div className="trust-grid mt32">
            {AI_TRUST.map((t) => (
              <div key={t.title} className={`trust ${t.ready ? '' : 'soon'}`}>
                <h3>{t.title} {!t.ready && <span className="badge example">En preparación</span>}</h3>
                <p>{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap grid g2" style={{ gap: 48, alignItems: 'start' }}>
          <div>
            <span className="eyebrow">Los nueve bloques</span>
            <h2>Qué se puntúa</h2>
            <table className="table mt32">
              <thead><tr><th>Bloque</th><th>Área</th></tr></thead>
              <tbody>{CRITERIA.map((c) => <tr key={c.key}><td className="t-name">{c.name}</td><td className="muted">{c.area}</td></tr>)}</tbody>
            </table>
            <p className="small muted mt16">Los pesos de cada bloque en la nota final están en fase experimental y se ajustarán tras la validación con evaluadores.</p>
          </div>
          <div>
            <span className="eyebrow">Rueda de edad</span>
            <h2>Se exige según la etapa</h2>
            <p className="muted mt16">La misma ejecución no vale lo mismo a los 4 que a los 6 años. Antes de puntuar se calibra con lo que es razonable pedir a esa edad, y cada etapa tiene un nivel máximo.</p>
            <table className="table mt24">
              <thead><tr><th>Etapa</th><th>Qué se valora</th><th>Nivel máx.</th></tr></thead>
              <tbody>{AGE_WHEEL.map(([a, t, cap]) => <tr key={a}><td className="t-name" style={{ whiteSpace: 'nowrap' }}>{a}</td><td className="muted">{t}</td><td style={{ textAlign: 'center', fontWeight: 700 }}>{cap}</td></tr>)}</tbody>
            </table>
            <p className="small muted mt16">Interpretación propia de C-IBERICO inspirada en las pruebas de caballos jóvenes; no es un baremo de la FEI.</p>
          </div>
        </div>
      </section>

      <section className="section white">
        <div className="wrap">
          <span className="eyebrow">Niveles de calidad</span>
          <h2>Un nivel que se conserva y se mejora</h2>
          <p className="lead">El nivel no depende de la edad. En cada cambio de etapa el ejemplar puede volver a presentarse: si mejora, sube; si no, conserva el que tenía. Nunca baja por una nueva valoración. Los méritos deportivos acreditados también pueden subirlo, por decisión de la presidencia.</p>
          <div className="levels-scale mt32">
            {LEVELS.map((l) => <div key={l.n}><LevelBadge level={l.n} /><p className="small muted mt8">Nota desde {l.min}/100</p></div>)}
          </div>
          <p className="small muted mt16">Umbrales en fase experimental, pendientes de validación con evaluadores.</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap grid g2" style={{ gap: 48, alignItems: 'start' }}>
          <div>
            <span className="eyebrow">Garantías</span>
            <h2>Lo que la IA nunca hace</h2>
            <ul className="mt24" style={{ paddingLeft: 20 }}>{AI_RULES.map((r) => <li key={r} className="mt8">{r}</li>)}</ul>
          </div>
          <div>
            <span className="eyebrow">Material necesario</span>
            <h2>Las cinco vistas y el vídeo</h2>
            <ul className="mt24" style={{ paddingLeft: 20 }}>
              {PHOTO_VIEWS.map((v) => <li key={v.key} className="mt8">{v.label}</li>)}
              <li className="mt8">Vídeo en los tres aires, máximo un minuto: montado desde los 3 años; a la mano o en libertad antes</li>
            </ul>
            <p className="small muted mt16">Fotografías con el caballo cuadrado, sobre fondo neutro y a la altura del tronco. Un material deficiente retrasa la valoración, pero nunca la empeora.</p>
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="wrap">
          <div className="card center" style={{ borderStyle: 'dashed', padding: 48 }}>
            {user ? (
              <>
                <h3>Solicita la valoración desde tu panel</h3>
                <p className="muted mt8">La valoración forma parte del Certificado de Calidad. Da de alta el ejemplar, sube el material y abre la gestión.</p>
                <Link className="btn btn-gold mt24" to={isStaff ? '/evaluador' : '/panel'}>{isStaff ? 'Ir al panel del evaluador' : 'Ir a mi panel'}</Link>
              </>
            ) : (
              <>
                <h3>Acceso reservado a titulares</h3>
                <p className="muted mt8">La valoración guarda el informe en tu expediente, por lo que necesitas acceder con tu cuenta. Puedes seguir consultando el registro libremente.</p>
                <div className="row mt24" style={{ justifyContent: 'center' }}>
                  <Link className="btn btn-gold" to="/acceder">Acceder a mi cuenta</Link>
                  <Link className="btn btn-line" to="/alta">Crear cuenta</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
