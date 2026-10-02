import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { api, openPrivateFile, useAuth, useFetch } from '../api.jsx'
import { Img, LevelBadge, Toast, breedLabel } from '../components/ui.jsx'
import { BREEDS, DOC_ROLES, MERIT_LEVELS, PHOTO_VIEWS, ROMAN, SERVICES, eur, fmtDate } from '../data/content.js'

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
                  <div className="mt8"><LevelBadge level={h.level} /></div>
                  <p className="small muted mt8">Fotos {h.photos.length}/5 · Vídeo {h.videos.length ? 'sí' : 'no'} · Certificados {h.certificates.filter((c) => c.status === 'VIGENTE').length}</p>
                </button>
              ))}
            </div>
          ) : <div className="empty">Aún no tienes ejemplares. <button className="link" style={{ background: 'none', border: 0, cursor: 'pointer' }} onClick={() => setTab('nuevo')}>Da de alta el primero</button>.</div>
        )}
        {tab === 'ejemplares' && current && <HorseManager h={current} onBack={() => setSelected(null)} onChange={horses.reload} notify={setToast} onRequest={(code) => { setParams({ gestion: code, caballo: current.id }); setTab('gestiones') }} />}
        {tab === 'nuevo' && <NewHorse onDone={(h) => { horses.reload(); setSelected(h.id); setTab('ejemplares'); setToast('Ejemplar dado de alta. Ahora sube sus fotografías.') }} />}
        {tab === 'gestiones' && <Requests horses={list} reloadHorses={horses.reload} requests={requests} preset={params.get('gestion')} presetHorse={params.get('caballo')} notify={setToast} />}
      </div>
      <Toast msg={toast} onDone={() => setToast('')} />
    </div>
  )
}

// Qué campos del formulario rellena cada documento
const SEXES = ['MACHO', 'HEMBRA', 'CASTRADO']
function fieldsFromDoc(role, x) {
  const out = {}
  const put = (k, v) => { if (v !== null && v !== undefined && String(v).trim() !== '') out[k] = String(v).trim() }
  if (role === 'PADRE') { put('sireName', x.name); put('sireRegistry', x.officialRegistry) }
  else if (role === 'MADRE') { put('damName', x.name); put('damRegistry', x.officialRegistry) }
  else {
    ;['name', 'coat', 'microchip', 'officialRegistry', 'sireName', 'sireRegistry', 'damName', 'damRegistry', 'breederName', 'country'].forEach((k) => put(k, x[k]))
    if (/^\d{4}-\d{2}-\d{2}$/.test(x.birthDate || '')) put('birthDate', x.birthDate)
    if (SEXES.includes(x.sex)) put('sex', x.sex)
    if (['PRE', 'PSL'].includes(x.breed)) put('breed', x.breed)
  }
  return out
}

function DocUpload({ role, doc, onFile, busy }) {
  return (
    <label className={`doc-slot ${doc ? (doc.aiError ? 'warn' : 'done') : ''}`}>
      <strong>{DOC_ROLES[role]}</strong>
      <span className="small muted">
        {busy ? 'Leyendo el documento…'
          : doc ? (doc.aiError ? `Subido. ${doc.aiError}` : `✓ Leído: ${doc.docType || 'documento'}${doc.notes ? ` · ${doc.notes}` : ''}`)
          : role === 'EJEMPLAR' ? 'Carta genealógica, certificado del libro o pasaporte (foto o PDF)' : 'Su carta genealógica o certificado (foto o PDF)'}
      </span>
      <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => onFile(e.target.files[0])} />
    </label>
  )
}

function NewHorse({ onDone }) {
  const [f, setF] = useState({ name: '', birthDate: '', sex: 'MACHO', breed: 'PRE', coat: '', country: 'España', ibericBloodPct: '', sireName: '', damName: '', breederName: '', microchip: '', officialRegistry: '', sireRegistry: '', damRegistry: '' })
  const cross = f.breed === 'PRE_PSL' || f.breed === 'CRUZADO'
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [docs, setDocs] = useState({})
  const [reading, setReading] = useState('')
  const [aiKeys, setAiKeys] = useState([])
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setAiKeys((a) => a.filter((x) => x !== k)) }
  const ai = (k) => (aiKeys.includes(k) ? 'input ai-filled' : 'input')
  const readDoc = async (role, file) => {
    if (!file) return
    setErr(''); setReading(role)
    try {
      const form = new FormData(); form.append('role', role); form.append('file', file)
      const d = await api('/my/documents/extract', { method: 'POST', form })
      setDocs((x) => ({ ...x, [role]: d }))
      if (d.fields) {
        const add = fieldsFromDoc(role, d.fields)
        setF((x) => ({ ...x, ...add }))
        setAiKeys((a) => [...new Set([...a, ...Object.keys(add)])])
      }
    } catch (x) { setErr(x.message) }
    setReading('')
  }
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try { onDone(await api('/my/horses', { method: 'POST', body: { ...f, documentIds: Object.values(docs).map((d) => d.id) } })) } catch (x) { setErr(x.message) }
    setBusy(false)
  }
  return (
    <form className="card form" onSubmit={submit} style={{ maxWidth: 860 }}>
      <h3>1 · Sube la documentación</h3>
      <p className="muted small">La IA lee el documento y rellena el formulario por ti. Revisa lo que ha puesto (en amarillo) antes de dar de alta: lo acreditará después la presidencia.</p>
      <div className="doc-slots">
        <DocUpload role="EJEMPLAR" doc={docs.EJEMPLAR} busy={reading === 'EJEMPLAR'} onFile={(file) => readDoc('EJEMPLAR', file)} />
        {cross && <DocUpload role="PADRE" doc={docs.PADRE} busy={reading === 'PADRE'} onFile={(file) => readDoc('PADRE', file)} />}
        {cross && <DocUpload role="MADRE" doc={docs.MADRE} busy={reading === 'MADRE'} onFile={(file) => readDoc('MADRE', file)} />}
      </div>
      {!cross && <p className="small muted">¿Es un cruce? Elige «Cruce» en <em>Raza</em> y aparecerán los huecos para los documentos del padre y de la madre.</p>}
      <h3 className="mt16">2 · Revisa los datos del ejemplar</h3>
      {aiKeys.length > 0 && <p className="small ai-note">Los campos en amarillo los ha rellenado la IA a partir del documento. Compruébalos.</p>}
      <div className="grid g3" style={{ gap: 16 }}>
        <div className="field"><label>Nombre *</label><input className={ai('name')} required value={f.name} onChange={set('name')} /></div>
        <div className="field"><label>Fecha de nacimiento *</label><input className={ai('birthDate')} type="date" required value={f.birthDate} onChange={set('birthDate')} /></div>
        <div className="field"><label>Sexo *</label><select className={ai('sex').replace('input', 'select')} value={f.sex} onChange={set('sex')}><option value="MACHO">Macho</option><option value="HEMBRA">Hembra</option><option value="CASTRADO">Castrado</option></select></div>
        <div className="field"><label>Raza *</label><select className={ai('breed').replace('input', 'select')} value={f.breed} onChange={set('breed')}><option value="PRE">PRE</option><option value="PSL">PSL</option><option value="PRE_PSL">Cruce PRE × PSL</option><option value="CRUZADO">Cruce ibérico (hijo de cruces)</option></select></div>
        <div className="field"><label>Capa *</label><input className={ai('coat')} required value={f.coat} onChange={set('coat')} placeholder="Torda, castaña…" /></div>
        <div className="field"><label>País *</label><input className={ai('country')} required value={f.country} onChange={set('country')} /></div>
        <div className="field"><label>% sangre ibérica (si se conoce)</label><input className={ai('ibericBloodPct')} type="number" min={10} max={100} value={f.ibericBloodPct} onChange={set('ibericBloodPct')} placeholder="Déjalo en blanco si no lo sabes" /></div>
        <div className="field"><label>Padre{cross ? ' *' : ''}</label><input className={ai('sireName')} required={cross} value={f.sireName} onChange={set('sireName')} /></div>
        <div className="field"><label>Nº registro del padre{cross ? ' *' : ''}</label><input className={ai('sireRegistry')} required={cross} value={f.sireRegistry} onChange={set('sireRegistry')} placeholder="ANCCE, APSL o CIB-…" /></div>
        <div className="field"><label>Madre{cross ? ' *' : ''}</label><input className={ai('damName')} required={cross} value={f.damName} onChange={set('damName')} /></div>
        <div className="field"><label>Nº registro de la madre{cross ? ' *' : ''}</label><input className={ai('damRegistry')} required={cross} value={f.damRegistry} onChange={set('damRegistry')} placeholder="ANCCE, APSL o CIB-…" /></div>
        <div className="field"><label>Criador</label><input className={ai('breederName')} value={f.breederName} onChange={set('breederName')} /></div>
        <div className="field"><label>Microchip *</label><input className={ai('microchip')} required value={f.microchip} onChange={set('microchip')} /></div>
        <div className="field"><label>Nº en libro oficial (ANCCE, APSL…){cross ? '' : ' *'}</label><input className={ai('officialRegistry')} required={!cross} value={f.officialRegistry} onChange={set('officialRegistry')} /></div>
      </div>
      <p className="notice info">{cross
        ? <>Un cruce puede no estar inscrito en ninguna asociación, pero <strong>sus padres sí deben estar registrados</strong> (ANCCE, APSL o C-IBERICO). Te pediremos sus documentos antes de expedir el certificado.</>
        : <>Indica el número del ejemplar en su libro oficial. Te pediremos el documento antes de expedir el certificado.</>}</p>
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
            <div className="mt8"><LevelBadge level={h.level} /> <span className="small muted">Puedes volver a presentarlo en cada cambio de etapa para subir de nivel.</span></div>
          </div>
          {h.registrationNumber && <label className="small row" style={{ gap: 8 }}><input type="checkbox" checked={h.isPublic} onChange={togglePublic} /> Ficha pública en el registro</label>}
        </div>
      </div>
      <HorseDocs h={h} notify={notify} onChange={onChange} />
      <OwnerMerits h={h} notify={notify} onChange={onChange} />
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
        {h.cases.map((c) => <p key={c.id} className="small muted mt8">Valoración del {fmtDate(c.createdAt)} · {c.status.replace(/_/g, ' ').toLowerCase()}{c.summary ? ` · ${c.summary}` : ''}</p>)}
        <div className="row mt16">
          {!h.registrationNumber && <button className="btn btn-gold" onClick={() => onRequest('ORIGEN')}>Solicitar Certificado de Origen</button>}
          {h.registrationNumber && <button className="btn btn-gold" onClick={() => onRequest('CALIDAD')}>Solicitar Certificado de Calidad</button>}
        </div>
      </div>
    </div>
  )
}

// Resultados deportivos: el titular los aporta con su documento; la presidencia los verifica y entonces suman estrellas
const EMPTY_MERIT = { competition: '', category: '', level: 'JOVENES_NACIONAL', position: '', score: '', date: '' }
function OwnerMerits({ h, notify, onChange, compact }) {
  const [m, setM] = useState(EMPTY_MERIT)
  const [doc, setDoc] = useState(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setM({ ...m, [k]: e.target.value })
  const add = async () => {
    if (!m.competition || !m.category || !m.position || !m.date) return notify('Rellena competición, prueba, puesto y fecha')
    if (!doc) return notify('Adjunta el documento oficial del resultado')
    setBusy(true)
    try {
      const form = new FormData(); Object.entries(m).forEach(([k, v]) => form.append(k, v)); form.append('document', doc)
      await api(`/my/horses/${h.id}/merits`, { method: 'POST', form }); notify('Resultado añadido: queda pendiente de verificar'); setM(EMPTY_MERIT); setDoc(null); setOpen(false); onChange?.()
    } catch (x) { notify(x.message) }
    setBusy(false)
  }
  const Wrap = compact ? 'div' : 'div'
  return (
    <Wrap className={compact ? 'merits-box' : 'card'}>
      <h3 style={compact ? { fontSize: '1rem' } : undefined}>Resultados deportivos {compact && <span className="small muted">(opcional)</span>}</h3>
      <p className="small muted mt8">Añade los resultados en competición con su documento oficial. Una vez verificados aparecen en su ficha y en el Certificado de Calidad, y pueden subir su nivel.</p>
      {(h.merits || []).map((x) => (
        <p key={x.id} className="small mt8">{x.competition} · {x.category} · {x.position}{x.score ? ` · ${x.score}${x.score > 10 ? ' %' : ''}` : ''} · {fmtDate(x.date)} <span className={`badge ${x.verified ? 'ok' : 'example'}`}>{x.verified ? 'verificado' : 'pendiente'}</span></p>
      ))}
      {!open ? <button type="button" className="btn btn-line btn-sm mt16" onClick={() => setOpen(true)}>+ Añadir resultado</button> : (
        <div className="stack mt16" style={{ gap: 8 }}>
          <input className="input" placeholder="Competición (p. ej. Campeonato de España de Caballos Jóvenes)" value={m.competition} onChange={set('competition')} />
          <div className="row" style={{ gap: 8 }}>
            <input className="input" style={{ flex: 1 }} placeholder="Prueba / categoría" value={m.category} onChange={set('category')} />
            <select className="select" style={{ flex: 1 }} value={m.level} onChange={set('level')}>{Object.entries(MERIT_LEVELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <input className="input" style={{ width: 110 }} placeholder="Puesto" value={m.position} onChange={set('position')} />
            <input className="input" style={{ width: 160 }} placeholder="Nota (8,4 o 72,5 %)" value={m.score} onChange={set('score')} />
            <input className="input" style={{ flex: 1 }} type="date" value={m.date} onChange={set('date')} />
          </div>
          <label className="small">Documento oficial (clasificación, acta o certificado) <input className="input mt8" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => setDoc(e.target.files[0])} /></label>
          <div className="row" style={{ gap: 8 }}><button type="button" className="btn btn-ink btn-sm" disabled={busy} onClick={add}>{busy ? 'Guardando…' : 'Guardar resultado'}</button><button type="button" className="btn btn-line btn-sm" onClick={() => setOpen(false)}>Cancelar</button></div>
        </div>
      )}
    </Wrap>
  )
}

function HorseDocs({ h, notify, onChange }) {
  const [role, setRole] = useState('EJEMPLAR')
  const [busy, setBusy] = useState(false)
  const cross = h.breed === 'PRE_PSL' || h.breed === 'CRUZADO'
  const send = async (file) => {
    if (!file) return
    setBusy(true)
    try {
      const form = new FormData(); form.append('role', role); form.append('file', file)
      await api(`/my/horses/${h.id}/documents`, { method: 'POST', form }); notify('Documento subido'); onChange()
    } catch (x) { notify(x.message) }
    setBusy(false)
  }
  return (
    <div className="card">
      <h3>Documentación de procedencia</h3>
      <p className="muted small mt8">{cross ? 'Sube la carta genealógica o el certificado del padre y de la madre (y el del ejemplar, si lo tiene).' : 'Sube la carta genealógica o el certificado del libro oficial del ejemplar.'} Solo la ve la presidencia; no se publica.</p>
      {(h.documents || []).map((d) => (
        <p key={d.id} className="mt8">
          <button type="button" className="link" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }} onClick={() => openPrivateFile(`/my/documents/${d.id}/file`).catch((x) => notify(x.message))}>{DOC_ROLES[d.role]}</button>
          <span className="small muted"> · {d.docType || d.originalName} · {fmtDate(d.createdAt)}</span>
        </p>
      ))}
      <div className="row mt16" style={{ gap: 8 }}>
        <select className="select" style={{ maxWidth: 260 }} value={role} onChange={(e) => setRole(e.target.value)}>
          {Object.entries(DOC_ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label className="btn btn-line" style={{ cursor: 'pointer' }}>
          {busy ? 'Leyendo…' : 'Subir documento'}
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: 'none' }} onChange={(e) => send(e.target.files[0])} />
        </label>
      </div>
    </div>
  )
}

// Pre-valoración automática: vídeo + foto → la IA responde al momento (orientativa)
function Prevaloracion({ picker, notify, onCalidad }) {
  const list = useFetch('/my/prevaloraciones')
  const [f, setF] = useState({ name: '', birthDate: '', breed: 'PRE' })
  const [video, setVideo] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [last, setLast] = useState(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault(); setErr('')
    if (!video) return setErr('Sube el vídeo')
    setBusy(true)
    const form = new FormData(); Object.entries(f).forEach(([k, v]) => form.append(k, v)); form.append('video', video); if (photo) form.append('photo', photo)
    try { const r = await api('/my/prevaloraciones', { method: 'POST', form }); setLast(r); list.reload(); notify('Pre-valoración lista') } catch (x) { setErr(x.message) }
    setBusy(false)
  }
  const remaining = list.data?.remaining
  return (
    <div className="grid g2" style={{ alignItems: 'start', gap: 32 }}>
      <form className="card form" onSubmit={submit}>
        <h3>Pre-valoración gratis</h3>
        {picker}
        <p className="small muted">Sube un vídeo y una foto de perfil: la IA te da al momento una orientación del nivel probable. No hace falta dar de alta el caballo.{remaining != null ? ` Te quedan ${remaining} este mes.` : ''}</p>
        <div className="grid g3" style={{ gap: 12 }}>
          <div className="field"><label>Nombre *</label><input className="input" required value={f.name} onChange={set('name')} /></div>
          <div className="field"><label>Nacimiento *</label><input className="input" type="date" required value={f.birthDate} onChange={set('birthDate')} /></div>
          <div className="field"><label>Raza</label><select className="select" value={f.breed} onChange={set('breed')}>{Object.entries(BREEDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        </div>
        <div className="field"><label>Vídeo * (30–60 s, de lado, cámara quieta a 10–15 m: trote y, si puede ser, paso y galope)</label><input className="input" type="file" accept="video/mp4,video/quicktime,video/webm" onChange={(e) => setVideo(e.target.files[0])} /></div>
        <div className="field"><label>Foto de perfil (caballo cuadrado)</label><input className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files[0])} /></div>
        {err && <p className="notice bad">{err}</p>}
        <button className="btn btn-gold btn-block" disabled={busy || remaining === 0}>{busy ? 'La IA está analizando el vídeo… (puede tardar 1–2 minutos)' : 'Pre-valorar gratis'}</button>
        <p className="small muted">Es una orientación, no un certificado. El nivel oficial se obtiene con el Certificado de Calidad (5 fotos y vídeo completo).</p>
      </form>
      <div>
        {last && <PrevalResult r={last} onCalidad={onCalidad} highlight />}
        <h3 className={last ? 'mt24' : ''}>Mis pre-valoraciones</h3>
        <div className="mt16">
          {(list.data?.items || []).filter((r) => r.id !== last?.id).map((r) => <PrevalResult key={r.id} r={r} onCalidad={onCalidad} />)}
          {!list.data?.items?.length && !last && <div className="empty">Aún no has hecho ninguna.</div>}
        </div>
      </div>
    </div>
  )
}

function PrevalResult({ r, onCalidad, highlight }) {
  const res = r.result || {}
  return (
    <div className={`card preval ${highlight ? 'hl' : ''}`} style={{ marginBottom: 12 }}>
      <div className="row between"><strong>{r.horseName}</strong><span className="small muted">{fmtDate(r.createdAt)}</span></div>
      {r.error ? <p className="small muted mt8">No se pudo analizar: inténtalo de nuevo.</p> : r.level != null ? (
        <>
          <p className="mt8">Nivel probable: <LevelBadge level={r.level} /> <span className="small muted">· {Number(r.score).toFixed(1)}/100{res.stageName ? ` · etapa ${res.stageName} (máx. ${ROMAN[res.cap]})` : ''}</span></p>
          {highlight && (
            <ul className="small mt8" style={{ paddingLeft: 18, margin: '8px 0 0' }}>
              {(res.items || []).filter((i) => i.score != null).map((i) => <li key={i.key}><strong>{i.name}: {i.score}</strong>{i.observation ? ` — ${i.observation}` : ''}</li>)}
            </ul>
          )}
          {highlight && <button type="button" className="btn btn-ink btn-sm mt16" onClick={onCalidad}>Pedir el Certificado de Calidad</button>}
        </>
      ) : <p className="small mt8">El vídeo no permite valorar los tres aires. Repite la grabación de lado, con la cámara quieta, mostrando paso, trote y galope.</p>}
    </div>
  )
}

function Requests({ horses, reloadHorses, requests, preset, presetHorse, notify }) {
  const [f, setF] = useState({ service: preset || 'PREVALORACION', horseId: presetHorse || '', notes: '' })
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
  const picker = (
    <div className="field"><label>Gestión</label>
      <select className="select" value={f.service} onChange={(e) => setF({ ...f, service: e.target.value })}>
        {SERVICES.map((s) => <option key={s.code} value={s.code}>{s.name} · {eur(s.price)}</option>)}
      </select>
    </div>
  )
  if (f.service === 'PREVALORACION') return <Prevaloracion picker={picker} notify={notify} onCalidad={() => setF({ ...f, service: 'CALIDAD' })} />
  return (
    <div className="grid g2" style={{ alignItems: 'start', gap: 32 }}>
      <form className="card form" onSubmit={submit}>
        <h3>Nueva gestión</h3>
        {picker}
        {f.service !== 'YEGUADA' && (
          <div className="field"><label>Ejemplar</label>
            {horses.length ? (
              <select className="select" value={f.horseId} onChange={(e) => setF({ ...f, horseId: e.target.value })}>
                {horses.map((h) => <option key={h.id} value={h.id}>{h.name}{h.registrationNumber ? ` · ${h.registrationNumber}` : ''}</option>)}
              </select>
            ) : <p className="notice">Primero da de alta un ejemplar.</p>}
          </div>
        )}
        {f.service === 'CALIDAD' && horses.find((h) => h.id === f.horseId) && <OwnerMerits h={horses.find((h) => h.id === f.horseId)} notify={notify} onChange={reloadHorses} compact />}
        {svc && <div className="notice info small"><strong>Documentación requerida:</strong><ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>{svc.docs.map((d) => <li key={d}>{d}</li>)}</ul></div>}
        <div className="field"><label>Documentos (PDF o imagen, hasta 10)</label><input className="input" type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => setFiles([...e.target.files])} /></div>
        <div className="field"><label>Observaciones</label><textarea className="textarea" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
        {err && <p className="notice bad">{err}</p>}
        <button className="btn btn-gold btn-block" disabled={busy || (f.service !== 'YEGUADA' && !horses.length)}>{busy ? 'Enviando…' : svc?.price === 0 ? 'Solicitar (gratis)' : `Solicitar y pagar ${svc ? eur(svc.price) : ''}`}</button>
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
