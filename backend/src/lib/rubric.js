// Rúbrica C-IBERICO v2.2
// CRITERIO DE LA CASA: el caballo ibérico (PRE, PSL y cruces) juzgado con la vara del caballo de deporte centroeuropeo.
// - MOVIMIENTO: las notas se anclan al estándar de las pruebas de caballos jóvenes y de selección centroeuropeas.
//   Un 8 en trote es un trote que obtendría un 8 allí, sea de la raza que sea.
// - CONFORMACIÓN: se juzga la función (lo que permite o limita ese movimiento), respetando el tipo racial ibérico.
//   Los rasgos de tipo PRE/PSL que no limitan la función no restan.
// Estado EXPERIMENTAL: pesos y umbrales pendientes de validación con evaluadores. Se edita desde el panel (versionada).

const AREAS = {
  CONFORMACION: 'Conformación funcional',
  MOVIMIENTO: 'Calidad de los aires',
  FUNCIONALIDAD: 'Equilibrio y capacidad atlética',
  DOMA: 'Aptitud para la doma',
};

const STANDARD = 'Vara de medir del movimiento: estándar del caballo de deporte centroeuropeo (pruebas de caballos jóvenes y de selección). '
  + 'Referencias de nota en trote: 9-10 excepcional incluso entre caballos de deporte de élite; 8 muy bueno para un caballo de deporte; 7 bueno; '
  + '6 suficiente, típico de un movimiento de rodilla alta con poco alcance y poco empuje del posterior; 5 o menos, insuficiente. '
  + 'No se da más nota por la elevación de la rodilla si no va acompañada de alcance desde el hombro, empuje del posterior y dorso elástico.';

const CRITERIA = [
  {
    key: 'cabeza_cuello', name: 'Cabeza y cuello', area: 'CONFORMACION', material: ['LATERAL_IZQUIERDO', 'LATERAL_DERECHO', 'FRONTAL'],
    observe: 'Salida del cuello desde la cruz, longitud y dirección, inserción cabeza-cuello y ganachas libres. El perfil de la cabeza (subconvexo, recto) es rasgo de tipo y no resta.',
    anchors: {
      '9-10': 'Cuello largo, de salida alta y ligera, bien insertado; permite flexionar en la nuca y estirarse hacia delante-abajo.',
      '7-8': 'Buena longitud y salida; algún detalle menor (ganacha algo cargada, cuello algo grueso en la base).',
      '5-6': 'Cuello corto, pesado o de salida baja, o muy arqueado y cargado en la parte alta, que limitará el estiramiento y el contacto.',
      '0-4': 'Defecto marcado (cuello invertido, cuello caído) que condiciona el trabajo.',
    },
  },
  {
    key: 'tronco_dorso', name: 'Tronco y dorso', area: 'CONFORMACION', material: ['LATERAL_IZQUIERDO', 'LATERAL_DERECHO', 'SUPERIOR'],
    observe: 'Espalda (inclinación y longitud), cruz, línea dorsal, unión lumbar y proporciones. Se busca un cuerpo que permita un dorso elástico y un tercio anterior libre.',
    anchors: {
      '9-10': 'Espalda larga e inclinada, cruz marcada que se prolonga atrás, dorso firme de longitud media, riñón corto y bien unido.',
      '7-8': 'Correcto con un detalle menor (espalda algo recta, riñón algo largo).',
      '5-6': 'Espalda recta y corta que limita el alcance, dorso largo o blando, o unión lumbar débil.',
      '0-4': 'Ensillado o desproporción marcada.',
    },
  },
  {
    key: 'grupa', name: 'Grupa y tercio posterior', area: 'CONFORMACION', material: ['LATERAL_IZQUIERDO', 'LATERAL_DERECHO', 'TRASERA', 'SUPERIOR'],
    observe: 'Longitud e inclinación de la grupa, musculatura, ángulos de babilla y corvejón. La grupa redondeada del PRE es tipo y no resta si no acorta el empuje.',
    anchors: {
      '9-10': 'Grupa larga y potente, inclinación moderada, ángulos posteriores que permiten meter el posterior bajo la masa y empujar.',
      '7-8': 'Correcta con leve exceso de inclinación o menor longitud.',
      '5-6': 'Grupa corta o muy derribada, o posterior que queda detrás de la vertical, limitando el empuje.',
      '0-4': 'Grupa desequilibrada o asimétrica.',
    },
  },
  {
    key: 'aplomos', name: 'Aplomos y extremidades', area: 'CONFORMACION', material: ['LATERAL_IZQUIERDO', 'LATERAL_DERECHO', 'FRONTAL', 'TRASERA'],
    observe: 'Aplomos anteriores y posteriores, articulaciones, cuartillas y cascos. Correcciones que afecten a la durabilidad del caballo de deporte.',
    anchors: {
      '9-10': 'Aplomos correctos en las cuatro vistas, articulaciones secas y amplias, cuartillas de longitud y ángulo correctos.',
      '7-8': 'Desviación leve sin repercusión funcional aparente.',
      '5-6': 'Desviación visible (izquierdo, cerrado, corvejón acodado o recto) o cuartillas muy cortas o largas.',
      '0-4': 'Defecto de aplomos marcado.',
    },
  },
  {
    key: 'paso', name: 'Paso', area: 'MOVIMIENTO', material: ['VIDEO'],
    observe: 'Cuatro tiempos puros, amplitud, sobrepaso, actividad y soltura. Sin montar: a la mano o en libertad.',
    anchors: {
      '9-10': 'Cuatro tiempos puros, sobrepaso amplio (varios cascos), soltura y movimiento de todo el cuerpo.',
      '7-8': 'Regular con buen sobrepaso.',
      '5-6': 'Regular pero corto o con poca soltura; poco sobrepaso.',
      '0-4': 'Tendencia a lateral (amblado) o irregular.',
    },
  },
  {
    key: 'trote', name: 'Trote', area: 'MOVIMIENTO', material: ['VIDEO'],
    observe: 'Ritmo y cadencia, alcance del anterior desde el hombro, empuje y flexión del posterior, dorso elástico que oscila, fase de suspensión y equilibrio cuesta arriba. Comparar siempre con el estándar centroeuropeo.',
    anchors: {
      '9-10': 'Alcance desde el hombro, posterior que empuja y pisa muy por delante, dorso que oscila, suspensión clara, cuesta arriba. Nivel de élite del caballo de deporte.',
      '7-8': 'Regular, buen alcance y empuje, suspensión visible; elasticidad o amplitud mejorables.',
      '5-6': 'Movimiento sobre todo de rodilla, con poco alcance desde el hombro, poco empuje del posterior o poca suspensión.',
      '0-4': 'Irregular, plano o sin impulsión.',
    },
  },
  {
    key: 'galope', name: 'Galope', area: 'MOVIMIENTO', material: ['VIDEO'],
    observe: 'Tres tiempos claros, salto y amplitud, posterior que entra bajo la masa, equilibrio cuesta arriba y rectitud.',
    anchors: {
      '9-10': 'Tres tiempos claros, gran salto cuesta arriba, amplitud y posterior muy activo.',
      '7-8': 'Tres tiempos claros y equilibrados, algo de peso en el anterior.',
      '5-6': 'Corto, plano o con poco salto; tendencia a cuatro tiempos.',
      '0-4': 'Galope a cuatro tiempos o desunido.',
    },
  },
  {
    key: 'reunion_giros', name: 'Equilibrio y capacidad de reunión', area: 'FUNCIONALIDAD', material: ['VIDEO'],
    observe: 'Transiciones, capacidad de cargar el posterior y bajar la grupa, equilibrio en giros. Sin montar: equilibrio natural en giros y cambios de aire en libertad.',
    anchors: {
      '9-10': 'Transiciones fluidas, reunión con descenso real de la grupa sin perder amplitud ni ritmo.',
      '7-8': 'Equilibrio correcto para su edad con transiciones limpias.',
      '5-6': 'Se apoya en el anterior o pierde el equilibrio en transiciones o giros.',
      '0-4': 'No demuestra capacidad de reunión.',
    },
  },
  {
    key: 'comportamiento_montable', name: 'Aptitud para ser montado', area: 'DOMA', material: ['VIDEO'], ridden: true,
    observe: 'Contacto, aceptación de ayudas, voluntad y permeabilidad. Solo conducta observable; nunca se infiere temperamento.',
    anchors: {
      '9-10': 'Contacto estable, responde a ayudas mínimas, trabaja con voluntad y se deja estirar.',
      '7-8': 'Buena disposición con resistencias puntuales.',
      '5-6': 'Tensión o resistencias repetidas.',
      '0-4': 'Defensas que impiden el trabajo.',
    },
  },
];

// Rueda de edad por etapa (interpretación C-IBERICO inspirada en las pruebas de caballos jóvenes; no atribuida a la FEI)
const AGE_WHEEL = {
  POTRO: 'Potro de 6 a 11 meses, a la mano o en libertad. Proporciones, aplomos y calidad natural de los aires frente al estándar de potros de deporte centroeuropeos. La conformación cambia mucho: nota orientativa, nivel máximo II.',
  ANOJO: 'Añojo en libertad o a la mano. Aires naturales, alcance y equilibrio. Nivel máximo II.',
  DOS_ANOS: 'Dos años en libertad o a la cuerda. Elasticidad, empuje del posterior y equilibrio en giros. Nivel máximo III.',
  TRES_ANOS: 'Tres aires regulares, ritmo y tacto bajo el jinete; se valora sobre todo la calidad natural de los aires. Nivel máximo III.',
  CUATRO_ANOS: 'Impulsión naciente y transiciones básicas. Nivel máximo IV.',
  CINCO_ANOS: 'Alargamientos, contragalope corto, reunión incipiente. Nivel máximo IV.',
  SEIS_MAS: 'Reunión real y exigencia completa de doma clásica según el nivel presentado.',
};

// Pesos EXPERIMENTALES: el movimiento pesa claramente más que la conformación (conformación 20 %, aires 45 %, equilibrio 15 %, aptitud 20 %).
// En etapas sin montar, la aptitud no se evalúa y el resto se reparte proporcionalmente.
const WEIGHTS = {
  cabeza_cuello: 5, tronco_dorso: 5, grupa: 5, aplomos: 5,
  paso: 12, trote: 19, galope: 14, reunion_giros: 15, comportamiento_montable: 20,
};

const RULES = [
  STANDARD,
  'La conformación se juzga por su función en el caballo de deporte. Los rasgos de tipo PRE o PSL (perfil de la cabeza, grupa redondeada, crin) no restan si no limitan el movimiento.',
  'La IA propone; el evaluador humano resuelve. Ninguna nota es oficial sin decisión humana.',
  'Un material deficiente nunca se convierte automáticamente en una puntuación baja: se marca como "requiere material" o "no evaluable".',
  'Cada propuesta cita su evidencia (vista fotográfica o minuto del vídeo) y declara confianza: alta, media, baja o abstención.',
  'La IA no determina identidad, genealogía, pureza, temperamento, seguridad, estado de salud, valor reproductivo ni rendimiento futuro.',
  'La IA no sugiere cruces. La orientación de cría la emite, en su caso, el evaluador humano.',
  'Las estrellas y los niveles nunca se deciden desde la IA: el nivel sale de las notas confirmadas por el evaluador y los méritos deportivos los reconoce la presidencia.',
  'En potros y caballos sin montar la nota es orientativa: calibra con la etapa y no penalices lo que la edad no permite ver.',
  'Sé exigente y usa toda la escala: no concentres las notas entre 6 y 7 por prudencia.',
];

const { DEFAULT_STAGES, DEFAULT_LEVELS } = require('./levels');

const DEFAULT_RUBRIC = {
  version: '2.2.0',
  status: 'EXPERIMENTAL',
  content: {
    standard: STANDARD,
    areas: AREAS, criteria: CRITERIA, ageWheel: AGE_WHEEL, weights: WEIGHTS, rules: RULES,
    stages: DEFAULT_STAGES, levels: DEFAULT_LEVELS,
    scale: '0-10, anclada al estándar de movimiento del caballo de deporte centroeuropeo',
  },
  notes: 'Criterio de la casa: caballo ibérico con la vara de movimiento centroeuropea, conformación funcional respetando el tipo. El movimiento pesa el 80 %. Pesos y umbrales pendientes de validación.',
};

module.exports = { DEFAULT_RUBRIC, CRITERIA, AREAS };
