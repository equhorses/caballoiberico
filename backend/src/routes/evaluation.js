// Módulo de valoración v2 — panel del evaluador.
// Flujo: abrir caso → revisión de material por criterio → propuesta IA (con evidencia y confianza)
// → decisión humana por criterio (aceptar/corregir/rechazar/no evaluable) → resolución. Todo auditado.
const router = require('express').Router();
const { db, UPLOAD_DIR, authenticate, requireRole, audit, ageYears, wrap } = require('../lib/common');
const ai = require('../lib/ai');

router.use(authenticate, requireRole('EVALUADOR', 'ADMIN'));

const MATERIAL = ['APTO', 'APTO_PARCIAL', 'REQUIERE_MATERIAL', 'NO_EVALUABLE'];
const CONF = ['ALTA', 'MEDIA', 'BAJA', 'ABSTENCION'];
const ACTIONS = ['ACEPTAR', 'CORREGIR', 'RECHAZAR', 'NO_EVALUABLE'];
const RUBRIC_STATUS = ['EXPERIMENTAL', 'PROVISIONAL', 'VALIDADA', 'PUBLICADA', 'ARCHIVADA'];

const activeRubric = () => db.one("SELECT * FROM rubrics WHERE status <> 'ARCHIVADA' ORDER BY created_at DESC LIMIT 1");
const getCase = (id) => db.one('SELECT * FROM evaluation_cases WHERE id::text=$1', [id]);
const touch = (id, status) => db.query('UPDATE evaluation_cases SET updated_at=now(), status=COALESCE($2,status) WHERE id=$1', [id, status || null]);

// ─── Rúbricas versionadas ───
router.get('/rubrics', wrap(async (req, res) => res.json(await db.query('SELECT * FROM rubrics ORDER BY created_at DESC'))));

router.get('/rubrics/active', wrap(async (req, res) => {
  const r = await activeRubric();
  if (!r) return res.status(404).json({ error: 'No hay rúbrica activa' });
  res.json(r);
}));

// Guardar cambios = crear una versión nueva (las anteriores no se modifican nunca)
router.post('/rubrics', requireRole('ADMIN'), wrap(async (req, res) => {
  const { version, content, notes, status = 'EXPERIMENTAL' } = req.body || {};
  if (!version || !Array.isArray(content?.criteria) || !content.criteria.length) return res.status(400).json({ error: 'Indica versión y criterios' });
  if (!RUBRIC_STATUS.includes(status)) return res.status(400).json({ error: 'Estado no válido' });
  if (await db.one('SELECT id FROM rubrics WHERE version=$1', [version])) return res.status(409).json({ error: 'Esa versión ya existe' });
  const r = await db.one('INSERT INTO rubrics(version, content, notes, status, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [version, JSON.stringify(content), notes || null, status, req.user.id]);
  audit(req.user.id, 'Rubric', r.id, 'NUEVA_VERSION', { version, status });
  res.status(201).json(r);
}));

router.patch('/rubrics/:id/status', requireRole('ADMIN'), wrap(async (req, res) => {
  if (!RUBRIC_STATUS.includes(req.body?.status)) return res.status(400).json({ error: 'Estado no válido' });
  const r = await db.one('UPDATE rubrics SET status=$2 WHERE id::text=$1 RETURNING *', [req.params.id, req.body.status]);
  if (!r) return res.status(404).json({ error: 'Rúbrica no encontrada' });
  audit(req.user.id, 'Rubric', r.id, 'ESTADO', { status: r.status });
  res.json(r);
}));

// ─── Ejemplares y casos ───
router.get('/horses', wrap(async (req, res) => {
  res.json(await db.query(
    `SELECT h.id, h.name, h.registration_number, h.breed, h.birth_date, h.status, u.first_name || ' ' || u.last_name AS owner_name,
       (SELECT COUNT(*)::int FROM horse_photos p WHERE p.horse_id=h.id) AS photo_count,
       (SELECT COUNT(*)::int FROM horse_videos v WHERE v.horse_id=h.id) AS video_count
     FROM horses h JOIN users u ON u.id=h.owner_id ORDER BY h.created_at DESC`,
  ));
}));

router.get('/cases', wrap(async (req, res) => {
  res.json(await db.query(
    `SELECT c.*, h.name AS horse_name, h.registration_number, h.breed, r.version AS rubric_version,
       (SELECT COUNT(*)::int FROM human_decisions d WHERE d.case_id=c.id) AS decided,
       jsonb_array_length(r.content->'criteria') AS criteria_count
     FROM evaluation_cases c JOIN horses h ON h.id=c.horse_id JOIN rubrics r ON r.id=c.rubric_id
     ORDER BY (c.status='RESUELTO'), c.updated_at DESC`,
  ));
}));

router.post('/cases', wrap(async (req, res) => {
  const horse = await db.one('SELECT * FROM horses WHERE id::text=$1', [req.body?.horseId || '']);
  if (!horse) return res.status(404).json({ error: 'Ejemplar no encontrado' });
  const rubric = await activeRubric();
  if (!rubric) return res.status(400).json({ error: 'No hay rúbrica activa' });
  const c = await db.one('INSERT INTO evaluation_cases(horse_id, rubric_id, age_years) VALUES ($1,$2,$3) RETURNING *',
    [horse.id, rubric.id, ageYears(horse.birthDate)]);
  audit(req.user.id, 'EvaluationCase', c.id, 'ABRIR', { ejemplar: horse.name, rubrica: rubric.version });
  res.status(201).json(c);
}));

router.get('/cases/:id', wrap(async (req, res) => {
  const c = await getCase(req.params.id);
  if (!c) return res.status(404).json({ error: 'Caso no encontrado' });
  const [horse, rubric, photos, videos, material, proposals, decisions, history] = await Promise.all([
    db.one('SELECT * FROM horses WHERE id=$1', [c.horseId]),
    db.one('SELECT * FROM rubrics WHERE id=$1', [c.rubricId]),
    db.query('SELECT * FROM horse_photos WHERE horse_id=$1', [c.horseId]),
    db.query('SELECT * FROM horse_videos WHERE horse_id=$1 ORDER BY uploaded_at DESC', [c.horseId]),
    db.query('SELECT * FROM material_checks WHERE case_id=$1', [c.id]),
    db.query('SELECT * FROM ai_proposals WHERE case_id=$1 ORDER BY created_at DESC', [c.id]),
    db.query(`SELECT d.*, u.first_name || ' ' || u.last_name AS decided_by_name FROM human_decisions d JOIN users u ON u.id=d.decided_by WHERE d.case_id=$1`, [c.id]),
    db.query(`SELECT a.*, u.first_name || ' ' || u.last_name AS user_name FROM audit_log a LEFT JOIN users u ON u.id=a.user_id
              WHERE a.entity='EvaluationCase' AND a.entity_id=$1 ORDER BY a.at DESC`, [c.id]),
  ]);
  res.json({ ...c, horse: { ...horse, photos, videos }, rubric, material, proposals, decisions, history, aiConfigured: ai.isConfigured() });
}));

const locked = (c) => c.status === 'RESUELTO';

router.put('/cases/:id/material/:key', wrap(async (req, res) => {
  const c = await getCase(req.params.id);
  if (!c) return res.status(404).json({ error: 'Caso no encontrado' });
  if (locked(c)) return res.status(409).json({ error: 'Caso resuelto: no admite cambios' });
  const { status, notes } = req.body || {};
  if (!MATERIAL.includes(status)) return res.status(400).json({ error: 'Estado de material no válido' });
  const m = await db.one(
    `INSERT INTO material_checks(case_id, criterion_key, status, notes, checked_by) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (case_id, criterion_key) DO UPDATE SET status=EXCLUDED.status, notes=EXCLUDED.notes, checked_by=EXCLUDED.checked_by, created_at=now()
     RETURNING *`,
    [c.id, req.params.key, status, notes || null, req.user.id],
  );
  await touch(c.id);
  audit(req.user.id, 'EvaluationCase', c.id, 'MATERIAL', { criterio: req.params.key, status, notes });
  res.json(m);
}));

// Lanzar la IA: completa la revisión de material que el humano no haya hecho y guarda propuestas
router.post('/cases/:id/ai', wrap(async (req, res) => {
  const c = await getCase(req.params.id);
  if (!c) return res.status(404).json({ error: 'Caso no encontrado' });
  if (locked(c)) return res.status(409).json({ error: 'Caso resuelto' });
  if (!ai.isConfigured()) return res.status(503).json({ error: 'IA pendiente de integración. Configura AI_API_KEY y AI_MODEL en Railway.' });
  const [rubric, photos, videos, material] = await Promise.all([
    db.one('SELECT * FROM rubrics WHERE id=$1', [c.rubricId]),
    db.query('SELECT * FROM horse_photos WHERE horse_id=$1', [c.horseId]),
    db.query('SELECT id FROM horse_videos WHERE horse_id=$1', [c.horseId]),
    db.query('SELECT criterion_key FROM material_checks WHERE case_id=$1 AND checked_by <> $2', [c.id, 'IA']),
  ]);
  if (!photos.length) return res.status(400).json({ error: 'El ejemplar no tiene fotografías' });

  const { model, result, raw } = await ai.runEvaluation({ rubric, ageYears: c.ageYears, photos, hasVideo: videos.length > 0, uploadDir: UPLOAD_DIR });
  const keys = new Set(rubric.content.criteria.map((k) => k.key));
  const humanChecked = new Set(material.map((m) => m.criterionKey));
  let n = 0;
  for (const item of result.criterios || []) {
    if (!keys.has(item.criterionKey)) continue;
    const mat = item.material || {};
    if (!humanChecked.has(item.criterionKey) && MATERIAL.includes(mat.status)) {
      await db.query(
        `INSERT INTO material_checks(case_id, criterion_key, status, notes, checked_by) VALUES ($1,$2,$3,$4,'IA')
         ON CONFLICT (case_id, criterion_key) DO UPDATE SET status=EXCLUDED.status, notes=EXCLUDED.notes, checked_by='IA', created_at=now()`,
        [c.id, item.criterionKey, mat.status, mat.notes || null],
      );
    }
    const p = item.propuesta || {};
    const allowScore = ['APTO', 'APTO_PARCIAL'].includes(mat.status) && typeof p.score === 'number' && p.score >= 0 && p.score <= 10;
    await db.query(
      `INSERT INTO ai_proposals(case_id, criterion_key, observation, score, confidence, evidence, limitations, source_label, rubric_version, model, raw)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [c.id, item.criterionKey, String(p.observation || 'Sin observación'), allowScore ? Math.round(p.score * 2) / 2 : null,
        CONF.includes(p.confidence) ? p.confidence : 'ABSTENCION', JSON.stringify(p.evidence || []), p.limitations || null,
        p.sourceLabel || null, rubric.version, model, JSON.stringify(item)],
    );
    n += 1;
  }
  await touch(c.id, 'EN_REVISION_HUMANA');
  audit(req.user.id, 'EvaluationCase', c.id, 'PROPUESTA_IA', { model, criterios: n, uso: raw.usage || null });
  res.json({ ok: true, proposals: n });
}));

router.put('/cases/:id/decisions/:key', wrap(async (req, res) => {
  const c = await getCase(req.params.id);
  if (!c) return res.status(404).json({ error: 'Caso no encontrado' });
  if (locked(c)) return res.status(409).json({ error: 'Caso resuelto: no admite cambios' });
  const { action, finalScore, notes, proposalId } = req.body || {};
  if (!ACTIONS.includes(action)) return res.status(400).json({ error: 'Acción no válida' });

  let score = null;
  let proposal = null;
  if (proposalId) {
    proposal = await db.one('SELECT * FROM ai_proposals WHERE id::text=$1 AND case_id=$2', [proposalId, c.id]);
    if (!proposal) return res.status(400).json({ error: 'Propuesta no encontrada en este caso' });
  }
  if (action === 'ACEPTAR') {
    if (!proposal) return res.status(400).json({ error: 'Para aceptar hay que indicar la propuesta de la IA' });
    score = proposal.score;
  } else if (action === 'CORREGIR') {
    score = Number(finalScore);
    if (finalScore === '' || finalScore == null || Number.isNaN(score) || score < 0 || score > 10) return res.status(400).json({ error: 'La nota debe estar entre 0 y 10' });
    if (!notes && proposal) return res.status(400).json({ error: 'Explica el motivo de la corrección' });
    score = Math.round(score * 2) / 2;
  } else if (!notes) {
    return res.status(400).json({ error: 'Indica el motivo' });
  }

  const prev = await db.one('SELECT * FROM human_decisions WHERE case_id=$1 AND criterion_key=$2', [c.id, req.params.key]);
  const d = await db.one(
    `INSERT INTO human_decisions(case_id, proposal_id, criterion_key, action, final_score, notes, decided_by) VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (case_id, criterion_key) DO UPDATE SET proposal_id=EXCLUDED.proposal_id, action=EXCLUDED.action, final_score=EXCLUDED.final_score,
       notes=EXCLUDED.notes, decided_by=EXCLUDED.decided_by, decided_at=now()
     RETURNING *`,
    [c.id, proposal ? proposal.id : null, req.params.key, action, score, notes || null, req.user.id],
  );
  await touch(c.id, 'EN_REVISION_HUMANA');
  audit(req.user.id, 'EvaluationCase', c.id, 'DECISION', {
    criterio: req.params.key, action, nota: score, notes, propuestaIA: proposal ? proposal.score : null,
    anterior: prev ? { action: prev.action, nota: prev.finalScore } : null,
  });
  res.json(d);
}));

router.post('/cases/:id/resolve', wrap(async (req, res) => {
  const c = await getCase(req.params.id);
  if (!c) return res.status(404).json({ error: 'Caso no encontrado' });
  if (locked(c)) return res.status(409).json({ error: 'Ya resuelto' });
  const { summary, guidance, requiresMaterial } = req.body || {};
  if (requiresMaterial) {
    await db.query("UPDATE evaluation_cases SET status='REQUIERE_MATERIAL', summary=$2, updated_at=now() WHERE id=$1", [c.id, summary || null]);
    audit(req.user.id, 'EvaluationCase', c.id, 'SOLICITA_MATERIAL', { summary });
    return res.json({ ok: true });
  }
  const rubric = await db.one('SELECT content FROM rubrics WHERE id=$1', [c.rubricId]);
  const decided = new Set((await db.query('SELECT criterion_key FROM human_decisions WHERE case_id=$1', [c.id])).map((d) => d.criterionKey));
  const missing = rubric.content.criteria.filter((k) => !decided.has(k.key)).map((k) => k.name);
  if (missing.length) return res.status(400).json({ error: `Falta decidir: ${missing.join(', ')}` });
  if (!summary) return res.status(400).json({ error: 'Escribe la conclusión del evaluador' });
  const r = await db.one("UPDATE evaluation_cases SET status='RESUELTO', summary=$2, guidance=$3, resolved_at=now(), updated_at=now() WHERE id=$1 RETURNING *",
    [c.id, summary, guidance || null]);
  audit(req.user.id, 'EvaluationCase', c.id, 'RESOLVER', { summary, guidance });
  res.json(r);
}));

module.exports = router;
