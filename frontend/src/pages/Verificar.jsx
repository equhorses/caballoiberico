import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api.jsx'
import { LevelBadge, breedLabel } from '../components/ui.jsx'
import { ORIGIN, fmtDate } from '../data/content.js'

const TYPE = { ORIGEN: 'Certificado de Origen', CALIDAD: 'Certificado de Calidad' }

export default function Verificar() {
  const [params, setParams] = useSearchParams()
  const [code, setCode] = useState(params.get('c') || '')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const check = async (c) => {
    if (!c.trim()) return
    setLoading(true)
    setParams({ c: c.trim().toUpperCase() }, { replace: true })
    try { setResult(await api(`/verify/${encodeURIComponent(c.trim())}`)) } catch (e) { setResult({ valid: false, error: e.message }) }
    setLoading(false)
  }
  useEffect(() => { if (params.get('c')) check(params.get('c')) }, [])

  return (
    <section className="section">
      <div className="wrap verify-box">
        <span className="eyebrow">Verificación pública</span>
        <h1 style={{ fontSize: 'clamp(2.2rem,4.5vw,3.4rem)' }}>Verificar un certificado</h1>
        <p className="lead">Igual que se comprueba el certificado de seguridad de una web, cualquier comprador, juez o criador puede comprobar aquí si un certificado C-IBERICO es auténtico y está vigente.</p>
        <form className="search mt32" onSubmit={(e) => { e.preventDefault(); check(code) }}>
          <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código del certificado (CV-XXXX-XXXX) o nº de registro (CIB-xxxxx)" aria-label="Código" />
          <button className="btn btn-ink" disabled={loading}>{loading ? 'Comprobando…' : 'Verificar'}</button>
        </form>

        {result && (
          <div className={`verify-result mt32 ${result.valid ? 'valid' : 'invalid'}`}>
            {result.horse ? (
              <>
                <span className={`badge ${result.valid ? 'ok' : 'bad'}`}>{result.valid ? '✓ Certificado vigente' : result.status === 'REVOCADO' ? '✕ Certificado revocado' : '✕ No vigente'}</span>
                <h2 className="mt16" style={{ fontSize: '1.8rem', textTransform: 'uppercase' }}>{result.horse.name}</h2>
                <dl className="kv">
                  <dt>Nº de registro</dt><dd>{result.horse.registrationNumber || '—'}</dd>
                  <dt>Raza</dt><dd>{breedLabel(result.horse.breed)}</dd>
                  <dt>Procedencia</dt><dd>{ORIGIN[result.horse.originStatus || 'DECLARADO']}</dd>
                  <dt>Nivel C-IBERICO</dt><dd><LevelBadge level={result.horse.level} /></dd>
                  {result.type && <><dt>Tipo</dt><dd>{TYPE[result.type]}{result.stars ? ` · ${result.stars} estrellas` : ''}</dd></>}
                  {result.code && <><dt>Código</dt><dd>{result.code}</dd></>}
                  {result.issuedAt && <><dt>Expedido</dt><dd>{fmtDate(result.issuedAt)}</dd></>}
                  {result.revokedAt && <><dt>Revocado</dt><dd>{fmtDate(result.revokedAt)}</dd></>}
                </dl>
                {result.certificates && (
                  <div className="mt16">{result.certificates.map((c) => (
                    <div key={c.code} className="row between" style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                      <span>{TYPE[c.type]} · {fmtDate(c.issuedAt)}</span>
                      <span className={`badge ${c.status === 'VIGENTE' ? 'ok' : 'bad'}`}>{c.code} · {c.status.toLowerCase()}</span>
                    </div>
                  ))}</div>
                )}
                {result.valid && result.horse.registrationNumber && <Link to={`/registro/${result.horse.registrationNumber}`} className="link mt16" style={{ display: 'inline-block' }}>Ver ficha en el registro →</Link>}
              </>
            ) : (
              <>
                <span className="badge bad">✕ No encontrado</span>
                <p className="mt16">{result.error || 'No existe ningún certificado C-IBERICO con ese código.'} Revisa que lo has escrito igual que aparece en el documento. Si sospechas de una falsificación, escríbenos.</p>
              </>
            )}
          </div>
        )}

        <p className="small muted mt32">C-IBERICO es un certificado privado: la verificación confirma que lo ha expedido C-IBERICO y su estado actual. No equivale a una inscripción en un libro genealógico oficial.</p>
      </div>
    </section>
  )
}
