# Gestión Educativa (Flask + SQLAlchemy)

Aplicación web para gestionar alumnos, cursos, tareas y notas. Incluye CRUDs sencillos, persistencia en SQLite y migraciones con Flask-Migrate.

## Tabla de contenido
- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecución en desarrollo](#ejecución-en-desarrollo)
- [Migraciones de base de datos](#migraciones-de-base-de-datos)
- [Despliegue en producción](#despliegue-en-producción)
- [Rutas principales](#rutas-principales)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Solución de problemas](#solución-de-problemas)
- [Licencia](#licencia)

## Características
- CRUD de `Alumnos`, `Cursos`, `Tareas` y `Notas`.
- Plantillas Jinja2 con estilos consistentes.
- Base de datos SQLite en `instance/educacion.db`.
- Migraciones manejadas con `Flask-Migrate`.

## Requisitos
- Python 3.10+ (recomendado)
- Pip
- Windows PowerShell (para los comandos de ejemplo)

## Instalación
```powershell
# Clonar el repositorio (si aplica)
# git clone <url-del-repo>
# cd TAREA01

# Crear y activar entorno virtual
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r requirements.txt
```

## Configuración
- Variables típicas de entorno:
```powershell
$env:FLASK_APP="app.py"
$env:FLASK_DEBUG="1"   # activar recarga automática en desarrollo
```
- La base de datos se crea en `instance/educacion.db` (carpeta generada automáticamente por Flask si no existe).

## Ejecución en desarrollo
```powershell
python -m flask run
# Por defecto, se expone en http://127.0.0.1:5000/
```

## Migraciones de base de datos
Generadas a partir de los modelos en `models.py`.
```powershell
# Inicializar (solo una vez)
flask db init

# Crear migración inicial (o tras cambios de modelos)
flask db migrate -m "tablas iniciales"

# Aplicar migraciones
flask db upgrade
```

## Despliegue en producción
Ejemplo con `waitress` (WSGI para Windows):
```powershell
pip install waitress
waitress-serve --call app:app
```

## Rutas principales
- `/` — Página de inicio.
- `/alumnos` — Listado, creación y detalle de alumnos.
- `/cursos` — Listado y creación de cursos.
- `/tareas` — Listado y creación de tareas.
- `/notas` — Listado, creación y edición de notas.

> Nota: Los endpoints exactos y métodos (GET/POST) se definen en `app.py`.

## Estructura del proyecto
```text
TAREA01/
├── app.py
├── models.py
├── requirements.txt
├── instance/
│   └── educacion.db
├── migrations/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── f7e5fb4da5f4_tablas_iniciales.py
└── templates/
    ├── base.html
    ├── index.html
    ├── alumnos/
    │   ├── list.html
    │   ├── form.html
    │   └── detail.html
    ├── cursos/
    │   ├── list.html
    │   └── form.html
    ├── tareas/
    │   ├── list.html
    │   └── form.html
    └── notas/
        ├── list.html
        ├── form.html
        └── edit.html
```

## Solución de problemas
- Cambios de estilos no se ven:
  - Forzar refresco: `Ctrl+F5` o usar ventana de incógnito.
- Puerto ocupado al iniciar Flask:
```powershell
Get-Process -Name python -ErrorAction SilentlyContinue |
  Where-Object { $_.Path -like "*flask*" -or $_.Path -like "*python*" } |
  Stop-Process -Force
```
- Migraciones no aplican:
  - Verificar que `FLASK_APP` está configurado y que `models.py` define correctamente los modelos.

## Licencia
Uso académico/educativo. Ajusta la licencia según tus necesidades.