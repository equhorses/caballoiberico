// Rúbrica C-IBERICO v2.0 (fusión v1 + especificación de gobernanza).
// Estado EXPERIMENTAL: los pesos y umbrales NO son definitivos hasta validarlos
// con evaluadores humanos. Se edita desde el panel del evaluador (se guarda versionada).

const AREAS = {
  CONFORMACION: 'Conformación y morfología',
  MOVIMIENTO: 'Movimiento y biomecánica observable',
  FUNCIONALIDAD: 'Funcionalidad y capacidad atlética',
  DOMA: 'Doma clásica demostrada',
};

const CRITERIA = [
  {
    key: 'cabeza_cuello', name: 'Cabeza y cuello', area: 'CONFORMACION', material: ['LATERAL_IZQUIERDO', 'LATERAL_DERECHO', 'FRONTAL'],
    observe: 'Inserción cabeza-cuello, longitud y arco del cuello, salida del cuello desde la cruz, ganachas libres.',
    anchors: {
      '9-10': 'Cuello largo, bien insertado y arqueado, salida alta; nuca libre que facilita la flexión.',
      '7-8': 'Buena inserción y longitud; algún detalle menor (ganacha algo cargada, salida algo baja).',
      '5-6': 'Cuello corto o grueso, o inserción baja que limitará la flexión en la reunión.',
      '0-4': 'Defecto marcado (cuello invertido, cuello caído) que condiciona el trabajo.',
    },
  },
  {
    key: 'tronco_dorso', name: 'Tronco y dorso', area: 'CONFORMACION', material: ['LATERAL_IZQUIERDO', 'LATERAL_DERECHO', 'SUPERIOR'],
    observe: 'Cruz, línea dorsal, unión lumbar, profundidad del tórax, proporciones tronco/extremidades.',
    anchors: {
      '9-10': 'Cruz marcada, dorso firme de longitud media, riñón corto y bien unido.',
      '7-8': 'Línea dorsal correcta con algún desequilibrio leve.',
      '5-6': 'Dorso largo o blando, o unión lumbar débil.',
      '0-4': 'Ensillado o desproporción marcada.',
    },
  },
  {
    key: 'grupa', name: 'Grupa', area: 'CONFORMACION', material: ['LATERAL_IZQUIERDO', 'LATERAL_DERECHO', 'TRASERA', 'SUPERIOR'],
    observe: 'Longitud e inclinación de la grupa, musculatura, simetría vista desde atrás.',
    anchors: {
      '9-10': 'Grupa larga, inclinación moderada, musculada y simétrica.',
      '7-8': 'Correcta con leve exceso de inclinación o menor longitud.',
      '5-6': 'Grupa corta o muy derribada que limita el empuje.',
      '0-4': 'Grupa desequilibrada o asimétrica.',
    },
  },
  {
    key: 'aplomos', name: 'Aplomos y extremidades', area: 'CONFORMACION', material: ['LATERAL_IZQUIERDO', 'LATERAL_DERECHO', 'FRONTAL', 'TRASERA'],
    observe: 'Aplomos anteriores y posteriores, articulaciones, cuartillas, cascos.',
    anchors: {
      '9-10': 'Aplomos correctos en las cuatro vistas, articulaciones secas y amplias.',
      '7-8': 'Desviación leve sin repercusión funcional aparente.',
      '5-6': 'Desviación visible (izquierdo, cerrado, corvejón acodado).',
      '0-4': 'Defecto de aplomos marcado.',
    },
  },
  {
    key: 'paso', name: 'Paso', area: 'MOVIMIENTO', material: ['VIDEO'],
    observe: 'Regularidad a cuatro tiempos, amplitud, sobrepaso, actividad y relajación.',
    anchors: {
      '9-10': 'Cuatro tiempos puros, gran sobrepaso, relajado y activo.',
      '7-8': 'Regular con amplitud correcta.',
      '5-6': 'Amplitud escasa o tensión puntual.',
      '0-4': 'Paso irregular o amblado.',
    },
  },
  {
    key: 'trote', name: 'Trote', area: 'MOVIMIENTO', material: ['VIDEO'],
    observe: 'Ritmo, cadencia, impulsión desde el posterior, elasticidad del dorso, fase de suspensión.',
    anchors: {
      '9-10': 'Ritmo constante, suspensión clara, empuje del posterior y dorso elástico.',
      '7-8': 'Regular con impulsión correcta; elasticidad mejorable.',
      '5-6': 'Movimiento de brazo sin empuje posterior, o poca suspensión.',
      '0-4': 'Irregular o sin impulsión.',
    },
  },
  {
    key: 'galope', name: 'Galope', area: 'MOVIMIENTO', material: ['VIDEO'],
    observe: 'Tres tiempos claros, salto hacia arriba, equilibrio, rectitud.',
    anchors: {
      '9-10': 'Tres tiempos claros, cuesta arriba, equilibrado y recto.',
      '7-8': 'Correcto con algo de peso en el anterior.',
      '5-6': 'Plano o con tendencia a cuatro tiempos.',
      '0-4': 'Galope a cuatro tiempos o desunido.',
    },
  },
  {
    key: 'reunion_giros', name: 'Reunión y giros', area: 'FUNCIONALIDAD', material: ['VIDEO'],
    observe: 'Transiciones, capacidad de bajar la grupa, equilibrio en giros sobre el posterior.',
    anchors: {
      '9-10': 'Transiciones fluidas, reunión con descenso real de la grupa.',
      '7-8': 'Equilibrio correcto para su edad con transiciones limpias.',
      '5-6': 'Pierde el equilibrio en transiciones o giros.',
      '0-4': 'No demuestra capacidad de reunión.',
    },
  },
  {
    key: 'comportamiento_montable', name: 'Comportamiento montable observable', area: 'DOMA', material: ['VIDEO'],
    observe: 'Contacto, aceptación de ayudas, voluntad, permeabilidad. Solo conducta observable; nunca se infiere temperamento.',
    anchors: {
      '9-10': 'Contacto estable, responde a ayudas mínimas, trabajo con voluntad.',
      '7-8': 'Buena disposición con resistencias puntuales.',
      '5-6': 'Tensión o resistencias repetidas.',
      '0-4': 'Defensas que impiden el trabajo.',
    },
  },
];

// Rueda de edad (interpretación C-IBERICO, inspirada en pruebas de caballos jóvenes; no atribuida a la FEI)
const AGE_WHEEL = {
  3: 'Tres aires regulares, ritmo y tacto. No se exige más.',
  4: 'Impulsión naciente y transiciones básicas al galope.',
  5: 'Alargamientos, contragalope corto, reunión incipiente.',
  6: 'Reunión real, espalda adentro, cambios simples.',
  7: 'Exigencia completa de doma clásica según el nivel presentado.',
};

// Pesos EXPERIMENTALES (configurables, no públicos hasta validación)
const WEIGHTS = {
  cabeza_cuello: 6.25, tronco_dorso: 6.25, grupa: 6.25, aplomos: 6.25,
  paso: 12, trote: 16, galope: 12, reunion_giros: 15, comportamiento_montable: 20,
};

const RULES = [
  'La IA propone; el evaluador humano resuelve. Ninguna nota es oficial sin decisión humana.',
  'Un material deficiente nunca se convierte automáticamente en una puntuación baja: se marca como "requiere material" o "no evaluable".',
  'Cada propuesta cita su evidencia (vista fotográfica o minuto del vídeo) y declara confianza: alta, media, baja o abstención.',
  'La IA no determina identidad, genealogía, pureza, temperamento, seguridad, estado de salud, valor reproductivo ni rendimiento futuro.',
  'La IA no sugiere cruces. La orientación de cría la emite, en su caso, el evaluador humano.',
  'Las estrellas nunca se calculan desde la IA: proceden de méritos deportivos acreditados con documentación oficial.',
  'Cada propuesta queda ligada a la versión de rúbrica utilizada.',
];

const DEFAULT_RUBRIC = {
  version: '2.0.0',
  status: 'EXPERIMENTAL',
  content: { areas: AREAS, criteria: CRITERIA, ageWheel: AGE_WHEEL, weights: WEIGHTS, rules: RULES, scale: '0-10 (escala de las pruebas de aptitud centroeuropeas)' },
  notes: 'Versión inicial experimental. Pesos y umbrales pendientes de validación con evaluadores.',
};

module.exports = { DEFAULT_RUBRIC, CRITERIA, AREAS };
