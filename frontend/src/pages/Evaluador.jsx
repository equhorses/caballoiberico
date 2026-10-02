import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api, fileUrl, openPrivateFile, useAuth, useFetch } from '../api.jsx'
import { Img, LevelBadge, Toast, breedLabel } from '../components/ui.jsx'
import { AdminHorses, CertificatesAdmin, Dashboard, ExportButton, HorseEditCard, MeritsAdmin, PaymentsAdmin, UsersAdmin } from './AdminParts.jsx'
import { DOC_ROLES, LEVEL_REASON, MERIT_LEVELS, ORIGIN, PHOTO_VIEWS, STARS_TXT, SERVICES, fmtDate } from '../data/content.js'

const CASE_STATUS = { REVISION_MATERIAL: 'Revisión de material', EN_REVISION_HUMANA: 'En revisión humana', REQUIERE_MATERIAL: 'Requiere material', RESUELTO: 'Resuelto' }
const MATERIAL = [['APTO', 'Apto'], ['APTO_PARCIAL', 'Apto parcialmente'], ['REQUIERE_MATERIAL', 'Requiere nuevo material'], ['NO_EVALUABLE', 'No evaluable']]
const REQ = ['PENDIENTE_PAGO', 'PAGADA', 'EN_REVISION', 'REQUIERE_DOCUMENTACION', 'RESUELTA', 'RECHAZADA']
const pretty = (s) => (s || '').replace(/_/g, ' ').toLowerCase()

export default function Evaluador() {
  const { user, isStaff, isAdmin } = useAuth()
  const [tab, setTab] = useState(isAdmin ? 'inicio' : 'casos')
  const [caseId, setCaseId] = useState(null)
  const [horseId, setHorseId] = useState(null)
  const [toast, setToast] = useState('')
  if (!user) return <Navigate to="/acceder?next=/evaluador" replace />
  if (!isStaff) return <Navigate to="/panel" replace />

  const tabs = isAdmin
    ? [['inicio', 'Inicio'], ['casos', 'Valoraciones'], ['ejemplares', 'Ejemplares'], ['gestiones', 'Gestiones'], ['certificados', 'Certificados'], ['meritos', 'Méritos'], ['pagos', 'Pagos'], ['usuarios', 'Usuarios'], ['rubrica', 'Rúbrica'], ['auditoria', 'Auditoría']]
    : [['casos', 'Valoraciones'], ['ejemplares', 'Ejemplares'], ['gestiones', 'Gestiones'], ['meritos', 'Méritos'], ['rubrica', 'Rúbrica']]
  const go = (k) => { setTab(k); setCaseId(null); setHorseId(null) }
  const openHorse = (id) => { setTab('ejemplares'); setCaseId(null); setHorseId(id) }

  return (
    <div className="app-shell">
      <div className="app-top">
        <div className="wrap">
          <span className="eyebrow">{isAdmin ? 'Presidencia' : 'Evaluador'}</span>
          <h2 style={{ fontSize: '2rem' }}>Panel de gestión</h2>
          <div className="tabs">{tabs.map(([k, l]) => <button key={k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => go(k)}>{l}</button>)}</div>
        </div>
      </div>
      <div className="wrap section tight">
        {tab === 'inicio' && <Dashboard go={go} />}
        {tab === 'casos' && (caseId ? <CaseView id={caseId} onBack={() => setCaseId(null)} notify={setToast} /> : <Cases open={setCaseId} />)}
        {tab === 'ejemplares' && (horseId
          ? <HorseAdmin id={horseId} onBack={() => setHorseId(null)} notify={setToast} openCase={(id) => { setTab('casos'); setCaseId(id) }} isAdmin={isAdmin} />
          : <AdminHorses isAdmin={isAdmin} notify={setToast} open={setHorseId} />)}
        {tab === 'gestiones' && <RequestsAdmin notify={setToast} isAdmin={isAdmin} />}
        {tab === 'certificados' && <CertificatesAdmin notify={setToast} openHorse={openHorse} />}
        {tab === 'meritos' && <MeritsAdmin notify={setToast} isAdmin={isAdmin} openHorse={openHorse} />}
        {tab === 'pagos' && <PaymentsAdmin notify={setToast} />}
        {tab === 'rubrica' && <Rubrics isAdmin={isAdmin} notify={setToast} />}
        {tab === 'usuarios' && <UsersAdmin notify={setToast} me={user.id} />}
        {tab === 'auditoria' && <Audit />}
      </div>
      <Toast msg={toast} onDone={() => setToast('')} />
    </div>
  )
}

function Cases({ open }) {
  const { data, loading } = useFetch('/eval/cases')
  if (loading) return <p className="muted">Cargando…</p>
  if (!data.length) return <div className="empty">No hay valoraciones. Ábrelas desde la pestaña Ejemplares.</div>
  return (
    <div className="table-scroll">
      <table className="table">
        <thead><tr><th>Ejemplar</th><th>Estado</th><th>Decididos</th><th>Nivel</th><th>Rúbrica</th><th>Actualizado</th><th /></tr></thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.id}>
              <td><span className="t-name">{c.horseName}</span><div className="k">{c.registrationNumber || 'sin nº'} · {breedLabel(c.breed)} · {c.stageName || `${c.ageYears} años`}</div></td>
              <td><span className={`badge ${c.status === 'RESUELTO' ? 'ok' : c.status === 'REQUIERE_MATERIAL' ? 'bad' : 'light'}`}>{CASE_STATUS[c.status]}</span></td>
              <td>{c.decided} / {c.criteriaCount}</td>
              <td>{c.status === 'RESUELTO' ? <span className="small">obtenido {STARS_TXT[c.levelAwarded || 0]}</span> : <LevelBadge level={c.horseLevel} />}</td>
              <td>v{c.rubricVersion}</td>
              <td className="small">{fmtDate(c.updatedAt)}</td>
              <td><button className="btn btn-line btn-sm" onClick={() => open(c.id)}>Abrir</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CaseView({ id, onBack, notify }) {
  const { isAdmin } = useAuth()
  const { data: c, loading, reload, error } = useFetch(`/eval/cases/${id}`)
  const [aiBusy, setAiBusy] = useState(false)
  const [resolve, setResolve] = useState({ summary: '', guidance: '' })
  const [manual, setManual] = useState(false)
  const [checks, setChecks] = useState({ same: false, valid: false })
  const [accepting, setAccepting] = useState(false)
  if (loading && !c) return <p className="muted">Cargando…</p>
  if (error) return <p className="notice bad">{error.message}</p>
  const locked = c.status === 'RESUELTO'
  const criteria = c.criteria || c.rubric.content.criteria

  const runAI = async () => {
    setAiBusy(true)
    try { const r = await api(`/eval/cases/${id}/ai`, { method: 'POST' }); notify(`La IA ha generado ${r.proposals} propuestas`); reload() } catch (x) { notify(x.message) }
    setAiBusy(false)
  }
  const doResolve = async (requiresMaterial) => {
    try {
      const r = await api(`/eval/cases/${id}/resolve`, { method: 'POST', body: { ...resolve, requiresMaterial } })
      notify(requiresMaterial ? 'Se ha pedido nuevo material al titular' : r.newLevel > r.previousLevel ? `Valoración resuelta: sube a ${STARS_TXT[r.newLevel]}` : `Valoración resuelta: conserva ${STARS_TXT[r.newLevel]}`)
      reload()
    } catch (x) { notify(x.message) }
  }

  const acceptAI = async () => {
    setAccepting(true)
    try {
      const r = await api(`/eval/cases/${id}/accept-ai`, { method: 'POST', body: {} })
      notify(r.newLevel > r.previousLevel ? `Resultado aceptado: sube a ${STARS_TXT[r.newLevel]}` : `Resultado aceptado: conserva ${STARS_TXT[r.newLevel]}`)
      reload()
    } catch (x) { notify(x.message) }
    setAccepting(false)
  }
  const ar = c.aiResult

  return (
    <div className="stack">
      <button className="link" style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0 }} onClick={onBack}>← Valoraciones</button>
      <div className="card">
        <div className="row between">
          <div>
            <h2 style={{ fontSize: '1.9rem', textTransform: 'uppercase' }}>{c.horse.name}</h2>
            <p className="k mt8">{c.horse.registrationNumber || 'sin nº'} · {breedLabel(c.horse.breed)} · {c.stageInfo ? c.stageInfo.name : `${c.ageYears} años`} · rúbrica v{c.rubric.version} ({c.rubric.status.toLowerCase()})</p>
            <div className="row mt8" style={{ gap: 10 }}>
              <span className="small">Calidad actual</span><LevelBadge level={c.horse.level} />
              {c.stageInfo && !c.stageInfo.ridden && <span className="small muted">· sin montar: no se evalúa la aptitud para ser montado</span>}
            </div>
          </div>
          <span className={`badge ${locked ? 'ok' : 'light'}`}>{CASE_STATUS[c.status]}</span>
        </div>
        <div className="photo-slots mt24">
          {PHOTO_VIEWS.map((v) => {
            const p = c.horse.photos.find((x) => x.view === v.key)
            return <a key={v.key} className="slot" href={p ? fileUrl(p.url) : undefined} target="_blank" rel="noreferrer">{p ? <Img src={p.url} alt={v.label} /> : 'Falta'}<span className="slot-label">{v.label}</span></a>
          })}
        </div>
        {c.rubric.content.ageWheel && c.stage && <p className="notice info small mt16"><strong>Qué se espera en esta etapa:</strong> {c.rubric.content.ageWheel[c.stage]}</p>}
        {c.horse.videos[0] ? <video className="mt16" src={fileUrl(c.horse.videos[0].url)} controls style={{ width: '100%', maxHeight: 420, background: '#000' }} /> : <p className="notice mt16">El titular no ha subido vídeo: los criterios de movimiento requieren vídeo (a la mano o en libertad en potros).</p>}
        {!locked && (
          <div className="row mt16">
            <button className="btn btn-ink" onClick={runAI} disabled={aiBusy || !c.aiConfigured}>{aiBusy ? 'La IA está analizando…' : c.proposals.length ? 'Volver a lanzar la IA' : 'Lanzar propuesta de la IA'}</button>
            {!c.aiConfigured && <span className="small muted">IA pendiente de integración (falta AI_API_KEY / AI_MODEL). Puedes valorar manualmente.</span>}
          </div>
        )}
      </div>

      {!locked && !manual && (
        <div className="card ai-result">
          <h3>Resultado de la IA</h3>
          {!ar ? <p className="muted mt8">Lanza la IA para obtener la valoración.</p> : (
            <>
              <p className="small muted mt8">Modelo{ar.models.length > 1 ? 's' : ''}: {ar.models.join(' + ')}{ar.models.length > 1 ? ' (se toma la media)' : ''}</p>
              <table className="table mt8">
                <thead><tr><th>Bloque</th><th>Nota</th><th /></tr></thead>
                <tbody>{ar.items.map((i) => (
                  <tr key={i.key}>
                    <td>{i.name}</td>
                    <td><strong>{i.score ?? '—'}</strong>{i.scores.length > 1 && <span className="small muted"> ({i.scores.map((x) => x.score).join(' y ')})</span>}</td>
                    <td className="small">{i.score == null ? <span className="chk DISTINTO">No ha podido valorarlo</span> : i.disagree ? <span className="chk DISTINTO">⚠ las IAs discrepan</span> : ''}</td>
                  </tr>
                ))}</tbody>
              </table>
              <p className="ai-total mt16">Nota <strong>{ar.score ?? '—'}/100</strong> → nivel <strong>{STARS_TXT[ar.level || 0]}</strong> · {ar.level > c.horse.level ? `subirá de ${STARS_TXT[c.horse.level]} a ${STARS_TXT[ar.level]}` : `conserva su ${STARS_TXT[c.horse.level]}`}</p>
            </>
          )}
          <div className="secretaria mt16">
            <h4>Comprobación de la secretaría</h4>
            <p className="small muted">La nota es de la IA. La secretaría solo comprueba el material y acepta el resultado; no modifica notas.</p>
            <label className="row small mt8" style={{ gap: 8 }}><input type="checkbox" checked={checks.same} onChange={(e) => setChecks({ ...checks, same: e.target.checked })} /> Las fotos y el vídeo son de este caballo (capa, reseña, microchip si se ve)</label>
            <label className="row small mt8" style={{ gap: 8 }}><input type="checkbox" checked={checks.valid} onChange={(e) => setChecks({ ...checks, valid: e.target.checked })} /> El material es válido: vistas correctas y vídeo en los aires que pide su etapa</label>
            <div className="row mt16" style={{ gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-gold" disabled={!ar || ar.missing.length > 0 || !checks.same || !checks.valid || accepting} onClick={acceptAI}>{accepting ? 'Cerrando…' : 'Aceptar resultado de la IA'}</button>
              <button className="btn btn-line" onClick={() => { const summary = window.prompt('¿Qué material falta o hay que repetir? (lo verá el titular)'); if (summary) { setResolve({ ...resolve, summary }); api(`/eval/cases/${id}/resolve`, { method: 'POST', body: { summary, requiresMaterial: true } }).then(() => { notify('Se ha pedido nuevo material al titular'); reload() }).catch((x) => notify(x.message)) } }}>Pedir nuevo material</button>
            </div>
            {ar?.missing.length > 0 && <p className="small chk DISTINTO mt8">La IA no ha podido valorar algún bloque: pide nuevo material o vuelve a lanzarla.</p>}
          </div>
          {isAdmin && <button type="button" className="link small mt16" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }} onClick={() => setManual(true)}>Ajuste manual excepcional (solo presidencia, queda en la auditoría)</button>}
        </div>
      )}

      {criteria.map((k) => (
        <Criterion key={k.key} k={k} c={c} locked={locked} reload={reload} notify={notify} manual={manual} />
      ))}

      {!locked && !manual ? null : !locked ? (
        <div className="card form">
          <div className="row between"><h3>Ajuste manual excepcional</h3><button type="button" className="link small" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }} onClick={() => setManual(false)}>Volver al modelo IA</button></div>
          <p className="notice info">
            Nota provisional con lo decidido: <strong>{c.preview?.score != null ? `${c.preview.score}/100` : '—'}</strong> → nivel <strong>{STARS_TXT[c.preview?.level || 0]}</strong>.{' '}
            {c.preview && c.preview.level > c.preview.current ? `Al resolver, el ejemplar subirá de ${STARS_TXT[c.preview.current]} a ${STARS_TXT[c.preview.level]}.` : `No supera su nivel actual (${STARS_TXT[c.preview?.current || 0]}): lo conservará.`}
          </p>
          <div className="field"><label>Conclusión (se publica en la ficha)</label><textarea className="textarea" value={resolve.summary} onChange={(e) => setResolve({ ...resolve, summary: e.target.value })} /></div>
          <div className="field"><label>Orientación (la emite el evaluador, nunca la IA)</label><textarea className="textarea" value={resolve.guidance} onChange={(e) => setResolve({ ...resolve, guidance: e.target.value })} /></div>
          <div className="row"><button className="btn btn-gold" onClick={() => doResolve(false)}>Resolver valoración</button><button className="btn btn-line" onClick={() => doResolve(true)}>Pedir nuevo material</button></div>
        </div>
      ) : (
        <div className="card"><h3>Resolución</h3><p className="mt8">Nota {c.finalScore ?? '—'}/100 · nivel obtenido {STARS_TXT[c.levelAwarded || 0]}</p><p className="mt8">{c.summary}</p>{c.guidance && <p className="muted mt8"><strong>Orientación:</strong> {c.guidance}</p>}<p className="small muted mt8">Resuelto el {fmtDate(c.resolvedAt)}</p></div>
      )}

      <div className="card history">
        <h3>Historial (no se borra)</h3>
        <ul className="mt16">{c.history.map((h) => <li key={h.id}><strong>{h.action}</strong> · {h.userName || 'Sistema'} · {new Date(h.at).toLocaleString('es-ES')}<div className="muted">{h.data ? JSON.stringify(h.data) : ''}</div></li>)}</ul>
      </div>
    </div>
  )
}

function Criterion({ k, c, locked, reload, notify, manual }) {
  const mat = c.material.find((m) => m.criterionKey === k.key)
  // Última ejecución de la IA (una o dos IAs en doble lectura)
  const lastRun = c.proposals[0]?.raw?.runId
  const props = c.proposals.filter((p) => p.criterionKey === k.key && (!lastRun || p.raw?.runId === lastRun))
  const prop = props[0]
  const scored = props.filter((p) => p.score != null)
  const mean = scored.length ? Math.round((scored.reduce((a, p) => a + p.score, 0) / scored.length) * 2) / 2 : null
  const disagree = scored.length > 1 && Math.max(...scored.map((p) => p.score)) - Math.min(...scored.map((p) => p.score)) > 1
  const dec = c.decisions.find((d) => d.criterionKey === k.key)
  const [m, setM] = useState({ status: mat?.status || '', notes: mat?.notes || '' })
  const [d, setD] = useState({ score: dec?.finalScore ?? prop?.score ?? '', notes: dec?.notes || '' })
  useEffect(() => { setM({ status: mat?.status || '', notes: mat?.notes || '' }) }, [mat?.status, mat?.notes])
  useEffect(() => { if (!dec && mean != null) setD((x) => ({ ...x, score: mean })) }, [prop?.id])

  const saveMat = async (status) => {
    try { await api(`/eval/cases/${c.id}/material/${k.key}`, { method: 'PUT', body: { status, notes: m.notes } }); reload() } catch (x) { notify(x.message) }
  }
  const decide = async (action, chosen = prop, override = {}) => {
    try {
      await api(`/eval/cases/${c.id}/decisions/${k.key}`, { method: 'PUT', body: { action, proposalId: chosen?.id, finalScore: d.score, notes: d.notes, ...override } })
      notify('Decisión guardada'); reload()
    } catch (x) { notify(x.message) }
  }

  return (
    <div className="crit">
      <div className="crit-head">
        <div><strong>{k.name}</strong> <span className="small muted">· {c.rubric.content.areas?.[k.area] || k.area} · material: {k.material.join(', ').toLowerCase().replace(/_/g, ' ')}</span></div>
        {dec ? <span className="badge ok">{dec.action.toLowerCase()} {dec.finalScore != null ? `· ${dec.finalScore}` : ''}</span> : <span className="badge example">sin decidir</span>}
      </div>
      <div className="crit-body">
        <div>
          <h4>1 · Material</h4>
          <select className="select" value={m.status} disabled={locked} onChange={(e) => { setM({ ...m, status: e.target.value }); saveMat(e.target.value) }}>
            <option value="">— sin revisar —</option>
            {MATERIAL.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input className="input mt8" placeholder="Nota sobre el material" value={m.notes} disabled={locked} onChange={(e) => setM({ ...m, notes: e.target.value })} onBlur={() => m.status && m.notes !== (mat?.notes || '') && saveMat(m.status)} />
          {mat && <p className="small muted mt8">Revisado por {mat.checkedBy === 'IA' ? 'la IA' : 'evaluador'}</p>}
          <details className="small mt8"><summary className="muted" style={{ cursor: 'pointer' }}>Qué observar y anclas</summary><p className="mt8">{k.observe}</p>{Object.entries(k.anchors).map(([r, t]) => <p key={r} className="mt8"><strong>{r}:</strong> {t}</p>)}</details>
        </div>
        <div>
          <h4>2 · Propuesta de la IA</h4>
          {props.length > 1 && <p className={`badge ${disagree ? 'bad' : 'ok'}`} style={{ marginBottom: 10 }}>{disagree ? '⚠ Las IAs discrepan: revisar' : '✓ Las IAs coinciden'}</p>}
          {prop ? (
            props.map((pp) => (
              <div key={pp.id} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: props.length > 1 ? '1px dashed var(--line)' : 0 }}>
                {props.length > 1 && <p className="small" style={{ fontWeight: 700 }}>{pp.model}</p>}
                <p>{pp.observation}</p>
                <p className="mt8"><strong style={{ fontSize: '1.3rem' }}>{pp.score ?? '—'}</strong> <span className={`small conf-${pp.confidence}`}>· confianza {pp.confidence.toLowerCase()}</span></p>
                {pp.evidence?.length > 0 && <p className="small muted mt8">Evidencia: {pp.evidence.map((e) => [e.fuente, e.t].filter(Boolean).join(' ')).join(' · ')}</p>}
                {pp.limitations && <p className="small muted mt8">Limitaciones: {pp.limitations}</p>}
                <p className="small muted mt8">{pp.sourceLabel ? `${pp.sourceLabel} · ` : ''}{props.length > 1 ? '' : `${pp.model} · `}v{pp.rubricVersion}</p>
                {!locked && props.length > 1 && pp.score != null && <button className="btn btn-line btn-sm mt8" onClick={() => decide('ACEPTAR', pp)}>Aceptar {pp.score} de esta IA</button>}
              </div>
            ))
          ) : <p className="muted small">Sin propuesta.</p>}
        </div>
        {(manual || locked) && <div>
          <h4>3 · {locked ? 'Resultado' : 'Ajuste manual'}</h4>
          {locked ? <p>{dec ? `${dec.action.toLowerCase()} · ${dec.finalScore ?? '—'}${dec.notes ? ` · ${dec.notes}` : ''}` : '—'}</p> : (
            <>
              <div className="row" style={{ gap: 8 }}>
                <input className="input" style={{ width: 90 }} type="number" min="0" max="10" step="0.5" value={d.score} onChange={(e) => setD({ ...d, score: e.target.value })} aria-label="Nota" />
                <input className="input" style={{ flex: 1, minWidth: 120 }} placeholder="Motivo / nota" value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} />
              </div>
              <div className="row mt8" style={{ gap: 6 }}>
                {props.length === 1 && prop?.score != null && <button className="btn btn-ink btn-sm" onClick={() => decide('ACEPTAR')}>Aceptar {prop.score}</button>}
                {props.length > 1 && mean != null && <button className="btn btn-ink btn-sm" onClick={() => decide('CORREGIR', prop, { finalScore: mean, notes: d.notes || `Media de ${scored.length} IAs (${scored.map((p) => p.score).join(' y ')})` })}>Aceptar media {mean}</button>}
                <button className="btn btn-gold btn-sm" onClick={() => decide('CORREGIR')}>{prop ? 'Corregir' : 'Puntuar'}</button>
                {prop && <button className="btn btn-line btn-sm" onClick={() => decide('RECHAZAR')}>Rechazar</button>}
                <button className="btn btn-line btn-sm" onClick={() => decide('NO_EVALUABLE')}>No evaluable</button>
              </div>
              {dec && <p className="small muted mt8">Decidido por {dec.decidedByName} · {fmtDate(dec.decidedAt)}</p>}
            </>
          )}
        </div>}
      </div>
    </div>
  )
}

function HorseAdmin({ id, onBack, notify, openCase, isAdmin }) {
  const { data: h, reload } = useFetch(`/admin/horses/${id}`)
  const [merit, setMerit] = useState({ competition: '', category: '', level: 'JOVENES_NACIONAL', position: '1º', score: '', date: '' })
  const [doc, setDoc] = useState(null)
  const [lvl, setLvl] = useState({ level: '', reason: 'MERITO', notes: '' })
  const [originNotes, setOriginNotes] = useState('')
  if (!h) return <p className="muted">Cargando…</p>
  const call = async (fn, msg) => { try { await fn(); notify(msg); reload(); return true } catch (x) { notify(x.message); return false } }
  const issue = (type) => call(() => api(`/admin/horses/${id}/certificates`, { method: 'POST', body: { type } }), 'Certificado expedido')
  const hasQuality = h.certificates.some((c) => c.type === 'CALIDAD' && c.status === 'VIGENTE')
  const addMerit = (e) => {
    e.preventDefault()
    const form = new FormData(); Object.entries(merit).forEach(([k, v]) => form.append(k, v)); if (doc) form.append('document', doc)
    call(() => api(`/admin/horses/${id}/merits`, { method: 'POST', form }), 'Resultado registrado (pendiente de verificar)')
  }
  const newCase = async () => { try { const c = await api('/eval/cases', { method: 'POST', body: { horseId: id } }); openCase(c.id) } catch (x) { notify(x.message) } }

  return (
    <div className="stack">
      <button className="link" style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0 }} onClick={onBack}>← Ejemplares</button>
      <div className="card">
        <div className="row between">
          <div><h2 style={{ fontSize: '1.9rem', textTransform: 'uppercase' }}>{h.name}</h2><p className="k mt8">{h.registrationNumber || 'sin nº'} · {breedLabel(h.breed)} · {fmtDate(h.birthDate)} · {h.ibericBloodPct ? `${h.ibericBloodPct}% ibérico` : '% ibérico no documentado'} · Microchip: {h.microchip || '—'}</p></div>
          <button className="btn btn-ink" onClick={newCase}>Abrir valoración</button>
        </div>
        <p className="small muted mt16">Titular: {h.ownerName} · {h.ownerEmail} {h.ownerPhone ? `· ${h.ownerPhone}` : ''} · Padre: {h.sireName || '—'}{h.sireRegistry ? ` (${h.sireRegistry})` : ''} · Madre: {h.damName || '—'}{h.damRegistry ? ` (${h.damRegistry})` : ''} · Libro oficial: {h.officialRegistry || '—'}</p>
        <div className="row mt16" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`badge ${h.originStatus === 'ACREDITADO' ? 'ok' : 'example'}`}>Procedencia: {ORIGIN[h.originStatus || 'DECLARADO']}</span>
          {h.originNotes && <span className="small muted">{h.originNotes}</span>}
        </div>
        {isAdmin && (
          <form className="row mt16" style={{ gap: 8, alignItems: 'stretch' }} onSubmit={(e) => {
            e.preventDefault()
            const status = h.originStatus === 'ACREDITADO' ? 'DECLARADO' : 'ACREDITADO'
            call(() => api(`/admin/horses/${id}/origin`, { method: 'POST', body: { status, notes: originNotes } }), 'Origen actualizado').then((ok) => ok && setOriginNotes(''))
          }}>
            <input className="input" style={{ flex: 1 }} value={originNotes} onChange={(e) => setOriginNotes(e.target.value)}
              placeholder={h.originStatus === 'ACREDITADO' ? 'Motivo para quitar la acreditación' : 'Documentos revisados (p. ej. carta ANCCE del ejemplar, o de padre y madre…)'} />
            <button className="btn btn-line">{h.originStatus === 'ACREDITADO' ? 'Quitar acreditación' : 'Acreditar procedencia'}</button>
          </form>
        )}
      </div>
      {isAdmin && <HorseEditCard h={h} notify={notify} reload={reload} />}
      <div className="card">
        <h3>Documentación de procedencia</h3>
        {!(h.documents || []).length && <p className="muted mt8">El titular no ha subido documentos todavía.</p>}
        {(h.documents || []).map((d) => {
          const bad = d.checks.filter((c) => c.status === 'DISTINTO').length
          return (
            <div key={d.id} className="doc-review mt16">
              <div className="row between" style={{ alignItems: 'center' }}>
                <div>
                  <strong>{DOC_ROLES[d.role]}</strong> <span className="small muted">· {d.docType || d.originalName} · {fmtDate(d.createdAt)}{d.aiModel ? ` · leído por ${d.aiModel}` : ''}</span>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  {d.checks.length > 0 && <span className={`badge ${bad ? 'bad' : 'ok'}`}>{bad ? `${bad} dato(s) no cuadran` : 'Todo cuadra'}</span>}
                  <button type="button" className="btn btn-line" onClick={() => openPrivateFile(`/my/documents/${d.id}/file`).catch((x) => notify(x.message))}>Ver documento</button>
                </div>
              </div>
              {d.aiError && <p className="notice bad mt8">La IA no pudo leerlo: {d.aiError}. Revísalo a mano.</p>}
              {d.extracted?.notes && <p className="small muted mt8">Nota de la IA: {d.extracted.notes}</p>}
              {d.checks.length > 0 && (
                <table className="table mt8">
                  <thead><tr><th>Dato</th><th>Declarado por el titular</th><th>Leído en el documento</th><th></th></tr></thead>
                  <tbody>{d.checks.map((c) => (
                    <tr key={c.label}>
                      <td>{c.label}</td><td>{c.declared || '—'}</td><td>{c.read || '—'}</td>
                      <td className={`chk ${c.status}`}>{{ OK: '✓', DISTINTO: '✕ No cuadra', SIN_DATO: 'No aparece', NO_DECLARADO: 'No declarado' }[c.status]}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          )
        })}
        <p className="small muted mt16">La IA solo lee y compara: la acreditación la decides tú con el botón de arriba, después de ver el documento.</p>
      </div>
      <div className="card">
        <div className="row between">
          <h3>Calidad (estrellas)</h3>
          <LevelBadge level={h.level} big />
        </div>
        <p className="small muted mt8">Sube con una valoración que lo mejore o con un resultado verificado (podio). Nunca baja por una nueva valoración. El cambio manual es excepcional y queda registrado.</p>
        {isAdmin && (
          <form className="row mt16" style={{ gap: 8, alignItems: 'stretch' }} onSubmit={(e) => { e.preventDefault(); call(() => api(`/admin/horses/${id}/level`, { method: 'POST', body: { ...lvl, level: Number(lvl.level) } }), 'Estrellas actualizadas').then((ok) => ok && setLvl({ level: '', reason: 'MERITO', notes: '' })) }}>
            <select className="select" style={{ width: 150 }} required value={lvl.level} onChange={(e) => setLvl({ ...lvl, level: e.target.value })}>
              <option value="">Nuevas estrellas…</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n} disabled={n === h.level}>{STARS_TXT[n]}</option>)}
              <option value="0">Sin valorar</option>
            </select>
            <select className="select" style={{ width: 200 }} value={lvl.reason} onChange={(e) => setLvl({ ...lvl, reason: e.target.value })}>
              <option value="MERITO">Mérito deportivo</option>
              <option value="MANUAL">Otra decisión de presidencia</option>
            </select>
            <input className="input" style={{ flex: 1, minWidth: 220 }} required placeholder="Motivo: competición, resultado, documento…" value={lvl.notes} onChange={(e) => setLvl({ ...lvl, notes: e.target.value })} />
            <button className="btn btn-gold">Cambiar estrellas</button>
          </form>
        )}
        {h.levelHistory?.length > 0 && (
          <ul className="history mt16" style={{ padding: 0 }}>
            {h.levelHistory.map((l) => (
              <li key={l.id}><strong>{STARS_TXT[l.fromLevel]} → {STARS_TXT[l.toLevel]}</strong> · {LEVEL_REASON[l.reason]} · {l.decidedByName || '—'} · {new Date(l.at).toLocaleString('es-ES')}<div className="muted">{l.notes}</div></li>
            ))}
          </ul>
        )}
      </div>
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div className="card">
          <h3>Certificados</h3>
          {h.certificates.map((c) => (
            <div key={c.id} className="row between mt8" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
              <span>{c.type === 'ORIGEN' ? 'Origen' : `Calidad · ${STARS_TXT[h.level] || '—'} (vivo)`} · {c.code}</span>
              {c.status === 'VIGENTE' && isAdmin
                ? <button className="btn btn-line btn-sm" onClick={() => { const reason = window.prompt('Motivo de la revocación'); if (reason) call(() => api(`/admin/certificates/${c.id}/revoke`, { method: 'POST', body: { reason } }), 'Certificado revocado') }}>Revocar</button>
                : <span className={`badge ${c.status === 'VIGENTE' ? 'ok' : 'bad'}`}>{c.status.toLowerCase()}</span>}
            </div>
          ))}
          {isAdmin ? (
            <div className="mt16 stack">
              {!h.registrationNumber && (
                <>
                  <button className="btn btn-gold" disabled={h.originStatus !== 'ACREDITADO'} onClick={() => issue('ORIGEN')}>1 · Expedir Certificado de Origen</button>
                  {h.originStatus !== 'ACREDITADO' && <p className="small muted">Antes acredita la procedencia (arriba).</p>}
                </>
              )}
              {h.registrationNumber && !hasQuality && (
                <>
                  <button className="btn btn-gold" disabled={!h.level} onClick={() => issue('CALIDAD')}>2 · Expedir Certificado de Calidad</button>
                  {!h.level && <p className="small muted">Antes necesita nivel: resuelve una valoración o asígnalo por méritos.</p>}
                </>
              )}
              {hasQuality && <p className="small muted">El Certificado de Calidad es vivo: se actualiza solo cuando cambia el nivel.</p>}
            </div>
          ) : <p className="small muted mt16">Solo la presidencia expide certificados.</p>}
        </div>
        <div className="card">
          <h3>Méritos deportivos</h3>
          {h.merits.map((m) => (
            <div key={m.id} className="mt8" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
              <strong>{m.competition}</strong> · {m.category} · {m.position} · {MERIT_LEVELS[m.level]} ({m.starsGiven}★) · {fmtDate(m.date)}
              <div className="row mt8" style={{ gap: 8 }}>
                {m.documentUrl && <a className="link small" href={fileUrl(m.documentUrl)} target="_blank" rel="noreferrer">Documento</a>}
                {m.verified ? <span className="badge ok">verificado</span> : isAdmin ? <button className="btn btn-line btn-sm" onClick={() => call(() => api(`/admin/merits/${m.id}/verify`, { method: 'POST' }), 'Resultado verificado (si da derecho a más estrellas, el caballo sube solo)')}>Verificar</button> : <span className="badge example">pendiente</span>}
              </div>
            </div>
          ))}
          <form className="form mt16" onSubmit={addMerit}>
            <input className="input" required placeholder="Competición" value={merit.competition} onChange={(e) => setMerit({ ...merit, competition: e.target.value })} />
            <div className="row" style={{ gap: 8 }}>
              <input className="input" style={{ flex: 1 }} required placeholder="Categoría / prueba" value={merit.category} onChange={(e) => setMerit({ ...merit, category: e.target.value })} />
              <select className="select" style={{ flex: 1 }} value={merit.level} onChange={(e) => setMerit({ ...merit, level: e.target.value })}>{Object.entries(MERIT_LEVELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <input className="input" style={{ width: 110 }} required placeholder="Puesto" value={merit.position} onChange={(e) => setMerit({ ...merit, position: e.target.value })} />
              <input className="input" style={{ width: 110 }} placeholder="Nota %" value={merit.score} onChange={(e) => setMerit({ ...merit, score: e.target.value })} />
              <input className="input" style={{ flex: 1 }} required type="date" value={merit.date} onChange={(e) => setMerit({ ...merit, date: e.target.value })} />
            </div>
            <input className="input" type="file" accept="application/pdf,image/*" onChange={(e) => setDoc(e.target.files[0])} />
            <button className="btn btn-line">Añadir resultado</button>
          </form>
        </div>
      </div>
    </div>
  )
}

function RequestsAdmin({ notify, isAdmin }) {
  const { data, loading, reload } = useFetch('/admin/requests')
  if (loading && !data) return <p className="muted">Cargando…</p>
  if (!data.length) return <div className="empty">Sin solicitudes.</div>
  const update = async (r, status) => {
    const adminNotes = status === 'REQUIERE_DOCUMENTACION' || status === 'RECHAZADA' ? window.prompt('Nota para el titular') ?? undefined : undefined
    try { await api(`/admin/requests/${r.id}`, { method: 'PATCH', body: { status, adminNotes } }); notify('Estado actualizado'); reload() } catch (x) { notify(x.message) }
  }
  return (
    <div className="stack">
    {isAdmin && <div className="row" style={{ justifyContent: 'flex-end' }}><ExportButton kind="gestiones" notify={notify} /></div>}
    <div className="table-scroll">
      <table className="table">
        <thead><tr><th>Gestión</th><th>Titular</th><th>Ejemplar</th><th>Documentos</th><th>Pago</th><th>Estado</th></tr></thead>
        <tbody>{data.map((r) => (
          <tr key={r.id}>
            <td><span className="t-name">{SERVICES.find((s) => s.code === r.service)?.name}</span><div className="small muted">{fmtDate(r.createdAt)}{r.notes ? ` · ${r.notes}` : ''}</div></td>
            <td className="small">{r.userName}<div className="muted">{r.userEmail}</div></td>
            <td className="small">{r.horseName || '—'}</td>
            <td className="small">{(r.documents || []).map((d, n) => <div key={n}>{d.file
              ? <button type="button" className="link" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }} onClick={() => openPrivateFile(`/my/requests/${r.id}/documents/${n}`).catch((x) => notify(x.message))}>{d.name}</button>
              : <a className="link" href={fileUrl(d.url)} target="_blank" rel="noreferrer">{d.name}</a>}</div>)}</td>
            <td className="small">{pretty(r.paymentStatus) || '—'}</td>
            <td><select className="select" value={r.status} onChange={(e) => update(r, e.target.value)}>{REQ.map((s) => <option key={s} value={s}>{pretty(s)}</option>)}</select></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
    </div>
  )
}

function Rubrics({ isAdmin, notify }) {
  const { data, loading, reload } = useFetch('/eval/rubrics')
  const [draft, setDraft] = useState(null)
  if (loading && !data) return <p className="muted">Cargando…</p>
  const active = data.find((r) => r.status !== 'ARCHIVADA')
  const startEdit = () => setDraft({ version: bump(active?.version || '2.0.0'), notes: '', json: JSON.stringify(active?.content || {}, null, 2) })
  const save = async () => {
    let content
    try { content = JSON.parse(draft.json) } catch { return notify('El JSON no es válido') }
    try { await api('/eval/rubrics', { method: 'POST', body: { version: draft.version, notes: draft.notes, content } }); notify('Nueva versión creada'); setDraft(null); reload() } catch (x) { notify(x.message) }
  }
  const setStatus = async (r, status) => { try { await api(`/eval/rubrics/${r.id}/status`, { method: 'PATCH', body: { status } }); reload() } catch (x) { notify(x.message) } }
  return (
    <div className="stack">
      <p className="notice info">La rúbrica está versionada: guardar cambios crea una versión nueva y las anteriores no se modifican. Cada valoración queda ligada a la versión con la que se hizo. La activa es la más reciente no archivada.</p>
      <div className="table-scroll">
        <table className="table">
          <thead><tr><th>Versión</th><th>Estado</th><th>Criterios</th><th>Creada</th><th>Notas</th></tr></thead>
          <tbody>{data.map((r) => (
            <tr key={r.id}>
              <td className="t-name">v{r.version} {r.id === active?.id && <span className="badge ok">activa</span>}</td>
              <td>{isAdmin ? <select className="select" value={r.status} onChange={(e) => setStatus(r, e.target.value)}>{['EXPERIMENTAL', 'PROVISIONAL', 'VALIDADA', 'PUBLICADA', 'ARCHIVADA'].map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}</select> : r.status.toLowerCase()}</td>
              <td>{r.content.criteria.length}</td>
              <td className="small">{fmtDate(r.createdAt)}</td>
              <td className="small muted">{r.notes}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {isAdmin && !draft && <button className="btn btn-ink" onClick={startEdit}>Editar (crear nueva versión)</button>}
      {draft && (
        <div className="card form">
          <div className="row"><div className="field"><label>Versión</label><input className="input" value={draft.version} onChange={(e) => setDraft({ ...draft, version: e.target.value })} /></div><div className="field" style={{ flex: 1 }}><label>Qué cambia</label><input className="input" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></div></div>
          <div className="field"><label>Contenido (criterios, anclas, rueda de edad, pesos, reglas)</label><textarea className="textarea json-edit" value={draft.json} onChange={(e) => setDraft({ ...draft, json: e.target.value })} spellCheck={false} /></div>
          <div className="row"><button type="button" className="btn btn-gold" onClick={save}>Guardar como nueva versión</button><button type="button" className="btn btn-line" onClick={() => setDraft(null)}>Cancelar</button></div>
        </div>
      )}
    </div>
  )
}
const bump = (v) => { const p = v.split('.').map(Number); p[2] = (p[2] || 0) + 1; return p.join('.') }

function Audit() {
  const { data, loading } = useFetch('/admin/audit')
  if (loading && !data) return <p className="muted">Cargando…</p>
  return (
    <div className="card history"><ul>{data.map((a) => (
      <li key={a.id}><strong>{a.entity} · {a.action}</strong> · {a.userName || 'Sistema'} · {new Date(a.at).toLocaleString('es-ES')}<div className="muted">{a.data ? JSON.stringify(a.data) : ''}</div></li>
    ))}</ul></div>
  )
}
