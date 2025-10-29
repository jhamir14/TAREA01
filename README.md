# Restaurante (Flask + React + SQLAlchemy)

Aplicación web para registro de pedidos de un restaurante, gestión de menú del día y administración de clientes. Backend en Flask y frontend en React (Vite + Tailwind).

## Índice
- Características
- Requisitos
- Estructura del proyecto
- Desarrollo (local)
- Variables de entorno
- Migraciones
- Despliegue en Render
- Rutas principales (API)
- Solución de problemas

## Características
- Gestión de productos y menú del día.
- Registro de pedidos (mesa y delivery) y estados de pago.
- Administración de clientes (no requieren credenciales).
- Autenticación JWT para usuarios del sistema y panel admin.
- CORS configurado para frontend local y dominio de producción.
- Base de datos por defecto en SQLite (archivo `backend/database.db`).

## Requisitos
- Python 3.10+.
- Node.js 18+ y npm.
- Windows PowerShell para los comandos de ejemplo.

## Estructura del proyecto
```text
TAREA01/
├── backend/
│   ├── app.py
│   ├── models.py
│   ├── requirements.txt
│   ├── migrations/
│   ├── routes/
│   ├── uploads/
│   └── database.db                 # SQLite (local y fallback en Render)
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── src/
│   └── public/
├── IMG/
└── render.yaml                     # Configuración de despliegue Render
```

## Desarrollo (local)
**Backend (SQLite por defecto)**
- Crear entorno y dependencias:
  - `cd backend`
  - `python -m venv .venv`
  - `./.venv/Scripts/Activate.ps1`
  - `pip install -r requirements.txt`
- Ejecutar en modo desarrollo:
  - `./.venv/Scripts/python.exe app.py`
- Acceso: `http://127.0.0.1:5000/`
- Salud: `http://127.0.0.1:5000/api/health`

**Frontend**
- `cd frontend`
- `npm ci`
- Crear `.env` con:
  - `VITE_API_URL=http://127.0.0.1:5000`
- Ejecutar:
  - `npm run dev`
- Acceso: `http://localhost:3000/`

## Variables de entorno
- Backend
  - `JWT_SECRET_KEY`: secreto para firmar JWT (requerido en producción).
  - `FRONTEND_ORIGIN`: dominio público del frontend para CORS (opcional en local).
  - `DATABASE_URL`: si NO se define, el backend usa `SQLite` en `backend/database.db`.
- Frontend
  - `VITE_API_URL`: URL del backend (incluye protocolo y sin slash final).

## Migraciones
- Inicializar (solo una vez):
  - `flask --app app db init`
- Crear migración (tras cambios de modelos):
  - `flask --app app db migrate -m "actualización de modelos"`
- Aplicar migraciones:
  - `flask --app app db upgrade`

## Despliegue en Render
- Este repo incluye `render.yaml` para configurar:
  - Servicio web backend (`env: python`, `rootDir: backend`).
  - Comandos:
    - Build: `pip install -r requirements.txt`
    - Start: `gunicorn --bind 0.0.0.0:$PORT app:app`
    - Post-deploy: `flask --app app db upgrade`
  - Health check: usar `/api/health`.
- Variables de entorno en Render (backend):
  - `JWT_SECRET_KEY`: generar un valor seguro.
  - `FRONTEND_ORIGIN`: p. ej. `https://restaurante-frontend.onrender.com`.
  - No definir `DATABASE_URL` si se desea usar SQLite (fallback). Nota: en plan Free, el disco es efímero; los datos pueden reiniciarse en cada deploy.
- Frontend está configurado como sitio estático:
  - Build: `npm ci && npm run build`
  - `staticPublishPath: dist`
  - `VITE_API_URL`: apuntar al subdominio del backend de Render.

## Rutas principales (API)
- `GET /` — Respuesta informativa del backend.
- `GET /api/health` — health check.
- Autenticación (`/api/auth`): `POST /register`, `POST /login`.
- Productos (`/api/products`): listar/crear/editar.
- Menú del día (`/api/menu`): `GET /today`, `POST /add`, `DELETE /remove/:product_id`.
- Carrito (`/api/cart`): operaciones para el usuario autenticado.
- Pedidos (`/api/orders`): listar y `GET /history` (pagados).
- Admin (`/api/admin`): `GET /users`, `POST /users`, `PUT /users/:id`, `POST /orders`.

## Solución de problemas
- 404 al abrir el dominio en producción:
  - Asegúrate de usar `https://tu-servicio.onrender.com/` (sin punto final).
  - Verifica que el backend tenga la ruta `/` y que el health check use `/api/health`.
- CORS desde el frontend:
  - Define `FRONTEND_ORIGIN` con el dominio público del frontend.
  - Confirma `VITE_API_URL` del frontend apunta al backend correcto.
- Migraciones fallan en Render:
  - Revisa logs del servicio; verifica que `Flask-Migrate` esté instalado y que `FLASK_APP` se aplique en `postDeployCommand`.
- Persistencia en Render Free:
  - SQLite puede reiniciarse en cada deploy. Usa un DB administrado (Railway, Render PostgreSQL) o instancia con disco persistente si necesitas datos duraderos.

---
Uso académico/educativo. Ajusta la licencia según tus necesidades.