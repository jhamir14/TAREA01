import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function AdminPanel() {
  const { api } = useAuth()
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [menuToday, setMenuToday] = useState([])

  const [form, setForm] = useState({ name: '', description: '', price: '', image_url: '', image_file: null })
  const [editingId, setEditingId] = useState(null)

  async function load() {
    const [p, u, m] = await Promise.all([
      api.get('/api/products/'),
      api.get('/api/admin/users'),
      api.get('/api/menu/today')
    ])
    setProducts(p.data)
    setUsers(u.data)
    setMenuToday(m.data)
  }

  useEffect(() => { load() }, [])

  async function submitProduct(e) {
    e.preventDefault()
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('description', form.description)
      fd.append('price', form.price)
      if (form.image_file) fd.append('image', form.image_file)
      if (editingId) {
        await api.put(`/api/products/${editingId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        const res = await api.post('/api/products/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        const newId = res?.data?.id
        if (newId) {
          try {
            await api.post('/api/menu/add', { product_id: newId })
          } catch (err) {
            // Silenciar el error aquí para no interrumpir el flujo de creación
          }
        }
      }
      setForm({ name: '', description: '', price: '', image_url: '', image_file: null })
      setEditingId(null)
      await load()
    } catch (err) {
      alert(err?.response?.data?.message || 'Error al guardar producto')
    }
  }

  async function editProduct(p) {
    setForm({ name: p.name, description: p.description || '', price: String(p.price), image_url: p.image_url || '' })
    setEditingId(p.id)
  }

  async function deleteProduct(id) {
    if (!confirm('¿Eliminar producto?')) return
    await api.delete(`/api/products/${id}`)
    await load()
  }

  async function addToMenu(productId) {
    try {
      await api.post('/api/menu/add', { product_id: productId })
      await load()
    } catch (err) {
      alert(err?.response?.data?.message || 'Error al añadir al menú')
    }
  }

  async function removeFromMenu(productId) {
    try {
      await api.delete(`/api/menu/remove/${productId}`)
      await load()
    } catch (err) {
      alert(err?.response?.data?.message || 'Error al quitar del menú')
    }
  }

  // Formateo consistente de fecha y hora en español (ej. "28 oct 2025, 17:52")
  function formatOrderDate(dateString) {
    try {
      const d = new Date(dateString)
      // Usamos toLocaleDateString con hora/minuto para mantener el estilo usado en Historial
      const str = d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      // Algunos navegadores añaden punto al mes abreviado ("oct."). Lo removemos para uniformidad.
      return str.replace(/\./g, '')
    } catch {
      return dateString
    }
  }

  const [newUser, setNewUser] = useState({ first_name: '', last_name: '', phone: '', address: '', email: '' })
  const [editingUserId, setEditingUserId] = useState(null)

  async function createUser(e) {
    e.preventDefault()
    try {
      if (editingUserId) {
        await api.put(`/api/admin/users/${editingUserId}`, newUser)
      } else {
        await api.post('/api/admin/users', newUser)
      }
      setNewUser({ first_name: '', last_name: '', phone: '', address: '', email: '' })
      setEditingUserId(null)
      await load()
    } catch (err) {
      alert(err?.response?.data?.message || 'Error al crear cliente')
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <header className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Panel de administración</h2>
        <p className="text-sm text-gray-400 mt-1">Gestiona productos, menú del día y clientes.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Columna izquierda: Crear/Editar producto */}
        <section className="bg-slate-800 border border-slate-700 rounded-xl shadow p-6">
          <h3 className="text-xl font-semibold text-gray-100 mb-4">Crear/Editar producto</h3>
          <form onSubmit={submitProduct} className="grid gap-3">
            <input className="w-full rounded-md border border-slate-700 bg-slate-900 text-gray-100 placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nombre" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <textarea className="w-full rounded-md border border-slate-700 bg-slate-900 text-gray-100 placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Descripción" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <input className="w-full rounded-md border border-slate-700 bg-slate-900 text-gray-100 placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Precio" type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            <input className="w-full rounded-md border border-slate-700 bg-slate-900 text-gray-100 placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" type="file" accept="image/*" onChange={e => setForm({ ...form, image_file: e.target.files?.[0] || null })} />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className={editingId
                  ? "inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
                  : "w-full inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700"}
              >
                {editingId ? 'Guardar cambios' : 'Añadir al menú'}
              </button>
              {editingId && <button type="button" onClick={() => { setForm({ name: '', description: '', price: '', image_url: '', image_file: null }); setEditingId(null) }} className="inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition-colors bg-slate-700 text-gray-100 hover:bg-slate-600">Cancelar</button>}
            </div>
          </form>
        </section>

        {/* Menú del día (en lugar de Productos) */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl shadow p-6">
        <h3 className="text-xl font-semibold text-gray-100 mb-4">Menú del día</h3>
        <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-xl shadow-sm divide-y">
          {menuToday.map(p => (
            <div key={p.id} className="py-3 px-4 flex items-center">
              <div className="flex-1">
                <strong className="text-gray-900">{p.name}</strong>
                <span className="ml-2 text-sm text-gray-600">${p.price}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => editProduct(p)} className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700">Editar</button>
                <button onClick={() => removeFromMenu(p.id)} className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors bg-gray-200 text-gray-900 hover:bg-gray-300">Quitar</button>
              </div>
            </div>
          ))}
          {menuToday.length === 0 && <div className="py-6 px-4 text-gray-600">Aún no has agregado productos al menú de hoy.</div>}
        </div>
      </section>
      </div>

      {/* Segunda fila: Menú del día y Crear usuario */}
      <div className="grid gap-6 md:grid-cols-2 mt-8">
        {/* Clientes registrados (antes Menú del día) */}
        <section className="bg-slate-800 border border-slate-700 rounded-xl shadow p-6">
          <h3 className="text-xl font-semibold text-gray-100 mb-4">Clientes registrados</h3>
          <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-xl shadow-sm divide-y max-h-80 overflow-y-auto">
            {users.filter(u => !u.is_admin).map(c => (
              <div key={c.id} className="py-3 px-4 flex items-center">
                <div className="flex-1">
                  <strong className="text-gray-900">{c.first_name || ''} {c.last_name || ''}</strong>
                  <div className="text-sm text-gray-600">{c.email || ''}</div>
                  <div className="text-sm text-gray-600">{c.phone || ''} {c.address ? ` · ${c.address}` : ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setNewUser({ first_name: c.first_name || '', last_name: c.last_name || '', phone: c.phone || '', address: c.address || '', email: c.email || '' }); setEditingUserId(c.id) }}
                    className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
                  >Editar</button>
                </div>
              </div>
            ))}
            {users.filter(u => !u.is_admin).length === 0 && (
              <div className="py-6 px-4 text-gray-600">No hay clientes registrados.</div>
            )}
          </div>
        </section>

        <section className="bg-slate-800 border border-slate-700 rounded-xl shadow p-6">
          <h3 className="text-xl font-semibold text-gray-100 mb-4">{editingUserId ? 'Editar cliente' : 'Crear cliente'}</h3>
          <form onSubmit={createUser} className="grid gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="w-full rounded-md border border-slate-700 bg-slate-900 text-gray-100 placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nombres" value={newUser.first_name} onChange={e => setNewUser({ ...newUser, first_name: e.target.value })} />
              <input className="w-full rounded-md border border-slate-700 bg-slate-900 text-gray-100 placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Apellidos" value={newUser.last_name} onChange={e => setNewUser({ ...newUser, last_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="w-full rounded-md border border-slate-700 bg-slate-900 text-gray-100 placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Teléfono" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} />
              <input className="w-full rounded-md border border-slate-700 bg-slate-900 text-gray-100 placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Dirección" value={newUser.address} onChange={e => setNewUser({ ...newUser, address: e.target.value })} />
            </div>
            <input className="w-full rounded-md border border-slate-700 bg-slate-900 text-gray-100 placeholder-gray-400 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Email (opcional)" type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
            <div className="flex items-center gap-3">
              <button type="submit" className="inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700">{editingUserId ? 'Guardar cambios' : 'Crear cliente'}</button>
              {editingUserId && (
                <button type="button" onClick={() => { setEditingUserId(null); setNewUser({ first_name: '', last_name: '', phone: '', address: '', email: '' }) }} className="inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition-colors bg-slate-700 text-gray-100 hover:bg-slate-600">Cancelar</button>
              )}
            </div>
          </form>
        </section>
      </div>

      {/* Registrar pedido (admin) */}
      <section className="mt-8 bg-slate-800 border border-slate-700 rounded-xl shadow p-6">
          <h3 className="text-xl font-semibold text-gray-100 mb-4">Registrar pedido</h3>
          <AdminOrderForm users={users.filter(u => !u.is_admin)} menu={menuToday} onCreated={load} />
        </section>

      {/* Clientes y pedidos (debajo del formulario) */}
      <section className="mt-8">
        <h3 className="text-xl font-semibold mb-2">Clientes y pedidos</h3>
        <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-xl shadow-sm divide-y">
          {users.map(u => (
            <div key={u.id} className="py-3 px-4">
              <div className="mb-1">
                <strong className="text-gray-900">{u.first_name || ''} {u.last_name || ''}</strong> {u.email && <span className="text-gray-700"> · {u.email}</span>}
                {u.phone && <span className="text-gray-600"> · {u.phone}</span>}
                {u.address && <span className="text-gray-600"> · {u.address}</span>}
              </div>
              <ul className="list-disc ml-6 text-sm text-gray-700">
                {u.orders.map(o => (
                  <li key={o.id}>
                    Pedido #{o.id} — Total: ${o.total} — {formatOrderDate(o.created_at)}
                    {o.info?.order_type && (
                      <span className="ml-2 inline-flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">{o.info.order_type}</span>
                        {o.info.order_type === 'mesa' && o.info.table_number && (
                          <span className="text-gray-600">Mesa {o.info.table_number}</span>
                        )}
                        {o.info.order_type === 'delivery' && (
                          <span className="text-gray-600">{o.info.delivery_address}{o.info.delivery_phone ? ` · ${o.info.delivery_phone}` : ''}</span>
                        )}
                      </span>
                    )}
                  </li>
                ))}
                {u.orders.length === 0 && <li>Sin pedidos</li>}
              </ul>
            </div>
          ))}
          {users.length === 0 && <div className="py-6 px-4 text-gray-600">Sin clientes</div>}
        </div>
      </section>

      {/* Crear cliente (sección principal ya incluida arriba junto al Menú del día) */}
    </div>
  )
}

function AdminOrderForm({ users, menu, onCreated }) {
  const { api } = useAuth()
  const [clientId, setClientId] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [orderType, setOrderType] = useState('mesa')
  const [tableNumber, setTableNumber] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryPhone, setDeliveryPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')

  async function submit(e) {
    e.preventDefault()
    try {
      const payload = {
        user_id: Number(clientId),
        items: [{ product_id: Number(productId), quantity: Number(quantity) }],
        order_type: orderType,
        table_number: orderType === 'mesa' ? Number(tableNumber) : undefined,
        delivery_address: orderType === 'delivery' ? deliveryAddress : undefined,
        delivery_phone: orderType === 'delivery' ? deliveryPhone : undefined,
        payment_method: paymentMethod,
      }
      await api.post('/api/admin/orders', payload)
      setClientId(''); setProductId(''); setQuantity(1); setOrderType('mesa'); setTableNumber(''); setDeliveryAddress(''); setDeliveryPhone(''); setPaymentMethod('efectivo')
      onCreated && onCreated()
      alert('Pedido registrado')
    } catch (err) {
      alert(err?.response?.data?.message || 'No se pudo registrar el pedido')
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 text-gray-100 px-3 py-2">
          <option value="">Seleccione cliente</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{(u.first_name || '')} {(u.last_name || '')}</option>
          ))}
        </select>
        <select value={productId} onChange={e => setProductId(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-900 text-gray-100 px-3 py-2">
          <option value="">Seleccione producto del menú</option>
          {menu.map(p => (
            <option key={p.id} value={p.id}>{p.name} — ${p.price}</option>
          ))}
        </select>
      </div>
      <input className="w-36 rounded-md border border-slate-700 bg-slate-900 text-gray-100 px-3 py-2" type="number" min="1" placeholder="Cantidad" value={quantity} onChange={e => setQuantity(e.target.value)} />
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-gray-300">
          <input type="radio" checked={orderType === 'mesa'} onChange={() => setOrderType('mesa')} /> Mesa
        </label>
        <label className="flex items-center gap-2 text-gray-300">
          <input type="radio" checked={orderType === 'delivery'} onChange={() => setOrderType('delivery')} /> Delivery
        </label>
      </div>
      {orderType === 'mesa' ? (
        <input className="w-48 rounded-md border border-slate-700 bg-slate-900 text-gray-100 px-3 py-2" placeholder="N° de mesa" type="number" min="1" value={tableNumber} onChange={e => setTableNumber(e.target.value)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className="rounded-md border border-slate-700 bg-slate-900 text-gray-100 px-3 py-2" placeholder="Dirección" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} />
          <input className="rounded-md border border-slate-700 bg-slate-900 text-gray-100 px-3 py-2" placeholder="Teléfono" value={deliveryPhone} onChange={e => setDeliveryPhone(e.target.value)} />
        </div>
      )}
      <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-48 rounded-md border border-slate-700 bg-slate-900 text-gray-100 px-3 py-2">
        <option value="efectivo">Efectivo</option>
        <option value="tarjeta">Tarjeta</option>
        <option value="yape">Yape</option>
        <option value="plin">Plin</option>
      </select>
      <button type="submit" className="inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-700">Registrar pedido</button>
    </form>
  )
}