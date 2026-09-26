import { Link } from 'react-router-dom'
import { useAuth } from '../api.jsx'
import { PageHero } from './Registry.jsx'
import { AGE_WHEEL, AI_RULES, CRITERIA, PHOTO_VIEWS } from '../data/content.js'

export default function Valoracion() {
  const { user, isStaff } = useAuth()
  return (
    <>
      <PageHero eyebrow="Inteligencia artificial C-IBERICO" title={<>Valoración morfo-deportiva<br />del ejemplar</>} image="/images/valoracion.jpg">
        Nueve bloques puntuados de 0 a 10 según el reglamento de doma clásica y los criterios de selección centroeuropeos.
        La nota global pondera el movimiento y la aptitud por encima del volumen barroco.
      </PageHero>

      <section className="section white">
        <div className="wrap">
          <span className="eyebrow">Cómo funciona</span>
          <h2>La IA propone, el evaluador resuelve</h2>
          <div className="steps mt48">
            <div><h3>Material</h3><p>El titular sube las cinco fotografías reglamentarias y el vídeo montado en los tres aires (máx. 1 minuto).</p></div>
            <div><h3>Revisión del material</h3><p>Se comprueba, criterio por criterio, si el material permite valorar. Si no, se pide material nuevo: nunca se penaliza.</p></div>
            <div><h3>Propuesta de la IA</h3><p>Para cada bloque, una observación, una nota provisional, la evidencia que la sustenta y su nivel de confianza.</p></div>
            <div><h3>Decisión humana</h3><p>El evaluador acepta, corrige o rechaza cada propuesta. Solo entonces la nota es firme y pasa al expediente.</p></div>
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
            <h2>Se exige según la edad</h2>
            <p className="muted mt16">La misma ejecución no vale lo mismo a los 4 que a los 6 años. Antes de puntuar, el movimiento se calibra con lo que es razonable pedir a esa edad.</p>
            <table className="table mt24">
              <thead><tr><th>Edad</th><th>Qué se espera para un 7</th></tr></thead>
              <tbody>{AGE_WHEEL.map(([a, t]) => <tr key={a}><td className="t-name" style={{ whiteSpace: 'nowrap' }}>{a}</td><td className="muted">{t}</td></tr>)}</tbody>
            </table>
            <p className="small muted mt16">Interpretación propia de C-IBERICO inspirada en las pruebas de caballos jóvenes; no es un baremo de la FEI.</p>
          </div>
        </div>
      </section>

      <section className="section white">
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
              <li className="mt8">Vídeo montado en los tres aires, máximo un minuto</li>
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
