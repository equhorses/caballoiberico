// Rúbrica C-IBERICO v2.3 (con textos de referencia: FEI, estudbooks centroeuropeos, PRE y PSL)
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
    observe: 'Aplomos anteriores y posteriores, articulaciones, cuartillas y cascos. Correcciones que afecten a la durabilidad del caballo de deporte. Un ángulo de corvejón ligeramente cerrado es propio del PRE y no resta si el posterior empuja bien.',
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
      '9-10': 'Cuatro tiempos puros y regulares, el posterior pisa claramente por delante de la huella del anterior (más de dos cascos), hombros libres, relajación y movimiento de todo el cuerpo.',
      '7-8': 'Regular, activo, con buen sobrepaso (uno o dos cascos).',
      '5-6': 'Regular pero corto o con poca soltura; los cuatro tiempos poco marcados limitan la nota a 5.',
      '0-4': 'Irregular (máximo 4), posterior que solo llega a la huella (máximo 4) o no llega (máximo 3), o lateral/amblado (máximo 3).',
    },
  },
  {
    key: 'trote', name: 'Trote', area: 'MOVIMIENTO', material: ['VIDEO'],
    observe: 'Ritmo y cadencia, alcance del anterior desde el hombro, empuje y flexión del posterior, dorso elástico que oscila, fase de suspensión y equilibrio cuesta arriba. Comparar siempre con el estándar centroeuropeo.',
    anchors: {
      '9-10': 'Alcance desde el hombro, posterior que empuja y pisa muy por delante, dorso que oscila, suspensión clara, cuesta arriba. Nivel de élite del caballo de deporte.',
      '7-8': 'Regular, buen alcance y empuje, suspensión visible; elasticidad o amplitud mejorables.',
      '5-6': 'Movimiento sobre todo de rodilla, con poco alcance desde el hombro, poco empuje del posterior o poca suspensión.',
      '0-4': 'Irregular o muy desigual (máximo 4; si parece cojera, abstente y avísalo), plano, sin suspensión o arrastrando el posterior.',
    },
  },
  {
    key: 'galope', name: 'Galope', area: 'MOVIMIENTO', material: ['VIDEO'],
    observe: 'Tres tiempos claros, salto y amplitud, posterior que entra bajo la masa, equilibrio cuesta arriba y rectitud.',
    anchors: {
      '9-10': 'Tres tiempos claros, gran salto cuesta arriba, amplitud y posterior muy activo.',
      '7-8': 'Tres tiempos claros y equilibrados, algo de peso en el anterior.',
      '5-6': 'Corto, plano o con poco salto; tendencia a cuatro tiempos.',
      '0-4': 'Galope a cuatro tiempos, desunido o con rupturas de aire (menos de 5).',
    },
  },
  {
    key: 'reunion_giros', name: 'Ejercicios: equilibrio y reunión', area: 'FUNCIONALIDAD', material: ['VIDEO'],
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

// TEXTOS DE REFERENCIA (resumen propio, no copia literal). La IA los usa para leer los aires y la conformación.
// Fuentes: FEI Dressage Rules 2025 y FEI Dressage Judging Manual 2025; hojas FEI de caballos jóvenes de 5, 6 y 7 años;
// objetivos de cría y puntuación lineal de los studbooks centroeuropeos (Oldenburg, KWPN; escala FN alemana);
// Programa de Cría del PRE (ANCCE, BOE 2020); estándar del PSL (APSL, según fuentes académicas de la Univ. de Évora).
const REFERENCES = {
  aires: [
    'PASO: aire de 4 tiempos sin suspensión. Se valora regularidad, relajación, actividad, terreno cubierto y libertad de hombros. Falta grave: paso lateral o amblado (mano y pie del mismo lado avanzan a la vez).',
    'TROTE: aire de 2 tiempos por bípedos diagonales con momento de suspensión. Se valora ritmo, soltura, elasticidad, dorso que oscila, impulsión desde el posterior, flexión de las articulaciones posteriores, suspensión y terreno cubierto.',
    'GALOPE: aire de 3 tiempos con suspensión. Se valora ritmo, soltura, equilibrio natural, tendencia cuesta arriba, salto, terreno cubierto y flexión del posterior. Faltas: cuatro tiempos, desunido, rupturas.',
    'REUNIÓN: los posteriores entran bajo la masa y cargan peso; trancos más cortos, más altos y activos sin perder impulsión ni ritmo. IMPULSIÓN: energía del posterior transmitida por un dorso flexible. EQUILIBRIO/AUTOPORTE: el caballo se lleva solo, sin apoyarse en la mano. CONTACTO: ligero y constante, cara ligeramente por delante de la vertical; detrás de la vertical, boca abierta o dorso hundido o tenso restan.',
  ],
  caballosJovenes: 'Criterios de las pruebas de caballos jóvenes (5-7 años): TROTE (ritmo, soltura, elasticidad, dorso que oscila, flexión de posteriores; a los 7: impulsión, terreno y capacidad de reunión), PASO (ritmo, relajación, actividad, terreno; libertad de hombros), GALOPE (ritmo, soltura, equilibrio natural, tendencia cuesta arriba, flexión de posteriores), SUMISIÓN (contacto, rectitud, respuesta a las ayudas) y PERSPECTIVA (potencial futuro como caballo de doma). Los fallos de ritmo, soltura, contacto o impulsión se puntúan claramente a la baja.',
  centroeuropeo: 'Objetivo de los studbooks de deporte centroeuropeos para el caballo de doma: modelo rectangular de líneas largas y cuesta arriba; cuello largo, alto y bien unido; cruz alta y larga; espalda inclinada; dorso y riñón fuertes; grupa larga; remos secos y correctos. El movimiento nace elástico y enérgico en el posterior, pasa por un dorso suelto que oscila y llega a un anterior libre desde la espalda: impulso, terreno cubierto, elasticidad, suspensión clara, equilibrio que "carga" (cuesta arriba) y no solo "empuja", y facilidad para alargar y acortar. Se puntúan a la baja el tranco corto, la rigidez, el equilibrio sobre el anterior, el posterior que se arrastra y el movimiento solo de rodilla.',
  escala: 'Escala de notas (FEI / FN): 10 excelente, 9 muy bueno, 8 bueno, 7 bastante bueno, 6 satisfactorio, 5 suficiente, 4 insuficiente, 3 bastante malo, 2 malo, 1 muy malo, 0 no ejecutado.',
  tipoIberico: [
    'PRE (prototipo racial oficial): cabeza proporcionada de perfil subconvexo; cuello de longitud media, musculado, en arco ascendente de la cruz a la nuca; cruz destacada; dorso casi recto; riñón corto, ancho y algo arqueado; grupa redondeada y ligeramente en declive; cola de nacimiento bajo; pecho amplio; espalda larga y oblicua; corvejón fuerte, con ángulo que puede ser ligeramente cerrado; proporciones cercanas al cuadrado. Aires amplios, ágiles, enérgicos, cadenciosos y elásticos, con elevación y extensión; predisposición a la reunión y a los giros sobre el posterior.',
    'PSL (estándar oficial): mediolíneo y subconvexilíneo de formas redondeadas, silueta que cabe en un cuadrado; cabeza de perfil ligeramente subconvexo; cuello de longitud media, arqueado; cruz destacada; dorso casi horizontal; riñón corto y algo convexo; grupa redondeada y ligeramente oblicua; cola que sale de la curva de la grupa. Aires ágiles, elevados, proyectados hacia delante y suaves; tendencia natural a la reunión.',
    'NO RESTAN por ser rasgos de tipo (si no limitan el movimiento): perfil subconvexo, cuello alto y arqueado, grupa redondeada e inclinada, cola baja, riñón corto y arqueado, silueta compacta, crines abundantes, corvejón ligeramente cerrado.',
    'SÍ RESTAN porque limitan el caballo de deporte: espalda recta y corta, riñón débil o largo, defectos de aplomos, paso irregular o corto, amblado, trote sin suspensión, movimiento de rodilla sin alcance desde el hombro ni empuje del posterior.',
  ],
};

const RULES = [
  STANDARD,
  'Usa los textos de referencia (FEI, caballos jóvenes, estándar centroeuropeo y tipo PRE/PSL) para describir y puntuar, pero la nota sigue el criterio C-IBERICO: movimiento con la vara centroeuropea y conformación por su función, respetando el tipo ibérico.',
  'Notas máximas por faltas (FEI): paso con cuatro tiempos poco marcados máx. 5; paso irregular máx. 4; paso lateral o amblado máx. 3; trote muy desigual máx. 4 (si parece cojera, abstente y avísalo en limitaciones); galope desunido, a cuatro tiempos o con rupturas por debajo de 5.',
  'La conformación se juzga por su función en el caballo de deporte. Los rasgos de tipo PRE o PSL (perfil de la cabeza, grupa redondeada, crin) no restan si no limitan el movimiento.',
  'Tu nota es la nota oficial: la secretaría solo comprueba el material y la acepta tal cual. Por eso sé rigurosa, cita evidencia y abstente si el material no permite valorar.',
  'Un material deficiente nunca se convierte automáticamente en una puntuación baja: se marca como "requiere material" o "no evaluable".',
  'Cada propuesta cita su evidencia (vista fotográfica o minuto del vídeo) y declara confianza: alta, media, baja o abstención.',
  'La IA no determina identidad, genealogía, pureza, temperamento, seguridad, estado de salud, valor reproductivo ni rendimiento futuro.',
  'La IA no sugiere cruces ni da orientación de cría.',
  'El nivel sale de tus notas con el tope de cada etapa; tú no decides el nivel ni las estrellas (las estrellas salen de resultados deportivos verificados).',
  'En potros y caballos sin montar la nota es orientativa: calibra con la etapa y no penalices lo que la edad no permite ver.',
  'Sé exigente y usa toda la escala: no concentres las notas entre 6 y 7 por prudencia.',
];

const { DEFAULT_STAGES, DEFAULT_LEVELS } = require('./levels');

const DEFAULT_RUBRIC = {
  version: '2.3.0',
  status: 'EXPERIMENTAL',
  content: {
    standard: STANDARD,
    areas: AREAS, criteria: CRITERIA, ageWheel: AGE_WHEEL, weights: WEIGHTS, rules: RULES, references: REFERENCES,
    stages: DEFAULT_STAGES, levels: DEFAULT_LEVELS,
    scale: '0-10, anclada al estándar de movimiento del caballo de deporte centroeuropeo',
  },
  notes: 'v2.3: añade textos de referencia (FEI doma y caballos jóvenes, estándar centroeuropeo, prototipos PRE y PSL) y notas máximas por faltas. La nota de la IA es la oficial. Pesos y umbrales pendientes de calibración.',
};

module.exports = { DEFAULT_RUBRIC, CRITERIA, AREAS };
