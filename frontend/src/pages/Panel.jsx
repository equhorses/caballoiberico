import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { api, useAuth, useFetch } from '../api.jsx'
import { Img, Toast, breedLabel } from '../components/ui.jsx'
import { PHOTO_VIEWS, SERVICES, eur, fmtDate } from '../data/content.js'

const REQ_STATUS = {
  PENDIENTE_PAGO: ['Pendiente de pago', 'example'], PAGADA: ['Pagada', 'ok'], EN_REVISION: ['En revisión', 'light'],
  REQUIERE_DOCUMENTACION: ['Falta documentación', 'bad'], RESUELTA: ['Resuelta', 'ok'], RECHAZADA: ['Rechazada', 'bad'],
}
const HORSE_STATUS = { PENDIENTE: 'Pendiente de certificar', CERTIFICADO: 'Certificado', RECHAZADO: 'Rechazado', BAJA: 'Baja' }
const serviceName = (c) => SERVICES.find((s) => s.code === c)?.name || c

export default function Panel() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState(params.get('gestion') ? 'gestiones' : 'ejemplares')
  const [toast, setToast] = useState(params.get('pago') === 'ok' ? 'Pago recibido. Tu gestión queda en revisión.' : params.get('pago') === 'cancelado' ? 'Pago cancelado: la solicitud queda pendiente.' : '')
  const horses = useFetch(user ? '/my/horses' : null)
  const requests = useFetch(user ? '/my/requests' : null)
  const [selected, setSelected] = useState(null)

  if (!user) return <Navigate to="/acceder?next=/panel" replace />
  const list = horses.data || []
  const current = list.find((h) => h.id === selected)

  return (
    <div className="app-shell">
      <div className="app-top">
        <div className="wrap">
          <span className="eyebrow">Panel del titular</span>
          <h2 style={{ fontSize: '2rem' }}>Hola, {user.firstName}</h2>
          <div className="tabs" role="tablist">
            {[['ejemplares', `Mis ejemplares (${list.length})`], ['nuevo', 'Dar de alta un ejemplar'], ['gestiones', 'Gestiones y pagos']].map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => { setTab(k); setSelected(null) }}>{l}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="wrap section tight">
        {tab === 'ejemplares' && !current && (
          list.length ? (
            <div className="grid g3">
              {list.map((h) => (
                <button key={h.id} className="card" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => setSelected(h.id)}>
                  <div className="row between"><span className="badge light">{breedLabel(h.breed)}</span><span className={`badge ${h.status === 'CERTIFICADO' ? 'ok' : 'example'}`}>{HORSE_STATUS[h.status]}</span></div>
                  <h3 className="mt16" style={{ textTransform: 'uppercase' }}>{h.name}</h3>
                  <p className="k mt8">{h.registrationNumber ? `Nº ${h.registrationNumber}` : 'Sin número todavía'}</p>
                  <p className="small muted mt8">Fotos {h.photos.length}/5 · Vídeo {h.videos.length ? 'sí' : 'no'} · Certificados {h.certificates.filter((c) => c.status === 'VIGENTE').length}</p>
                </button>
              ))}
            </div>
          ) : <div className="empty">Aún no tienes ejemplares. <button className="link" style={{ background: 'none', border: 0, cursor: 'pointer' }} onClick={() => setTab('nuevo')}>Da de alta el primero</button>.</div>
        )}
        {tab === 'ejemplares' && current && <HorseManager h={current} onBack={() => setSelected(null)} onChange={horses.reload} notify={setToast} onRequest={(code) => { setParams({ gestion: code, caballo: current.id }); setTab('gestiones') }} />}
        {tab === 'nuevo' && <NewHorse onDone={(h) => { horses.reload(); setSelected(h.id); setTab('ejemplares'); setToast('Ejemplar dado de alta. Ahora sube sus fotografías.') }} />}
        {tab === 'gestiones' && <Requests horses={list} requests={requests} preset={params.get('gestion')} presetHorse={params.get('caballo')} notify={setToast} />}
      </div>
      <Toast msg={toast} onDone={() => setToast('')} />
    </div>
  )
}

function NewHorse({ onDone }) {
  const [f, setF] = useState({ name: '', birthDate: '', sex: 'MACHO', breed: 'PRE', coat: '', country: 'España', ibericBloodPct: 100, sireName: '', damName: '', breederName: '', microchip: '', officialRegistry: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try { onDone(await api('/my/horses', { method: 'POST', body: f })) } catch (x) { setErr(x.message) }
    setBusy(false)
  }
  return (
    <form className="card form" onSubmit={submit} style={{ maxWidth: 860 }}>
      <h3>Datos del ejemplar</h3>
      <div className="grid g3" style={{ gap: 16 }}>
        <div className="field"><label>Nombre *</label><input className="input" required value={f.name} onChange={set('name')} /></div>
        <div className="field"><label>Fecha de nacimiento *</label><input className="input" type="date" required value={f.birthDate} onChange={set('birthDate')} /></div>
        <div className="field"><label>Sexo *</label><select className="select" value={f.sex} onChange={set('sex')}><option value="MACHO">Macho</option><option value="HEMBRA">Hembra</option><option value="CASTRADO">Castrado</option></select></div>
        <div className="field"><label>Raza *</label><select className="select" value={f.breed} onChange={set('breed')}><option value="PRE">PRE</option><option value="PSL">PSL</option><option value="PRE_PSL">PRE/PSL</option><option value="CRUZADO">Cruzado ibérico</option></select></div>
        <div className="field"><label>Capa *</label><input className="input" required value={f.coat} onChange={set('coat')} placeholder="Torda, castaña…" /></div>
        <div className="field"><label>País *</label><input className="input" required value={f.country} onChange={set('country')} /></div>
        <div className="field"><label>% sangre ibérica *</label><input className="input" type="number" min={10} max={100} required value={f.ibericBloodPct} onChange={set('ibericBloodPct')} /></div>
        <div className="field"><label>Padre</label><input className="input" value={f.sireName} onChange={set('sireName')} /></div>
        <div className="field"><label>Madre</label><input className="input" value={f.damName} onChange={set('damName')} /></div>
        <div className="field"><label>Criador</label><input className="input" value={f.breederName} onChange={set('breederName')} /></div>
        <div className="field"><label>Microchip</label><input className="input" value={f.microchip} onChange={set('microchip')} /></div>
        <div className="field"><label>Nº en libro oficial (ANCCE, APSL…)</label><input className="input" value={f.officialRegistry} onChange={set('officialRegistry')} /></div>
      </div>
      {err && <p className="notice bad">{err}</p>}
      <div><button className="btn btn-ink" disabled={busy}>{busy ? 'Guardando…' : 'Dar de alta'}</button></div>
    </form>
  )
}

function HorseManager({ h, onBack, onChange, notify, onRequest }) {
  const [busy, setBusy] = useState('')
  const upload = async (path, file, key) => {
    if (!file) return
    const form = new FormData(); form.append('file', file)
    setBusy(key)
    try { await api(path, { method: 'POST', form }); notify('Archivo subido'); onChange() } catch (x) { notify(x.message) }
    setBusy('')
  }
  const togglePublic = async () => { await api(`/my/horses/${h.id}`, { method: 'PATCH', body: { isPublic: !h.isPublic } }); onChange() }
  return (
    <div className="stack">
      <button className="link" style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0 }} onClick={onBack}>← Mis ejemplares</button>
      <div className="card">
        <div className="row between">
          <div>
            <h2 style={{ fontSize: '2rem', textTransform: 'uppercase' }}>{h.name}</h2>
            <p className="k mt8">{h.registrationNumber ? `Nº ${h.registrationNumber}` : 'Pendiente de Certificado de Origen'} · {breedLabel(h.breed)} · {fmtDate(h.birthDate)}</p>
          </div>
          {h.registrationNumber && <label className="small row" style={{ gap: 8 }}><input type="checkbox" checked={h.isPublic} onChange={togglePublic} /> Ficha pública en el registro</label>}
        </div>
      </div>
      <div className="card">
        <h3>Fotografías reglamentarias</h3>
        <p className="muted small mt8">Caballo cuadrado, fondo neutro, cámara a la altura del tronco. JPG, PNG o WEBP.</p>
        <div className="photo-slots mt16">
          {PHOTO_VIEWS.map((v) => {
            const p = h.photos.find((x) => x.view === v.key)
            return (
              <label key={v.key} className="slot">
                {p ? <Img src={p.url} alt={v.label} /> : <span>{busy === v.key ? 'Subiendo…' : '+ Subir foto'}</span>}
                <span className="slot-label">{v.label}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => upload(`/my/horses/${h.id}/photos/${v.key}`, e.target.files[0], v.key)} />
              </label>
            )
          })}
        </div>
      </div>
      <div className="card">
        <h3>Vídeo montado en los tres aires</h3>
        <p className="muted small mt8">Máximo un minuto. MP4, MOV o WEBM.</p>
        {h.videos.length > 0 && <p className="mt8">✓ {h.videos.length} vídeo(s) subido(s). El último: {fmtDate(h.videos[0].uploadedAt)}</p>}
        <label className="btn btn-line mt16" style={{ cursor: 'pointer' }}>
          {busy === 'video' ? 'Subiendo…' : 'Subir vídeo'}
          <input type="file" accept="video/mp4,video/quicktime,video/webm" style={{ display: 'none' }} onChange={(e) => upload(`/my/horses/${h.id}/video`, e.target.files[0], 'video')} />
        </label>
      </div>
      <div className="card">
        <h3>Certificados y valoraciones</h3>
        {h.certificates.length ? h.certificates.map((c) => (
          <p key={c.id} className="mt8">{c.type === 'ORIGEN' ? 'Certificado de Origen' : `Certificado de Calidad · ${c.stars} estrellas`} · <Link className="link" to={`/verificar?c=${c.code}`}>{c.code}</Link> · {c.status.toLowerCase()}</p>
        )) : <p className="muted mt8">Sin certificados todavía.</p>}
        {h.cases.map((c) => <p key={c.id} className="small muted mt8">Valoración abierta el {fmtDate(c.createdAt)} · estado: {c.status.replace(/_/g, ' ').toLowerCase()}</p>)}
        <div className="row mt16">
          {!h.registrationNumber && <button className="btn btn-gold" onClick={() => onRequest('ORIGEN')}>Solicitar Certificado de Origen</button>}
          {h.registrationNumber && <button className="btn btn-gold" onClick={() => onRequest('CALIDAD')}>Solicitar Certificado de Calidad</button>}
        </div>
      </div>
    </div>
  )
}

function Requests({ horses, requests, preset, presetHorse, notify }) {
  const [f, setF] = useState({ service: preset || 'ORIGEN', horseId: presetHorse || '', notes: '' })
  const [files, setFiles] = useState([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (!f.horseId && horses[0]) setF((x) => ({ ...x, horseId: horses[0].id })) }, [horses])
  const svc = SERVICES.find((s) => s.code === f.service)
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    const form = new FormData()
    form.append('service', f.service)
    if (f.service !== 'YEGUADA') form.append('horseId', f.horseId)
    form.append('notes', f.notes)
    files.forEach((x) => form.append('documents', x))
    try {
      const r = await api('/my/requests', { method: 'POST', form })
      if (r.checkoutUrl) { window.location.href = r.checkoutUrl; return }
      notify(r.message || 'Solicitud registrada'); setFiles([]); setF({ ...f, notes: '' }); requests.reload()
    } catch (x) { setErr(x.message) }
    setBusy(false)
  }
  return (
    <div className="grid g2" style={{ alignItems: 'start', gap: 32 }}>
      <form className="card form" onSubmit={submit}>
        <h3>Nueva gestión</h3>
        <div className="field"><label>Gestión</label>
          <select className="select" value={f.service} onChange={(e) => setF({ ...f, service: e.target.value })}>
            {SERVICES.map((s) => <option key={s.code} value={s.code}>{s.name} · {eur(s.price)}</option>)}
          </select>
        </div>
        {f.service !== 'YEGUADA' && (
          <div className="field"><label>Ejemplar</label>
            {horses.length ? (
              <select className="select" value={f.horseId} onChange={(e) => setF({ ...f, horseId: e.target.value })}>
                {horses.map((h) => <option key={h.id} value={h.id}>{h.name}{h.registrationNumber ? ` · ${h.registrationNumber}` : ''}</option>)}
              </select>
            ) : <p className="notice">Primero da de alta un ejemplar.</p>}
          </div>
        )}
        {svc && <div className="notice info small"><strong>Documentación requerida:</strong><ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>{svc.docs.map((d) => <li key={d}>{d}</li>)}</ul></div>}
        <div className="field"><label>Documentos (PDF o imagen, hasta 10)</label><input className="input" type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => setFiles([...e.target.files])} /></div>
        <div className="field"><label>Observaciones</label><textarea className="textarea" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
        {err && <p className="notice bad">{err}</p>}
        <button className="btn btn-gold btn-block" disabled={busy || (f.service !== 'YEGUADA' && !horses.length)}>{busy ? 'Enviando…' : `Solicitar y pagar ${svc ? eur(svc.price) : ''}`}</button>
        <p className="small muted">El trámite empieza cuando se recibe el pago. Plazo: {svc?.days} días hábiles.</p>
      </form>
      <div>
        <h3>Mis solicitudes</h3>
        <div className="mt16">
          {(requests.data || []).length ? requests.data.map((r) => {
            const [label, cls] = REQ_STATUS[r.status] || [r.status, 'light']
            return (
              <div key={r.id} className="card" style={{ padding: 18, marginBottom: 12 }}>
                <div className="row between"><strong>{serviceName(r.service)}</strong><span className={`badge ${cls}`}>{label}</span></div>
                <p className="small muted mt8">{r.horseName || 'Yeguada'} · {fmtDate(r.createdAt)}{r.adminNotes ? ` · ${r.adminNotes}` : ''}</p>
              </div>
            )
          }) : <div className="empty">Sin solicitudes todavía.</div>}
        </div>
      </div>
    </div>
  )
}
