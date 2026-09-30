// Conector de IA (APIs compatibles con OpenAI: Anthropic/Claude, Kimi, Gemini, OpenRouter…).
// Admite DOBLE LECTURA: una IA principal (AI_*) y otra secundaria opcional (AI2_*). Ambas valoran
// por separado con la misma rúbrica; si discrepan, el evaluador lo ve marcado.
// Si no hay ninguna configurada, la web muestra "pendiente de integración": nunca se inventan resultados.
const fs = require('fs');
const path = require('path');
const { extractFrames, extractBursts } = require('./frames');

const num = (v, def, min, max) => Math.min(Math.max(parseInt(v ?? def, 10) || def, min), max);

function providers() {
  const list = [];
  for (const prefix of ['AI', 'AI2']) {
    const apiKey = process.env[`${prefix}_API_KEY`];
    const model = process.env[`${prefix}_MODEL`];
    if (!apiKey || !model) continue;
    list.push({
      id: prefix,
      baseUrl: (process.env[`${prefix}_BASE_URL`] || 'https://api.anthropic.com/v1').replace(/\/$/, ''),
      apiKey,
      model,
    });
  }
  return list;
}

const isConfigured = () => providers().length > 0;

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const fileOf = (uploadDir, url) => path.join(uploadDir, path.basename(url));

function photoToDataUrl(uploadDir, url) {
  const file = fileOf(uploadDir, url);
  const mime = MIME[path.extname(file).toLowerCase()];
  if (!mime || !fs.existsSync(file)) return null;
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
}

function buildPrompt({ rubric, criteria, stage, ageMonths, views, spreadTimes, bursts }) {
  const c = rubric.content;
  const list = criteria.map((k) =>
    `- ${k.key} (${k.name}) · material: ${k.material.join(', ')}\n  Observar: ${k.observe}\n  Anclas: ${Object.entries(k.anchors).map(([r, d]) => `${r}: ${d}`).join(' | ')}`,
  ).join('\n');
  const years = Math.floor((ageMonths || 0) / 12);
  const age = stage
    ? `Edad: ${years} años y ${(ageMonths || 0) % 12} meses. Etapa: ${stage.name}${stage.ridden ? ' (montado)' : ' (sin montar: a la mano o en libertad)'}.
Expectativa para esta etapa: ${c.ageWheel?.[stage.key] || '—'}`
    : 'Edad no disponible.';

  let videoPart = 'No hay vídeo: en criterios cuyo material sea solo VIDEO devuelve material "REQUIERE_MATERIAL", confianza "ABSTENCION" y score null.';
  if (spreadTimes.length || bursts.length) {
    videoPart = `Después de las fotos recibirás imágenes del vídeo:
- ${spreadTimes.length} fotogramas repartidos por todo el vídeo, en este orden: ${spreadTimes.join(', ')}.
${bursts.map((b, i) => `- Ráfaga ${i + 1}: ${b.frames.length} fotogramas CONSECUTIVOS separados 0,1 s, desde ${b.frames[0].t} hasta ${b.frames[b.frames.length - 1].t}. Úsala para seguir la secuencia de apoyos (diagonales en el trote, tres tiempos en el galope, cuatro en el paso), el alcance y la suspensión.`).join('\n')}
Con esto puedes valorar amplitud, alcance, empuje del posterior, equilibrio y secuencia de un tranco, pero no la regularidad a lo largo de todo el vídeo.
En criterios de movimiento: confianza como máximo "MEDIA", y en limitations indica qué debe confirmar el evaluador viendo el vídeo completo.
Cita la evidencia como {"fuente":"video","t":"mm:ss"}.`;
  }

  return `Eres el evaluador asistente de C-IBERICO, un certificado privado de calidad del caballo ibérico deportivo.
Rúbrica versión ${rubric.version} (estado ${rubric.status}).

CRITERIO DE LA CASA Y REGLAS OBLIGATORIAS:
${(c.rules || []).map((r) => `- ${r}`).join('\n')}

${age}

Fotografías recibidas primero, en este orden: ${views.join(', ') || 'ninguna'}. Cítalas como {"fuente":"foto:VISTA"}.
${videoPart}

CRITERIOS A EVALUAR (solo estos):
${list}

Para cada criterio devuelve primero la revisión de material (APTO, APTO_PARCIAL, REQUIERE_MATERIAL, NO_EVALUABLE) y después la propuesta.
Solo das "score" (0-10, admite medios puntos) si el material es APTO o APTO_PARCIAL; en otro caso null.

Responde SOLO con JSON válido con esta forma exacta:
{"criterios":[{"criterionKey":"...","material":{"status":"APTO","notes":"..."},"propuesta":{"observation":"...","score":7.5,"confidence":"MEDIA","evidence":[{"fuente":"foto:LATERAL_IZQUIERDO"}],"limitations":"...","sourceLabel":"criterio C-IBERICO"}}]}`;
}

async function callModel(p, body) {
  const post = (b) => fetch(`${p.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.apiKey}` },
    body: JSON.stringify(b),
  });
  let res = await post({ ...body, temperature: 0.2, max_tokens: 8000, response_format: { type: 'json_object' } });
  // Algunos modelos no aceptan temperature o response_format: se reintenta sin ellos
  if (res.status === 400) res = await post({ ...body, max_tokens: 8000 });
  if (!res.ok) {
    const txt = (await res.text()).slice(0, 400);
    const hint = res.status === 401 ? ' (clave no válida)' : res.status === 402 || /balance|quota|insufficient|credit/i.test(txt) ? ' (saldo insuficiente en la cuenta de IA)' : '';
    throw Object.assign(new Error(`Error de ${p.model} ${res.status}${hint}: ${txt}`), { status: 502 });
  }
  return res.json();
}

function parseJson(text) {
  const clean = String(text || '').replace(/```json|```/g, '');
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start < 0 || end < start) throw Object.assign(new Error('La IA no devolvió un JSON válido'), { status: 502 });
  return JSON.parse(clean.slice(start, end + 1));
}

// Prepara el material una sola vez y lo envía a todas las IAs configuradas en paralelo
async function runEvaluation({ rubric, criteria, stage, ageMonths, photos, video, uploadDir }) {
  const list = providers();
  if (!list.length) throw Object.assign(new Error('IA pendiente de integración: falta AI_API_KEY o AI_MODEL'), { status: 503 });

  const images = photos.map((p) => ({ view: p.view, dataUrl: photoToDataUrl(uploadDir, p.url) })).filter((p) => p.dataUrl);
  const videoFile = video ? fileOf(uploadDir, video.url) : null;
  const spread = videoFile ? await extractFrames(videoFile, num(process.env.AI_VIDEO_FRAMES, 8, 0, 16)) : [];
  const bursts = videoFile ? await extractBursts(videoFile, { bursts: num(process.env.AI_VIDEO_BURSTS, 2, 0, 4) }) : [];

  const content = [{ type: 'text', text: buildPrompt({ rubric, criteria, stage, ageMonths, views: images.map((i) => i.view), spreadTimes: spread.map((f) => f.t), bursts }) }];
  images.forEach((i) => content.push({ type: 'image_url', image_url: { url: i.dataUrl } }));
  spread.forEach((f) => {
    content.push({ type: 'text', text: `Fotograma del vídeo en ${f.t}` });
    content.push({ type: 'image_url', image_url: { url: f.dataUrl } });
  });
  bursts.forEach((b, i) => {
    content.push({ type: 'text', text: `Ráfaga ${i + 1} (fotogramas consecutivos cada 0,1 s):` });
    b.frames.forEach((f) => {
      content.push({ type: 'text', text: f.t });
      content.push({ type: 'image_url', image_url: { url: f.dataUrl } });
    });
  });

  const media = { frames: spread.map((f) => f.t), bursts: bursts.map((b) => `${b.frames[0].t}–${b.frames[b.frames.length - 1].t}`) };
  const settled = await Promise.allSettled(list.map(async (p) => {
    const body = await callModel(p, { model: p.model, messages: [{ role: 'user', content }] });
    return { model: p.model, result: parseJson(body.choices?.[0]?.message?.content), usage: body.usage || null };
  }));
  const runs = settled.filter((s) => s.status === 'fulfilled').map((s) => s.value);
  const errors = settled.filter((s) => s.status === 'rejected').map((s) => s.reason.message);
  if (!runs.length) throw Object.assign(new Error(errors.join(' | ')), { status: 502 });
  return { runs, errors, media };
}

module.exports = { isConfigured, runEvaluation, providers, callModel, parseJson };
