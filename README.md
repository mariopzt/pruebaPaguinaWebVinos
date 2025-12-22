# 🍷 VinosStK - Sistema de Gestión de Bodegas

Sistema completo de gestión de bodegas con frontend en React y backend en Node.js + MongoDB Atlas.

## 📁 Estructura del Proyecto

```
pruebaPaguinaWebVinos/
├── backEnd/                    # 🔧 Backend API (Node.js + Express + MongoDB)
│   ├── config/                 # Configuración
│   ├── controllers/            # Controladores
│   ├── middleware/             # Middleware
│   ├── models/                 # Modelos de datos
│   ├── routes/                 # Rutas de la API
│   ├── .env                    # Variables de entorno (NO SUBIR A GIT)
│   ├── .env.example            # Plantilla de variables
│   ├── server.js               # Servidor principal
│   └── README.md               # Documentación del backend
│
├── src/                        # 🎨 Frontend (React + Vite)
│   ├── api/                    # Servicios de API
│   ├── components/             # Componentes React
│   ├── services/               # Servicios (EmailJS, etc)
│   ├── App.jsx                 # Componente principal
│   └── App.css                 # Estilos globales
│
├── .env                        # Variables del frontend (NO SUBIR A GIT)
├── .gitignore                  # Archivos ignorados por git
├── CONFIGURAR_MONGODB.md       # 📚 Guía MongoDB Atlas
├── CONFIGURAR_EMAIL.md         # 📚 Guía EmailJS
├── INICIAR_PROYECTO.md         # 📚 Guía de inicio
└── README.md                   # Este archivo
```

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js (v16 o superior)
- npm
- Cuenta de MongoDB Atlas (gratis)
- Cuenta de EmailJS (gratis)

### 1. Instalar dependencias

**Backend:**
```bash
cd backEnd
npm install
```

**Frontend:**
```bash
npm install
```

### 2. Configurar variables de entorno

**Backend (`backEnd/.env`):**
```env
PORT=5000
MONGODB_URI=tu_connection_string_de_mongodb
JWT_SECRET=tu_clave_secreta
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

**Frontend (`.env`):**
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Iniciar el proyecto

**Terminal 1 - Backend:**
```bash
cd backEnd
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 4. Abrir en el navegador
```
http://localhost:5173
```

## 📚 Documentación

- **[INICIAR_PROYECTO.md](INICIAR_PROYECTO.md)** - Guía completa para iniciar el proyecto
- **[CONFIGURAR_MONGODB.md](CONFIGURAR_MONGODB.md)** - Cómo configurar MongoDB Atlas
- **[CONFIGURAR_EMAIL.md](CONFIGURAR_EMAIL.md)** - Cómo configurar EmailJS
- **[backEnd/README.md](backEnd/README.md)** - Documentación del backend

## 🔐 Seguridad

⚠️ **IMPORTANTE**: 
- **NUNCA** subas el archivo `.env` a git
- **NUNCA** compartas tus credenciales de MongoDB
- El archivo `.gitignore` ya está configurado para proteger tus credenciales

Los archivos `.env` están protegidos y no se subirán a git.

## 🛠️ Tecnologías

### Backend
- Node.js + Express
- MongoDB Atlas
- Mongoose
- JWT (autenticación)
- bcryptjs (encriptación)

### Frontend
- React + Vite
- Axios
- EmailJS
- React Icons

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener perfil

### Vinos (protegidos)
- `GET /api/wines` - Listar vinos
- `POST /api/wines` - Crear vino
- `GET /api/wines/:id` - Ver vino
- `PUT /api/wines/:id` - Actualizar vino
- `DELETE /api/wines/:id` - Eliminar vino

## 🎯 Características

- ✅ Autenticación con JWT
- ✅ Registro de usuarios
- ✅ Login/Logout
- ✅ Encriptación de contraseñas
- ✅ API RESTful
- ✅ Base de datos MongoDB Atlas
- ✅ Envío de emails de bienvenida
- ✅ Diseño responsive
- ✅ Tema oscuro

## 🐛 Solución de problemas

### Backend no conecta a MongoDB
→ Verifica tu connection string en `backEnd/.env`
→ Asegúrate de que tu IP esté en la whitelist de MongoDB Atlas

### Frontend no conecta al backend
→ Verifica que el backend esté corriendo en puerto 5000
→ Verifica la variable `VITE_API_URL` en `.env`

### Email no se envía
→ Verifica tus credenciales de EmailJS en `src/services/emailService.js`

## 📝 Scripts disponibles

### Backend
```bash
npm start       # Producción
npm run dev     # Desarrollo (con nodemon)
```

### Frontend
```bash
npm run dev     # Desarrollo
npm run build   # Build para producción
npm run preview # Preview del build
```

## 👨‍💻 Desarrollo

Para empezar a desarrollar:

1. Lee `INICIAR_PROYECTO.md` para la configuración completa
2. Configura MongoDB Atlas siguiendo `CONFIGURAR_MONGODB.md`
3. Inicia backend y frontend
4. ¡Empieza a codear! 🚀

## 📧 Contacto

Para dudas o problemas, revisa la documentación en los archivos `.md` del proyecto.

---

**¡Hecho con ❤️ y 🍷!**
