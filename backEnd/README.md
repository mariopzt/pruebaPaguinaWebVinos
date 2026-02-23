# 🍷 VinosStK Backend API

Backend API para la aplicación de gestión de bodegas VinosStK.

## 🚀 Tecnologías

- **Node.js** - Entorno de ejecución
- **Express** - Framework web
- **MongoDB Atlas** - Base de datos en la nube
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación con tokens
- **bcryptjs** - Encriptación de contraseñas

## 📦 Instalación

1. **Navega a la carpeta del backend:**
```bash
cd backEnd
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**

Crea un archivo `.env` en la carpeta `backEnd` con las siguientes variables:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=tu_connection_string_de_mongodb_atlas
JWT_SECRET=tu_clave_secreta_super_segura
JWT_EXPIRE=7d

# URL del frontend para emails de activación
# En desarrollo:
FRONTEND_URL=http://localhost:5173
# En producción (Render):
# FRONTEND_URL=https://vinosstk-rdsr.onrender.com
```

**⚠️ IMPORTANTE:** La variable `FRONTEND_URL` es crítica para que los emails de activación de usuarios contengan el link correcto. En producción, debe apuntar a la URL del frontend desplegado.

## 🔧 Configurar MongoDB Atlas

1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo cluster (gratis)
4. En "Database Access", crea un usuario con contraseña
5. En "Network Access", agrega tu IP o `0.0.0.0/0` (para desarrollo)
6. Haz clic en "Connect" → "Connect your application"
7. Copia el connection string y reemplaza:
   - `<username>` con tu usuario
   - `<password>` con tu contraseña
   - `<database>` con `Miga`

**Ejemplo:**
```
mongodb+srv://mario:mipassword123@cluster0.xxxxx.mongodb.net/Miga?retryWrites=true&w=majority
```

## 🏃 Ejecutar el servidor

**Modo desarrollo (con auto-reload):**
```bash
npm run dev
```

**Modo producción:**
```bash
npm start
```

El servidor se ejecutará en `http://localhost:5000`

## 📡 Endpoints de la API

### Autenticación

#### Registrar usuario
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Mario",
  "email": "mario@example.com",
  "password": "123456"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "mario@example.com",
  "password": "123456"
}
```

#### Obtener perfil (requiere autenticación)
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Vinos (todas las rutas requieren autenticación)

#### Obtener todos los vinos
```http
GET /api/wines
Authorization: Bearer <token>
```

#### Obtener un vino
```http
GET /api/wines/:id
Authorization: Bearer <token>
```

#### Crear vino
```http
POST /api/wines
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Reserva Especial",
  "type": "Tinto",
  "year": 2020,
  "origin": "Rioja",
  "grape": "Tempranillo",
  "price": 25.99,
  "stock": 50,
  "description": "Vino tinto de reserva"
}
```

#### Actualizar vino
```http
PUT /api/wines/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "stock": 45,
  "price": 24.99
}
```

#### Eliminar vino
```http
DELETE /api/wines/:id
Authorization: Bearer <token>
```

## 📁 Estructura del proyecto

```
backEnd/
├── config/
│   └── db.js              # Configuración de MongoDB
├── controllers/
│   ├── authController.js  # Controladores de autenticación
│   └── wineController.js  # Controladores de vinos
├── middleware/
│   ├── auth.js            # Middleware de autenticación
│   └── errorHandler.js    # Manejador de errores
├── models/
│   ├── User.js            # Modelo de usuario
│   └── Wine.js            # Modelo de vino
├── routes/
│   ├── authRoutes.js      # Rutas de autenticación
│   └── wineRoutes.js      # Rutas de vinos
├── .env                   # Variables de entorno (no subir a git)
├── .gitignore            # Archivos ignorados por git
├── package.json          # Dependencias y scripts
├── README.md             # Este archivo
└── server.js             # Punto de entrada del servidor
```

## 🔐 Autenticación

La API utiliza JWT (JSON Web Tokens) para la autenticación.

1. Registra un usuario o inicia sesión
2. Guarda el token que recibes en la respuesta
3. Incluye el token en el header de las peticiones protegidas:
   ```
   Authorization: Bearer <tu_token>
   ```

## 🧪 Probar la API

Puedes usar:
- **Postman** - https://www.postman.com/
- **Thunder Client** (extensión de VS Code)
- **curl** desde la terminal

## 📝 Notas

- El servidor usa el puerto 5000 por defecto
- CORS está configurado para aceptar peticiones desde `http://localhost:5173` (frontend)
- Las contraseñas se encriptan automáticamente antes de guardarlas
- Los vinos están asociados al usuario que los crea

## 🐛 Solución de problemas

**Error: "Cannot connect to MongoDB"**
- Verifica tu connection string en `.env`
- Asegúrate de que tu IP esté en la whitelist de MongoDB Atlas
- Verifica que el usuario y contraseña sean correctos

**Error: "Port 5000 already in use"**
- Cambia el puerto en `.env` a otro (ej: 5001)
- O detén el proceso que está usando el puerto 5000

## 📧 Contacto

Para cualquier duda o problema, contacta al equipo de desarrollo.

---

¡Hecho con ❤️ y 🍷!

