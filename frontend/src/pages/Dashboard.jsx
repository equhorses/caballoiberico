import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore, api } from '../store.js'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [horses, setHorses] = useState([])
  const [requests, setRequests] = useState([])

  useEffect(() => {
    api.get('/horses?limit=5').then(r => setHorses(r.data.horses))
    api.get('/requests').then(r => setRequests(r.data))
  }, [])

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Panel de control</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>Bienvenido, {user?.firstName}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 40 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, color: '#888' }}>Mis caballos</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{horses.length}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, color: '#888' }}>Solicitudes</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{requests.length}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, color: '#888' }}>Código criador</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 8, color: '#D4A017' }}>
            {user?.breederProfile?.breederCode || 'Pendiente'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>Mis ejemplares</h2>
        <Link to="/registrar-caballo" style={{ background: '#111', color: '#fff', padding: '10px 18px', borderRadius: 6, textDecoration: 'none', fontSize: 14 }}>
          + Nuevo caballo
        </Link>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, overflow: 'hidden' }}>
        {horses.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>No tienes caballos registrados aún</div>
        ) : (
          horses.map(h => (
            <Link key={h.id} to={`/caballo/${h.id}`} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderBottom: '1px solid #f0f0f0', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ width: 56, height: 56, borderRadius: 8, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🐴</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{h.name}</div>
                <div style={{ fontSize: 13, color: '#888' }}>{h.registrationNumber} · {h.breedType}</div>
              </div>
              <div style={{ fontSize: 13, padding: '4px 10px', borderRadius: 6, background: h.status === 'APPROVED' ? '#e8f5e9' : '#fff3e0', color: h.status === 'APPROVED' ? '#2e7d32' : '#e65100' }}>
                {h.status}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
