import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  return (
    <nav className="p-4 border-b border-slate-700 bg-slate-800 text-gray-100">
      <div className="max-w-6xl mx-auto flex items-center gap-6">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <img
            src="http://localhost:5000/img/cocina_convertida.jpg"
            alt="Mesón del Valle"
            className="h-8 w-8 rounded-full object-cover ring-2 ring-indigo-500 bg-slate-700"
          />
          <span className="text-lg sm:text-xl font-bold text-indigo-400">Mesón del Valle</span>
        </Link>
        {/* Nav links (se eliminó la opción Productos) */}
        {user && <Link to="/cart" className="text-indigo-400 hover:text-indigo-300">Carrito</Link>}
        {user && <Link to="/orders" className="text-indigo-400 hover:text-indigo-300">Pedidos</Link>}
        {user?.is_admin && <Link to="/orders-history" className="text-indigo-400 hover:text-indigo-300">Historial</Link>}
        {user?.is_admin && <Link to="/admin" className="text-indigo-400 hover:text-indigo-300">Admin</Link>}
        <div className="ml-auto flex items-center gap-3">
          {!user ? (
            <>
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Login</Link>
              <Link to="/register" className="inline-flex items-center justify-center rounded-md px-3 py-2 font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700">Registro</Link>
            </>
          ) : (
            <>
              <span className="text-sm opacity-80">Hola, {user.username}</span>
              <button onClick={logout} className="inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700">Salir</button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}