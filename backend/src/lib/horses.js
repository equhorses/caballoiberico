// Validación común del alta/edición de un ejemplar (titulares y presidencia siguen el mismo reglamento)
const BREEDS = ['PRE', 'PSL', 'PRE_PSL', 'CRUZADO'];
const SEXES = ['MACHO', 'HEMBRA', 'CASTRADO'];
const t = (v) => (v == null ? '' : String(v).trim());

// Devuelve { error } o { data } con los valores normalizados para la base de datos
function validateHorse(b) {
  const rawPct = b.ibericBloodPct;
  const pct = rawPct === undefined || rawPct === null || rawPct === '' ? null : parseInt(rawPct, 10);
  if (!t(b.name) || !t(b.birthDate) || !SEXES.includes(b.sex) || !BREEDS.includes(b.breed) || !t(b.coat) || !t(b.country)) {
    return { error: 'Faltan datos obligatorios del ejemplar' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t(b.birthDate))) return { error: 'Fecha de nacimiento no válida' };
  if (!t(b.microchip)) return { error: 'El microchip es obligatorio: es lo que identifica al caballo, tenga o no papeles' };
  if (['PRE', 'PSL'].includes(b.breed) && !t(b.officialRegistry)) {
    return { error: 'Para un PRE o un PSL indica su número en el libro oficial (ANCCE, APSL…)' };
  }
  if (['PRE_PSL', 'CRUZADO'].includes(b.breed) && (!t(b.sireName) || !t(b.damName) || !t(b.sireRegistry) || !t(b.damRegistry))) {
    return { error: 'En un cruce hay que indicar padre y madre con su número de registro (libro oficial o C-IBERICO)' };
  }
  if (pct !== null && (Number.isNaN(pct) || pct < 10 || pct > 100)) return { error: 'El % de sangre ibérica debe estar entre 10 y 100 (déjalo en blanco si no se conoce)' };
  return {
    data: {
      name: t(b.name).toUpperCase(), birth_date: t(b.birthDate), sex: b.sex, coat: t(b.coat), country: t(b.country), breed: b.breed,
      iberic_blood_pct: pct, sire_name: t(b.sireName) || null, dam_name: t(b.damName) || null, breeder_name: t(b.breederName) || null,
      microchip: t(b.microchip), official_registry: t(b.officialRegistry) || null, sire_registry: t(b.sireRegistry) || null, dam_registry: t(b.damRegistry) || null,
    },
  };
}

module.exports = { validateHorse, BREEDS, SEXES };
