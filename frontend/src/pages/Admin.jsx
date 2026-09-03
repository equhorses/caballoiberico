import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, api } from '../store.js'

export default function Admin() {
  const { user } = useAuthStore()
  const nav = useNavigate()
  const [stats, setStats] = useState({})
  const [horses, setHorses] = useState([])
  const [requests, setRequests] = useState([])

  useEffect(() => {
    if (user?.role !== 'ADMIN') { nav('/'); return }
    api.get('/admin/stats').then(r => setStats(r.data))
    api.get('/horses?limit=50').then(r => setHorses(r.data.horses))
    api.get('/requests').then(r => setRequests(r.data))
  }, [user, nav])

  const updateStatus = async (id, status) => {
    await api.patch(`/horses/${id}/status`, { status })
    setHorses(horses.map(h => h.id === id ? { ...h, status } : h))
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 24 }}>Panel de Administración</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
        {[
          { label: 'Total caballos', val: stats.totalHorses },
          { label: 'Criadores', val: stats.totalBreeders },
          { label: 'Certificados', val: stats.totalCerts },
          { label: 'Solicitudes pendientes', val: stats.pendingRequests }
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 13, color: '#888' }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{s.val ?? 0}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Caballos pendientes de revisión</h2>
      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, overflow: 'hidden', marginBottom: 40 }}>
        {horses.filter(h => h.status === 'PENDING').map(h => (
          <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 14, borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{h.name}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{h.registrationNumber} · {h.breedComposition}</div>
            </div>
            <button onClick={() => updateStatus(h.id, 'APPROVED')} style={{ background: '#e8f5e9', color: '#2e7d32', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Aprobar</button>
            <button onClick={() => updateStatus(h.id, 'REJECTED')} style={{ background: '#ffebee', color: '#c62828', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Rechazar</button>
          </div>
        ))}
        {horses.filter(h => h.status === 'PENDING').length === 0 && (
          <div style={{ padding: 30, textAlign: 'center', color: '#888' }}>No hay caballos pendientes</div>
        )}
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Solicitudes de servicio</h2>
      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, overflow: 'hidden' }}>
        {requests.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 14, borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{r.type}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{r.status} · {new Date(r.createdAt).toLocaleDateString('es-ES')}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
