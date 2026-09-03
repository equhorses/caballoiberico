import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore, api } from '../store.js'

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', country: '', city: '' })
  const [error, setError] = useState('')
  const { login } = useAuthStore()
  const nav = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/auth/register', form)
      login(res.data.token, res.data.user)
      nav('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Error en el registro')
    }
  }

  return (
    <div style={{ maxWidth: 450, margin: '60px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8, fontWeight: 600 }}>Crear cuenta</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>Únete a C-IBERICO y registra tus ejemplares</p>
      {error && <div style={{ background: '#fee', color: '#c00', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#444' }}>Nombre</label>
            <input name="firstName" value={form.firstName} onChange={handleChange} required
              style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 15, marginTop: 6 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#444' }}>Apellidos</label>
            <input name="lastName" value={form.lastName} onChange={handleChange} required
              style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 15, marginTop: 6 }} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#444' }}>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} required
            style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 15, marginTop: 6 }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#444' }}>Contraseña</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={6}
            style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 15, marginTop: 6 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#444' }}>País</label>
            <input name="country" value={form.country} onChange={handleChange} required
              style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 15, marginTop: 6 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#444' }}>Ciudad</label>
            <input name="city" value={form.city} onChange={handleChange} required
              style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 15, marginTop: 6 }} />
          </div>
        </div>
        <button type="submit" style={{ background: '#111', color: '#fff', padding: 14, borderRadius: 8, border: 'none', fontSize: 15, fontWeight: 500, cursor: 'pointer', marginTop: 8 }}>
          Crear cuenta
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#666' }}>
        ¿Ya tienes cuenta? <Link to="/login" style={{ color: '#111', fontWeight: 500 }}>Entrar</Link>
      </p>
    </div>
  )
}
