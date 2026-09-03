import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../store.js'

export default function HorseDetail() {
  const { id } = useParams()
  const [horse, setHorse] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/horses/${id}`).then(r => { setHorse(r.data); setLoading(false) })
  }, [id])

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>Cargando...</div>
  if (!horse) return <div style={{ padding: 80, textAlign: 'center' }}>No encontrado</div>

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link to="/dashboard" style={{ color: '#666', textDecoration: 'none', fontSize: 14 }}>← Volver</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div>
          <div style={{ width: '100%', aspectRatio: '4/3', background: '#f5f5f5', borderRadius: 12, overflow: 'hidden' }}>
            {horse.photos?.[0] ? (
              <img src={horse.photos[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            ) : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>Sin foto</div>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginTop: 8 }}>
            {horse.photos?.map((p, i) => (
              <div key={i} style={{ aspectRatio: 1, borderRadius: 6, overflow: 'hidden' }}>
                <img src={p.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <h1 style={{ fontSize: 28, fontWeight: 600 }}>{horse.name}</h1>
            <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: horse.status === 'APPROVED' ? '#e8f5e9' : '#fff3e0', color: horse.status === 'APPROVED' ? '#2e7d32' : '#e65100' }}>
              {horse.status}
            </span>
          </div>
          <div style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>{horse.registrationNumber}</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Nacimiento', new Date(horse.birthDate).toLocaleDateString('es-ES')],
              ['Sexo', horse.sex === 'MALE' ? 'Macho' : horse.sex === 'FEMALE' ? 'Hembra' : 'Castrado'],
              ['Color', horse.color],
              ['Alzada', horse.height ? `${horse.height} cm` : '—'],
              ['Composición', horse.breedComposition],
              ['Raza madre', horse.motherBreed],
              ['Criador', horse.breeder?.farmName || '—'],
            ].map(([label, val], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ color: '#888', fontSize: 14 }}>{label}</span>
                <span style={{ fontWeight: 500, fontSize: 14 }}>{val}</span>
              </div>
            ))}
          </div>

          {horse.originCertificate && (
            <div style={{ marginTop: 20, padding: 16, background: '#e8f5e9', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, color: '#2e7d32', marginBottom: 4 }}>✓ Certificado de Origen</div>
              <div style={{ fontSize: 12, color: '#666', fontFamily: 'monospace' }}>{horse.originCertificate.hash}</div>
            </div>
          )}

          {horse.qualityCertificate && (
            <div style={{ marginTop: 12, padding: 16, background: '#e3f2fd', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, color: '#1565c0', marginBottom: 4 }}>★ Certificado de Calidad · {horse.qualityCertificate.stars} estrellas</div>
              <div style={{ fontSize: 13, color: '#666' }}>{horse.qualityCertificate.discipline}</div>
            </div>
          )}

          {/* Zona de IA - Aquí conectas tu sistema */}
          <div style={{ marginTop: 24, padding: 20, background: '#f5f5f5', borderRadius: 8, border: '1px dashed #ccc' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>🤖 Evaluación por IA</div>
            {horse.evaluations?.length > 0 ? (
              <div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{horse.evaluations[0].overallScore?.toFixed(2)} / 10</div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Morfología: {horse.evaluations[0].morphologyScore} · Movimiento: {horse.evaluations[0].movementScore} · Doma: {horse.evaluations[0].dressageScore}</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>Este ejemplar aún no ha sido evaluado por IA.</div>
                <div style={{ fontSize: 12, color: '#888' }}>
                  Endpoint para tu IA:<br/>
                  <code style={{ background: '#fff', padding: '2px 6px', borderRadius: 4 }}>GET /api/horses/{horse.id}/ai-data</code><br/>
                  <code style={{ background: '#fff', padding: '2px 6px', borderRadius: 4 }}>POST /api/horses/{horse.id}/ai-evaluation</code>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pedigree */}
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Genealogía</h2>
      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>PADRE</div>
            <div style={{ fontWeight: 500 }}>{horse.father?.name || 'No registrado'}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>MADRE</div>
            <div style={{ fontWeight: 500 }}>{horse.mother?.name || 'No registrada'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
