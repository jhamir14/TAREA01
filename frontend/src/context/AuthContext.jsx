import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || null)

  const api = axios.create({ baseURL: 'http://localhost:5000' })
  api.interceptors.request.use((config) => {
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [token])

  async function login(username, password) {
    const { data } = await api.post('/api/auth/login', { username, password })
    setToken(data.access_token)
    setUser(data.user)
  }

  async function register(username, email, password) {
    await api.post('/api/auth/register', { username, email, password })
    return login(username, password)
  }

  async function logout() {
    try { await api.post('/api/auth/logout') } catch {}
    setToken(null)
    setUser(null)
  }

  const value = { user, token, login, register, logout, api }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}