import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../store.js'

export default function HorseRegister() {
  const nav = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '', birthDate: '', sex: 'MALE', color: '', microchip: '', height: '',
    breedComposition: '', breedType: 'PURE', motherBreed: 'PRE',
    fatherId: '', motherId: '', breederId: ''
  })
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handleFiles = (e) => setPhotos(Array.from(e.target.files))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const data = new FormData()
    data.append('data', JSON.stringify(form))
    photos.forEach(p => data.append('photos', p))
    try {
      const res = await api.post('/horses', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      nav(`/caballo/${res.data.id}`)
    } catch (err) {
      alert(err.response?.data?.error || 'Error al registrar')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 8 }}>Registrar ejemplar</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>Completa los datos de tu caballo. Requiere 5 fotos obligatorias.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: step >= s ? '#D4A017' : '#e5e5e5' }} />
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Datos básicos</h3>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Nombre del ejemplar</label>
              <input name="name" value={form.name} onChange={handleChange} required style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, marginTop: 6 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Fecha de nacimiento</label>
                <input name="birthDate" type="date" value={form.birthDate} onChange={handleChange} required style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, marginTop: 6 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Sexo</label>
                <select name="sex" value={form.sex} onChange={handleChange} style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, marginTop: 6 }}>
                  <option value="MALE">Macho</option>
                  <option value="FEMALE">Hembra</option>
                  <option value="GELDING">Castrado</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Color</label>
                <input name="color" value={form.color} onChange={handleChange} required style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, marginTop: 6 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Alzada (cm)</label>
                <input name="height" type="number" value={form.height} onChange={handleChange} style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, marginTop: 6 }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Microchip</label>
              <input name="microchip" value={form.microchip} onChange={handleChange} style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, marginTop: 6 }} />
            </div>
            <button type="button" onClick={() => setStep(2)} style={{ background: '#111', color: '#fff', padding: 14, borderRadius: 8, border: 'none', fontSize: 15, fontWeight: 500, cursor: 'pointer', marginTop: 8 }}>
              Continuar →
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Raza y composición</h3>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Composición racial (ej: 50% PRE / 50% PSL)</label>
              <input name="breedComposition" value={form.breedComposition} onChange={handleChange} required style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, marginTop: 6 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Tipo de cruza</label>
                <select name="breedType" value={form.breedType} onChange={handleChange} style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, marginTop: 6 }}>
                  <option value="PURE">100% o 50/50 ibérico (Puro)</option>
                  <option value="CROSS_50_50">50% ibérico / 50% exterior</option>
                  <option value="CROSS_40_60">40% ibérico / 60% exterior</option>
                  <option value="CROSS_30_70">30% ibérico / 70% exterior</option>
                  <option value="CROSS_20_80">20% ibérico / 80% exterior</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Raza madre</label>
                <select name="motherBreed" value={form.motherBreed} onChange={handleChange} style={{ width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, marginTop: 6 }}>
                  <option value="PRE">PRE</option>
                  <option value="PSL">PSL</option>
                  <option value="PRM">PRM (Marismeño)</option>
                  <option value="C_IBERICO">C-IBERICO</option>
                </select>
              </div>
            </div>
            <div style={{ background: '#fff8e1', padding: 16, borderRadius: 8, fontSize: 13, color: '#666' }}>
              <strong>Reglas de cruza C-IBERICO:</strong><br/>
              • Mínimo 20% sangre ibérica (raza madre).<br/>
              • 10% ibérico / 90% exterior NO está permitido.<br/>
              • No se permite el uso de razas ponis.
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => setStep(1)} style={{ flex: 1, background: '#f5f5f5', color: '#111', padding: 14, borderRadius: 8, border: '1px solid #ddd', fontSize: 15, cursor: 'pointer' }}>
                ← Atrás
              </button>
              <button type="button" onClick={() => setStep(3)} style={{ flex: 1, background: '#111', color: '#fff', padding: 14, borderRadius: 8, border: 'none', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Reseña fotográfica (5 fotos obligatorias)</h3>
            <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, fontSize: 13 }}>
              Sube exactamente 5 fotos en este orden:<br/>
              1. Lateral izquierdo · 2. Lateral derecho · 3. Frontal (pecho) · 4. Trasera (posterior) · 5. Vista desde arriba (tronco)
            </div>
            <input type="file" multiple accept="image/*" onChange={handleFiles} required
              style={{ padding: 12, border: '2px dashed #ddd', borderRadius: 8, width: '100%' }} />
            {photos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {photos.map((p, i) => (
                  <div key={i} style={{ aspectRatio: '1', borderRadius: 6, overflow: 'hidden', background: '#f5f5f5' }}>
                    <img src={URL.createObjectURL(p)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="button" onClick={() => setStep(2)} style={{ flex: 1, background: '#f5f5f5', color: '#111', padding: 14, borderRadius: 8, border: '1px solid #ddd', fontSize: 15, cursor: 'pointer' }}>
                ← Atrás
              </button>
              <button type="submit" disabled={loading || photos.length !== 5} style={{ flex: 1, background: loading || photos.length !== 5 ? '#ccc' : '#D4A017', color: '#000', padding: 14, borderRadius: 8, border: 'none', fontSize: 15, fontWeight: 600, cursor: loading || photos.length !== 5 ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Registrando...' : 'Registrar ejemplar'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
