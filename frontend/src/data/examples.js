// EJEMPLOS ILUSTRATIVOS (no son ejemplares ni resultados reales).
// Se muestran, siempre marcados como ejemplo, solo mientras el Registro no tenga ejemplares publicados.
// Para quitarlos del todo: deja estos arrays vacíos.

export const EXAMPLE_HORSES = [
  { slug: 'jerusalem', level: 5, name: 'Jerusalem', registrationNumber: 'EJ-15986', breed: 'PRE_PSL', birthDate: '2019-03-15', coat: 'Torda', country: 'España', stars: 24, amberStars: 3, score: 91.2, photo: '/images/ejemplo-doma.jpg' },
  { slug: 'escarmiento-real', level: 4, name: 'Escarmiento Real', registrationNumber: 'EJ-15330', breed: 'PRE_PSL', birthDate: '2013-02-28', coat: 'Torda oscura', country: 'España', stars: 12, amberStars: 1, score: 86.7, photo: '/images/ejemplo-doma.jpg' },
  { slug: 'alcazar-del-puerto', level: 4, name: 'Alcázar del Puerto', registrationNumber: 'EJ-16104', breed: 'PRE', birthDate: '2020-04-22', coat: 'Torda', country: 'España', stars: 6, amberStars: 0, score: 84.5, photo: '/images/pre.jpg' },
  { slug: 'escarmiento-xii', level: 4, name: 'Escarmiento XII', registrationNumber: 'EJ-15201', breed: 'PSL', birthDate: '2006-04-12', coat: 'Castaña', country: 'Portugal', stars: 12, amberStars: 2, score: 82.4, photo: '/images/psl.jpg' },
  { slug: 'veleta-do-tejo', level: 4, name: 'Veleta do Tejo', registrationNumber: 'EJ-15331', breed: 'PSL', birthDate: '2014-04-08', coat: 'Castaña', country: 'Portugal', stars: 6, amberStars: 1, score: 81.9, photo: null },
  { slug: 'urre-do-tejo', level: 4, name: 'Urre do Tejo', registrationNumber: 'EJ-15410', breed: 'PSL', birthDate: '2012-05-02', coat: 'Castaña', country: 'Portugal', stars: 6, amberStars: 1, score: 80.1, photo: null },
  { slug: 'lusa-warendorf', level: 3, name: 'Lusa Warendorf', registrationNumber: 'EJ-16220', breed: 'PSL', birthDate: '2021-03-10', coat: 'Negra', country: 'Alemania', stars: 3, amberStars: 0, score: 79.8, photo: null },
  { slug: 'veleta-de-oro', level: 3, name: 'Veleta de Oro', registrationNumber: 'EJ-15502', breed: 'PRE', birthDate: '2015-06-01', coat: 'Baya', country: 'España', stars: 6, amberStars: 1, score: 78.6, photo: null },
  { slug: 'tejo-novo', level: 3, name: 'Tejo Novo', registrationNumber: 'EJ-16301', breed: 'PRE_PSL', birthDate: '2022-02-14', coat: 'Torda', country: 'Portugal', stars: 3, amberStars: 0, score: 72.5, photo: null },
].map((h) => ({ ...h, example: true, age: new Date().getFullYear() - Number(h.birthDate.slice(0, 4)) }))

export const EXAMPLE_RESULTS = [
  { competition: 'Bundeschampionat Junge Dressurpferde', horseName: 'Lusa Warendorf', category: 'Caballos jóvenes 5 años', level: 'JOVENES_NACIONAL', position: '1º', score: 8.1, date: '2026-06-06', starsGiven: 3 },
  { competition: 'Campeonato Ibérico de Jóvenes Promesas', horseName: 'Tejo Novo', category: 'Caballos jóvenes 4 años', level: 'JOVENES_NACIONAL', position: '1º', score: 7.9, date: '2026-05-16', starsGiven: 3 },
  { competition: 'Campeonato del Mundo de Doma Clásica', horseName: 'Jerusalem', category: 'Gran Premio Special', level: 'MUNDIAL_OLIMPICO', position: '11º (top 15)', score: 74.8, date: '2025-08-17', starsGiven: 24 },
  { competition: 'Campeonato de España de Doma Clásica', horseName: 'Alcázar del Puerto', category: 'San Jorge', level: 'NACIONAL_ABSOLUTO', position: '1º', score: 69.9, date: '2025-05-31', starsGiven: 6 },
  { competition: 'CDI4* Wellington', horseName: 'Jerusalem', category: 'Intermedia II', level: 'INTERNACIONAL', position: '1º', score: 72.1, date: '2024-02-24', starsGiven: 12 },
  { competition: 'Campeonato Nacional de Portugal', horseName: 'Veleta do Tejo', category: 'Intermedia I', level: 'NACIONAL_ABSOLUTO', position: '1º', score: 68.7, date: '2022-07-09', starsGiven: 6 },
  { competition: 'CDI3* Vejer de la Frontera', horseName: 'Escarmiento Real', category: 'San Jorge', level: 'INTERNACIONAL', position: '1º', score: 71.4, date: '2021-04-10', starsGiven: 12 },
].map((r) => ({ ...r, example: true }))
