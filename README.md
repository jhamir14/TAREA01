# 🌻 Flores de Amistad - TAREA01

Una hermosa página web interactiva con flores amarillas para celebrar la amistad, creada con HTML, CSS y JavaScript puro.

## 🚀 Deploy en Vercel

Este proyecto está configurado para ser desplegado fácilmente en Vercel. Sigue estos pasos:

### Opción 1: Deploy desde GitHub (Recomendado)

1. **Sube tu código a GitHub:**
   ```bash
   git add .
   git commit -m "Configuración para deploy en Vercel"
   git push origin main
   ```

2. **Conecta con Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Inicia sesión con tu cuenta de GitHub
   - Haz clic en "New Project"
   - Selecciona tu repositorio `TAREA01`
   - Vercel detectará automáticamente la configuración

3. **Deploy automático:**
   - Vercel usará el archivo `vercel.json` para la configuración
   - El deploy se completará en unos minutos
   - Obtendrás una URL pública para tu proyecto

### Opción 2: Deploy con Vercel CLI

1. **Instala Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Inicia sesión:**
   ```bash
   vercel login
   ```

3. **Deploy del proyecto:**
   ```bash
   # Para preview
   vercel
   
   # Para producción
   vercel --prod
   ```

## 📁 Estructura del Proyecto

```
TAREA01/
├── index.html          # Página de redirección
├── index1.html         # Página principal con flores
├── script.js           # JavaScript para interactividad
├── styles.css          # Estilos CSS
├── flores_amistad.html # Versión alternativa de flores
├── vercel.json         # Configuración de Vercel
├── package.json        # Configuración del proyecto
├── floreditado.mp3     # Audio de fondo
├── flormusica.mp3      # Audio adicional
└── README.md           # Este archivo
```

## 🌟 Características

- ✨ Flores amarillas animadas con CSS
- 🎵 Audio de fondo opcional
- 📱 Diseño responsive
- 🎨 Animaciones suaves y atractivas
- 💛 Tema de amistad con mensajes emotivos

## 🛠️ Tecnologías Utilizadas

- **HTML5** - Estructura semántica
- **CSS3** - Estilos y animaciones
- **JavaScript** - Interactividad
- **Vercel** - Hosting y deploy

## 📝 Scripts Disponibles

```bash
# Desarrollo local con Vercel
npm run dev

# Preview del deploy
npm run preview

# Deploy a producción
npm run deploy
```

## 🔧 Configuración

El archivo `vercel.json` está configurado para:
- Servir `index1.html` como página principal
- Manejar rutas estáticas
- Incluir todos los archivos necesarios

## 🌐 URL del Proyecto

Una vez desplegado, tu proyecto estará disponible en:
`https://tu-proyecto.vercel.app`

## 👨‍💻 Autor

**Jhamir** - Proyecto de flores de amistad

---

¡Disfruta compartiendo estas hermosas flores digitales con tus amigos! 🌻💛