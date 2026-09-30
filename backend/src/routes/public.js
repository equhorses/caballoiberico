// Rutas públicas: Registro C-IBERICO, laureados, resultados y verificación de certificados
const router = require('express').Router();
const { db, SERVICES, ageYears, starsOf, wrap } = require('../lib/common');
const L = require('../lib/levels');

// Carga fotos, méritos verificados, certificados vigentes y la última valoración resuelta
async function bundles(horses) {
  if (!horses.length) return [];
  const ids = horses.map((h) => h.id);
  const [photos, merits, certs, cases] = await Promise.all([
    db.query('SELECT * FROM horse_photos WHERE horse_id = ANY($1)', [ids]),
    db.query('SELECT * FROM sport_merits WHERE verified AND horse_id = ANY($1) ORDER BY date DESC', [ids]),
    db.query("SELECT * FROM certificates WHERE status='VIGENTE' AND horse_id = ANY($1)", [ids]),
    db.query(`SELECT DISTINCT ON (c.horse_id) c.*, r.version AS rubric_version, r.content->'weights' AS weights
              FROM evaluation_cases c JOIN rubrics r ON r.id=c.rubric_id
              WHERE c.status='RESUELTO' AND c.horse_id = ANY($1) ORDER BY c.horse_id, c.resolved_at DESC`, [ids]),
  ]);
  const decisions = cases.length ? await db.query('SELECT * FROM human_decisions WHERE case_id = ANY($1)', [cases.map((c) => c.id)]) : [];
  return horses.map((h) => {
    const c = cases.find((x) => x.horseId === h.id) || null;
    if (c) c.decisions = decisions.filter((d) => d.caseId === c.id);
    return { ...h, photos: photos.filter((p) => p.horseId === h.id), merits: merits.filter((m) => m.horseId === h.id), certificates: certs.filter((x) => x.horseId === h.id), lastCase: c };
  });
}

// Nota final (sobre 100) = media ponderada de las notas decididas por el evaluador humano
const finalScore = (c) => (c ? (c.finalScore ?? L.scoreOf(c.decisions, c.weights || {})) : null);

const card = (h) => ({
  id: h.id,
  registrationNumber: h.registrationNumber,
  name: h.name,
  breed: h.breed,
  birthDate: h.birthDate,
  age: ageYears(h.birthDate),
  coat: h.coat,
  country: h.country,
  sireName: h.sireName,
  damName: h.damName,
  breederName: h.breederName,
  photo: (h.photos.find((p) => p.view === 'LATERAL_IZQUIERDO') || h.photos[0])?.url || null,
  level: h.level || 0,
  stars: starsOf(h.merits),
  amberStars: h.certificates.reduce((m, c) => Math.max(m, c.amberStars), 0),
  score: finalScore(h.lastCase),
});

const PUBLIC = "is_public AND status='CERTIFICADO'";

router.get('/registry', wrap(async (req, res) => {
  const { q = '', breed, sort = 'score' } = req.query;
  const params = [];
  let where = PUBLIC;
  if (breed) { params.push(breed); where += ` AND breed=$${params.length}`; }
  if (q) {
    params.push(`%${q}%`);
    where += ` AND (name ILIKE $${params.length} OR registration_number ILIKE $${params.length} OR sire_name ILIKE $${params.length} OR dam_name ILIKE $${params.length} OR breeder_name ILIKE $${params.length})`;
  }
  const horses = (await bundles(await db.query(`SELECT * FROM horses WHERE ${where}`, params))).map(card);
  const sorters = {
    score: (a, b) => (b.score ?? -1) - (a.score ?? -1),
    level: (a, b) => b.level - a.level || (b.score ?? -1) - (a.score ?? -1),
    stars: (a, b) => b.stars - a.stars,
    name: (a, b) => a.name.localeCompare(b.name),
    age: (a, b) => a.age - b.age,
  };
  res.json(horses.sort(sorters[sort] || sorters.score));
}));

router.get('/registry/:number', wrap(async (req, res) => {
  const h = await db.one(`SELECT * FROM horses WHERE registration_number=$1 AND ${PUBLIC}`, [req.params.number.toUpperCase()]);
  if (!h) return res.status(404).json({ error: 'Ejemplar no encontrado en el Registro' });
  const [b] = await bundles([h]);
  const c = b.lastCase;
  res.json({
    ...card(b),
    sex: h.sex, sireName: h.sireName, damName: h.damName, sireRegistry: h.sireRegistry, damRegistry: h.damRegistry, breederName: h.breederName, ibericBloodPct: h.ibericBloodPct, originStatus: h.originStatus,
    photos: b.photos.map(({ view, url }) => ({ view, url })),
    merits: b.merits.map(({ competition, category, level, position, score, date, starsGiven }) => ({ competition, category, level, position, score, date, starsGiven })),
    certificates: b.certificates.map(({ type, code, stars, amberStars, issuedAt }) => ({ type, code, stars, amberStars, issuedAt })),
    levelHistory: (await db.query('SELECT from_level, to_level, reason, notes, at FROM level_history WHERE horse_id=$1 ORDER BY at DESC', [h.id])),
    evaluation: c ? {
      rubricVersion: c.rubricVersion, resolvedAt: c.resolvedAt, summary: c.summary, stage: c.stage, levelAwarded: c.levelAwarded,
      criteria: c.decisions.map((d) => ({ key: d.criterionKey, score: d.finalScore, action: d.action })),
    } : null,
  });
}));

router.get('/laureados', wrap(async (req, res) => {
  const horses = (await bundles(await db.query(`SELECT * FROM horses WHERE ${PUBLIC}`))).map(card);
  res.json({
    laureados: horses.filter((h) => h.amberStars >= 3),
    ranking: horses.filter((h) => h.stars > 0).sort((a, b) => b.stars - a.stars || (b.score ?? 0) - (a.score ?? 0)),
  });
}));

router.get('/results', wrap(async (req, res) => {
  res.json(await db.query(
    `SELECT m.id, m.competition, m.category, m.level, m.position, m.score, m.date, m.stars_given, h.name AS horse_name, h.registration_number FROM sport_merits m JOIN horses h ON h.id=m.horse_id
     WHERE m.verified AND h.is_public AND h.status='CERTIFICADO' ORDER BY m.date DESC LIMIT 50`,
  ));
}));

// Verificación pública (como comprobar un certificado SSL): por código o por nº de registro
router.get('/verify/:code', wrap(async (req, res) => {
  const code = req.params.code.trim().toUpperCase();
  const cert = await db.one(
    `SELECT c.*, h.name, h.registration_number, h.breed, h.level, h.origin_status FROM certificates c JOIN horses h ON h.id=c.horse_id WHERE c.code=$1`, [code],
  );
  if (cert) {
    return res.json({
      valid: cert.status === 'VIGENTE', type: cert.type, code: cert.code, status: cert.status, issuedAt: cert.issuedAt, revokedAt: cert.revokedAt,
      stars: cert.stars, horse: { name: cert.name, registrationNumber: cert.registrationNumber, breed: cert.breed, level: cert.level, originStatus: cert.originStatus },
    });
  }
  const horse = await db.one("SELECT * FROM horses WHERE registration_number=$1 AND status='CERTIFICADO'", [code]);
  if (horse) {
    const certs = await db.query('SELECT type, code, status, issued_at FROM certificates WHERE horse_id=$1 ORDER BY issued_at', [horse.id]);
    return res.json({ valid: horse.status === 'CERTIFICADO', horse: { name: horse.name, registrationNumber: horse.registrationNumber, breed: horse.breed, level: horse.level, originStatus: horse.originStatus }, certificates: certs });
  }
  res.status(404).json({ valid: false, error: 'No existe ningún certificado C-IBERICO con ese código' });
}));

router.get('/services', (req, res) => res.json(SERVICES));

module.exports = router;
