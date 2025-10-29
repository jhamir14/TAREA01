import React, { createContext, useContext, useCallback, useState } from 'react'

const NotifyContext = createContext(null)

export function NotifyProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const notify = useCallback((message, type = 'info', opts = {}) => {
    const id = Math.random().toString(36).slice(2)
    const duration = opts.duration ?? 3500
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => remove(id), duration)
  }, [remove])

  const bgByType = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-indigo-600',
    warning: 'bg-amber-600'
  }
  const ringByType = {
    success: 'ring-emerald-300',
    error: 'ring-red-300',
    info: 'ring-indigo-300',
    warning: 'ring-amber-300'
  }

  return (
    <NotifyContext.Provider value={{ notify }}>
      {children}
      <div className="fixed inset-x-0 top-[64px] z-50">
        <div className="max-w-6xl mx-auto pr-4 space-y-2 flex flex-col items-end">
          {toasts.map(t => (
            <div
              key={t.id}
              onClick={() => remove(t.id)}
              className={`flex items-start gap-3 text-white shadow-lg rounded-md px-4 py-3 ring-1 cursor-pointer transition-transform hover:scale-[1.01] ${ringByType[t.type] || 'ring-indigo-300'} ${bgByType[t.type] || 'bg-indigo-600'}`}
            >
              <span className="font-semibold capitalize">
                {t.type === 'success' ? 'Éxito' : t.type === 'error' ? 'Error' : t.type === 'warning' ? 'Aviso' : 'Info'}
              </span>
              <span className="opacity-95">{t.message}</span>
            </div>
          ))}
        </div>
      </div>
    </NotifyContext.Provider>
  )
}

export function useNotify() {
  return useContext(NotifyContext) || { notify: () => {} }
}