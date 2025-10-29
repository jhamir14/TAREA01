import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'

export default function Products() {
  const { api, user } = useAuth()
  const { addToCart } = useCart()
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')

  // Construye URL absoluta para imágenes servidas por el backend
  function buildImageSrc(url) {
    if (!url) return ''
    if (/^https?:\/\//i.test(url)) return url
    const base = api?.defaults?.baseURL || ''
    return `${base}${url}`
  }

  async function load() {
    try {
      const { data } = await api.get('/api/products/')
      setProducts(data)
    } catch (err) {
      setError('No se pudo cargar productos')
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Productos</h2>
        {products.length > 0 && (
          <span className="text-sm text-gray-400">{products.length} ítems disponibles</span>
        )}
      </div>
      {error && <div className="mb-3 text-red-600 bg-red-950/40 border border-red-800 rounded-md px-3 py-2">{error}</div>}
      {products.length === 0 ? (
        <div className="text-gray-300 bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-center">No hay productos. Crea uno desde <span className="text-indigo-400">Admin</span>.</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
          {products.map(p => (
            <div key={p.id} className="bg-slate-800 border border-slate-700 rounded-lg shadow-sm p-4 transition hover:shadow-md hover:border-indigo-700">
              {p.image_url && <img src={buildImageSrc(p.image_url)} alt={p.name} className="w-full h-44 object-cover rounded-md mb-3 ring-1 ring-slate-700" />}
              <h3 className="font-semibold text-lg text-gray-100">{p.name}</h3>
              {p.description && <p className="text-sm text-gray-300 line-clamp-3">{p.description}</p>}
              <div className="mt-3 flex items-center justify-between">
                <strong className="text-indigo-300">${p.price?.toFixed?.(2) ?? p.price}</strong>
                {user && <button onClick={() => addToCart(p.id, 1)} className="inline-flex items-center justify-center rounded-md px-3 py-2 font-medium transition-colors bg-brand-600 text-white hover:bg-brand-700">Agregar</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}