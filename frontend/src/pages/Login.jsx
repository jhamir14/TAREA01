import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotify } from '../context/NotifyContext.jsx'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const { notify } = useNotify()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await login(username, password)
      notify('Inicio de sesión exitoso', 'success')
      navigate('/')
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error de login'
      setError(msg)
      notify(msg, 'error')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-slate-800/90 backdrop-blur border border-slate-700 rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-1 text-indigo-400">Login</h2>
        <p className="text-sm text-slate-300 mb-4">Accede para continuar</p>
        {error && <div className="mb-3 text-red-400">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-300">Usuario</label>
            <input className="w-full rounded-md border border-slate-700 bg-slate-900 text-gray-100 placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300">Contraseña</label>
            <input className="w-full rounded-md border border-slate-700 bg-slate-900 text-gray-100 placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700 w-full shadow">Entrar</button>
        </form>
      </div>
    </div>
  )
}