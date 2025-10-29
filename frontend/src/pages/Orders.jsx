import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotify } from '../context/NotifyContext.jsx'

export default function Orders() {
  const { api, user } = useAuth()
  const { notify } = useNotify()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true)
        const { data } = await api.get('/api/orders/')
        setOrders(data)
      } catch (err) {
        const msg = err?.response?.data?.message || 'Error al cargar pedidos'
        notify(msg, 'error')
      } finally {
        setLoading(false)
      }
    }
    
    if (user) {
      loadOrders()
    }
  }, [user, api, notify])

  const reloadOrders = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/api/orders/')
      setOrders(data)
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al recargar pedidos'
      notify(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (orderId, status) => {
    try {
      setUpdatingId(orderId)
      await api.put(`/api/orders/${orderId}/status`, { status })
      notify('Estado actualizado', 'success')
      await reloadOrders()
    } catch (err) {
      const msg = err?.response?.data?.error || 'No se pudo actualizar el estado'
      notify(msg, 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
        <h2 className="text-2xl font-bold mb-6">Pedidos</h2>
        <div className="text-center text-gray-400">Cargando pedidos...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6">Pedidos</h2>
      
      {orders.length === 0 ? (
        <div className="text-center text-gray-400">
          <p>No hay pedidos para mostrar.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {orders.map(order => (
            <div key={order.id} className="bg-slate-800 border border-slate-700 rounded-lg shadow-sm p-6">
              {/* Header del pedido */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-indigo-400">
                    Pedido #{order.id}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">
                    ${order.total.toFixed(2)}
                  </p>
                  {/* Estado actual */}
                  <div className="mt-2 inline-block px-2 py-1 text-xs rounded bg-slate-700 text-gray-200">
                    Estado: {order.status || 'pendiente'}
                  </div>
                </div>
              </div>

              {/* Información del cliente (solo para admins) */}
              {user?.is_admin && (
                <div className="mb-3 p-3 bg-slate-700 rounded-md">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">Cliente:</span> {order.user_name}
                  </p>
                </div>
              )}

              {/* Tipo de pedido */}
              <div className="mb-4">
                <p className="text-sm text-gray-300">
                  <span className="font-medium">Tipo:</span> {getOrderTypeDisplay(order)}
                </p>
                {order.order_type === 'delivery' && order.delivery_phone && (
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">Teléfono:</span> {order.delivery_phone}
                  </p>
                )}
              </div>

              {/* Menú del pedido */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-200 border-b border-slate-600 pb-1">
                  Menú
                </h4>
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex-1">
                      <span className="text-gray-100">{item.product_name}</span>
                      <span className="text-gray-400 ml-2">x{item.quantity}</span>
                    </div>
                    <span className="text-gray-300">
                      ${item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Método de pago si existe */}
              {order.payment_method && (
                <div className="mt-4 pt-3 border-t border-slate-600">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">Pago:</span> {order.payment_method}
                  </p>
                </div>
              )}

              {/* Acciones de estado (solo admin) */}
              {user?.is_admin && (
                <div className="mt-4 pt-3 border-t border-slate-600">
                  <p className="text-sm text-gray-300 mb-2 font-medium">Cambiar estado</p>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      disabled={updatingId === order.id}
                      onClick={() => updateStatus(order.id, 'pendiente')}
                      className="px-3 py-1 text-sm rounded bg-slate-700 hover:bg-slate-600 text-gray-100 disabled:opacity-50"
                    >Pendiente</button>
                    <button
                      disabled={updatingId === order.id}
                      onClick={() => updateStatus(order.id, 'entregado')}
                      className="px-3 py-1 text-sm rounded bg-blue-700 hover:bg-blue-600 text-white disabled:opacity-50"
                    >Entregado</button>
                    <button
                      disabled={updatingId === order.id}
                      onClick={() => updateStatus(order.id, 'pagado')}
                      className="px-3 py-1 text-sm rounded bg-green-700 hover:bg-green-600 text-white disabled:opacity-50"
                    >Pagado</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}