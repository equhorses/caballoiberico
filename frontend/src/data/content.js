// Textos y datos fijos de la web. C-IBERICO es un certificado PRIVADO:
// no es un libro genealógico oficial ni está avalado por ningún organismo público.

export const CONTACT = {
  place: 'El Puerto de Santa María, Cádiz, España',
  email: 'ibericocaballo@gmail.com',
  phone: '+34 644 064 856',
}

export const BREEDS = { PRE: 'PRE', PSL: 'PSL', PRE_PSL: 'PRE/PSL', CRUZADO: 'Cruzado ibérico' }

export const SERVICES = [
  {
    code: 'ORIGEN', slug: 'origen', num: '01', tag: 'Origen', name: 'Certificado de Origen', price: 120, days: 10,
    desc: 'Alta del ejemplar en el Registro C-IBERICO con número de registro único, código de verificación público y ascendencia documentada.',
    docs: [
      'Documentación del padre (registro PRE de ANCCE, PSL de APSL, DIE/pasaporte, ADN u otro aval)',
      'Documentación de la madre en las mismas condiciones',
      'Certificado de cubrición o justificación de la procedencia paterna',
      'Cinco fotografías reglamentarias del ejemplar',
      'Datos del titular e identificación oficial del país',
    ],
  },
  {
    code: 'CALIDAD', slug: 'calidad', num: '02', tag: 'Calidad', name: 'Certificado de Calidad', price: 180, days: 15,
    desc: 'Reconocimiento de calidad con estrellas por mérito deportivo contrastado en doma clásica o disciplina avalada, junto a la valoración morfo-deportiva.',
    docs: [
      'Certificado de Origen C-IBERICO ya expedido',
      'Ejemplar con tres años cumplidos a la fecha de la solicitud',
      'Cinco fotografías reglamentarias y vídeo montado en los tres aires (máx. 1 minuto)',
      'Documentación oficial del organismo que acredita el resultado deportivo',
    ],
  },
  {
    code: 'CAMBIO_NOMBRE', slug: 'nombre', num: '03', tag: 'Nombre', name: 'Cambio de nombre', price: 60, days: 5,
    desc: 'Cambio del nombre del ejemplar en el Registro C-IBERICO con reexpedición del certificado y de la documentación anexa.',
    docs: ['Certificado de Origen actual', 'Reseña del ejemplar', 'Comprobante de identidad del titular'],
  },
  {
    code: 'CAMBIO_TITULARIDAD', slug: 'titularidad', num: '04', tag: 'Titularidad', name: 'Cambio de titularidad', price: 75, days: 5,
    desc: 'Transmisión de la titularidad del ejemplar entre partes, con reexpedición inmediata de la documentación.',
    docs: ['Certificado de Origen actual', 'Documento de compraventa o cesión firmado por ambas partes', 'Identificación del titular anterior y del nuevo titular'],
  },
  {
    code: 'LAUREADA', slug: 'laureada', num: '05', tag: 'Laureada', name: 'Lista Laureada Ámbar', price: 250, days: 20,
    desc: 'Máxima distinción C-IBERICO. Acceso al salón de la fama y trabajo de promoción por parte de la presidencia.',
    docs: ['Certificado de Origen C-IBERICO', 'Acreditación de las tres estrellas ámbar obtenidas por la descendencia', 'Historial deportivo documentado'],
  },
  {
    code: 'YEGUADA', slug: 'yeguada', num: '06', tag: 'Yeguada', name: 'Alta de yeguada asociada', price: 300, days: 15,
    desc: 'Integración de la yeguada en la red C-IBERICO con código de criador, atención urgente y descuentos en servicios.',
    docs: ['Datos de la yeguada y ubicación', 'Identificación del titular', 'Relación de ejemplares'],
  },
]

export const STAR_LEVELS = [
  { n: 3, name: 'Tres estrellas', level: 'Mérito nacional — categoría jóvenes', desc: 'Vencedor de la prueba más alta de la categoría de caballos jóvenes en doma clásica o disciplina avalada.' },
  { n: 6, name: 'Seis estrellas', level: 'Mérito nacional absoluto', desc: 'Vencedor de la prueba más alta de la disciplina presentada a nivel nacional.' },
  { n: 12, name: 'Doce estrellas', level: 'Mérito internacional', desc: 'Vencedor de la prueba más alta de la disciplina presentada en competición internacional.' },
  { n: 24, name: 'Veinticuatro estrellas', level: 'Juegos Olímpicos, Mundial o Juegos Ecuestres', desc: 'Participación entre los quince primeros. Concede además una estrella ámbar a todos sus ascendientes.' },
]

export const MERIT_LEVELS = {
  JOVENES_NACIONAL: 'Jóvenes (nacional)', NACIONAL_ABSOLUTO: 'Nacional absoluto', INTERNACIONAL: 'Internacional', MUNDIAL_OLIMPICO: 'Mundial / Olímpico',
}

export const PHOTO_VIEWS = [
  { key: 'LATERAL_IZQUIERDO', label: 'Lateral izquierdo' },
  { key: 'LATERAL_DERECHO', label: 'Lateral derecho' },
  { key: 'FRONTAL', label: 'Frontal' },
  { key: 'TRASERA', label: 'Trasera' },
  { key: 'SUPERIOR', label: 'Tronco desde arriba' },
]

export const CRITERIA = [
  { key: 'cabeza_cuello', name: 'Cabeza y cuello', area: 'Conformación' },
  { key: 'tronco_dorso', name: 'Tronco y dorso', area: 'Conformación' },
  { key: 'grupa', name: 'Grupa', area: 'Conformación' },
  { key: 'aplomos', name: 'Aplomos y extremidades', area: 'Conformación' },
  { key: 'paso', name: 'Paso', area: 'Movimiento' },
  { key: 'trote', name: 'Trote', area: 'Movimiento' },
  { key: 'galope', name: 'Galope', area: 'Movimiento' },
  { key: 'reunion_giros', name: 'Reunión y giros', area: 'Funcionalidad' },
  { key: 'comportamiento_montable', name: 'Aptitud para ser montado', area: 'Doma' },
]

export const AGE_WHEEL = [
  ['3 años', 'Tres aires regulares, ritmo y tacto. No se exige más.'],
  ['4 años', 'Impulsión naciente y transiciones básicas al galope.'],
  ['5 años', 'Alargamientos, contragalope corto, reunión incipiente.'],
  ['6 años', 'Reunión real, espalda adentro, cambios simples.'],
  ['7 años o más', 'Exigencia completa de doma clásica según el nivel presentado.'],
]

export const AI_RULES = [
  'La IA propone; un evaluador humano resuelve. Ninguna nota es válida sin decisión humana.',
  'Un material deficiente nunca se convierte en una nota baja: se pide nuevo material o se marca como no evaluable.',
  'Cada propuesta cita su evidencia (vista fotográfica o minuto del vídeo) y declara su confianza.',
  'La IA no determina identidad, genealogía, pureza, temperamento, salud, valor reproductivo ni rendimiento futuro.',
  'Las estrellas nunca salen de la IA: proceden de méritos deportivos acreditados con documentación oficial.',
  'Cada valoración queda ligada a la versión de la rúbrica utilizada y a un historial que no se borra.',
]

export const fmtDate = (d) => (d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
export const eur = (n) => `${n.toLocaleString('es-ES')} €`
