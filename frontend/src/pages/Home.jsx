import { Link } from 'react-router-dom'
import { useAuthStore } from '../store.js'

export default function Home() {
  const { isAuth } = useAuthStore()

  return (
    <div>
      <section style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: '#fff', padding: '100px 24px', textAlign: 'center'
      }}>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 700, marginBottom: 16, letterSpacing: '-0.02em' }}>
          C-IBERICO
        </h1>
        <p style={{ fontSize: 'clamp(16px, 2vw, 22px)', color: '#ccc', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.5 }}>
          El primer studbook digital del caballo ibérico.<br/>
          Certificación de origen y calidad 100% online.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={isAuth ? "/registrar-caballo" : "/registro"} style={{
            background: '#D4A017', color: '#000', padding: '14px 28px', borderRadius: 8,
            textDecoration: 'none', fontWeight: 600, fontSize: 15
          }}>
            Registrar mi caballo
          </Link>
          <Link to="/ranking" style={{
            background: 'transparent', color: '#fff', padding: '14px 28px', borderRadius: 8,
            textDecoration: 'none', fontWeight: 500, fontSize: 15, border: '1px solid rgba(255,255,255,0.3)'
          }}>
            Ver ranking
          </Link>
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 28, marginBottom: 48, fontWeight: 600 }}>¿Por qué C-IBERICO?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
          {[
            { title: '100% Online', desc: 'Registro, evaluación, pago y certificación sin moverte de casa.' },
            { title: 'Tres razas madre', desc: 'PRE, PSL y Marismeño. Cruzas permitidas desde 20% hasta 100% ibérico.' },
            { title: 'Sistema de estrellas', desc: '3★, 6★, 12★ y 24★. Lista Laureada Ámbar para los mejores ejemplares.' },
            { title: 'IA Ready', desc: 'Plataforma preparada para integrar evaluación biomecánica por inteligencia artificial.' },
            { title: 'Pagos seguros', desc: 'Pasarela Stripe integrada. Tarifas transparentes sin sorpresas.' },
            { title: 'Internacional', desc: 'Válido en cualquier país. Conexión con WBFSH y estándares globales.' }
          ].map((f, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: '#666', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: '#f5f5f5', padding: '80px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, marginBottom: 48, fontWeight: 600 }}>Tarifas de servicios</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { name: 'Certificado de Origen', price: '80 €', desc: 'Digital incluido. Físico consultar envío.' },
              { name: 'Certificado de Calidad', price: '85 €', desc: 'Evaluación y estrellas. Requiere origen previo.' },
              { name: 'Código de Criador', price: '50 €/año', desc: 'Renovación anual 250 €. Descuentos en servicios.' },
              { name: 'Cambio Titularidad', price: '35 €', desc: 'Transferencia de propiedad. Reexpedición incluida.' },
              { name: 'Cambio de Nombre', price: '150 €', desc: 'Reexpedición completa de documentación.' },
              { name: '3 Estrellas', price: '300 €', desc: 'Mérito deportivo nacional joven.' },
              { name: '6 Estrellas', price: '600 €', desc: 'Mérito deportivo nacional adulto.' },
              { name: '12 Estrellas', price: '1.200 €', desc: 'Mérito deportivo internacional.' },
              { name: '24 Estrellas', price: 'Sin costo', desc: 'Olímpico / Mundial / Top 15.' }
            ].map((t, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #ddd' }}>
                <div style={{ fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{t.name}</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{t.price}</div>
                <div style={{ fontSize: 13, color: '#666' }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
