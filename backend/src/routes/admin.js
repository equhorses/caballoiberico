// Presidencia: gestiones, expedición/revocación de certificados, méritos deportivos y usuarios
const router = require('express').Router();
const DOCS = require('../lib/documents');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validateHorse } = require('../lib/horses');
const { db, MERIT_STARS, upload, authenticate, requireRole, audit, verificationCode, nextRegistrationNumber, wrap } = require('../lib/common');

router.use(authenticate, requireRole('ADMIN', 'EVALUADOR'));

const REQ_STATUS = ['PENDIENTE_PAGO', 'PAGADA', 'EN_REVISION', 'REQUIERE_DOCUMENTACION', 'RESUELTA', 'RECHAZADA'];

router.get('/stats', wrap(async (req, res) => {
  res.json(await db.one(`SELECT
    (SELECT COUNT(*)::int FROM horses WHERE status <> 'BAJA') AS horses,
    (SELECT COUNT(*)::int FROM horses WHERE created_at > now() - interval '30 days') AS horses_month,
    (SELECT COUNT(*)::int FROM horses WHERE status='CERTIFICADO') AS certified,
    (SELECT COUNT(*)::int FROM certificates WHERE type='CALIDAD' AND status='VIGENTE') AS quality,
    (SELECT COUNT(*)::int FROM horses WHERE status='PENDIENTE' AND origin_status='DECLARADO') AS pending_origin,
    (SELECT COUNT(*)::int FROM service_requests WHERE status IN ('PENDIENTE_PAGO','PAGADA','EN_REVISION','REQUIERE_DOCUMENTACION')) AS pending,
    (SELECT COUNT(*)::int FROM evaluation_cases WHERE status <> 'RESUELTO') AS open_cases,
    (SELECT COUNT(*)::int FROM sport_merits WHERE NOT verified) AS unverified_merits,
    (SELECT COUNT(*)::int FROM users) AS users,
    (SELECT COUNT(*)::int FROM users WHERE created_at > now() - interval '30 days') AS users_month,
    (SELECT COUNT(DISTINCT raw->>'runId')::int FROM ai_proposals WHERE created_at > date_trunc('month', now())) AS ai_runs_month,
    (SELECT COUNT(*)::int FROM horse_documents WHERE created_at > date_trunc('month', now())) AS docs_month,
    (SELECT COUNT(*)::int FROM prevaluations WHERE created_at > date_trunc('month', now())) AS preval_month,
    (SELECT COALESCE(SUM(amount),0)::int FROM payments WHERE status='COMPLETADO') / 100.0 AS revenue,
    (SELECT COALESCE(SUM(amount),0)::int FROM payments WHERE status='COMPLETADO' AND paid_at > date_trunc('month', now())) / 100.0 AS revenue_month`));
}));

router.get('/requests', wrap(async (req, res) => {
  res.json(await db.query(
    `SELECT r.*, u.first_name || ' ' || u.last_name AS user_name, u.email AS user_email, h.name AS horse_name, h.registration_number,
       (SELECT status FROM payments p WHERE p.request_id=r.id ORDER BY created_at DESC LIMIT 1) AS payment_status
     FROM service_requests r JOIN users u ON u.id=r.user_id LEFT JOIN horses h ON h.id=r.horse_id ORDER BY r.created_at DESC`,
  ));
}));

router.patch('/requests/:id', wrap(async (req, res) => {
  const { status, adminNotes } = req.body || {};
  if (!REQ_STATUS.includes(status)) return res.status(400).json({ error: 'Estado no válido' });
  const r = await db.one(
    `UPDATE service_requests SET status=$2, admin_notes=COALESCE($3, admin_notes),
       resolved_at=CASE WHEN $2 IN ('RESUELTA','RECHAZADA') THEN now() ELSE NULL END
     WHERE id::text=$1 RETURNING *`, [req.params.id, status, adminNotes ?? null],
  );
  if (!r) return res.status(404).json({ error: 'Solicitud no encontrada' });
  audit(req.user.id, 'ServiceRequest', r.id, 'ESTADO', { status, adminNotes });
  res.json(r);
}));

router.get('/horses/:id', wrap(async (req, res) => {
  const h = await db.one(
    `SELECT h.*, u.first_name || ' ' || u.last_name AS owner_name, u.email AS owner_email, u.phone AS owner_phone
     FROM horses h JOIN users u ON u.id=h.owner_id WHERE h.id::text=$1`, [req.params.id],
  );
  if (!h) return res.status(404).json({ error: 'Ejemplar no encontrado' });
  const [photos, videos, certificates, merits, levelHistory, docs] = await Promise.all([
    db.query('SELECT * FROM horse_photos WHERE horse_id=$1', [h.id]),
    db.query('SELECT * FROM horse_videos WHERE horse_id=$1', [h.id]),
    db.query('SELECT * FROM certificates WHERE horse_id=$1 ORDER BY issued_at', [h.id]),
    db.query('SELECT * FROM sport_merits WHERE horse_id=$1 ORDER BY date DESC', [h.id]),
    db.query(`SELECT l.*, u.first_name || ' ' || u.last_name AS decided_by_name FROM level_history l
              LEFT JOIN users u ON u.id=l.decided_by WHERE l.horse_id=$1 ORDER BY l.at DESC`, [h.id]),
    db.query('SELECT id, role, doc_type, original_name, mime, extracted, ai_model, ai_error, created_at FROM horse_documents WHERE horse_id=$1 ORDER BY created_at', [h.id]),
  ]);
  const documents = docs.map((d) => ({ ...d, checks: DOCS.compare(h, d) }));
  res.json({ ...h, photos, videos, certificates, merits, levelHistory, documents });
}));

// Expedir certificado. ORIGEN asigna número de registro y publica el ejemplar en el Registro.
router.post('/horses/:id/certificates', requireRole('ADMIN'), wrap(async (req, res) => {
  const { type, notes } = req.body || {};
  if (!['ORIGEN', 'CALIDAD'].includes(type)) return res.status(400).json({ error: 'Tipo no válido' });
  const cert = await db.tx(async (client) => {
    const horse = await db.one('SELECT * FROM horses WHERE id::text=$1 FOR UPDATE', [req.params.id], client);
    if (!horse) throw Object.assign(new Error('Ejemplar no encontrado'), { status: 404 });
    // Calidad: uno solo por ejemplar, "vivo" (muestra siempre el nivel actual). Requiere Origen y una valoración con nivel.
    if (type === 'CALIDAD') {
      if (horse.status !== 'CERTIFICADO') throw Object.assign(new Error('Primero debe expedirse el Certificado de Origen'), { status: 400 });
      if (!horse.level) throw Object.assign(new Error('El ejemplar aún no tiene nivel de calidad: resuelve antes una valoración (o asígnalo por méritos)'), { status: 400 });
      const prev = await db.one("SELECT id FROM certificates WHERE horse_id=$1 AND type='CALIDAD' AND status='VIGENTE'", [horse.id], client);
      if (prev) throw Object.assign(new Error('Ya tiene Certificado de Calidad vigente: se actualiza solo cuando cambia el nivel'), { status: 400 });
    }
    if (type === 'ORIGEN') {
      const prev = await db.one("SELECT id FROM certificates WHERE horse_id=$1 AND type='ORIGEN' AND status='VIGENTE'", [horse.id], client);
      if (prev) throw Object.assign(new Error('Ya tiene Certificado de Origen vigente'), { status: 400 });
    }
    if (type === 'ORIGEN' && horse.originStatus !== 'ACREDITADO') {
      throw Object.assign(new Error('Antes de expedir el Certificado de Origen hay que acreditar la procedencia (documentos del ejemplar o de sus padres)'), { status: 400 });
    }
    if (type === 'ORIGEN' && !horse.registrationNumber) {
      await db.query("UPDATE horses SET registration_number=$2, status='CERTIFICADO', updated_at=now() WHERE id=$1",
        [horse.id, await nextRegistrationNumber(client)], client);
    }
    const c = await db.one(
      'INSERT INTO certificates(horse_id, type, code, stars, amber_stars, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [horse.id, type, verificationCode(), null, 0, notes || null], client,
    );
    await audit(req.user.id, 'Certificate', c.id, 'EXPEDIR', { type, ejemplar: horse.name, stars: c.stars }, client);
    return c;
  });
  res.status(201).json(cert);
}));

router.post('/certificates/:id/revoke', requireRole('ADMIN'), wrap(async (req, res) => {
  if (!req.body?.reason) return res.status(400).json({ error: 'Indica el motivo de la revocación' });
  const cert = await db.one("UPDATE certificates SET status='REVOCADO', revoked_at=now(), notes=$2 WHERE id::text=$1 RETURNING *", [req.params.id, req.body.reason]);
  if (!cert) return res.status(404).json({ error: 'Certificado no encontrado' });
  audit(req.user.id, 'Certificate', cert.id, 'REVOCAR', { reason: req.body.reason });
  res.json(cert);
}));

// Méritos deportivos: se registran con su documento oficial y la presidencia los verifica
router.post('/horses/:id/merits', upload.single('document'), wrap(async (req, res) => {
  const { competition, category, level, position, score, date } = req.body || {};
  if (!competition || !category || !MERIT_STARS[level] || !position || !date) return res.status(400).json({ error: 'Faltan datos del resultado' });
  const h = await db.one('SELECT id FROM horses WHERE id::text=$1', [req.params.id]);
  if (!h) return res.status(404).json({ error: 'Ejemplar no encontrado' });
  const m = await db.one(
    `INSERT INTO sport_merits(horse_id, competition, category, level, position, score, date, stars_given, document_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [h.id, competition, category, level, position, score ? Number(score) : null, date, MERIT_STARS[level], req.file ? `/uploads/${req.file.filename}` : null],
  );
  audit(req.user.id, 'SportMerit', m.id, 'CREAR', { competition, level });
  res.status(201).json(m);
}));

router.post('/merits/:id/verify', requireRole('ADMIN'), wrap(async (req, res) => {
  const m = await db.one('UPDATE sport_merits SET verified=TRUE WHERE id::text=$1 RETURNING *', [req.params.id]);
  if (!m) return res.status(404).json({ error: 'Resultado no encontrado' });
  audit(req.user.id, 'SportMerit', m.id, 'VERIFICAR', {});
  res.json(m);
}));

// Origen: DECLARADO (lo dice el titular) o ACREDITADO (documentos oficiales o ADN revisados). Auditado.
router.post('/horses/:id/origin', requireRole('ADMIN'), wrap(async (req, res) => {
  const { status, notes } = req.body || {};
  if (!['DECLARADO', 'ACREDITADO'].includes(status)) return res.status(400).json({ error: 'Estado de origen no válido' });
  if (!notes || notes.trim().length < 5) return res.status(400).json({ error: 'Indica qué documento o prueba se ha revisado' });
  const h = await db.one('SELECT id, name, origin_status FROM horses WHERE id::text=$1', [req.params.id]);
  if (!h) return res.status(404).json({ error: 'Ejemplar no encontrado' });
  await db.query('UPDATE horses SET origin_status=$2, origin_notes=$3, updated_at=now() WHERE id=$1', [h.id, status, notes.trim()]);
  await audit(req.user.id, 'Horse', h.id, 'ORIGEN', { ejemplar: h.name, de: h.originStatus, a: status, notes });
  res.json({ id: h.id, originStatus: status });
}));

// Cambio manual de nivel por la presidencia (p. ej. subida por méritos deportivos). Motivo obligatorio y auditado.
router.post('/horses/:id/level', requireRole('ADMIN'), wrap(async (req, res) => {
  const level = Number(req.body?.level);
  const { reason = 'MERITO', notes } = req.body || {};
  if (!Number.isInteger(level) || level < 0 || level > 5) return res.status(400).json({ error: 'El nivel debe estar entre 0 y V' });
  if (!['MERITO', 'MANUAL'].includes(reason)) return res.status(400).json({ error: 'Motivo no válido' });
  if (!notes || notes.trim().length < 5) return res.status(400).json({ error: 'Explica el motivo (competición, resultado, documento…)' });
  const out = await db.tx(async (client) => {
    const h = await db.one('SELECT id, name, level FROM horses WHERE id::text=$1 FOR UPDATE', [req.params.id], client);
    if (!h) throw Object.assign(new Error('Ejemplar no encontrado'), { status: 404 });
    if (h.level === level) throw Object.assign(new Error('El ejemplar ya tiene ese nivel'), { status: 400 });
    await db.query('UPDATE horses SET level=$2, updated_at=now() WHERE id=$1', [h.id, level], client);
    await db.query('INSERT INTO level_history(horse_id, from_level, to_level, reason, notes, decided_by) VALUES ($1,$2,$3,$4,$5,$6)',
      [h.id, h.level, level, reason, notes.trim(), req.user.id], client);
    await audit(req.user.id, 'Horse', h.id, 'NIVEL', { ejemplar: h.name, de: h.level, a: level, reason, notes }, client);
    return { id: h.id, level, previous: h.level };
  });
  res.json(out);
}));

// ─── Usuarios: control total de la presidencia ───
const USER_COLS = 'u.id, u.email, u.first_name, u.last_name, u.role, u.phone, u.country, u.city, u.is_active, u.created_at';
router.get('/users', requireRole('ADMIN'), wrap(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const params = [];
  let where = 'TRUE';
  if (q) { params.push(`%${q}%`); where = "(u.email ILIKE $1 OR u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.phone ILIKE $1)"; }
  res.json(await db.query(
    `SELECT ${USER_COLS}, (SELECT COUNT(*)::int FROM horses h WHERE h.owner_id=u.id) AS horse_count,
       (SELECT COUNT(*)::int FROM service_requests r WHERE r.user_id=u.id) AS request_count
     FROM users u WHERE ${where} ORDER BY u.created_at DESC LIMIT 500`, params,
  ));
}));

router.get('/users/:id', requireRole('ADMIN'), wrap(async (req, res) => {
  const u = await db.one(`SELECT ${USER_COLS} FROM users u WHERE u.id::text=$1`, [req.params.id]);
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
  const [horses, requests] = await Promise.all([
    db.query('SELECT id, name, registration_number, breed, status, level FROM horses WHERE owner_id=$1 ORDER BY created_at DESC', [u.id]),
    db.query('SELECT id, service, status, created_at FROM service_requests WHERE user_id=$1 ORDER BY created_at DESC', [u.id]),
  ]);
  res.json({ ...u, horses, requests });
}));

const tempPassword = () => crypto.randomBytes(6).toString('base64url');

router.post('/users', requireRole('ADMIN'), wrap(async (req, res) => {
  const b = req.body || {};
  const email = String(b.email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email) || !String(b.firstName || '').trim() || !String(b.lastName || '').trim()) return res.status(400).json({ error: 'Email, nombre y apellidos son obligatorios' });
  const role = ['ADMIN', 'EVALUADOR', 'TITULAR'].includes(b.role) ? b.role : 'TITULAR';
  const password = b.password && String(b.password).length >= 8 ? String(b.password) : tempPassword();
  const u = await db.one(
    `INSERT INTO users(email, password, role, first_name, last_name, phone, country, city) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id, email, role, first_name, last_name`,
    [email, await bcrypt.hash(password, 10), role, b.firstName.trim(), b.lastName.trim(), b.phone || null, (b.country || 'España').trim(), b.city || null],
  );
  audit(req.user.id, 'User', u.id, 'CREAR', { email, role });
  res.status(201).json({ ...u, tempPassword: b.password ? null : password });
}));

router.patch('/users/:id', requireRole('ADMIN'), wrap(async (req, res) => {
  const b = req.body || {};
  const self = req.params.id === req.user.id;
  if (self && (b.isActive === false || (b.role && b.role !== 'ADMIN'))) return res.status(400).json({ error: 'No puedes bloquearte ni quitarte la presidencia a ti mismo' });
  if (b.role && !['ADMIN', 'EVALUADOR', 'TITULAR'].includes(b.role)) return res.status(400).json({ error: 'Rol no válido' });
  if (b.email && !/^\S+@\S+\.\S+$/.test(b.email)) return res.status(400).json({ error: 'Email no válido' });
  const map = { email: 'email', firstName: 'first_name', lastName: 'last_name', phone: 'phone', country: 'country', city: 'city', role: 'role', isActive: 'is_active' };
  const sets = []; const vals = [req.params.id];
  Object.entries(map).forEach(([k, col]) => {
    if (b[k] === undefined) return;
    vals.push(k === 'email' ? String(b[k]).trim().toLowerCase() : k === 'isActive' ? Boolean(b[k]) : (b[k] === '' ? null : b[k]));
    sets.push(`${col}=$${vals.length}`);
  });
  if (!sets.length) return res.status(400).json({ error: 'Nada que cambiar' });
  const u = await db.one(`UPDATE users SET ${sets.join(', ')} WHERE id::text=$1 RETURNING id, email, role, is_active`, vals);
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
  audit(req.user.id, 'User', u.id, 'EDITAR', b);
  res.json(u);
}));

router.post('/users/:id/password', requireRole('ADMIN'), wrap(async (req, res) => {
  const password = tempPassword();
  const u = await db.one('UPDATE users SET password=$2 WHERE id::text=$1 RETURNING id, email', [req.params.id, await bcrypt.hash(password, 10)]);
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
  audit(req.user.id, 'User', u.id, 'CLAVE_REINICIADA', { email: u.email });
  res.json({ email: u.email, tempPassword: password });
}));

// Compatibilidad con el panel anterior
router.patch('/users/:id/role', requireRole('ADMIN'), wrap(async (req, res) => {
  if (!['ADMIN', 'EVALUADOR', 'TITULAR'].includes(req.body?.role)) return res.status(400).json({ error: 'Rol no válido' });
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
  const u = await db.one('UPDATE users SET role=$2 WHERE id::text=$1 RETURNING id, role', [req.params.id, req.body.role]);
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
  audit(req.user.id, 'User', u.id, 'ROL', { role: u.role });
  res.json(u);
}));

// ─── Ejemplares: la presidencia puede darlos de alta y editarlos (siempre con el reglamento) ───
router.get('/horses', wrap(async (req, res) => {
  const { q = '', status = '', breed = '', origin = '' } = req.query;
  const params = []; const w = ['TRUE'];
  if (q) { params.push(`%${q}%`); w.push(`(h.name ILIKE $${params.length} OR h.registration_number ILIKE $${params.length} OR h.microchip ILIKE $${params.length} OR u.email ILIKE $${params.length} OR h.external_owner ILIKE $${params.length})`); }
  if (status) { params.push(status); w.push(`h.status=$${params.length}`); }
  if (breed) { params.push(breed); w.push(`h.breed=$${params.length}`); }
  if (origin) { params.push(origin); w.push(`h.origin_status=$${params.length}`); }
  res.json(await db.query(
    `SELECT h.id, h.name, h.registration_number, h.breed, h.birth_date, h.status, h.level, h.is_public, h.origin_status, h.laureado, h.amber_stars,
       h.external_owner, h.created_at, u.first_name || ' ' || u.last_name AS owner_name, u.email AS owner_email,
       (SELECT COUNT(*)::int FROM horse_photos p WHERE p.horse_id=h.id) AS photo_count,
       (SELECT COUNT(*)::int FROM horse_videos v WHERE v.horse_id=h.id) AS video_count,
       EXISTS(SELECT 1 FROM certificates c WHERE c.horse_id=h.id AND c.type='CALIDAD' AND c.status='VIGENTE') AS has_quality
     FROM horses h JOIN users u ON u.id=h.owner_id WHERE ${w.join(' AND ')} ORDER BY h.created_at DESC LIMIT 1000`, params,
  ));
}));

async function ownerFrom(b, fallbackId) {
  const email = String(b.ownerEmail || '').trim().toLowerCase();
  if (!email) return { id: fallbackId };
  const u = await db.one('SELECT id FROM users WHERE email=$1', [email]);
  if (!u) throw Object.assign(new Error(`No hay ninguna cuenta con el email ${email}. Créala en Usuarios o deja el campo vacío.`), { status: 400 });
  return { id: u.id };
}

router.post('/horses', requireRole('ADMIN'), wrap(async (req, res) => {
  const b = req.body || {};
  const v = validateHorse(b);
  if (v.error) return res.status(400).json({ error: v.error });
  const owner = await ownerFrom(b, req.user.id);
  const data = { ...v.data, external_owner: String(b.externalOwner || '').trim() || null, admin_notes: b.adminNotes || null, is_public: b.isPublic !== false };
  const cols = Object.keys(data);
  const h = await db.one(
    `INSERT INTO horses(${cols.join(', ')}, owner_id) VALUES (${cols.map((_, n) => `$${n + 1}`).join(',')}, $${cols.length + 1}) RETURNING *`,
    [...cols.map((k) => data[k]), owner.id],
  );
  audit(req.user.id, 'Horse', h.id, 'CREAR_PRESIDENCIA', { name: h.name, titular: b.ownerEmail || b.externalOwner || 'presidencia' });
  res.status(201).json(h);
}));

router.patch('/horses/:id', requireRole('ADMIN'), wrap(async (req, res) => {
  const b = req.body || {};
  const h = await db.one('SELECT * FROM horses WHERE id::text=$1', [req.params.id]);
  if (!h) return res.status(404).json({ error: 'Ejemplar no encontrado' });
  const sets = []; const vals = [h.id]; const changes = {};
  const put = (col, val) => { vals.push(val); sets.push(`${col}=$${vals.length}`); changes[col] = val; };
  // Datos del ejemplar: se revalidan completos con el reglamento
  const DATA_KEYS = ['name', 'birthDate', 'sex', 'coat', 'country', 'breed', 'ibericBloodPct', 'sireName', 'damName', 'breederName', 'microchip', 'officialRegistry', 'sireRegistry', 'damRegistry'];
  if (DATA_KEYS.some((k) => b[k] !== undefined)) {
    const merged = {
      name: h.name, birthDate: h.birthDate, sex: h.sex, coat: h.coat, country: h.country, breed: h.breed, ibericBloodPct: h.ibericBloodPct,
      sireName: h.sireName, damName: h.damName, breederName: h.breederName, microchip: h.microchip, officialRegistry: h.officialRegistry,
      sireRegistry: h.sireRegistry, damRegistry: h.damRegistry,
    };
    DATA_KEYS.forEach((k) => { if (b[k] !== undefined) merged[k] = b[k]; });
    const v = validateHorse(merged);
    if (v.error) return res.status(400).json({ error: v.error });
    Object.entries(v.data).forEach(([col, val]) => { if (String(val ?? '') !== String(h[col.replace(/_(\w)/g, (_, c) => c.toUpperCase())] ?? '')) put(col, val); });
  }
  if (b.isPublic !== undefined) put('is_public', Boolean(b.isPublic));
  if (b.laureado !== undefined) put('laureado', Boolean(b.laureado));
  if (b.amberStars !== undefined) {
    const n = parseInt(b.amberStars, 10);
    if (Number.isNaN(n) || n < 0 || n > 99) return res.status(400).json({ error: 'Estrellas ámbar no válidas' });
    put('amber_stars', n);
  }
  if (b.externalOwner !== undefined) put('external_owner', String(b.externalOwner).trim() || null);
  if (b.adminNotes !== undefined) put('admin_notes', b.adminNotes || null);
  if (b.status !== undefined) {
    // CERTIFICADO solo se alcanza expidiendo el Certificado de Origen
    const allowed = h.status === 'CERTIFICADO' ? ['CERTIFICADO', 'BAJA'] : ['PENDIENTE', 'RECHAZADO', 'BAJA'];
    if (h.status === 'BAJA') allowed.push(h.registrationNumber ? 'CERTIFICADO' : 'PENDIENTE');
    if (!allowed.includes(b.status)) return res.status(400).json({ error: 'Cambio de estado no permitido (el estado «certificado» se obtiene expidiendo el Certificado de Origen)' });
    put('status', b.status);
  }
  if (String(b.ownerEmail || '').trim()) {
    const owner = await ownerFrom(b, req.user.id);
    if (owner.id !== h.ownerId) put('owner_id', owner.id);
  }
  if (!sets.length) return res.json(h);
  const out = await db.one(`UPDATE horses SET ${sets.join(', ')}, updated_at=now() WHERE id=$1 RETURNING *`, vals);
  audit(req.user.id, 'Horse', h.id, 'EDITAR_PRESIDENCIA', { ejemplar: h.name, cambios: changes });
  res.json(out);
}));

// ─── Listados ───
router.get('/certificates', requireRole('ADMIN'), wrap(async (req, res) => {
  const q = String(req.query.q || '').trim(); const params = []; let where = 'TRUE';
  if (q) { params.push(`%${q}%`); where = '(c.code ILIKE $1 OR h.name ILIKE $1 OR h.registration_number ILIKE $1)'; }
  res.json(await db.query(
    `SELECT c.id, c.type, c.code, c.status, c.issued_at, c.revoked_at, c.notes, h.id AS horse_id, h.name AS horse_name, h.registration_number, h.level
     FROM certificates c JOIN horses h ON h.id=c.horse_id WHERE ${where} ORDER BY c.issued_at DESC LIMIT 1000`, params,
  ));
}));

router.get('/merits', wrap(async (req, res) => {
  res.json(await db.query(
    `SELECT m.*, h.name AS horse_name, h.registration_number FROM sport_merits m JOIN horses h ON h.id=m.horse_id
     ORDER BY m.verified ASC, m.date DESC LIMIT 1000`,
  ));
}));

router.get('/payments', requireRole('ADMIN'), wrap(async (req, res) => {
  res.json(await db.query(
    `SELECT p.id, p.amount, p.currency, p.status, p.created_at, p.paid_at, p.stripe_id, r.service, u.email AS user_email,
       u.first_name || ' ' || u.last_name AS user_name
     FROM payments p JOIN users u ON u.id=p.user_id LEFT JOIN service_requests r ON r.id=p.request_id ORDER BY p.created_at DESC LIMIT 1000`,
  ));
}));

// ─── Exportar a CSV (se abre en Excel) ───
const EXPORTS = {
  ejemplares: `SELECT h.registration_number AS "Nº registro", h.name AS "Nombre", h.breed AS "Raza", h.sex AS "Sexo", h.birth_date AS "Nacimiento",
      h.coat AS "Capa", h.country AS "País", h.microchip AS "Microchip", h.official_registry AS "Libro oficial", h.sire_name AS "Padre", h.sire_registry AS "Nº padre",
      h.dam_name AS "Madre", h.dam_registry AS "Nº madre", h.status AS "Estado", h.origin_status AS "Procedencia", h.level AS "Nivel", h.is_public AS "Público",
      h.laureado AS "Laureado", h.amber_stars AS "Estrellas ámbar", COALESCE(h.external_owner, u.first_name || ' ' || u.last_name) AS "Titular", u.email AS "Email titular", h.created_at AS "Alta"
    FROM horses h JOIN users u ON u.id=h.owner_id ORDER BY h.created_at`,
  usuarios: `SELECT email AS "Email", first_name AS "Nombre", last_name AS "Apellidos", role AS "Rol", phone AS "Teléfono", country AS "País", city AS "Ciudad",
      is_active AS "Activo", created_at AS "Alta" FROM users ORDER BY created_at`,
  certificados: `SELECT c.code AS "Código", c.type AS "Tipo", c.status AS "Estado", h.name AS "Ejemplar", h.registration_number AS "Nº registro", h.level AS "Nivel actual",
      c.issued_at AS "Expedido", c.revoked_at AS "Revocado" FROM certificates c JOIN horses h ON h.id=c.horse_id ORDER BY c.issued_at`,
  meritos: `SELECT h.name AS "Ejemplar", h.registration_number AS "Nº registro", m.competition AS "Competición", m.category AS "Prueba", m.level AS "Nivel",
      m.position AS "Puesto", m.score AS "Nota", m.date AS "Fecha", m.stars_given AS "Estrellas", m.verified AS "Verificado"
    FROM sport_merits m JOIN horses h ON h.id=m.horse_id ORDER BY m.date`,
  pagos: `SELECT p.created_at AS "Fecha", u.email AS "Usuario", r.service AS "Gestión", p.amount / 100.0 AS "Importe", p.currency AS "Moneda", p.status AS "Estado", p.paid_at AS "Pagado"
    FROM payments p JOIN users u ON u.id=p.user_id LEFT JOIN service_requests r ON r.id=p.request_id ORDER BY p.created_at`,
  gestiones: `SELECT r.created_at AS "Fecha", r.service AS "Gestión", r.status AS "Estado", u.email AS "Titular", h.name AS "Ejemplar", r.notes AS "Notas", r.admin_notes AS "Notas presidencia"
    FROM service_requests r JOIN users u ON u.id=r.user_id LEFT JOIN horses h ON h.id=r.horse_id ORDER BY r.created_at`,
};
const csvCell = (v) => {
  if (v === null || v === undefined) return '';
  const s = v instanceof Date ? v.toISOString().slice(0, 19).replace('T', ' ') : typeof v === 'boolean' ? (v ? 'sí' : 'no') : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
router.get('/export/:kind', requireRole('ADMIN'), wrap(async (req, res) => {
  const sql = EXPORTS[req.params.kind];
  if (!sql) return res.status(404).json({ error: 'Listado no disponible' });
  const r = await db.pool.query(sql);
  const head = r.fields.map((f) => csvCell(f.name)).join(';');
  const lines = r.rows.map((row) => r.fields.map((f) => csvCell(row[f.name])).join(';'));
  audit(req.user.id, 'Export', req.params.kind, 'EXPORTAR', { listado: req.params.kind, filas: r.rows.length });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="c-iberico-${req.params.kind}-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(`﻿${[head, ...lines].join('\r\n')}`);
}));

router.get('/audit', requireRole('ADMIN'), wrap(async (req, res) => {
  res.json(await db.query(
    `SELECT a.*, u.first_name || ' ' || u.last_name AS user_name FROM audit_log a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.at DESC LIMIT 200`,
  ));
}));

module.exports = router;
