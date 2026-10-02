// Textos y datos fijos de la web. C-IBERICO es un certificado PRIVADO:
// no es un libro genealógico oficial ni está avalado por ningún organismo público.

export const CONTACT = {
  place: 'El Puerto de Santa María, Cádiz, España',
  email: 'ibericocaballo@gmail.com',
  phone: '+34 644 064 856',
}

export const DOC_ROLES = { EJEMPLAR: 'Documento del ejemplar', PADRE: 'Documento del padre', MADRE: 'Documento de la madre' }
export const ORIGIN = { DECLARADO: 'Pendiente de acreditar', ACREDITADO: 'Acreditado por C-IBERICO' }
export const BREEDS = { PRE: 'PRE', PSL: 'PSL', PRE_PSL: 'Cruce PRE × PSL', CRUZADO: 'Cruce ibérico' }

// Plazo en texto: 0 = al momento
export const plazo = (d) => (d === 0 ? 'Al momento' : `${d} días hábiles`)

export const SERVICES = [
  {
    code: 'PREVALORACION', slug: 'prevaloracion', num: '00', tag: 'Pre-valoración', name: 'Pre-valoración', price: 0, days: 0, launch: true,
    desc: 'Antes de pedir el certificado: sube un vídeo y una foto de perfil y nuestra IA te da al momento una orientación del nivel probable de tu caballo. Gratis, sin compromiso y sin dar de alta el ejemplar.',
    docs: [
      'Un vídeo de 30 a 60 segundos de lado, con la cámara quieta a 10–15 m: trote y, si puede ser, paso y galope',
      'Una fotografía de perfil con el caballo cuadrado',
      'Fecha de nacimiento y raza del ejemplar',
    ],
  },
  {
    code: 'ORIGEN', slug: 'origen', num: '01', tag: 'Origen', name: 'Certificado de Origen', price: 59, days: 5,
    desc: 'El primer paso, para cualquier edad. Acredita quién es el caballo y de dónde viene: microchip, procedencia comprobada y número de registro CIB con verificación pública. Es único y no caduca.',
    docs: [
      'Microchip del ejemplar',
      'PRE o PSL: carta genealógica o certificado de su libro oficial (ANCCE, APSL…)',
      'Cruces: documentación del padre y de la madre (ANCCE, APSL o C-IBERICO)',
      'Fotografías del ejemplar para su identificación',
      'Datos del titular',
    ],
  },
  {
    code: 'CALIDAD', slug: 'calidad', num: '02', tag: 'Calidad', name: 'Certificado de Calidad', price: 89, days: 3,
    desc: 'El segundo paso, desde los 6 meses. Valoración morfo-deportiva según su etapa de edad y nivel de calidad del I al V. Es un certificado vivo: se actualiza cuando el caballo sube de nivel en una nueva etapa o por sus resultados deportivos.',
    docs: [
      'Certificado de Origen C-IBERICO ya expedido',
      'Ejemplar con al menos 6 meses (la exigencia y el nivel máximo dependen de la etapa)',
      'Cinco fotografías reglamentarias y vídeo de máx. 1 minuto (montado desde los 3 años; a la mano o en libertad antes)',
      'Opcional: resultados deportivos con documento oficial del organismo, para incluirlos',
    ],
  },
  {
    code: 'CAMBIO_NOMBRE', slug: 'nombre', num: '03', tag: 'Nombre', name: 'Cambio de nombre', price: 25, days: 2,
    desc: 'Cambio del nombre del ejemplar en el Registro C-IBERICO con reexpedición del certificado y de la documentación anexa.',
    docs: ['Certificado de Origen actual', 'Reseña del ejemplar', 'Comprobante de identidad del titular'],
  },
  {
    code: 'CAMBIO_TITULARIDAD', slug: 'titularidad', num: '04', tag: 'Titularidad', name: 'Cambio de titularidad', price: 19, days: 2,
    desc: 'Transmisión de la titularidad del ejemplar entre partes, con reexpedición inmediata de la documentación.',
    docs: ['Certificado de Origen actual', 'Documento de compraventa o cesión firmado por ambas partes', 'Identificación del titular anterior y del nuevo titular'],
  },
  {
    code: 'LAUREADA', slug: 'laureada', num: '05', tag: 'Laureada', name: 'Lista Laureada Ámbar', price: 99, days: 10,
    desc: 'Máxima distinción C-IBERICO. Acceso al salón de la fama y trabajo de promoción por parte de la presidencia.',
    docs: ['Certificado de Origen C-IBERICO', 'Acreditación de las tres estrellas ámbar obtenidas por la descendencia', 'Historial deportivo documentado'],
  },
  {
    code: 'YEGUADA', slug: 'yeguada', num: '06', tag: 'Yeguada', name: 'Alta de yeguada asociada', price: 149, days: 7,
    desc: 'Integración de la yeguada en la red C-IBERICO con código de criador, atención urgente y descuentos en servicios.',
    docs: ['Datos de la yeguada y ubicación', 'Identificación del titular', 'Relación de ejemplares'],
  },
]

// Las estrellas reconocen méritos deportivos verificados. No forman parte del Certificado de Calidad (que es el nivel I–V).
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
  { key: 'grupa', name: 'Grupa y tercio posterior', area: 'Conformación' },
  { key: 'aplomos', name: 'Aplomos y extremidades', area: 'Conformación' },
  { key: 'paso', name: 'Paso', area: 'Movimiento' },
  { key: 'trote', name: 'Trote', area: 'Movimiento' },
  { key: 'galope', name: 'Galope', area: 'Movimiento' },
  { key: 'reunion_giros', name: 'Equilibrio y capacidad de reunión', area: 'Funcionalidad' },
  { key: 'comportamiento_montable', name: 'Aptitud para ser montado', area: 'Doma (desde 3 años)' },
]

export const AGE_WHEEL = [
  ['Potro (6–11 meses)', 'A la mano o en libertad. Proporciones, aplomos y calidad natural de los aires. Nota orientativa.', 'II'],
  ['Añojo (1 año)', 'En libertad o a la mano. Aires naturales regulares y equilibrio.', 'II'],
  ['2 años', 'En libertad o a la cuerda. Elasticidad, empuje del posterior y equilibrio en giros.', 'III'],
  ['3 años', 'Montado. Tres aires regulares, ritmo y tacto. No se exige más.', 'III'],
  ['4 años', 'Impulsión naciente y transiciones básicas al galope.', 'IV'],
  ['5 años', 'Alargamientos, contragalope corto, reunión incipiente.', 'IV'],
  ['6 años o más', 'Reunión real y exigencia completa de doma clásica según el nivel presentado.', 'V'],
]

export const LEVELS = [
  { n: 1, name: 'Nivel I', min: 50 },
  { n: 2, name: 'Nivel II', min: 60 },
  { n: 3, name: 'Nivel III', min: 70 },
  { n: 4, name: 'Nivel IV', min: 80 },
  { n: 5, name: 'Nivel V', min: 90 },
]
export const ROMAN = ['—', 'I', 'II', 'III', 'IV', 'V']
export const LEVEL_REASON = { VALORACION: 'Valoración', MERITO: 'Mérito deportivo', MANUAL: 'Decisión de presidencia' }

export const STANDARD_TEXT = {
  title: 'El caballo ibérico, medido con la vara del caballo de deporte',
  lead: 'C-IBERICO valora el movimiento con el estándar de las pruebas de caballos jóvenes y de selección centroeuropeas, y la conformación por su función, respetando el tipo PRE y PSL.',
  points: [
    'Un 8 en trote es un trote que obtendría un 8 en una prueba de caballos jóvenes centroeuropea, sea de la raza que sea.',
    'La elevación de la rodilla no suma por sí sola: se busca alcance desde el hombro, empuje del posterior, dorso elástico y suspensión.',
    'Los rasgos de tipo ibérico (perfil de la cabeza, grupa redondeada, crin) no restan si no limitan el movimiento.',
    'El movimiento pesa el 80 % de la nota y la conformación el 20 %.',
  ],
  honest: 'Es una vara exigente: la mayoría de los caballos ibéricos obtienen niveles I y II, y los niveles IV y V son excepcionales. Por eso tienen valor.',
}

// "Cómo trabaja nuestra IA". Solo se afirma lo que ya es verdad: lo que está en marcha va como "En preparación".
// Cuando algo esté hecho, cambiar ready a true y poner la cifra real en el texto.
export const AI_TRUST = [
  { ready: true, title: 'Un mismo criterio para todos', text: 'Cada caballo se valora con la misma rúbrica C-IBERICO, versionada y pública en el Reglamento: mismos bloques, mismas anclas y la misma exigencia según su edad.' },
  { ready: true, title: 'Cita sus pruebas', text: 'Cada nota indica en qué foto o en qué segundo del vídeo se basa, y con qué grado de confianza.' },
  { ready: true, title: 'Doble lectura', text: 'Cuando trabajan dos IAs, cada una valora por separado: se usa la media y se marca cualquier discrepancia.' },
  { ready: true, title: 'No inventa', text: 'Si el material no permite valorar un bloque, no pone nota: se pide nuevo material.' },
  { ready: true, title: 'Trazable', text: 'Cada valoración queda ligada a la versión de la rúbrica utilizada y a un historial que no se borra.' },
  // Reglamentos cargados en la rúbrica v2.3 (oct 2026). PENDIENTE antes del dominio propio: vídeos de referencia y calibración con caballos (poner cifras reales).
  { ready: true, title: 'Instruida con los reglamentos', text: 'Trabaja con el reglamento FEI de doma clásica y de caballos jóvenes y con los estándares del PRE y del PSL, aplicados al criterio C-IBERICO.' },
  { ready: true, title: 'Formada con vídeo y texto', text: 'Preparada con vídeos de referencia de caballos de deporte y con la documentación técnica de la doma clásica, para leer el movimiento como lo haría un juez.' },
  { ready: true, title: 'Única para el caballo ibérico', text: 'Calibrada con caballos ibéricos valorados por jinetes y jueces, para que sus niveles coincidan con el criterio de los expertos.' },
]

export const AI_RULES = [
  'La nota es de la IA, siempre con la misma rúbrica para todos. La secretaría solo comprueba que el material es del caballo y es válido, y acepta el resultado: no modifica notas.',
  'Un material deficiente nunca se convierte en una nota baja: se pide nuevo material o se marca como no evaluable.',
  'Cada propuesta cita su evidencia (vista fotográfica o minuto del vídeo) y declara su confianza.',
  'La IA no determina identidad, genealogía, pureza, temperamento, salud, valor reproductivo ni rendimiento futuro.',
  'El nivel sale de la nota de la IA, con el tope de cada etapa. Las estrellas no las da la IA: salen de resultados deportivos verificados.',
  'Cada valoración queda ligada a la versión de la rúbrica utilizada y a un historial que no se borra.',
]

export const fmtDate = (d) => (d ? new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')
export const eur = (n) => (n === 0 ? 'Gratis' : `${n.toLocaleString('es-ES')} €`)
