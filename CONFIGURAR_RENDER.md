# 🚀 Configuración de Variables de Entorno en Render

Este documento explica cómo configurar las variables de entorno necesarias para que la aplicación funcione correctamente en producción.

## ⚠️ Problema Común: Links de Activación Incorrectos

Si los emails de activación de usuarios están enviando links a `http://localhost:5173` en lugar de tu dominio de producción, es porque falta configurar la variable de entorno `FRONTEND_URL` en el backend.

## 📝 Variables de Entorno Requeridas

### Backend (vinosstk-backend)

1. **Inicia sesión en [Render](https://render.com/)**
2. Ve a tu servicio **vinosstk-backend**
3. Ve a **Environment** en el menú lateral
4. Agrega o actualiza estas variables:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Modo de ejecución |
| `PORT` | `5000` | Puerto del servidor |
| `MONGODB_URI` | `tu_mongo_uri` | URL de MongoDB Atlas |
| `JWT_SECRET` | `tu_clave_secreta` | Clave para JWT (genera una segura) |
| `JWT_EXPIRE` | `7d` | Tiempo de expiración del token |
| `FRONTEND_URL` | `https://vinosstk-rdsr.onrender.com` | ⚠️ **IMPORTANTE** |
| `OPENAI_API_KEY` | `tu_api_key` | (Opcional) Para funciones de IA |

**⚠️ CRÍTICO:** La variable `FRONTEND_URL` debe ser la URL completa de tu frontend en producción. Esta se usa para generar los links de activación en los emails.

### Frontend (vinosstk-frontend)

1. Ve a tu servicio **vinosstk-frontend**
2. Ve a **Environment**
3. Agrega estas variables:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `VITE_API_URL` | `https://vinosstk.onrender.com/api` | URL del backend |
| `VITE_FRONTEND_URL` | `https://vinosstk-rdsr.onrender.com` | URL del frontend |

## 🔄 Después de Configurar

1. **Guarda los cambios** en el panel de Environment
2. Render **redesplegará automáticamente** tu aplicación
3. Espera a que el despliegue termine (puede tardar 2-5 minutos)
4. Verifica que todo funcione correctamente

## ✅ Verificación

Para verificar que el problema está solucionado:

1. Crea un nuevo usuario pendiente desde tu aplicación
2. Revisa el email de activación
3. El link debe ser: `https://vinosstk-rdsr.onrender.com/activate?token=...`
4. Si aún aparece `localhost`, verifica que:
   - La variable `FRONTEND_URL` está bien configurada en el backend
   - El backend se ha redesplegado correctamente
   - No hay espacios extra en la URL

## 🔐 Generar JWT_SECRET Seguro

Puedes generar una clave segura usando Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

O en línea: https://www.grc.com/passwords.htm

## 📧 Configuración de EmailJS

Asegúrate también de que tu template en EmailJS esté configurado para usar la variable `{{activation_link}}` correctamente.

## 🐛 Solución de Problemas

### El link sigue siendo localhost

1. Verifica que `FRONTEND_URL` esté configurada en Render
2. Revisa los logs del backend: `Dashboard > Logs`
3. Busca líneas que muestren qué URL se está usando
4. Si necesitas forzar un redespliegue: `Manual Deploy > Deploy latest commit`

### Los emails no llegan

1. Verifica que EmailJS esté configurado correctamente
2. Revisa la consola del navegador para errores
3. Verifica que las credenciales de EmailJS sean correctas en `src/services/emailService.js`

## 📚 Recursos Adicionales

- [Documentación de Render - Environment Variables](https://render.com/docs/environment-variables)
- [Documentación de Vite - Env Variables](https://vitejs.dev/guide/env-and-mode.html)

---

**Última actualización:** Enero 2026

