import { create } from 'zustand'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('cib_user') || 'null'),
  token: localStorage.getItem('cib_token') || null,
  isAuth: !!localStorage.getItem('cib_token'),

  login: (token, user) => {
    localStorage.setItem('cib_token', token)
    localStorage.setItem('cib_user', JSON.stringify(user))
    set({ token, user, isAuth: true })
  },
  logout: () => {
    localStorage.removeItem('cib_token')
    localStorage.removeItem('cib_user')
    set({ token: null, user: null, isAuth: false })
  }
}))

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
