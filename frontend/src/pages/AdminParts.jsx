// Panel de la presidencia: inicio, ejemplares, usuarios, certificados, méritos, pagos y exportaciones
import { useEffect, useState } from 'react'
import { api, downloadPrivate, useFetch } from '../api.jsx'
import { LevelBadge, breedLabel } from '../components/ui.jsx'
import { MERIT_LEVELS, ORIGIN, ROMAN, SERVICES, fmtDate } from '../data/content.js'

const pretty = (s) => (s || '').replace(/_/g, ' ').toLowerCase()
const eurs = (n) => `${Number(n || 0).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`
const serviceName = (c) => SERVICES.find((s) => s.code === c)?.name || c || '—'
const HORSE_STATUS = { PENDIENTE: 'Pendiente', CERTIFICADO: 'Certificado', RECHAZADO: 'Rechazado', BAJA: 'Baja' }

// Retrasa la búsqueda mientras se escribe
function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t) }, [value, ms])
  return v
}

export function ExportButton({ kind, label = 'Descargar Excel (CSV)', notify }) {
  const [busy, setBusy] = useState(false)
  const go = async () => {
    setBusy(true)
    try { await downloadPrivate(`/admin/export/${kind}`, `c-iberico-${kind}-${new Date().toISOString().slice(0, 10)}.csv`) } catch (x) { notify?.(x.message) }
    setBusy(false)
  }
  return <button type="button" className="btn btn-line btn-sm" onClick={go} disabled={busy}>{busy ? 'Preparando…' : `⬇ ${label}`}</button>
}

// ─── INICIO ───
export function Dashboard({ go }) {
  const { data: s } = useFetch('/admin/stats')
  if (!s) return <p className="muted">Cargando…</p>
  const tile = (n, label, sub, tab) => (
    <button type="button" className="dash-tile" onClick={() => tab && go(tab)} disabled={!tab}>
      <strong>{n}</strong><span>{label}</span>{sub && <em>{sub}</em>}
    </button>
  )
  return (
    <div className="stack">
      <div>
        <span className="eyebrow">Pendiente de ti</span>
        <div className="dash-grid mt8">
          {tile(s.pending, 'Gestiones abiertas', 'pago, revisión o documentación', 'gestiones')}
          {tile(s.openCases, 'Valoraciones abiertas', 'por resolver', 'casos')}
          {tile(s.pendingOrigin, 'Procedencias por acreditar', 'ejemplares sin Certificado de Origen', 'ejemplares')}
          {tile(s.unverifiedMerits, 'Resultados por verificar', 'méritos deportivos', 'meritos')}
        </div>
      </div>
      <div>
        <span className="eyebrow">Registro</span>
        <div className="dash-grid mt8">
          {tile(s.horses, 'Ejemplares', `${s.horsesMonth} en los últimos 30 días`, 'ejemplares')}
          {tile(s.certified, 'Con Certificado de Origen', null, 'certificados')}
          {tile(s.quality, 'Con Certificado de Calidad', null, 'certificados')}
          {tile(s.users, 'Usuarios', `${s.usersMonth} en los últimos 30 días`, 'usuarios')}
        </div>
      </div>
      <div>
        <span className="eyebrow">Dinero e IA</span>
        <div className="dash-grid mt8">
          {tile(eurs(s.revenue), 'Cobrado en total', null, 'pagos')}
          {tile(eurs(s.revenueMonth), 'Cobrado este mes', null, 'pagos')}
          {tile(s.aiRunsMonth, 'Valoraciones con IA este mes', 'cada una ≈ 0,10–0,15 $')}
          {tile(s.docsMonth, 'Documentos leídos este mes', 'cada uno ≈ 0,01–0,02 $')}
        </div>
      </div>
    </div>
  )
}

// ─── EJEMPLARES ───
const EMPTY_HORSE = { name: '', birthDate: '', sex: 'MACHO', breed: 'PRE', coat: '', country: 'España', ibericBloodPct: '', sireName: '', sireRegistry: '', damName: '', damRegistry: '', breederName: '', microchip: '', officialRegistry: '', ownerEmail: '', externalOwner: '', adminNotes: '' }

export function HorseFields({ f, setF, withOwner }) {
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const cross = f.breed === 'PRE_PSL' || f.breed === 'CRUZADO'
  return (
    <div className="grid g3" style={{ gap: 14 }}>
      <div className="field"><label>Nombre *</label><input className="input" required value={f.name} onChange={set('name')} /></div>
      <div className="field"><label>Nacimiento *</label><input className="input" type="date" required value={f.birthDate} onChange={set('birthDate')} /></div>
      <div className="field"><label>Sexo *</label><select className="select" value={f.sex} onChange={set('sex')}><option value="MACHO">Macho</option><option value="HEMBRA">Hembra</option><option value="CASTRADO">Castrado</option></select></div>
      <div className="field"><label>Raza *</label><select className="select" value={f.breed} onChange={set('breed')}><option value="PRE">PRE</option><option value="PSL">PSL</option><option value="PRE_PSL">Cruce PRE × PSL</option><option value="CRUZADO">Cruce ibérico</option></select></div>
      <div className="field"><label>Capa *</label><input className="input" required value={f.coat} onChange={set('coat')} /></div>
      <div className="field"><label>País *</label><input className="input" required value={f.country} onChange={set('country')} /></div>
      <div className="field"><label>Microchip *</label><input className="input" required value={f.microchip} onChange={set('microchip')} /></div>
      <div className="field"><label>Nº libro oficial{cross ? '' : ' *'}</label><input className="input" required={!cross} value={f.officialRegistry || ''} onChange={set('officialRegistry')} /></div>
      <div className="field"><label>% sangre ibérica</label><input className="input" type="number" min={10} max={100} value={f.ibericBloodPct ?? ''} onChange={set('ibericBloodPct')} /></div>
      <div className="field"><label>Padre{cross ? ' *' : ''}</label><input className="input" required={cross} value={f.sireName || ''} onChange={set('sireName')} /></div>
      <div className="field"><label>Nº registro padre{cross ? ' *' : ''}</label><input className="input" required={cross} value={f.sireRegistry || ''} onChange={set('sireRegistry')} /></div>
      <div className="field"><label>Criador</label><input className="input" value={f.breederName || ''} onChange={set('breederName')} /></div>
      <div className="field"><label>Madre{cross ? ' *' : ''}</label><input className="input" required={cross} value={f.damName || ''} onChange={set('damName')} /></div>
      <div className="field"><label>Nº registro madre{cross ? ' *' : ''}</label><input className="input" required={cross} value={f.damRegistry || ''} onChange={set('damRegistry')} /></div>
      {withOwner && <>
        <div className="field"><label>Email del titular (si tiene cuenta)</label><input className="input" type="email" value={f.ownerEmail || ''} onChange={set('ownerEmail')} placeholder="Vacío = queda a cargo de la presidencia" /></div>
        <div className="field"><label>Titular sin cuenta (nombre)</label><input className="input" value={f.externalOwner || ''} onChange={set('externalOwner')} placeholder="Opcional" /></div>
        <div className="field"><label>Notas internas</label><input className="input" value={f.adminNotes || ''} onChange={set('adminNotes')} placeholder="No se publican" /></div>
      </>}
    </div>
  )
}

export function AdminHorses({ isAdmin, notify, open }) {
  const [q, setQ] = useState('')
  const [fl, setFl] = useState({ status: '', breed: '', origin: '' })
  const [creating, setCreating] = useState(false)
  const [f, setF] = useState(EMPTY_HORSE)
  const [busy, setBusy] = useState(false)
  const dq = useDebounced(q)
  const qs = new URLSearchParams({ q: dq, ...fl }).toString()
  const { data, loading, reload } = useFetch(`/admin/horses?${qs}`)
  const create = async (e) => {
    e.preventDefault(); setBusy(true)
    try { const h = await api('/admin/horses', { method: 'POST', body: f }); notify('Ejemplar dado de alta'); setF(EMPTY_HORSE); setCreating(false); reload(); open(h.id) } catch (x) { notify(x.message) }
    setBusy(false)
  }
  return (
    <div className="stack">
      <div className="row between" style={{ gap: 12, flexWrap: 'wrap' }}>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap', flex: 1 }}>
          <input className="input" style={{ flex: 1, minWidth: 220 }} placeholder="Buscar por nombre, nº CIB, microchip o titular…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="select" style={{ width: 160 }} value={fl.status} onChange={(e) => setFl({ ...fl, status: e.target.value })}><option value="">Todos los estados</option>{Object.entries(HORSE_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select className="select" style={{ width: 150 }} value={fl.breed} onChange={(e) => setFl({ ...fl, breed: e.target.value })}><option value="">Todas las razas</option><option value="PRE">PRE</option><option value="PSL">PSL</option><option value="PRE_PSL">Cruce PRE × PSL</option><option value="CRUZADO">Cruce ibérico</option></select>
          <select className="select" style={{ width: 190 }} value={fl.origin} onChange={(e) => setFl({ ...fl, origin: e.target.value })}><option value="">Toda procedencia</option><option value="DECLARADO">Pendiente de acreditar</option><option value="ACREDITADO">Acreditada</option></select>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {isAdmin && <ExportButton kind="ejemplares" notify={notify} />}
          {isAdmin && <button className="btn btn-gold btn-sm" onClick={() => setCreating(!creating)}>{creating ? 'Cerrar' : '+ Nuevo ejemplar'}</button>}
        </div>
      </div>
      {creating && (
        <form className="card form" onSubmit={create}>
          <h3>Alta de ejemplar por la presidencia</h3>
          <p className="small muted">Se aplica el mismo reglamento que a los titulares (microchip, libro oficial o padres documentados). Después podrás acreditar la procedencia y expedir sus certificados.</p>
          <HorseFields f={f} setF={setF} withOwner />
          <div><button className="btn btn-ink" disabled={busy}>{busy ? 'Guardando…' : 'Dar de alta'}</button></div>
        </form>
      )}
      {loading && !data ? <p className="muted">Cargando…</p> : !data?.length ? <div className="empty">No hay ejemplares con esos filtros.</div> : (
        <div className="table-scroll">
          <table className="table">
            <thead><tr><th>Ejemplar</th><th>Titular</th><th>Estado</th><th>Procedencia</th><th>Nivel</th><th>Material</th><th /></tr></thead>
            <tbody>{data.map((h) => (
              <tr key={h.id}>
                <td><span className="t-name">{h.name}</span><div className="k">{h.registrationNumber || 'sin nº'} · {breedLabel(h.breed)}{h.laureado ? ' · Laureado' : ''}{h.isPublic ? '' : ' · oculto'}</div></td>
                <td className="small">{h.externalOwner || h.ownerName}<div className="muted">{h.ownerEmail}</div></td>
                <td><span className={`badge ${h.status === 'CERTIFICADO' ? 'ok' : h.status === 'BAJA' || h.status === 'RECHAZADO' ? 'bad' : 'example'}`}>{HORSE_STATUS[h.status]}</span>{h.hasQuality && <div className="small mt8">+ Calidad</div>}</td>
                <td className="small">{ORIGIN[h.originStatus]}</td>
                <td><LevelBadge level={h.level} /></td>
                <td className="small">Fotos {h.photoCount}/5 · Vídeo {h.videoCount ? 'sí' : 'no'}</td>
                <td><button className="btn btn-line btn-sm" onClick={() => open(h.id)}>Gestionar</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Edición completa de un ejemplar (presidencia)
export function HorseEditCard({ h, notify, reload }) {
  const toForm = () => ({
    name: h.name, birthDate: h.birthDate, sex: h.sex, breed: h.breed, coat: h.coat, country: h.country, ibericBloodPct: h.ibericBloodPct ?? '',
    sireName: h.sireName || '', sireRegistry: h.sireRegistry || '', damName: h.damName || '', damRegistry: h.damRegistry || '', breederName: h.breederName || '',
    microchip: h.microchip || '', officialRegistry: h.officialRegistry || '', ownerEmail: h.ownerEmail || '', externalOwner: h.externalOwner || '', adminNotes: h.adminNotes || '',
  })
  const [open, setOpen] = useState(false)
  const [f, setF] = useState(toForm)
  const [busy, setBusy] = useState(false)
  useEffect(() => { setF(toForm()) }, [h.id, h.updatedAt]) // eslint-disable-line react-hooks/exhaustive-deps
  const patch = async (body, msg) => {
    setBusy(true)
    try { await api(`/admin/horses/${h.id}`, { method: 'PATCH', body }); notify(msg); reload(); return true } catch (x) { notify(x.message); return false } finally { setBusy(false) }
  }
  const save = async (e) => { e.preventDefault(); if (await patch(f, 'Datos guardados')) setOpen(false) }
  const setStatus = (status) => {
    const label = { BAJA: 'dar de baja', PENDIENTE: 'reactivar', CERTIFICADO: 'reactivar', RECHAZADO: 'rechazar' }[status]
    if (window.confirm(`¿Seguro que quieres ${label} este ejemplar?`)) patch({ status }, 'Estado actualizado')
  }
  return (
    <div className="card">
      <div className="row between" style={{ flexWrap: 'wrap', gap: 8 }}>
        <h3>Control de la presidencia</h3>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-line btn-sm" disabled={busy} onClick={() => patch({ isPublic: !h.isPublic }, h.isPublic ? 'Ficha oculta' : 'Ficha publicada')}>{h.isPublic ? 'Ocultar del registro' : 'Publicar en el registro'}</button>
          {h.status !== 'BAJA' && <button type="button" className="btn btn-line btn-sm" disabled={busy} onClick={() => setStatus('BAJA')}>Dar de baja</button>}
          {h.status === 'BAJA' && <button type="button" className="btn btn-line btn-sm" disabled={busy} onClick={() => setStatus(h.registrationNumber ? 'CERTIFICADO' : 'PENDIENTE')}>Reactivar</button>}
          {h.status === 'PENDIENTE' && <button type="button" className="btn btn-line btn-sm" disabled={busy} onClick={() => setStatus('RECHAZADO')}>Rechazar</button>}
          {h.status === 'RECHAZADO' && <button type="button" className="btn btn-line btn-sm" disabled={busy} onClick={() => setStatus('PENDIENTE')}>Volver a pendiente</button>}
          <button type="button" className="btn btn-ink btn-sm" onClick={() => setOpen(!open)}>{open ? 'Cerrar' : 'Editar datos'}</button>
        </div>
      </div>
      <div className="row mt16" style={{ gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <label className="row small" style={{ gap: 8 }}><input type="checkbox" checked={h.laureado} disabled={busy} onChange={(e) => patch({ laureado: e.target.checked }, e.target.checked ? 'Incluido en la Lista Laureada' : 'Retirado de la Lista Laureada')} /> En la Lista Laureada Ámbar</label>
        <label className="row small" style={{ gap: 8 }}>Estrellas ámbar
          <input className="input" type="number" min="0" max="99" style={{ width: 80 }} defaultValue={h.amberStars} key={h.amberStars} onBlur={(e) => Number(e.target.value) !== h.amberStars && patch({ amberStars: e.target.value }, 'Estrellas ámbar actualizadas')} />
        </label>
        {h.adminNotes && <span className="small muted">Nota interna: {h.adminNotes}</span>}
      </div>
      {open && (
        <form className="form mt16" onSubmit={save}>
          <HorseFields f={f} setF={setF} withOwner />
          <p className="small muted">Cambiar el email del titular traspasa el ejemplar a esa cuenta (debe existir). Cada cambio queda en la auditoría.</p>
          <div><button className="btn btn-gold" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</button></div>
        </form>
      )}
    </div>
  )
}

// ─── USUARIOS ───
const EMPTY_USER = { email: '', firstName: '', lastName: '', phone: '', country: 'España', city: '', role: 'TITULAR' }

export function UsersAdmin({ notify, me }) {
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const { data, loading, reload } = useFetch(`/admin/users?q=${encodeURIComponent(dq)}`)
  const [sel, setSel] = useState(null)
  const [creating, setCreating] = useState(false)
  const [f, setF] = useState(EMPTY_USER)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const create = async (e) => {
    e.preventDefault()
    try {
      const u = await api('/admin/users', { method: 'POST', body: f })
      window.alert(`Cuenta creada para ${u.email}.\n\nContraseña provisional: ${u.tempPassword}\n\nCópiala ahora y envíasela: no se vuelve a mostrar.`)
      setF(EMPTY_USER); setCreating(false); reload()
    } catch (x) { notify(x.message) }
  }
  if (sel) return <UserDetail id={sel} me={me} notify={notify} onBack={() => { setSel(null); reload() }} />
  return (
    <div className="stack">
      <div className="row between" style={{ gap: 8, flexWrap: 'wrap' }}>
        <input className="input" style={{ flex: 1, minWidth: 240 }} placeholder="Buscar por nombre, email o teléfono…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="row" style={{ gap: 8 }}>
          <ExportButton kind="usuarios" notify={notify} />
          <button className="btn btn-gold btn-sm" onClick={() => setCreating(!creating)}>{creating ? 'Cerrar' : '+ Nueva cuenta'}</button>
        </div>
      </div>
      {creating && (
        <form className="card form" onSubmit={create}>
          <h3>Crear cuenta</h3>
          <div className="grid g3" style={{ gap: 14 }}>
            <div className="field"><label>Email *</label><input className="input" type="email" required value={f.email} onChange={set('email')} /></div>
            <div className="field"><label>Nombre *</label><input className="input" required value={f.firstName} onChange={set('firstName')} /></div>
            <div className="field"><label>Apellidos *</label><input className="input" required value={f.lastName} onChange={set('lastName')} /></div>
            <div className="field"><label>Teléfono</label><input className="input" value={f.phone} onChange={set('phone')} /></div>
            <div className="field"><label>País</label><input className="input" value={f.country} onChange={set('country')} /></div>
            <div className="field"><label>Rol</label><select className="select" value={f.role} onChange={set('role')}><option value="TITULAR">Titular</option><option value="EVALUADOR">Evaluador</option><option value="ADMIN">Presidencia</option></select></div>
          </div>
          <p className="small muted">Se genera una contraseña provisional que verás una sola vez para enviársela.</p>
          <div><button className="btn btn-ink">Crear cuenta</button></div>
        </form>
      )}
      {loading && !data ? <p className="muted">Cargando…</p> : (
        <div className="table-scroll">
          <table className="table">
            <thead><tr><th>Usuario</th><th>Rol</th><th>Ejemplares</th><th>Gestiones</th><th>Alta</th><th>Estado</th><th /></tr></thead>
            <tbody>{(data || []).map((u) => (
              <tr key={u.id}>
                <td><span className="t-name">{u.firstName} {u.lastName}</span><div className="small muted">{u.email}{u.phone ? ` · ${u.phone}` : ''}</div></td>
                <td className="small">{{ ADMIN: 'Presidencia', EVALUADOR: 'Evaluador', TITULAR: 'Titular' }[u.role]}</td>
                <td>{u.horseCount}</td>
                <td>{u.requestCount}</td>
                <td className="small">{fmtDate(u.createdAt)}</td>
                <td><span className={`badge ${u.isActive ? 'ok' : 'bad'}`}>{u.isActive ? 'activa' : 'bloqueada'}</span></td>
                <td><button className="btn btn-line btn-sm" onClick={() => setSel(u.id)}>Abrir</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function UserDetail({ id, me, notify, onBack }) {
  const { data: u, reload } = useFetch(`/admin/users/${id}`)
  const [f, setF] = useState(null)
  useEffect(() => { if (u) setF({ email: u.email, firstName: u.firstName, lastName: u.lastName, phone: u.phone || '', country: u.country || '', city: u.city || '', role: u.role }) }, [u])
  if (!u || !f) return <p className="muted">Cargando…</p>
  const self = u.id === me
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const patch = async (body, msg) => { try { await api(`/admin/users/${id}`, { method: 'PATCH', body }); notify(msg); reload() } catch (x) { notify(x.message) } }
  const resetPw = async () => {
    if (!window.confirm('¿Generar una contraseña nueva? La actual dejará de funcionar.')) return
    try { const r = await api(`/admin/users/${id}/password`, { method: 'POST' }); window.alert(`Nueva contraseña provisional para ${r.email}:\n\n${r.tempPassword}\n\nCópiala ahora: no se vuelve a mostrar.`) } catch (x) { notify(x.message) }
  }
  return (
    <div className="stack">
      <button className="link" style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0 }} onClick={onBack}>← Usuarios</button>
      <form className="card form" onSubmit={(e) => { e.preventDefault(); patch(f, 'Usuario actualizado') }}>
        <div className="row between" style={{ flexWrap: 'wrap', gap: 8 }}>
          <h3>{u.firstName} {u.lastName} {!u.isActive && <span className="badge bad">bloqueada</span>}</h3>
          <div className="row" style={{ gap: 8 }}>
            <button type="button" className="btn btn-line btn-sm" onClick={resetPw}>Nueva contraseña</button>
            {!self && <button type="button" className="btn btn-line btn-sm" onClick={() => window.confirm(u.isActive ? '¿Bloquear esta cuenta? No podrá entrar.' : '¿Desbloquear esta cuenta?') && patch({ isActive: !u.isActive }, u.isActive ? 'Cuenta bloqueada' : 'Cuenta desbloqueada')}>{u.isActive ? 'Bloquear cuenta' : 'Desbloquear'}</button>}
          </div>
        </div>
        <div className="grid g3" style={{ gap: 14 }}>
          <div className="field"><label>Email</label><input className="input" type="email" value={f.email} onChange={set('email')} /></div>
          <div className="field"><label>Nombre</label><input className="input" value={f.firstName} onChange={set('firstName')} /></div>
          <div className="field"><label>Apellidos</label><input className="input" value={f.lastName} onChange={set('lastName')} /></div>
          <div className="field"><label>Teléfono</label><input className="input" value={f.phone} onChange={set('phone')} /></div>
          <div className="field"><label>País</label><input className="input" value={f.country} onChange={set('country')} /></div>
          <div className="field"><label>Rol</label><select className="select" value={f.role} disabled={self} onChange={set('role')}><option value="TITULAR">Titular</option><option value="EVALUADOR">Evaluador</option><option value="ADMIN">Presidencia</option></select></div>
        </div>
        <div><button className="btn btn-gold">Guardar cambios</button></div>
      </form>
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div className="card">
          <h3>Ejemplares ({u.horses.length})</h3>
          {u.horses.length ? u.horses.map((h) => <p key={h.id} className="mt8">{h.name} <span className="small muted">· {h.registrationNumber || 'sin nº'} · {breedLabel(h.breed)} · {pretty(h.status)} · nivel {ROMAN[h.level] || '—'}</span></p>) : <p className="muted mt8">Ninguno.</p>}
        </div>
        <div className="card">
          <h3>Gestiones ({u.requests.length})</h3>
          {u.requests.length ? u.requests.map((r) => <p key={r.id} className="mt8">{serviceName(r.service)} <span className="small muted">· {pretty(r.status)} · {fmtDate(r.createdAt)}</span></p>) : <p className="muted mt8">Ninguna.</p>}
        </div>
      </div>
    </div>
  )
}

// ─── CERTIFICADOS ───
export function CertificatesAdmin({ notify, openHorse }) {
  const [q, setQ] = useState('')
  const dq = useDebounced(q)
  const { data, loading, reload } = useFetch(`/admin/certificates?q=${encodeURIComponent(dq)}`)
  const revoke = async (c) => {
    const reason = window.prompt(`Motivo de la revocación de ${c.code}`)
    if (!reason) return
    try { await api(`/admin/certificates/${c.id}/revoke`, { method: 'POST', body: { reason } }); notify('Certificado revocado'); reload() } catch (x) { notify(x.message) }
  }
  return (
    <div className="stack">
      <div className="row between" style={{ gap: 8, flexWrap: 'wrap' }}>
        <input className="input" style={{ flex: 1, minWidth: 240 }} placeholder="Buscar por código, ejemplar o nº CIB…" value={q} onChange={(e) => setQ(e.target.value)} />
        <ExportButton kind="certificados" notify={notify} />
      </div>
      {loading && !data ? <p className="muted">Cargando…</p> : !data?.length ? <div className="empty">Sin certificados.</div> : (
        <div className="table-scroll">
          <table className="table">
            <thead><tr><th>Certificado</th><th>Ejemplar</th><th>Expedido</th><th>Estado</th><th /></tr></thead>
            <tbody>{data.map((c) => (
              <tr key={c.id}>
                <td><span className="t-name">{c.type === 'ORIGEN' ? 'Origen' : `Calidad · nivel ${ROMAN[c.level] || '—'}`}</span><div className="k">{c.code}</div></td>
                <td className="small"><button type="button" className="link" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }} onClick={() => openHorse(c.horseId)}>{c.horseName}</button><div className="muted">{c.registrationNumber || 'sin nº'}</div></td>
                <td className="small">{fmtDate(c.issuedAt)}</td>
                <td><span className={`badge ${c.status === 'VIGENTE' ? 'ok' : 'bad'}`}>{c.status.toLowerCase()}</span>{c.notes && <div className="small muted mt8">{c.notes}</div>}</td>
                <td>{c.status === 'VIGENTE' && <button className="btn btn-line btn-sm" onClick={() => revoke(c)}>Revocar</button>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── MÉRITOS ───
export function MeritsAdmin({ notify, isAdmin, openHorse }) {
  const { data, loading, reload } = useFetch('/admin/merits')
  const verify = async (m) => { try { await api(`/admin/merits/${m.id}/verify`, { method: 'POST' }); notify('Resultado verificado'); reload() } catch (x) { notify(x.message) } }
  return (
    <div className="stack">
      <div className="row between"><p className="small muted">Los resultados se añaden desde la ficha de cada ejemplar. Aquí ves todos, primero los pendientes de verificar.</p>{isAdmin && <ExportButton kind="meritos" notify={notify} />}</div>
      {loading && !data ? <p className="muted">Cargando…</p> : !data?.length ? <div className="empty">Sin resultados deportivos.</div> : (
        <div className="table-scroll">
          <table className="table">
            <thead><tr><th>Ejemplar</th><th>Competición</th><th>Nivel</th><th>Puesto</th><th>Fecha</th><th>Estrellas</th><th>Estado</th></tr></thead>
            <tbody>{data.map((m) => (
              <tr key={m.id}>
                <td className="small"><button type="button" className="link" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }} onClick={() => openHorse(m.horseId)}>{m.horseName}</button></td>
                <td className="small">{m.competition}<div className="muted">{m.category}</div></td>
                <td className="small">{MERIT_LEVELS[m.level]}</td>
                <td className="small">{m.position}{m.score ? ` · ${m.score}%` : ''}</td>
                <td className="small">{fmtDate(m.date)}</td>
                <td>{m.starsGiven}★</td>
                <td>{m.verified ? <span className="badge ok">verificado</span> : isAdmin ? <button className="btn btn-line btn-sm" onClick={() => verify(m)}>Verificar</button> : <span className="badge example">pendiente</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── PAGOS ───
export function PaymentsAdmin({ notify }) {
  const { data, loading } = useFetch('/admin/payments')
  return (
    <div className="stack">
      <div className="row between"><p className="small muted">Cobros por gestiones (Stripe). Las devoluciones se hacen desde el panel de Stripe.</p><ExportButton kind="pagos" notify={notify} /></div>
      {loading && !data ? <p className="muted">Cargando…</p> : !data?.length ? <div className="empty">Aún no hay pagos.</div> : (
        <div className="table-scroll">
          <table className="table">
            <thead><tr><th>Fecha</th><th>Usuario</th><th>Gestión</th><th>Importe</th><th>Estado</th></tr></thead>
            <tbody>{data.map((p) => (
              <tr key={p.id}>
                <td className="small">{fmtDate(p.createdAt)}</td>
                <td className="small">{p.userName}<div className="muted">{p.userEmail}</div></td>
                <td className="small">{serviceName(p.service)}</td>
                <td>{eurs(p.amount / 100)}</td>
                <td><span className={`badge ${p.status === 'COMPLETADO' ? 'ok' : p.status === 'PENDIENTE' ? 'example' : 'bad'}`}>{pretty(p.status)}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
