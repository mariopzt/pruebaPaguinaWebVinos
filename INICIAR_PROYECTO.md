# 🚀 Iniciar Proyecto VinosStK

Guía rápida para iniciar el proyecto completo (Frontend + Backend).

## 📋 Requisitos previos

- ✅ Node.js instalado (v16 o superior)
- ✅ npm instalado
- ✅ Cuenta de MongoDB Atlas configurada (ver `CONFIGURAR_MONGODB.md`)
- ✅ Cuenta de EmailJS configurada (ver `CONFIGURAR_EMAIL.md`)

## 🔧 Configuración inicial

### 1. Backend

1. **Navega a la carpeta del backend:**
```bash
cd pruebaPaguinaWebVinos/backEnd
```

2. **Instala las dependencias** (si no lo hiciste antes):
```bash
npm install
```

3. **Configura las variables de entorno:**

Edita el archivo `.env` y agrega tu connection string de MongoDB Atlas:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://tu_usuario:tu_password@cluster0.xxxxx.mongodb.net/vinosStK?retryWrites=true&w=majority
JWT_SECRET=tu_clave_secreta_super_segura_cambiala_123456
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

⚠️ **IMPORTANTE**: Reemplaza `MONGODB_URI` con tu connection string real de MongoDB Atlas.

4. **Inicia el servidor:**
```bash
npm run dev
```

Deberías ver:
```
✅ MongoDB conectado: cluster0-shard-00-00.xxxxx.mongodb.net
📦 Base de datos: vinosStK
🚀 Servidor corriendo en modo development
📡 Puerto: 5000
🌐 URL: http://localhost:5000
🍷 API: http://localhost:5000/api
```

### 2. Frontend

1. **Abre una NUEVA terminal** (deja el backend corriendo)

2. **Navega a la carpeta del proyecto:**
```bash
cd pruebaPaguinaWebVinos
```

3. **Instala las dependencias** (si no lo hiciste antes):
```bash
npm install
```

4. **Verifica el archivo `.env`:**

Asegúrate de que existe y tiene:
```env
VITE_API_URL=http://localhost:5000/api
```

5. **Configura EmailJS:**

Edita `src/services/emailService.js` y agrega tus credenciales:

```javascript
const EMAIL_CONFIG = {
  serviceId: 'tu_service_id',      // De EmailJS
  templateId: 'tu_template_id',    // De EmailJS
  publicKey: 'tu_public_key'       // De EmailJS
};
```

6. **Inicia el frontend:**
```bash
npm run dev
```

Deberías ver:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## 🎯 Probar el proyecto

### 1. Abrir la aplicación

Abre tu navegador y ve a: `http://localhost:5173`

### 2. Registrar un usuario

1. En la pantalla de login, haz clic en **"Crear cuenta"**
2. Completa el formulario:
   - Nombre: Mario
   - Email: tu@email.com
   - Contraseña: 123456
   - Confirmar contraseña: 123456
3. Haz clic en **"Crear cuenta"**
4. Deberías ver una confirmación y recibir un email

### 3. Iniciar sesión

1. Usa el email y contraseña que registraste
2. Haz clic en **"Iniciar Sesión"**
3. Deberías entrar a la aplicación

### 4. Verificar en MongoDB Atlas

1. Ve a [MongoDB Atlas](https://cloud.mongodb.com/)
2. Haz clic en **"Browse Collections"**
3. Verás tu base de datos `vinosStK` con la colección `users`
4. Tu usuario registrado aparecerá ahí

## 📊 Estructura de terminales

Necesitas **2 terminales abiertas** desde la raíz del proyecto:

**Terminal 1 - Backend:**
```bash
cd backEnd
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

O desde fuera del proyecto:

**Terminal 1:**
```bash
cd pruebaPaguinaWebVinos/backEnd
npm run dev
```

**Terminal 2:**
```bash
cd pruebaPaguinaWebVinos
npm run dev
```

## 🔍 Verificar que todo funciona

### Backend funcionando:
- ✅ Terminal muestra "MongoDB conectado"
- ✅ Terminal muestra "Servidor corriendo"
- ✅ Puedes abrir `http://localhost:5000` y ver un mensaje JSON

### Frontend funcionando:
- ✅ Terminal muestra "VITE ready"
- ✅ Puedes abrir `http://localhost:5173` y ver el login
- ✅ No hay errores en la consola del navegador (F12)

### Conexión funcionando:
- ✅ Puedes registrar un usuario sin errores
- ✅ Puedes iniciar sesión sin errores
- ✅ El usuario aparece en MongoDB Atlas

## 🐛 Solución de problemas

### Error: "Cannot connect to MongoDB"

**Solución:**
1. Verifica tu connection string en `backEnd/.env`
2. Asegúrate de que tu IP está en la whitelist de MongoDB Atlas
3. Verifica que el usuario y contraseña sean correctos

### Error: "Port 5000 already in use"

**Solución:**
1. Cierra otros procesos que usen el puerto 5000
2. O cambia el puerto en `backEnd/.env` a otro (ej: 5001)
3. Actualiza `VITE_API_URL` en el frontend

### Error: "Network Error" en el frontend

**Solución:**
1. Verifica que el backend esté corriendo
2. Verifica que el `.env` del frontend tenga la URL correcta
3. Abre `http://localhost:5000/api/health` para verificar el backend

### Error: "Email no se envía"

**Solución:**
1. Verifica tus credenciales de EmailJS en `src/services/emailService.js`
2. Verifica que el template de EmailJS esté configurado correctamente
3. Revisa la consola del navegador para ver errores específicos

### El login no funciona

**Solución:**
1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Network"
3. Intenta hacer login y mira si hay errores
4. Verifica que el backend esté corriendo

## 📝 Comandos útiles

### Backend:
```bash
# Iniciar en modo desarrollo (con auto-reload)
npm run dev

# Iniciar en modo producción
npm start

# Ver logs del servidor
# Los logs aparecen en la terminal donde corre el backend
```

### Frontend:
```bash
# Iniciar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build de producción
npm run preview
```

## 🎓 Próximos pasos

Una vez que todo funcione:

1. **Explora la API:**
   - Abre Postman o Thunder Client
   - Prueba los endpoints del backend
   - Ver `backEnd/README.md` para la documentación completa

2. **Personaliza el proyecto:**
   - Cambia colores y estilos
   - Agrega más funcionalidades
   - Conecta los vinos del frontend con el backend

3. **Aprende más:**
   - [Express.js Documentation](https://expressjs.com/)
   - [MongoDB Documentation](https://docs.mongodb.com/)
   - [React Documentation](https://react.dev/)

## ✅ Checklist de inicio

- [ ] Backend instalado y configurado
- [ ] MongoDB Atlas configurado
- [ ] EmailJS configurado
- [ ] Frontend instalado y configurado
- [ ] Backend corriendo en puerto 5000
- [ ] Frontend corriendo en puerto 5173
- [ ] Registro de usuario funciona
- [ ] Login funciona
- [ ] Usuario aparece en MongoDB Atlas
- [ ] Email de bienvenida llega

---

¡Todo listo para empezar a desarrollar! 🍷✨

**¿Necesitas ayuda?** Revisa los archivos:
- `CONFIGURAR_MONGODB.md` - Configuración de base de datos
- `CONFIGURAR_EMAIL.md` - Configuración de emails
- `backEnd/README.md` - Documentación del backend

