# 🍃 Configurar MongoDB Atlas

Guía completa para configurar MongoDB Atlas y conectar tu backend.

## 📋 Paso 1: Crear cuenta en MongoDB Atlas

1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Regístrate con tu email o cuenta de Google
3. Completa el formulario de registro

## 🚀 Paso 2: Crear un Cluster

1. Una vez dentro del dashboard, haz clic en **"Build a Database"** o **"Create"**
2. Selecciona **"Shared"** (es gratis)
3. Selecciona tu proveedor de nube:
   - **AWS** (recomendado)
   - Región más cercana a ti (ej: `us-east-1` o `eu-west-1`)
4. Deja el nombre del cluster como `Cluster0` o cámbialo a `VinosStK`
5. Haz clic en **"Create Cluster"**
6. Espera 1-3 minutos mientras se crea el cluster

## 👤 Paso 3: Crear usuario de base de datos

1. Te aparecerá un modal de seguridad
2. En **"How would you like to authenticate your connection?"**
   - Selecciona **"Username and Password"**
   - Usuario: `mario` (o el que prefieras)
   - Contraseña: Genera una segura o usa una propia
   - ⚠️ **IMPORTANTE**: Guarda esta contraseña, la necesitarás después
3. Haz clic en **"Create User"**

## 🌐 Paso 4: Configurar acceso de red

1. En **"Where would you like to connect from?"**
2. Selecciona **"My Local Environment"**
3. Haz clic en **"Add My Current IP Address"**
   - O si quieres acceso desde cualquier IP (solo para desarrollo):
   - Haz clic en **"Add IP Address"**
   - Ingresa: `0.0.0.0/0`
   - Descripción: `Acceso desde cualquier lugar`
4. Haz clic en **"Finish and Close"**

## 🔗 Paso 5: Obtener Connection String

1. En el dashboard, haz clic en **"Connect"** (botón verde)
2. Selecciona **"Drivers"**
3. En **"Driver"**, selecciona **"Node.js"**
4. En **"Version"**, selecciona la más reciente
5. Copia el **Connection String** que aparece:

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## ⚙️ Paso 6: Configurar el backend

1. Ve a la carpeta `backEnd` de tu proyecto
2. Abre el archivo `.env`
3. Reemplaza la línea de `MONGODB_URI` con tu connection string:

```env
MONGODB_URI=mongodb+srv://mario:tu_password_aqui@cluster0.xxxxx.mongodb.net/vinosStK?retryWrites=true&w=majority
```

⚠️ **IMPORTANTE**: Reemplaza:
- `<username>` → tu usuario (ej: `mario`)
- `<password>` → tu contraseña (la que guardaste)
- Agrega `/vinosStK` antes del `?` para especificar el nombre de la base de datos

**Ejemplo completo:**
```env
MONGODB_URI=mongodb+srv://mario:MiPassword123@cluster0.abc123.mongodb.net/vinosStK?retryWrites=true&w=majority
```

## 🧪 Paso 7: Probar la conexión

1. Abre una terminal en la carpeta `backEnd`
2. Ejecuta:
```bash
npm run dev
```

3. Deberías ver algo como:
```
✅ MongoDB conectado: cluster0-shard-00-00.xxxxx.mongodb.net
📦 Base de datos: vinosStK
🚀 Servidor corriendo en modo development
📡 Puerto: 5000
```

## 🎯 Paso 8: Verificar en MongoDB Atlas

1. Ve al dashboard de MongoDB Atlas
2. Haz clic en **"Browse Collections"**
3. Verás tu base de datos `vinosStK` (se crea automáticamente)
4. Cuando crees usuarios o vinos, aparecerán aquí

## 🔧 Solución de problemas

### Error: "MongoNetworkError: failed to connect"

**Causa**: Tu IP no está en la whitelist

**Solución**:
1. Ve a MongoDB Atlas → Network Access
2. Haz clic en **"Add IP Address"**
3. Agrega `0.0.0.0/0` (permite todas las IPs - solo para desarrollo)

### Error: "Authentication failed"

**Causa**: Usuario o contraseña incorrectos

**Solución**:
1. Ve a MongoDB Atlas → Database Access
2. Verifica tu usuario
3. Si es necesario, edita el usuario y cambia la contraseña
4. Actualiza el `.env` con la nueva contraseña

### Error: "ENOTFOUND cluster0.xxxxx.mongodb.net"

**Causa**: Connection string incorrecto

**Solución**:
1. Ve a MongoDB Atlas → Connect
2. Copia de nuevo el connection string
3. Asegúrate de reemplazar `<username>` y `<password>` correctamente

### La base de datos no aparece en Atlas

**Causa**: Es normal, se crea cuando insertas el primer documento

**Solución**:
- Registra un usuario desde el frontend
- La base de datos aparecerá automáticamente

## 📊 Explorar tus datos

1. En MongoDB Atlas, haz clic en **"Browse Collections"**
2. Verás tus colecciones:
   - `users` - Usuarios registrados
   - `wines` - Vinos de la bodega
3. Puedes ver, editar y eliminar documentos desde aquí

## 🔐 Seguridad

### Para desarrollo:
- Está bien usar `0.0.0.0/0` en Network Access
- Usa una contraseña simple

### Para producción:
- ⚠️ **NUNCA** uses `0.0.0.0/0` en producción
- Agrega solo las IPs específicas de tu servidor
- Usa contraseñas fuertes y seguras
- Activa la autenticación de dos factores en MongoDB Atlas

## 📝 Notas importantes

1. **El plan gratuito incluye**:
   - 512 MB de almacenamiento
   - Conexiones compartidas
   - Suficiente para desarrollo y proyectos pequeños

2. **Límites del plan gratuito**:
   - No hay límite de tiempo
   - Perfecto para aprender y proyectos personales

3. **Backup automático**:
   - MongoDB Atlas hace backups automáticos
   - Puedes restaurar datos si algo sale mal

## 🎓 Recursos adicionales

- [Documentación de MongoDB Atlas](https://docs.atlas.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB University](https://university.mongodb.com/) - Cursos gratis

## ✅ Checklist final

- [ ] Cuenta de MongoDB Atlas creada
- [ ] Cluster creado y activo
- [ ] Usuario de base de datos creado
- [ ] IP agregada a Network Access
- [ ] Connection string copiado
- [ ] `.env` configurado con el connection string correcto
- [ ] Backend iniciado sin errores
- [ ] Conexión exitosa visible en la consola

---

¡Listo! Ahora tu backend está conectado a MongoDB Atlas 🎉🍷

