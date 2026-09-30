import { useEffect, useState } from 'react'
import { api } from '../api.jsx'
import { EXAMPLE_HORSES } from './examples.js'

// Carga el registro completo. Si aún no hay ningún ejemplar publicado (o la API no responde),
// devuelve los ejemplos ilustrativos, siempre marcados como tales.
export function useRegistry() {
  const [state, set] = useState({ horses: [], isExample: false, loading: true })
  useEffect(() => {
    let alive = true
    api('/registry?sort=score')
      .then((horses) => alive && set(horses.length ? { horses, isExample: false, loading: false } : { horses: EXAMPLE_HORSES, isExample: true, loading: false }))
      .catch(() => alive && set({ horses: EXAMPLE_HORSES, isExample: true, loading: false }))
    return () => { alive = false }
  }, [])
  return state
}

const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function filterHorses(horses, { q = '', breed = '', sort = 'score' }) {
  const n = norm(q.trim())
  const sorters = {
    score: (a, b) => (b.score ?? -1) - (a.score ?? -1),
    level: (a, b) => (b.level || 0) - (a.level || 0) || (b.score ?? -1) - (a.score ?? -1),
    stars: (a, b) => b.stars - a.stars || (b.score ?? -1) - (a.score ?? -1),
    name: (a, b) => a.name.localeCompare(b.name),
    age: (a, b) => a.age - b.age,
  }
  return horses
    .filter((h) => !breed || h.breed === breed)
    .filter((h) => !n || [h.name, h.registrationNumber, h.sireName, h.damName, h.breederName].some((f) => norm(f).includes(n)))
    .sort(sorters[sort] || sorters.score)
}
