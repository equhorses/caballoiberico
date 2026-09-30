// Panel del titular: sus ejemplares, fotos/vídeo, solicitudes y pagos
const router = require('express').Router();
const { db, SERVICES, upload, authenticate, audit, wrap } = require('../lib/common');

const DOCS = require('../lib/documents');

const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

const VIEWS = ['LATERAL_IZQUIERDO', 'LATERAL_DERECHO', 'FRONTAL', 'TRASERA', 'SUPERIOR'];
const BREEDS = ['PRE', 'PSL', 'PRE_PSL', 'CRUZADO'];
const SEXES = ['MACHO', 'HEMBRA', 'CASTRADO'];

async function ownHorse(req, res) {
  const h = await db.one('SELECT * FROM horses WHERE id::text=$1', [req.params.id]);
  if (!h || (h.ownerId !== req.user.id && req.user.role === 'TITULAR')) { res.status(404).json({ error: 'Ejemplar no encontrado' }); return null; }
  return h;
}

async function withRelations(horses) {
  if (!horses.length) return [];
  const ids = horses.map((h) => h.id);
  const [photos, videos, certs, cases, docs] = await Promise.all([
    db.query('SELECT * FROM horse_photos WHERE horse_id = ANY($1)', [ids]),
    db.query('SELECT * FROM horse_videos WHERE horse_id = ANY($1) ORDER BY uploaded_at DESC', [ids]),
    db.query('SELECT * FROM certificates WHERE horse_id = ANY($1) ORDER BY issued_at', [ids]),
    db.query('SELECT id, horse_id, status, created_at, resolved_at, summary FROM evaluation_cases WHERE horse_id = ANY($1) ORDER BY created_at DESC', [ids]),
    db.query('SELECT id, horse_id, role, doc_type, original_name, created_at FROM horse_documents WHERE horse_id = ANY($1) ORDER BY created_at', [ids]),
  ]);
  return horses.map((h) => ({
    ...h,
    photos: photos.filter((p) => p.horseId === h.id),
    videos: videos.filter((v) => v.horseId === h.id),
    certificates: certs.filter((c) => c.horseId === h.id),
    documents: docs.filter((d) => d.horseId === h.id),
    cases: cases.filter((c) => c.horseId === h.id),
  }));
}

// Webhook de Stripe (se monta en server.js con body raw, antes de este router)
router.webhook = wrap(async (req, res) => {
  if (!stripe) return res.sendStatus(204);
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).send(`Webhook error: ${e.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;
    await db.query("UPDATE payments SET status='COMPLETADO', paid_at=now() WHERE stripe_id=$1", [s.id]);
    if (s.metadata?.requestId) {
      await db.query("UPDATE service_requests SET status='PAGADA' WHERE id=$1 AND status='PENDIENTE_PAGO'", [s.metadata.requestId]);
      audit(s.metadata.userId, 'ServiceRequest', s.metadata.requestId, 'PAGO', { amount: s.amount_total });
    }
  }
  res.json({ received: true });
});

router.use(authenticate);

router.get('/horses', wrap(async (req, res) => {
  res.json(await withRelations(await db.query('SELECT * FROM horses WHERE owner_id=$1 ORDER BY created_at DESC', [req.user.id])));
}));

router.post('/horses', wrap(async (req, res) => {
  const b = req.body || {};
  const rawPct = b.ibericBloodPct;
  const pct = rawPct === undefined || rawPct === null || rawPct === '' ? null : parseInt(rawPct, 10);
  if (!b.name || !b.birthDate || !SEXES.includes(b.sex) || !BREEDS.includes(b.breed) || !b.coat || !b.country) {
    return res.status(400).json({ error: 'Faltan datos obligatorios del ejemplar' });
  }
  if (!b.microchip || !String(b.microchip).trim()) return res.status(400).json({ error: 'El microchip es obligatorio: es lo que identifica al caballo, tenga o no papeles' });
  const t = (v) => (v == null ? '' : String(v).trim());
  if (['PRE', 'PSL'].includes(b.breed) && !t(b.officialRegistry)) {
    return res.status(400).json({ error: 'Para un PRE o un PSL indica su número en el libro oficial (ANCCE, APSL…)' });
  }
  if (['PRE_PSL', 'CRUZADO'].includes(b.breed) && (!t(b.sireName) || !t(b.damName) || !t(b.sireRegistry) || !t(b.damRegistry))) {
    return res.status(400).json({ error: 'En un cruce hay que indicar padre y madre con su número de registro (libro oficial o C-IBERICO)' });
  }
  if (pct !== null && (Number.isNaN(pct) || pct < 10 || pct > 100)) return res.status(400).json({ error: 'El % de sangre ibérica debe estar entre 10 y 100 (déjalo en blanco si no se conoce)' });
  const h = await db.one(
    `INSERT INTO horses(name, birth_date, sex, coat, country, breed, iberic_blood_pct, sire_name, dam_name, breeder_name, microchip, official_registry, owner_id, sire_registry, dam_registry)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [b.name.trim().toUpperCase(), b.birthDate, b.sex, b.coat, b.country, b.breed, pct, b.sireName || null, b.damName || null,
      b.breederName || null, String(b.microchip).trim(), b.officialRegistry || null, req.user.id, t(b.sireRegistry) || null, t(b.damRegistry) || null],
  );
  const docIds = Array.isArray(b.documentIds) ? b.documentIds.filter((x) => /^[0-9a-f-]{36}$/i.test(x)) : [];
  if (docIds.length) {
    await db.query('UPDATE horse_documents SET horse_id=$1 WHERE id = ANY($2::uuid[]) AND user_id=$3 AND horse_id IS NULL', [h.id, docIds, req.user.id]);
  }
  audit(req.user.id, 'Horse', h.id, 'CREAR', { name: h.name, documentos: docIds.length });
  res.status(201).json(h);
}));

router.get('/horses/:id', wrap(async (req, res) => {
  const h = await ownHorse(req, res);
  if (!h) return;
  const [full] = await withRelations([h]);
  full.merits = await db.query('SELECT * FROM sport_merits WHERE horse_id=$1 ORDER BY date DESC', [h.id]);
  full.requests = await db.query('SELECT * FROM service_requests WHERE horse_id=$1 ORDER BY created_at DESC', [h.id]);
  res.json(full);
}));

router.patch('/horses/:id', wrap(async (req, res) => {
  if (!(await ownHorse(req, res))) return;
  res.json(await db.one('UPDATE horses SET is_public=$2, updated_at=now() WHERE id=$1 RETURNING *', [req.params.id, Boolean(req.body?.isPublic)]));
}));

router.post('/horses/:id/photos/:view', upload.single('file'), wrap(async (req, res) => {
  if (!(await ownHorse(req, res))) return;
  const { view } = req.params;
  if (!VIEWS.includes(view)) return res.status(400).json({ error: 'Vista no válida' });
  if (!req.file || !req.file.mimetype.startsWith('image/')) return res.status(400).json({ error: 'Sube una imagen JPG, PNG o WEBP' });
  const photo = await db.one(
    `INSERT INTO horse_photos(horse_id, view, url) VALUES ($1,$2,$3)
     ON CONFLICT (horse_id, view) DO UPDATE SET url=EXCLUDED.url, uploaded_at=now() RETURNING *`,
    [req.params.id, view, `/uploads/${req.file.filename}`],
  );
  audit(req.user.id, 'Horse', req.params.id, 'FOTO', { view });
  res.json(photo);
}));

router.post('/horses/:id/video', upload.single('file'), wrap(async (req, res) => {
  if (!(await ownHorse(req, res))) return;
  if (!req.file || !req.file.mimetype.startsWith('video/')) return res.status(400).json({ error: 'Sube un vídeo MP4, MOV o WEBM' });
  const v = await db.one('INSERT INTO horse_videos(horse_id, url, seconds) VALUES ($1,$2,$3) RETURNING *',
    [req.params.id, `/uploads/${req.file.filename}`, parseInt(req.body.seconds, 10) || null]);
  audit(req.user.id, 'Horse', req.params.id, 'VIDEO', {});
  res.json(v);
}));

// ─── Solicitudes (gestiones) ───
// ── Documentación: se sube, la IA la lee y propone los datos (el titular revisa; la presidencia acredita) ──
const DOC_ROLES = ['EJEMPLAR', 'PADRE', 'MADRE'];
const DOC_MIME = /^(image\/(jpeg|png|webp)|application\/pdf)$/;

async function saveDocument(req, res, horseId) {
  const role = String(req.body?.role || 'EJEMPLAR').toUpperCase();
  if (!req.file) return res.status(400).json({ error: 'Sube una foto (JPG/PNG) o un PDF del documento' });
  if (!DOC_MIME.test(req.file.mimetype)) return res.status(400).json({ error: 'Formato no admitido: usa JPG, PNG, WEBP o PDF' });
  if (!DOC_ROLES.includes(role)) return res.status(400).json({ error: 'Tipo de documento no válido' });
  const name = DOCS.storePrivate(req.file);
  const ex = await DOCS.extract({ name, mime: req.file.mimetype, role });
  const d = await db.one(
    `INSERT INTO horse_documents(user_id, horse_id, role, file, mime, original_name, doc_type, extracted, ai_model, ai_error)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, role, doc_type, created_at`,
    [req.user.id, horseId || null, role, name, req.file.mimetype, req.file.originalname, ex.docType || null,
      ex.fields ? JSON.stringify({ fields: ex.fields, legible: ex.legible, notes: ex.notes }) : null, ex.model || null, ex.error || null],
  );
  if (horseId) audit(req.user.id, 'Horse', horseId, 'DOCUMENTO', { role, docType: ex.docType });
  res.status(201).json({ id: d.id, role, docType: ex.docType || null, fields: ex.fields || null, legible: ex.legible, notes: ex.notes || '', aiError: ex.error || null });
}

// Antes del alta: sirve para rellenar el formulario
router.post('/documents/extract', upload.single('file'), wrap(async (req, res) => saveDocument(req, res, null)));

// Para un ejemplar ya dado de alta
router.post('/horses/:id/documents', upload.single('file'), wrap(async (req, res) => {
  const h = await ownHorse(req, res);
  if (!h) return;
  return saveDocument(req, res, h.id);
}));

// Ver el archivo: solo el titular que lo subió o la presidencia/evaluadores
router.get('/documents/:id/file', wrap(async (req, res) => {
  const d = await db.one('SELECT * FROM horse_documents WHERE id::text=$1', [req.params.id]);
  if (!d || (d.userId !== req.user.id && !['ADMIN', 'EVALUADOR'].includes(req.user.role))) return res.status(404).json({ error: 'Documento no encontrado' });
  res.setHeader('Content-Type', d.mime);
  res.setHeader('Cache-Control', 'private, no-store');
  res.sendFile(DOCS.privatePath(d.file));
}));

// Descarga de un documento de una gestión: solo el titular o la presidencia/evaluadores
router.get('/requests/:id/documents/:n', wrap(async (req, res) => {
  const r = await db.one('SELECT * FROM service_requests WHERE id::text=$1', [req.params.id]);
  if (!r || (r.userId !== req.user.id && !['ADMIN', 'EVALUADOR'].includes(req.user.role))) return res.status(404).json({ error: 'Documento no encontrado' });
  const d = (r.documents || [])[Number(req.params.n)];
  if (!d || !d.file) return res.status(404).json({ error: 'Documento no encontrado' });
  res.setHeader('Content-Type', d.mime || 'application/octet-stream');
  res.setHeader('Cache-Control', 'private, no-store');
  res.sendFile(DOCS.privatePath(d.file));
}));

router.get('/requests', wrap(async (req, res) => {
  res.json(await db.query(
    `SELECT r.*, h.name AS horse_name,
       (SELECT status FROM payments p WHERE p.request_id=r.id ORDER BY created_at DESC LIMIT 1) AS payment_status
     FROM service_requests r LEFT JOIN horses h ON h.id=r.horse_id WHERE r.user_id=$1 ORDER BY r.created_at DESC`, [req.user.id],
  ));
}));

router.post('/requests', upload.array('documents', 10), wrap(async (req, res) => {
  const { service, horseId, notes } = req.body || {};
  const svc = SERVICES[service];
  if (!svc) return res.status(400).json({ error: 'Gestión no válida' });
  let horse = null;
  if (service !== 'YEGUADA') {
    horse = horseId && await db.one('SELECT * FROM horses WHERE id::text=$1', [horseId]);
    if (!horse || horse.ownerId !== req.user.id) return res.status(400).json({ error: 'Selecciona uno de tus ejemplares' });
  }
  // Documentación de gestiones (DNI, contratos…): carpeta privada, nunca en /uploads
  const docs = (req.files || []).map((f) => ({ name: f.originalname, file: DOCS.storePrivate(f), mime: f.mimetype }));
  const request = await db.one(
    'INSERT INTO service_requests(user_id, horse_id, service, notes, documents) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [req.user.id, horse ? horse.id : null, service, notes || null, JSON.stringify(docs)],
  );
  audit(req.user.id, 'ServiceRequest', request.id, 'CREAR', { service });

  // Servicio gratuito (p. ej. pre-valoración de lanzamiento): entra directamente en revisión
  if (svc.price === 0) {
    await db.query("UPDATE service_requests SET status='EN_REVISION' WHERE id=$1", [request.id]);
    return res.status(201).json({ request: { ...request, status: 'EN_REVISION' }, checkoutUrl: null, message: 'Solicitud recibida. La revisaremos y te daremos una orientación de su nivel probable.' });
  }
  // Abono previo: no se inicia ningún trámite sin el pago
  if (!stripe) return res.status(201).json({ request, checkoutUrl: null, message: 'Solicitud registrada. El pago online aún no está activo: la presidencia te contactará para el abono.' });
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price_data: { currency: 'eur', unit_amount: svc.price, product_data: { name: `C-IBERICO · ${svc.name}` } }, quantity: 1 }],
    metadata: { requestId: request.id, userId: req.user.id },
    success_url: `${process.env.FRONTEND_URL.split(',')[0]}/panel?pago=ok`,
    cancel_url: `${process.env.FRONTEND_URL.split(',')[0]}/panel?pago=cancelado`,
  });
  await db.query('INSERT INTO payments(user_id, request_id, stripe_id, amount) VALUES ($1,$2,$3,$4)', [req.user.id, request.id, session.id, svc.price]);
  res.status(201).json({ request, checkoutUrl: session.url });
}));

module.exports = router;
