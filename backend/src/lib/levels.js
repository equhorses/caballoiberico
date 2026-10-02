// Etapas por edad y niveles de calidad C-IBERICO.
// - Etapa: qué se puede evaluar según la edad (desde 6 meses).
// - Nivel (I–V): independiente de la edad. Se conserva el más alto; nunca baja por una valoración.
//   Cada etapa tiene un tope de nivel (un potro no puede pasar del nivel II).
// Los valores por defecto se pueden sobrescribir en la rúbrica (content.stages / content.levels).

const DEFAULT_STAGES = [
  { key: 'POTRO', name: 'Potro (6–11 meses)', minMonths: 6, maxMonths: 11, ridden: false, cap: 2 },
  { key: 'ANOJO', name: 'Añojo (1 año)', minMonths: 12, maxMonths: 23, ridden: false, cap: 2 },
  { key: 'DOS_ANOS', name: '2 años', minMonths: 24, maxMonths: 35, ridden: false, cap: 3 },
  { key: 'TRES_ANOS', name: '3 años', minMonths: 36, maxMonths: 47, ridden: true, cap: 3 },
  { key: 'CUATRO_ANOS', name: '4 años', minMonths: 48, maxMonths: 59, ridden: true, cap: 4 },
  { key: 'CINCO_ANOS', name: '5 años', minMonths: 60, maxMonths: 71, ridden: true, cap: 4 },
  { key: 'SEIS_MAS', name: '6 años o más', minMonths: 72, maxMonths: 9999, ridden: true, cap: 5 },
];

// Nota mínima (sobre 100) para cada nivel. Experimental hasta validar con evaluadores.
const DEFAULT_LEVELS = [
  { level: 1, name: 'Nivel I', minScore: 50 },
  { level: 2, name: 'Nivel II', minScore: 60 },
  { level: 3, name: 'Nivel III', minScore: 70 },
  { level: 4, name: 'Nivel IV', minScore: 80 },
  { level: 5, name: 'Nivel V', minScore: 90 },
];

const ROMAN = ['—', 'I', 'II', 'III', 'IV', 'V'];

function ageMonths(birth, at = new Date()) {
  const b = new Date(birth);
  let m = (at.getFullYear() - b.getFullYear()) * 12 + (at.getMonth() - b.getMonth());
  if (at.getDate() < b.getDate()) m -= 1;
  return m;
}

const stagesOf = (rubricContent) => rubricContent?.stages || DEFAULT_STAGES;
const levelsOf = (rubricContent) => rubricContent?.levels || DEFAULT_LEVELS;

function stageFor(months, rubricContent) {
  return stagesOf(rubricContent).find((s) => months >= s.minMonths && months <= s.maxMonths) || null;
}

// Criterios que se evalúan en esa etapa (los que exigen montar se excluyen en potros, añojos y 2 años)
function criteriaFor(rubricContent, stageKey) {
  const stage = stagesOf(rubricContent).find((s) => s.key === stageKey);
  return rubricContent.criteria.filter((c) => !(c.ridden && stage && !stage.ridden));
}

// Media ponderada (sobre 100) de las notas decididas por el evaluador humano
function scoreOf(decisions, weights = {}) {
  let sum = 0; let wsum = 0;
  decisions.forEach((d) => {
    const w = weights[d.criterionKey];
    if (d.finalScore == null || !w) return;
    sum += Number(d.finalScore) * w; wsum += w;
  });
  return wsum ? Math.round((sum / wsum) * 100) / 10 : null;
}

function levelFromScore(score, rubricContent) {
  if (score == null) return 0;
  return levelsOf(rubricContent).reduce((lvl, l) => (score >= l.minScore ? Math.max(lvl, l.level) : lvl), 0);
}

// Suelo por méritos: un resultado verificado garantiza un nivel mínimo (no se aplica el tope de la etapa)
const MERIT_FLOOR = { JOVENES_NACIONAL: { level: 3, top: 3 }, NACIONAL_ABSOLUTO: { level: 4, top: 3 }, INTERNACIONAL: { level: 5, top: 3 }, MUNDIAL_OLIMPICO: { level: 5, top: 15 } };
function meritFloor(merit) {
  const rule = MERIT_FLOOR[merit.level];
  const pos = parseInt(String(merit.position || '').replace(/[^0-9]/g, ''), 10);
  if (!rule || !pos || pos > rule.top) return 0;
  return rule.level;
}

module.exports = { MERIT_FLOOR, meritFloor, DEFAULT_STAGES, DEFAULT_LEVELS, ROMAN, ageMonths, stageFor, criteriaFor, scoreOf, levelFromScore, stagesOf };
