import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { useNotify } from './NotifyContext.jsx'

const CartContext = createContext()

export function CartProvider({ children }) {
  const { api, user } = useAuth()
  const [cart, setCart] = useState({ items: [], total: 0 })
  const { notify } = useNotify()

  async function loadCart() {
    if (!user) return setCart({ items: [], total: 0 })
    const { data } = await api.get('/api/cart/')
    setCart(data)
  }

  useEffect(() => { loadCart() }, [user])

  async function addToCart(product_id, quantity = 1) {
    try {
      await api.post('/api/cart/', { product_id, quantity })
      await loadCart()
      notify('Producto agregado al carrito', 'success')
    } catch (err) {
      const msg = err?.response?.data?.message || 'No se pudo agregar al carrito'
      notify(msg, 'error')
      throw err
    }
  }

  async function updateItem(item_id, quantity) {
    await api.put(`/api/cart/${item_id}`, { quantity })
    await loadCart()
  }

  async function removeItem(item_id) {
    await api.delete(`/api/cart/${item_id}`)
    await loadCart()
  }

  async function checkout(payload = {}) {
    const { data } = await api.post('/api/cart/checkout', payload)
    await loadCart()
    return data
  }

  const value = { cart, loadCart, addToCart, updateItem, removeItem, checkout }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  return useContext(CartContext)
}