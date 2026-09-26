// Conector de IA (API compatible con OpenAI: Kimi/Moonshot, OpenAI, etc.).
// Si no hay AI_API_KEY/AI_MODEL configurados, la web muestra "pendiente de integración":
// nunca se inventan resultados.
const fs = require('fs');
const path = require('path');

const cfg = () => ({
  baseUrl: (process.env.AI_BASE_URL || 'https://api.moonshot.ai/v1').replace(/\/$/, ''),
  apiKey: process.env.AI_API_KEY,
  model: process.env.AI_MODEL,
});

const isConfigured = () => Boolean(cfg().apiKey && cfg().model);

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

function photoToDataUrl(uploadDir, url) {
  const file = path.join(uploadDir, path.basename(url));
  const mime = MIME[path.extname(file).toLowerCase()];
  if (!mime || !fs.existsSync(file)) return null;
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
}

function buildPrompt(rubric, ageYears, views, hasVideo) {
  const c = rubric.content;
  const criteria = c.criteria.map((k) =>
    `- ${k.key} (${k.name}) · material: ${k.material.join(', ')}\n  Observar: ${k.observe}\n  Anclas: ${Object.entries(k.anchors).map(([r, d]) => `${r}: ${d}`).join(' | ')}`
  ).join('\n');
  const age = ageYears ? `Edad del ejemplar: ${ageYears} años. Expectativa por edad: ${c.ageWheel[Math.min(Math.max(ageYears, 3), 7)]}` : 'Edad no disponible.';
  return `Eres el asistente de valoración morfo-deportiva de C-IBERICO (certificado privado, no oficial).
Rúbrica versión ${rubric.version} (estado ${rubric.status}).

REGLAS OBLIGATORIAS:
${c.rules.map((r) => `- ${r}`).join('\n')}

${age}
Fotografías recibidas (en este orden): ${views.join(', ') || 'ninguna'}.
Vídeo: ${hasVideo ? 'existe pero NO se te envía; los criterios de movimiento los valora el evaluador humano sobre el vídeo.' : 'no aportado.'}
Por tanto, para criterios cuyo material sea solo VIDEO: material "NO_EVALUABLE", confianza "ABSTENCION", score null.

CRITERIOS:
${criteria}

Para cada criterio devuelve primero la revisión de material (APTO, APTO_PARCIAL, REQUIERE_MATERIAL, NO_EVALUABLE) y después la propuesta.
Solo das "score" (0-10, admite medios puntos) si el material es APTO o APTO_PARCIAL; en otro caso null.
La evidencia cita la foto usada, p. ej. {"fuente":"foto:LATERAL_IZQUIERDO"}.

Responde SOLO con JSON válido con esta forma exacta:
{"criterios":[{"criterionKey":"...","material":{"status":"APTO","notes":"..."},"propuesta":{"observation":"...","score":7.5,"confidence":"MEDIA","evidence":[{"fuente":"foto:LATERAL_IZQUIERDO"}],"limitations":"...","sourceLabel":"interpretación C-IBERICO"}}]}`;
}

async function runEvaluation({ rubric, ageYears, photos, hasVideo, uploadDir }) {
  if (!isConfigured()) throw Object.assign(new Error('IA pendiente de integración: falta AI_API_KEY o AI_MODEL'), { status: 503 });
  const { baseUrl, apiKey, model } = cfg();

  const images = photos.map((p) => ({ view: p.view, dataUrl: photoToDataUrl(uploadDir, p.url) })).filter((p) => p.dataUrl);
  const content = [{ type: 'text', text: buildPrompt(rubric, ageYears, images.map((i) => i.view), hasVideo) }];
  images.forEach((i) => content.push({ type: 'image_url', image_url: { url: i.dataUrl } }));

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, temperature: 0.2, messages: [{ role: 'user', content }], response_format: { type: 'json_object' } }),
  });
  if (!res.ok) throw Object.assign(new Error(`Error del proveedor de IA (${res.status}): ${(await res.text()).slice(0, 300)}`), { status: 502 });
  const body = await res.json();
  const text = body.choices?.[0]?.message?.content || '';
  const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
  return { model, result: json, raw: body };
}

module.exports = { isConfigured, runEvaluation };
