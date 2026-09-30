// Panel del titular: sus ejemplares, fotos/vídeo, solicitudes y pagos
const router = require('express').Router();
const { db, SERVICES, upload, authenticate, audit, wrap } = require('../lib/common');

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
  const [photos, videos, certs, cases] = await Promise.all([
    db.query('SELECT * FROM horse_photos WHERE horse_id = ANY($1)', [ids]),
    db.query('SELECT * FROM horse_videos WHERE horse_id = ANY($1) ORDER BY uploaded_at DESC', [ids]),
    db.query('SELECT * FROM certificates WHERE horse_id = ANY($1) ORDER BY issued_at', [ids]),
    db.query('SELECT id, horse_id, status, created_at, resolved_at, summary FROM evaluation_cases WHERE horse_id = ANY($1) ORDER BY created_at DESC', [ids]),
  ]);
  return horses.map((h) => ({
    ...h,
    photos: photos.filter((p) => p.horseId === h.id),
    videos: videos.filter((v) => v.horseId === h.id),
    certificates: certs.filter((c) => c.horseId === h.id),
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
  const pct = parseInt(b.ibericBloodPct ?? 100, 10);
  if (!b.name || !b.birthDate || !SEXES.includes(b.sex) || !BREEDS.includes(b.breed) || !b.coat || !b.country) {
    return res.status(400).json({ error: 'Faltan datos obligatorios del ejemplar' });
  }
  if (Number.isNaN(pct) || pct < 10 || pct > 100) return res.status(400).json({ error: 'Se exige un mínimo del 10 % de sangre ibérica documentada' });
  const h = await db.one(
    `INSERT INTO horses(name, birth_date, sex, coat, country, breed, iberic_blood_pct, sire_name, dam_name, breeder_name, microchip, official_registry, owner_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [b.name.trim().toUpperCase(), b.birthDate, b.sex, b.coat, b.country, b.breed, pct, b.sireName || null, b.damName || null,
      b.breederName || null, b.microchip || null, b.officialRegistry || null, req.user.id],
  );
  audit(req.user.id, 'Horse', h.id, 'CREAR', { name: h.name });
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
  const docs = (req.files || []).map((f) => ({ name: f.originalname, url: `/uploads/${f.filename}` }));
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
