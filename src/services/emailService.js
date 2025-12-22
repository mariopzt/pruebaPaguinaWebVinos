import emailjs from '@emailjs/browser';

// Configuración de EmailJS
// IMPORTANTE: Reemplaza estos valores con tus credenciales de EmailJS
const EMAIL_CONFIG = {
  serviceId: 'service_2h6az8h',      // Reemplazar con tu Service ID
  templateId: 'template_m8vdxfb',    // Reemplazar con tu Template ID
  publicKey: 'wHmZsLdDszdHCzAcZ'       // Reemplazar con tu Public Key
};

// Función para enviar email de bienvenida
export const sendWelcomeEmail = async (userData) => {
  try {
    const templateParams = {
      to_name: userData.name,
      to_email: userData.email,
      from_name: 'VinosStK',
      message: `¡Bienvenido a VinosStK! Gracias por registrarte.`,
      reply_to: 'noreply@vinosstk.com'
    };

    console.log('📧 Enviando email a:', userData.email);
    console.log('📧 Parámetros completos:', templateParams);
    console.log('📧 Service ID:', EMAIL_CONFIG.serviceId);
    console.log('📧 Template ID:', EMAIL_CONFIG.templateId);

    const response = await emailjs.send(
      EMAIL_CONFIG.serviceId,
      EMAIL_CONFIG.templateId,
      templateParams,
      EMAIL_CONFIG.publicKey
    );

    console.log('✅ Email enviado exitosamente!');
    console.log('✅ Response status:', response.status);
    console.log('✅ Response text:', response.text);
    console.log('🔍 Revisa tu bandeja de entrada (y spam) en:', userData.email);
    
    return { success: true, response };
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    console.error('❌ Error status:', error.status);
    console.error('❌ Error text:', error.text);
    console.error('❌ Error completo:', error);
    return { success: false, error };
  }
};

// Función para inicializar EmailJS (opcional, pero recomendado)
export const initEmailJS = () => {
  emailjs.init(EMAIL_CONFIG.publicKey);
};

