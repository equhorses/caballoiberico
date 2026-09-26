// Presidencia: gestiones, expedición/revocación de certificados, méritos deportivos y usuarios
const router = require('express').Router();
const { db, MERIT_STARS, upload, authenticate, requireRole, audit, verificationCode, nextRegistrationNumber, wrap } = require('../lib/common');

router.use(authenticate, requireRole('ADMIN', 'EVALUADOR'));

const REQ_STATUS = ['PENDIENTE_PAGO', 'PAGADA', 'EN_REVISION', 'REQUIERE_DOCUMENTACION', 'RESUELTA', 'RECHAZADA'];

router.get('/stats', wrap(async (req, res) => {
  res.json(await db.one(`SELECT
    (SELECT COUNT(*)::int FROM horses) AS horses,
    (SELECT COUNT(*)::int FROM horses WHERE status='CERTIFICADO') AS certified,
    (SELECT COUNT(*)::int FROM service_requests WHERE status IN ('PENDIENTE_PAGO','PAGADA','EN_REVISION','REQUIERE_DOCUMENTACION')) AS pending,
    (SELECT COUNT(*)::int FROM evaluation_cases WHERE status <> 'RESUELTO') AS open_cases,
    (SELECT COALESCE(SUM(amount),0)::int FROM payments WHERE status='COMPLETADO') / 100.0 AS revenue`));
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
  const [photos, videos, certificates, merits] = await Promise.all([
    db.query('SELECT * FROM horse_photos WHERE horse_id=$1', [h.id]),
    db.query('SELECT * FROM horse_videos WHERE horse_id=$1', [h.id]),
    db.query('SELECT * FROM certificates WHERE horse_id=$1 ORDER BY issued_at', [h.id]),
    db.query('SELECT * FROM sport_merits WHERE horse_id=$1 ORDER BY date DESC', [h.id]),
  ]);
  res.json({ ...h, photos, videos, certificates, merits });
}));

// Expedir certificado. ORIGEN asigna número de registro y publica el ejemplar en el Registro.
router.post('/horses/:id/certificates', requireRole('ADMIN'), wrap(async (req, res) => {
  const { type, stars, amberStars = 0, notes } = req.body || {};
  if (!['ORIGEN', 'CALIDAD'].includes(type)) return res.status(400).json({ error: 'Tipo no válido' });
  const cert = await db.tx(async (client) => {
    const horse = await db.one('SELECT * FROM horses WHERE id::text=$1 FOR UPDATE', [req.params.id], client);
    if (!horse) throw Object.assign(new Error('Ejemplar no encontrado'), { status: 404 });
    if (type === 'CALIDAD') {
      if (horse.status !== 'CERTIFICADO') throw Object.assign(new Error('Primero debe expedirse el Certificado de Origen'), { status: 400 });
      if (![3, 6, 12, 24].includes(Number(stars))) throw Object.assign(new Error('Estrellas: 3, 6, 12 o 24'), { status: 400 });
    }
    if (type === 'ORIGEN' && !horse.registrationNumber) {
      await db.query("UPDATE horses SET registration_number=$2, status='CERTIFICADO', updated_at=now() WHERE id=$1",
        [horse.id, await nextRegistrationNumber(client)], client);
    }
    const c = await db.one(
      'INSERT INTO certificates(horse_id, type, code, stars, amber_stars, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [horse.id, type, verificationCode(), type === 'CALIDAD' ? Number(stars) : null, Number(amberStars) || 0, notes || null], client,
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

router.get('/users', requireRole('ADMIN'), wrap(async (req, res) => {
  res.json(await db.query('SELECT id, email, first_name, last_name, role, country, created_at FROM users ORDER BY created_at DESC'));
}));

router.patch('/users/:id/role', requireRole('ADMIN'), wrap(async (req, res) => {
  if (!['ADMIN', 'EVALUADOR', 'TITULAR'].includes(req.body?.role)) return res.status(400).json({ error: 'Rol no válido' });
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
  const u = await db.one('UPDATE users SET role=$2 WHERE id::text=$1 RETURNING id, role', [req.params.id, req.body.role]);
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
  audit(req.user.id, 'User', u.id, 'ROL', { role: u.role });
  res.json(u);
}));

router.get('/audit', requireRole('ADMIN'), wrap(async (req, res) => {
  res.json(await db.query(
    `SELECT a.*, u.first_name || ' ' || u.last_name AS user_name FROM audit_log a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.at DESC LIMIT 200`,
  ));
}));

module.exports = router;
