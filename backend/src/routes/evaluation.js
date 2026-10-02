// Módulo de valoración v2 — panel del evaluador.
// Flujo: abrir caso → revisión de material por criterio → propuesta IA (con evidencia y confianza)
// → decisión humana por criterio (aceptar/corregir/rechazar/no evaluable) → resolución. Todo auditado.
const router = require('express').Router();
const { db, UPLOAD_DIR, authenticate, requireRole, audit, ageYears, wrap } = require('../lib/common');
const ai = require('../lib/ai');
const L = require('../lib/levels');

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
    `SELECT h.id, h.name, h.registration_number, h.breed, h.birth_date, h.status, h.level, u.first_name || ' ' || u.last_name AS owner_name,
       (SELECT COUNT(*)::int FROM horse_photos p WHERE p.horse_id=h.id) AS photo_count,
       (SELECT COUNT(*)::int FROM horse_videos v WHERE v.horse_id=h.id) AS video_count
     FROM horses h JOIN users u ON u.id=h.owner_id ORDER BY h.created_at DESC`,
  ));
}));

router.get('/cases', wrap(async (req, res) => {
  const rows = await db.query(
    `SELECT c.*, h.name AS horse_name, h.registration_number, h.breed, h.level AS horse_level, r.version AS rubric_version, r.content AS rubric_content,
       (SELECT COUNT(*)::int FROM human_decisions d WHERE d.case_id=c.id) AS decided
     FROM evaluation_cases c JOIN horses h ON h.id=c.horse_id JOIN rubrics r ON r.id=c.rubric_id
     ORDER BY (c.status='RESUELTO'), c.updated_at DESC`,
  );
  res.json(rows.map(({ rubricContent, ...c }) => ({
    ...c,
    criteriaCount: L.criteriaFor(rubricContent, c.stage).length,
    stageName: (L.stagesOf(rubricContent).find((x) => x.key === c.stage) || {}).name || null,
  })));
}));

router.post('/cases', wrap(async (req, res) => {
  const horse = await db.one('SELECT * FROM horses WHERE id::text=$1', [req.body?.horseId || '']);
  if (!horse) return res.status(404).json({ error: 'Ejemplar no encontrado' });
  const rubric = await activeRubric();
  if (!rubric) return res.status(400).json({ error: 'No hay rúbrica activa' });
  const months = L.ageMonths(horse.birthDate);
  const stage = L.stageFor(months, rubric.content);
  if (!stage) return res.status(400).json({ error: 'El ejemplar debe tener al menos 6 meses para ser valorado' });
  const c = await db.one('INSERT INTO evaluation_cases(horse_id, rubric_id, age_years, age_months, stage) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [horse.id, rubric.id, ageYears(horse.birthDate), months, stage.key]);
  audit(req.user.id, 'EvaluationCase', c.id, 'ABRIR', { ejemplar: horse.name, rubrica: rubric.version, etapa: stage.name, nivelActual: horse.level });
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
  const stage = L.stagesOf(rubric.content).find((x) => x.key === c.stage) || null;
  const criteria = L.criteriaFor(rubric.content, c.stage);
  const score = L.scoreOf(decisions, rubric.content.weights);
  const projected = Math.min(L.levelFromScore(score, rubric.content), stage ? stage.cap : 5);
  const air = aiResult(proposals, criteria);
  if (air) {
    const aiScore = L.scoreOf(air.items.map((i) => ({ criterionKey: i.key, finalScore: i.score })), rubric.content.weights);
    air.score = aiScore;
    air.level = Math.min(L.levelFromScore(aiScore, rubric.content), stage ? stage.cap : 5);
  }
  res.json({
    ...c, horse: { ...horse, photos, videos }, rubric, material, proposals, decisions, history,
    stageInfo: stage, criteria, preview: { score, level: projected, current: horse.level }, aiResult: air,
    aiConfigured: ai.isConfigured(),
  });
}));

const locked = (c) => c.status === 'RESUELTO';

// Resultado de la IA en su última ejecución: por criterio, la nota (media si hay doble lectura)
function aiResult(proposals, criteria) {
  const lastRun = proposals[0]?.raw?.runId || null;
  const latest = proposals.filter((p) => !lastRun || p.raw?.runId === lastRun);
  if (!latest.length) return null;
  const items = criteria.map((k) => {
    const props = latest.filter((p) => p.criterionKey === k.key);
    const scored = props.filter((p) => p.score != null);
    const mean = scored.length ? Math.round((scored.reduce((a, p) => a + Number(p.score), 0) / scored.length) * 2) / 2 : null;
    const spread = scored.length > 1 ? Math.max(...scored.map((p) => Number(p.score))) - Math.min(...scored.map((p) => Number(p.score))) : 0;
    return { key: k.key, name: k.name, score: mean, scores: scored.map((p) => ({ model: p.model, score: Number(p.score) })), proposalId: (scored[0] || props[0])?.id || null, disagree: spread > 1 };
  });
  return { runId: lastRun, models: [...new Set(latest.map((p) => p.model))], items, missing: items.filter((i) => i.score == null).map((i) => i.name) };
}

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
    db.query('SELECT * FROM horse_videos WHERE horse_id=$1 ORDER BY uploaded_at DESC', [c.horseId]),
    db.query('SELECT criterion_key FROM material_checks WHERE case_id=$1 AND checked_by <> $2', [c.id, 'IA']),
  ]);
  if (!photos.length) return res.status(400).json({ error: 'El ejemplar no tiene fotografías' });

  const stage = L.stagesOf(rubric.content).find((x) => x.key === c.stage) || null;
  const criteria = L.criteriaFor(rubric.content, c.stage);
  const { runs, errors, media } = await ai.runEvaluation({
    rubric, criteria, stage, ageMonths: c.ageMonths, photos, video: videos[0] || null, uploadDir: UPLOAD_DIR,
  });
  const keys = new Set(criteria.map((k) => k.key));
  const humanChecked = new Set(material.map((m) => m.criterionKey));
  const runId = require('crypto').randomUUID();
  let n = 0;
  for (const [idx, run] of runs.entries()) {
    for (const item of run.result.criterios || []) {
      if (!keys.has(item.criterionKey)) continue;
      const mat = item.material || {};
      // La revisión de material automática la fija la IA principal (la primera que responde)
      if (idx === 0 && !humanChecked.has(item.criterionKey) && MATERIAL.includes(mat.status)) {
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
          p.sourceLabel || null, rubric.version, run.model, JSON.stringify({ ...item, runId, material: mat })],
      );
      n += 1;
    }
  }
  await touch(c.id, 'EN_REVISION_HUMANA');
  audit(req.user.id, 'EvaluationCase', c.id, 'PROPUESTA_IA', {
    modelos: runs.map((r) => r.model), criterios: n, video: media, errores: errors.length ? errors : undefined, uso: runs.map((r) => r.usage),
  });
  res.json({ ok: true, proposals: n, models: runs.map((r) => r.model), errors });
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

// Cierre de la valoración: nota ponderada, estrellas de calidad y subida si mejora. Nunca baja.
async function resolveCase(c, user, summary, guidance) {
  const rubric = await db.one('SELECT content FROM rubrics WHERE id=$1', [c.rubricId]);
  const decisions = await db.query('SELECT * FROM human_decisions WHERE case_id=$1', [c.id]);
  const decided = new Set(decisions.map((d) => d.criterionKey));
  const missing = L.criteriaFor(rubric.content, c.stage).filter((k) => !decided.has(k.key)).map((k) => k.name);
  if (missing.length) throw Object.assign(new Error(`Falta decidir: ${missing.join(', ')}`), { status: 400 });
  const stage = L.stagesOf(rubric.content).find((x) => x.key === c.stage);
  const score = L.scoreOf(decisions, rubric.content.weights);
  const earned = Math.min(L.levelFromScore(score, rubric.content), stage ? stage.cap : 5);
  const finalSummary = typeof summary === 'function' ? summary({ score, earned, stage }) : summary;
  return db.tx(async (client) => {
    const horse = await db.one('SELECT id, level FROM horses WHERE id=$1 FOR UPDATE', [c.horseId], client);
    const out = await db.one(
      `UPDATE evaluation_cases SET status='RESUELTO', summary=$2, guidance=$3, final_score=$4, level_awarded=$5, resolved_at=now(), updated_at=now()
       WHERE id=$1 RETURNING *`, [c.id, finalSummary, guidance || null, score, earned], client,
    );
    if (earned > horse.level) {
      await db.query('UPDATE horses SET level=$2, updated_at=now() WHERE id=$1', [horse.id, earned], client);
      await db.query(`INSERT INTO level_history(horse_id, from_level, to_level, reason, case_id, notes, decided_by)
                      VALUES ($1,$2,$3,'VALORACION',$4,$5,$6)`, [horse.id, horse.level, earned, c.id, `${stage ? stage.name : ''} · ${earned} ${earned === 1 ? 'estrella' : 'estrellas'} (${score}/100)`, user.id], client);
    }
    await audit(user.id, 'EvaluationCase', c.id, 'RESOLVER', { summary: finalSummary, guidance, nota: score, nivelObtenido: earned, nivelAnterior: horse.level, sube: earned > horse.level }, client);
    return { ...out, previousLevel: horse.level, newLevel: Math.max(earned, horse.level) };
  });
}

// Modelo C-IBERICO: la valoración es de la IA. La secretaría solo comprueba que el material es del caballo y es válido,
// y acepta el resultado tal cual (media de las IAs si hay doble lectura). No modifica notas.
router.post('/cases/:id/accept-ai', wrap(async (req, res) => {
  const c = await getCase(req.params.id);
  if (!c) return res.status(404).json({ error: 'Caso no encontrado' });
  if (locked(c)) return res.status(409).json({ error: 'Ya resuelto' });
  const rubric = await db.one('SELECT version, content FROM rubrics WHERE id=$1', [c.rubricId]);
  const proposals = await db.query('SELECT * FROM ai_proposals WHERE case_id=$1 ORDER BY created_at DESC', [c.id]);
  const air = aiResult(proposals, L.criteriaFor(rubric.content, c.stage));
  if (!air) return res.status(400).json({ error: 'Primero hay que lanzar la IA' });
  if (air.missing.length) return res.status(400).json({ error: `La IA no ha podido valorar: ${air.missing.join(', ')}. Pide nuevo material al titular.` });
  await db.tx(async (client) => {
    for (const it of air.items) {
      const note = it.scores.length > 1 ? `Media de ${it.scores.length} IAs (${it.scores.map((x) => `${x.model}: ${x.score}`).join(', ')})` : null;
      // eslint-disable-next-line no-await-in-loop
      await db.query(
        `INSERT INTO human_decisions(case_id, proposal_id, criterion_key, action, final_score, notes, decided_by) VALUES ($1,$2,$3,'ACEPTAR',$4,$5,$6)
         ON CONFLICT (case_id, criterion_key) DO UPDATE SET proposal_id=EXCLUDED.proposal_id, action='ACEPTAR', final_score=EXCLUDED.final_score,
           notes=EXCLUDED.notes, decided_by=EXCLUDED.decided_by, decided_at=now()`,
        [c.id, it.proposalId, it.key, it.score, note, req.user.id], client,
      );
    }
  });
  audit(req.user.id, 'EvaluationCase', c.id, 'ACEPTA_IA', { modelos: air.models, runId: air.runId });
  const stageName = (st) => (st ? st.name : '');
  const r = await resolveCase(c, req.user, ({ score, earned, stage }) =>
    `Valoración realizada por la IA C-IBERICO (${air.models.join(' + ')}) con la rúbrica v${rubric.version}${stage ? `, etapa ${stageName(stage)}` : ''}. Nota ${score}/100 · nivel ${L.ROMAN[earned] || '—'}. Resultado aceptado por la secretaría tras comprobar el material.`,
  req.body?.guidance);
  res.json(r);
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
  if (!summary) return res.status(400).json({ error: 'Escribe la conclusión' });
  const r = await resolveCase(c, req.user, summary, guidance);
  res.json(r);
}));

module.exports = router;
