import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../store.js'

export default function Ranking() {
  const [horses, setHorses] = useState([])

  useEffect(() => {
    api.get('/ranking').then(r => setHorses(r.data))
  }, [])

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Ranking C-IBERICO</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>Los mejores ejemplares certificados por mérito deportivo y calidad</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {horses.map((h) => (
          <Link key={h.id} to={`/caballo/${h.id}`} style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: '1px solid #e5e5e5', borderRadius: 10, padding: 16, textDecoration: 'none', color: 'inherit' }}>
            <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: h.rank <= 3 ? '#D4A017' : '#f5f5f5', color: h.rank <= 3 ? '#fff' : '#666', fontWeight: 700, fontSize: 14 }}>
              {h.rank}
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f5f5f5', overflow: 'hidden' }}>
              {h.photo ? <img src={h.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>🐴</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{h.name}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{h.breedType} · {h.breeder}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1565c0' }}>{'★'.repeat(Math.min(h.stars / 3, 8))}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{h.stars} estrellas</div>
            </div>
          </Link>
        ))}
        {horses.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Aún no hay ejemplares en el ranking</div>}
      </div>
    </div>
  )
}
