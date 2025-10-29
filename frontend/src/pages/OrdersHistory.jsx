import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotify } from '../context/NotifyContext.jsx'

export default function OrdersHistory() {
  const { api, user } = useAuth()
  const { notify } = useNotify()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true)
        const { data } = await api.get('/api/orders/history')
        setOrders(data)
      } catch (err) {
        const msg = err?.response?.data?.message || 'Error al cargar historial'
        notify(msg, 'error')
      } finally {
        setLoading(false)
      }
    }
    if (user) {
      loadOrders()
    }
  }, [user, api, notify])

  // Formato consistente usado en Admin: "28 oct 2025, 17:52" sin punto en el mes
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      const str = date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      return str.replace(/\./g, '')
    } catch {
      return dateString
    }
  }

  const getOrderTypeDisplay = (order) => {
    if (order.order_type === 'mesa') {
      return `Mesa ${order.table_number || 'N/A'}`
    } else if (order.order_type === 'delivery') {
      return `Delivery - ${order.delivery_address || 'Sin dirección'}`
    }
    return order.order_type
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto mt-10">
        <h2 className="text-2xl font-bold mb-6">Historial de Pedidos</h2>
        <div className="text-center text-gray-400">Cargando historial...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6">Historial de Pedidos</h2>
      {orders.length === 0 ? (
        <div className="text-center text-gray-400">
          <p>No hay pedidos pagados.</p>
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-xl shadow-sm divide-y">
          {orders.map(order => (
            <div key={order.id} className="py-3 px-4">
              <ul className="list-disc ml-6 text-sm text-gray-700">
                <li>
                  Pedido #{order.id} — Total: ${order.total.toFixed(2)} — {formatDate(order.created_at)}
                  {order.order_type && (
                    <span className="ml-2 inline-flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">{order.order_type}</span>
                      {order.order_type === 'mesa' && order.table_number && (
                        <span className="text-gray-600">Mesa {order.table_number}</span>
                      )}
                      {order.order_type === 'delivery' && (
                        <span className="text-gray-600">{order.delivery_address}{order.delivery_phone ? ` · ${order.delivery_phone}` : ''}</span>
                      )}
                    </span>
                  )}
                </li>
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}