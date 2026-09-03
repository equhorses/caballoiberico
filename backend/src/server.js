require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const prisma = new PrismaClient();
const app = express();

// Middlewares
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Sin permisos' });
  next();
};

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } }); // 500MB max

// ==================== AUTH ====================
app.post('/api/auth/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('country').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password, firstName, lastName, phone, dni, country, city, address, postalCode } = req.body;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(400).json({ error: 'Email ya registrado' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed, firstName, lastName, phone, dni, country, city, address, postalCode }
  });

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email, firstName, lastName, role: user.role } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { breederProfile: true }
  });
  res.json(user);
});

// ==================== BREEDERS ====================
app.post('/api/breeders', authenticate, [
  body('farmName').notEmpty(),
  body('farmAddress').notEmpty(),
  body('farmCity').notEmpty(),
  body('farmCountry').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const code = `CIB-${Date.now().toString(36).toUpperCase()}`;
  const breeder = await prisma.breeder.create({
    data: { ...req.body, breederCode: code, userId: req.user.id }
  });
  res.json(breeder);
});

// ==================== HORSES ====================
app.post('/api/horses', authenticate, upload.array('photos', 5), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || '{}');
    const { name, birthDate, sex, color, microchip, height, breedComposition, breedType, motherBreed, fatherId, motherId, breederId } = data;

    const regNum = `CIB-${Date.now().toString(36).toUpperCase()}`;

    const horse = await prisma.horse.create({
      data: {
        registrationNumber: regNum,
        name, birthDate: new Date(birthDate), sex, color, microchip, height,
        breedComposition, breedType, motherBreed,
        fatherId, motherId, breederId, ownerId: req.user.id
      }
    });

    // Guardar fotos
    if (req.files) {
      const angles = ['LEFT_PROFILE', 'RIGHT_PROFILE', 'FRONT', 'REAR', 'TOP'];
      for (let i = 0; i < req.files.length; i++) {
        await prisma.horsePhoto.create({
          data: { horseId: horse.id, angle: angles[i] || 'LEFT_PROFILE', url: `/uploads/${req.files[i].filename}` }
        });
      }
    }

    res.json(horse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/horses', async (req, res) => {
  const { search, breedType, status, page = 1, limit = 20 } = req.query;
  const where = {};
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { registrationNumber: { contains: search, mode: 'insensitive' } }
  ];
  if (breedType) where.breedType = breedType;
  if (status) where.status = status;

  const horses = await prisma.horse.findMany({
    where,
    include: { photos: true, originCertificate: true, qualityCertificate: true, breeder: true },
    skip: (page - 1) * limit,
    take: parseInt(limit),
    orderBy: { createdAt: 'desc' }
  });
  const total = await prisma.horse.count({ where });
  res.json({ horses, total, pages: Math.ceil(total / limit) });
});

app.get('/api/horses/:id', async (req, res) => {
  const horse = await prisma.horse.findUnique({
    where: { id: req.params.id },
    include: {
      photos: true,
      videos: true,
      originCertificate: true,
      qualityCertificate: true,
      evaluations: true,
      pedigreeEntries: true,
      father: { include: { photos: { take: 1 } } },
      mother: { include: { photos: { take: 1 } } },
      childrenSire: { include: { photos: { take: 1 } } },
      childrenDam: { include: { photos: { take: 1 } } },
      breeder: true,
      owner: { select: { firstName: true, lastName: true, country: true } }
    }
  });
  if (!horse) return res.status(404).json({ error: 'No encontrado' });
  res.json(horse);
});

// ==================== VIDEOS (API para IA) ====================
app.post('/api/horses/:id/videos', authenticate, upload.single('video'), async (req, res) => {
  const { type = 'EVALUATION' } = req.body;
  const video = await prisma.horseVideo.create({
    data: {
      horseId: req.params.id,
      url: `/uploads/${req.file.filename}`,
      type,
      duration: req.body.duration ? parseInt(req.body.duration) : null
    }
  });
  res.json(video);
});

// ENDPOINT PARA IA EXTERNA - Subir resultado de análisis
app.post('/api/horses/:id/ai-evaluation', authenticate, async (req, res) => {
  // Solo ADMIN o el sistema IA (con token especial) puede usar esto
  const { overallScore, morphologyScore, movementScore, dressageScore, sportsScore, biomechanics, notes } = req.body;

  const evaluation = await prisma.evaluation.create({
    data: {
      horseId: req.params.id,
      evaluatorType: 'AI',
      overallScore,
      morphologyScore,
      movementScore,
      dressageScore,
      sportsScore,
      biomechanics: biomechanics || {},
      notes,
      status: 'COMPLETED',
      evaluatedAt: new Date()
    }
  });

  // Actualizar video con score
  await prisma.horseVideo.updateMany({
    where: { horseId: req.params.id, isAnalyzed: false },
    data: { aiScore: overallScore, isAnalyzed: true }
  });

  res.json(evaluation);
});

// Obtener datos para IA - endpoint que tu IA consumirá
app.get('/api/horses/:id/ai-data', authenticate, async (req, res) => {
  const horse = await prisma.horse.findUnique({
    where: { id: req.params.id },
    include: { photos: true, videos: true, evaluations: true, pedigreeEntries: true }
  });
  if (!horse) return res.status(404).json({ error: 'No encontrado' });

  // Devolver URLs de videos y fotos para que la IA las procese
  res.json({
    horseId: horse.id,
    name: horse.name,
    breedComposition: horse.breedComposition,
    breedType: horse.breedType,
    height: horse.height,
    photos: horse.photos.map(p => ({ angle: p.angle, url: p.url })),
    videos: horse.videos.map(v => ({ id: v.id, url: v.url, type: v.type, duration: v.duration })),
    standards: {
      // Estándares morfológicos C-IBERICO para que la IA compare
      maxHeight: 170,
      profile: "convexo_o_subconvexo",
      mane: "tupido_espeso",
      body: "compacto_caja",
      movements: "agiles_elevados_extensos_armonicos_cadenciosos"
    }
  });
});

// ==================== CERTIFICATES ====================
app.post('/api/certificates/origin', authenticate, async (req, res) => {
  const { horseId } = req.body;
  const hash = `0x${Buffer.from(uuidv4()).toString('hex').slice(0, 12)}`;

  const cert = await prisma.originCertificate.create({
    data: { horseId, hash, isDigital: true }
  });

  await prisma.horse.update({ where: { id: horseId }, data: { status: 'APPROVED' } });
  res.json(cert);
});

app.post('/api/certificates/quality', authenticate, async (req, res) => {
  const { horseId, stars, discipline, competitionLevel, resultsUrl } = req.body;
  const hash = `0x${Buffer.from(uuidv4()).toString('hex').slice(0, 12)}`;

  const cert = await prisma.qualityCertificate.create({
    data: { horseId, stars, discipline, competitionLevel, resultsUrl, hash }
  });
  res.json(cert);
});

// ==================== PAYMENTS (Stripe) ====================
app.post('/api/payments/create-checkout', authenticate, async (req, res) => {
  const { serviceType, horseId, amount, successUrl, cancelUrl } = req.body;

  const priceMap = {
    ORIGIN_CERTIFICATE: 8000,      // 80.00 EUR en céntimos
    QUALITY_CERTIFICATE: 8500,     // 85.00 EUR
    NAME_CHANGE: 15000,            // 150.00 EUR
    OWNERSHIP_TRANSFER: 3500,      // 35.00 EUR
    BREEDER_CODE: 5000,            // 50.00 EUR
    STALLION_LICENSE: 8500,
    RENEWAL: 25000                 // 250.00 EUR
  };

  const unitAmount = amount || priceMap[serviceType] || 8000;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: { name: `C-IBERICO - ${serviceType}` },
        unit_amount: unitAmount
      },
      quantity: 1
    }],
    mode: 'payment',
    success_url: successUrl || `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/cancel`,
    metadata: { userId: req.user.id, serviceType, horseId: horseId || '' }
  });

  await prisma.payment.create({
    data: {
      userId: req.user.id,
      stripeId: session.id,
      amount: unitAmount / 100,
      serviceType,
      horseId,
      status: 'PENDING'
    }
  });

  res.json({ url: session.url });
});

app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await prisma.payment.updateMany({
      where: { stripeId: session.id },
      data: { status: 'COMPLETED', paidAt: new Date() }
    });
  }
  res.json({ received: true });
});

// ==================== SERVICE REQUESTS ====================
app.post('/api/requests', authenticate, async (req, res) => {
  const request = await prisma.serviceRequest.create({
    data: { ...req.body, userId: req.user.id }
  });
  res.json(request);
});

app.get('/api/requests', authenticate, async (req, res) => {
  const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
  const requests = await prisma.serviceRequest.findMany({
    where,
    include: { horse: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(requests);
});

// ==================== RANKING ====================
app.get('/api/ranking', async (req, res) => {
  const { category = 'ALL' } = req.query;

  const horses = await prisma.horse.findMany({
    where: { status: 'APPROVED', qualityCertificate: { isNot: null } },
    include: { qualityCertificate: true, photos: { take: 1 }, breeder: true },
    orderBy: { qualityCertificate: { stars: 'desc' } },
    take: 100
  });

  const ranked = horses.map((h, i) => ({
    rank: i + 1,
    id: h.id,
    name: h.name,
    registrationNumber: h.registrationNumber,
    stars: h.qualityCertificate?.stars || 0,
    breedType: h.breedType,
    breeder: h.breeder?.farmName,
    photo: h.photos[0]?.url
  }));

  res.json(ranked);
});

// ==================== ADMIN ====================
app.patch('/api/horses/:id/status', authenticate, requireRole('ADMIN', 'CERTIFIER'), async (req, res) => {
  const { status } = req.body;
  const horse = await prisma.horse.update({
    where: { id: req.params.id },
    data: { status }
  });
  res.json(horse);
});

app.get('/api/admin/stats', authenticate, requireRole('ADMIN'), async (req, res) => {
  const [totalHorses, totalBreeders, totalCerts, pendingRequests] = await Promise.all([
    prisma.horse.count(),
    prisma.breeder.count(),
    prisma.originCertificate.count(),
    prisma.serviceRequest.count({ where: { status: 'PENDING' } })
  ]);
  res.json({ totalHorses, totalBreeders, totalCerts, pendingRequests });
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', service: 'C-IBERICO API' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`C-IBERICO API corriendo en puerto ${PORT}`));
