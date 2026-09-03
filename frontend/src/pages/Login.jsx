import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore, api } from '../store.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuthStore()
  const nav = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/auth/login', { email, password })
      login(res.data.token, res.data.user)
      nav('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8, fontWeight: 600 }}>Bienvenido de nuevo</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>Accede a tu cuenta de C-IBERICO</p>
      {error && <div style={{ background: '#fee', color: '#c00', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#444' }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 15 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#444' }}>Contraseña</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 15 }} />
        </div>
        <button type="submit" style={{ background: '#111', color: '#fff', padding: 14, borderRadius: 8, border: 'none', fontSize: 15, fontWeight: 500, cursor: 'pointer', marginTop: 8 }}>
          Entrar
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#666' }}>
        ¿No tienes cuenta? <Link to="/registro" style={{ color: '#111', fontWeight: 500 }}>Regístrate</Link>
      </p>
    </div>
  )
}
