import React, { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext.jsx'
import { useNotify } from '../context/NotifyContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Cart() {
  const { cart, updateItem, removeItem, checkout } = useCart()
  const { notify } = useNotify()
  const { api, user: currentUser } = useAuth()
  const [orderType, setOrderType] = useState('mesa')
  const [tableNumber, setTableNumber] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryPhone, setDeliveryPhone] = useState('')
  const [clients, setClients] = useState([])
  const [clientId, setClientId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')

  useEffect(() => {
    async function loadClients() {
      try {
        if (currentUser?.is_admin) {
          const { data } = await api.get('/api/admin/users')
          setClients(data.filter(u => !u.is_admin))
        } else {
          setClients([])
        }
      } catch (err) {
        // No bloquear el carrito por error de carga de clientes
      }
    }
    loadClients()
  }, [currentUser])

  return (
    <div className="max-w-xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Carrito</h2>
      {cart.items.length === 0 && <p className="text-gray-600">Tu carrito está vacío.</p>}
      {cart.items.map(i => (
        <div key={i.id} className="bg-slate-800 border border-slate-700 rounded-lg shadow-sm p-4 flex items-center gap-4">
          <div className="flex-1">
            <strong className="text-gray-100">{i.product.name}</strong> — <span className="text-gray-300">${i.product.price}</span>
          </div>
          <div>
            <input
              type="number"
              min="1"
              value={i.quantity}
              onChange={e => updateItem(i.id, parseInt(e.target.value || '1'))}
              className="w-20 border border-slate-700 bg-slate-900 text-gray-100 rounded px-2 py-1"
            />
          </div>
          <div className="text-gray-300">Subtotal: ${i.subtotal.toFixed(2)}</div>
          <button onClick={() => removeItem(i.id)} className="inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition-colors bg-red-600 text-white hover:bg-red-700">Eliminar</button>
        </div>
      ))}
      {cart.items.length > 0 && (
        <div className="mt-4">
          <strong className="text-lg">Total: ${cart.total.toFixed(2)}</strong>
          <div className="mt-4 space-y-3">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-6 mb-3">
                <label className="flex items-center gap-2 text-gray-100">
                  <input type="radio" name="orderType" value="mesa" checked={orderType === 'mesa'} onChange={() => setOrderType('mesa')} />
                  Pedido en mesa
                </label>
                <label className="flex items-center gap-2 text-gray-100">
                  <input type="radio" name="orderType" value="delivery" checked={orderType === 'delivery'} onChange={() => setOrderType('delivery')} />
                  Delivery
                </label>
              </div>
              {orderType === 'mesa' ? (
                <div className="flex items-center gap-3">
                  <input
                    className="w-36 border border-slate-700 bg-slate-900 text-gray-100 rounded px-3 py-2"
                    placeholder="N° de mesa"
                    type="number"
                    min="1"
                    value={tableNumber}
                    onChange={e => setTableNumber(e.target.value)}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    className="border border-slate-700 bg-slate-900 text-gray-100 rounded px-3 py-2"
                    placeholder="Dirección de entrega"
                    type="text"
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                  />
                  <input
                    className="border border-slate-700 bg-slate-900 text-gray-100 rounded px-3 py-2"
                    placeholder="Teléfono"
                    type="tel"
                    value={deliveryPhone}
                    onChange={e => setDeliveryPhone(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="mb-3">
              {currentUser?.is_admin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <label className="text-gray-300">Cliente</label>
                  <select
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                    className="w-full border border-slate-700 bg-slate-900 text-gray-100 rounded px-3 py-2"
                  >
                    <option value="">Seleccione cliente</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{(c.first_name || '')} {(c.last_name || '')}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {/* Método de pago */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center mb-3">
              <label className="text-gray-300">Método de pago</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full border border-slate-700 bg-slate-900 text-gray-100 rounded px-3 py-2"
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="yape">Yape</option>
                <option value="plin">Plin</option>
              </select>
            </div>
            <button
              onClick={async () => {
                const basePayload = orderType === 'mesa'
                  ? { order_type: 'mesa', table_number: tableNumber }
                  : { order_type: 'delivery', delivery_address: deliveryAddress, delivery_phone: deliveryPhone }
                const payload = (currentUser?.is_admin && clientId)
                  ? { ...basePayload, user_id: Number(clientId), payment_method: paymentMethod }
                  : { ...basePayload, payment_method: paymentMethod }
                try {
                  const res = await checkout(payload)
                  notify(`Pedido #${res.order_id} creado — ${res.order_type}`, 'success')
                  // Reiniciar estados del formulario y selector de cliente
                  setOrderType('mesa')
                  setTableNumber('')
                  setDeliveryAddress('')
                  setDeliveryPhone('')
                  setClientId('')
                  setPaymentMethod('efectivo')
                } catch (err) {
                  const msg = err?.response?.data?.message || 'No se pudo finalizar el pedido'
                  notify(msg, 'error')
                }
              }}
              className="inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition-colors bg-brand-600 text-white hover:bg-brand-700"
            >
              Finalizar pedido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}