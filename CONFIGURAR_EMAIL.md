# 📧 Configuración de EmailJS para VinosStK

## Paso 1: Crear cuenta en EmailJS

1. Ve a: **https://www.emailjs.com/**
2. Haz clic en "Sign Up" (Registrarse)
3. Puedes usar tu Gmail para registrarte

## Paso 2: Conectar tu Gmail

1. Una vez dentro del dashboard, ve a **"Email Services"**
2. Haz clic en **"Add New Service"**
3. Selecciona **"Gmail"**
4. Haz clic en **"Connect Account"**
5. Autoriza el acceso a tu cuenta de Gmail
6. Dale un nombre al servicio (ej: "VinosStK Gmail")
7. **Copia el Service ID** (algo como: `service_xxxxxxx`)

## Paso 3: Crear plantilla de email

1. Ve a **"Email Templates"**
2. Haz clic en **"Create New Template"**
3. Configura la plantilla:

### Asunto del email:
```
Bienvenido a VinosStK - Verifica tu cuenta
```

### Contenido del email:

**IMPORTANTE: Usa el editor HTML de EmailJS para agregar el botón**

En el editor de EmailJS, cambia a la vista HTML y pega esto:

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2>Hola {{to_name}},</h2>
  
  <p>¡Bienvenido a VinosStK! 🍷</p>
  
  <p>{{message}}</p>
  
  <p>Tu cuenta ha sido creada exitosamente. Ahora puedes acceder a la plataforma:</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{login_link}}" style="background-color: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
      🍷 Entrar a VinosStK
    </a>
  </div>
  
  <p>O copia este enlace en tu navegador:</p>
  <p style="color: #667eea; word-break: break-all;">{{login_link}}</p>
  
  <p>Gracias por unirte a nuestra plataforma de gestión de bodegas.</p>
  
  <p style="color: #999; font-size: 12px;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
  
  <p>Saludos,<br>{{from_name}}</p>
</div>
```

O si prefieres texto simple:

```
Hola {{to_name}},

¡Bienvenido a VinosStK! 🍷

{{message}}

Tu cuenta ha sido creada exitosamente. Ahora puedes acceder a la plataforma haciendo clic en el siguiente enlace:

{{login_link}}

Copia y pega este enlace en tu navegador si no funciona el anterior.

Gracias por unirte a nuestra plataforma de gestión de bodegas.

Si no creaste esta cuenta, puedes ignorar este correo.

Saludos,
{{from_name}}
```

### Configuración adicional:
- **From Name**: VinosStK
- **From Email**: tu@gmail.com (tu email de Gmail)
- **To Email**: `{{to_email}}` ⚠️ MUY IMPORTANTE - debe ser la variable, no un email fijo

### ⚠️ IMPORTANTE - Variables del template:
Asegúrate de que tu template en EmailJS tenga estas variables:
- `{{to_name}}` - Nombre del usuario
- `{{to_email}}` - Email del destinatario (debe estar en "To Email" en Settings)
- `{{from_name}}` - Nombre de quien envía (VinosStK)
- `{{message}}` - Mensaje personalizado
- `{{login_link}}` - Enlace para entrar a la aplicación
- `{{app_url}}` - URL de la aplicación
- `{{reply_to}}` - Email de respuesta (en "Reply To" en Settings)

4. Guarda la plantilla
5. **Copia el Template ID** (algo como: `template_xxxxxxx`)

## Paso 4: Obtener tu Public Key

1. Ve a **"Account"** en el menú
2. En la sección **"General"**, encontrarás tu **Public Key**
3. **Copia el Public Key** (algo como: `tu_public_key_aqui`)

## Paso 5: Configurar en el código

Abre el archivo: `src/services/emailService.js`

Reemplaza estos valores:

```javascript
const EMAIL_CONFIG = {
  serviceId: 'service_xxxxxxx',      // Tu Service ID
  templateId: 'template_m8vdxfb',    // Tu Template ID
  publicKey: 'tu_public_key_aqui'    // Tu Public Key
};
```

## Paso 6: Probar

1. Guarda los cambios
2. Reinicia el servidor si es necesario: `npm run dev`
3. Ve al registro y crea una cuenta de prueba
4. Revisa tu bandeja de entrada (y spam por si acaso)

## 🎉 ¡Listo!

Ahora cada vez que alguien se registre, recibirá un email de bienvenida automáticamente.

## 📊 Límites del plan gratuito:
- 200 emails por mes
- Perfecto para desarrollo y proyectos pequeños

## ⚠️ Nota de seguridad:
- Las credenciales están en el código (frontend)
- Para producción, considera mover esto a un backend
- EmailJS tiene protección contra spam incluida

