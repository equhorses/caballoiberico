const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./db');

// Tarifas (céntimos). Deben coincidir con la web.
const PREVAL_PRICE = Math.max(0, Math.round(Number(process.env.PREVALORACION_PRICE_EUR || 0) * 100));
const SERVICES = {
  PREVALORACION: { name: 'Pre-valoración', price: PREVAL_PRICE, days: 5 },
  ORIGEN: { name: 'Certificado de Origen', price: 12000, days: 10 },
  CALIDAD: { name: 'Certificado de Calidad', price: 18000, days: 15 },
  CAMBIO_NOMBRE: { name: 'Cambio de nombre', price: 6000, days: 5 },
  CAMBIO_TITULARIDAD: { name: 'Cambio de titularidad', price: 7500, days: 5 },
  LAUREADA: { name: 'Lista Laureada Ámbar', price: 25000, days: 20 },
  YEGUADA: { name: 'Alta de yeguada asociada', price: 30000, days: 15 },
};

const MERIT_STARS = { JOVENES_NACIONAL: 3, NACIONAL_ABSOLUTO: 6, INTERNACIONAL: 12, MUNDIAL_OLIMPICO: 24 };

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 300 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^(image\/(jpeg|png|webp)|video\/(mp4|quicktime|webm)|application\/pdf)$/.test(file.mimetype)),
});

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Sesión requerida' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Sesión caducada' });
  }
};

const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) { try { req.user = jwt.verify(token, process.env.JWT_SECRET); } catch { /* anónimo */ } }
  next();
};

const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : res.status(403).json({ error: 'Sin permisos' });

const audit = (userId, entity, entityId, action, data, client) =>
  db.query('INSERT INTO audit_log(user_id, entity, entity_id, action, data) VALUES ($1,$2,$3,$4,$5)',
    [userId || null, entity, String(entityId), action, data ? JSON.stringify(data) : null], client).catch((e) => console.error('audit', e.message));

const verificationCode = () => { const h = crypto.randomBytes(4).toString('hex').toUpperCase(); return `CV-${h.slice(0, 4)}-${h.slice(4)}`; };

async function nextRegistrationNumber(client) {
  const r = await db.one("SELECT MAX(CAST(SUBSTRING(registration_number FROM 5) AS INT)) AS n FROM horses WHERE registration_number LIKE 'CIB-%'", [], client);
  return `CIB-${(r && r.n ? r.n : 10000) + 1}`;
}

const ageYears = (birth, at = new Date()) => {
  const b = new Date(birth);
  let a = at.getFullYear() - b.getFullYear();
  if (at < new Date(at.getFullYear(), b.getMonth(), b.getDate())) a -= 1;
  return a;
};

// Mayor nivel de estrellas conseguido (no se acumulan entre niveles)
const starsOf = (merits) => merits.filter((m) => m.verified).reduce((max, m) => Math.max(max, m.starsGiven), 0);

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { db, SERVICES, MERIT_STARS, UPLOAD_DIR, upload, authenticate, optionalAuth, requireRole, audit, verificationCode, nextRegistrationNumber, ageYears, starsOf, wrap };
