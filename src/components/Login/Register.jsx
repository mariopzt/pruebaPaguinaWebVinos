import { useState } from 'react'
import { FiUser, FiLock, FiEye, FiEyeOff, FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi'
import { FaWineBottle } from 'react-icons/fa'
import { sendWelcomeEmail } from '../../services/emailService'
import authService from '../../api/authService'
import pendingService from '../../api/pendingService'
import './Login.css'

function Register({ onRegister, onBackToLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Validaciones
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Por favor, completa todos los campos')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 3) {
      setError('La contraseña debe tener al menos 3 caracteres')
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      setIsLoading(false)
      return
    }

    try {
      // Crear usuario pendiente y enviar link de activación
      const pendingResp = await pendingService.create({
        name: formData.name,
        email: formData.email
      })

      // Obtener el token y generar el link en el frontend (no usar el del backend)
      const token = pendingResp?.data?.data?.token
      const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin
      const activationLink = token 
        ? `${frontendUrl}/activate?token=${token}`
        : `${frontendUrl}/activate`

      setRegisteredEmail(formData.email)
      
      // Enviar email de activación
      const emailResult = await sendWelcomeEmail({
        name: formData.name,
        email: formData.email,
        activationLink,
        message: 'Activa tu cuenta para iniciar sesión.'
      });

      if (emailResult.success) {
        console.log('✅ Email de activación enviado correctamente');
      } else {
        console.warn('⚠️ No se pudo enviar el email, pero la invitación fue creada');
      }
      
      setShowConfirmation(true)
      setIsLoading(false)
    } catch (error) {
      console.error('Error en registro:', error)
      setError(error.message || 'Error al registrar usuario')
      setIsLoading(false)
    }
  }

  // Si se muestra la confirmación
  if (showConfirmation) {
    return (
      <div className="login-container">
        <div className="login-background">
          <div className="login-gradient-orb orb-1"></div>
          <div className="login-gradient-orb orb-2"></div>
          <div className="login-gradient-orb orb-3"></div>
        </div>

        <div className="login-card register-confirmation-card">
          <div className="register-confirmation-content">
            <div className="register-confirmation-icon">
              <FiCheckCircle />
            </div>
            <h2 className="register-confirmation-title">¡Cuenta creada!</h2>
            <p className="register-confirmation-message">
              Hemos enviado un enlace de verificación a:
            </p>
            <p className="register-confirmation-email">{registeredEmail}</p>
            <p className="register-confirmation-instructions">
              Por favor, revisa tu correo y haz clic en el enlace para activar tu cuenta.
            </p>
            <button 
              className="login-button"
              onClick={onBackToLogin}
            >
              Volver al inicio de sesión
            </button>
          </div>
        </div>

        <div className="login-info">
          <p>© 2024 VinosStK. Todos los derechos reservados.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-gradient-orb orb-1"></div>
        <div className="login-gradient-orb orb-2"></div>
        <div className="login-gradient-orb orb-3"></div>
      </div>

      <div className="login-card">
        <button className="register-back-button" onClick={onBackToLogin}>
          <FiArrowLeft /> Volver
        </button>

        <h2 className="register-title">Nuevo usuario</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-input-group">
            <label className="login-label">Nombre completo</label>
            <div className="login-input-wrapper">
              <FiUser className="login-input-icon" />
              <input
                type="text"
                className="login-input"
                placeholder="Tu nombre"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="login-input-group">
            <label className="login-label">Email</label>
            <div className="login-input-wrapper">
              <FiMail className="login-input-icon" />
              <input
                type="email"
                className="login-input"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="login-input-group">
            <label className="login-label">Contraseña</label>
            <div className="login-input-wrapper">
              <FiLock className="login-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                disabled={isLoading}
              />
              <button
                type="button"
                className="login-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="login-input-group">
            <label className="login-label">Confirmar contraseña</label>
            <div className="login-input-wrapper">
              <FiLock className="login-input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="login-input"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                disabled={isLoading}
              />
              <button
                type="button"
                className="login-toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="login-spinner"></span>
                Creando cuenta...
              </>
            ) : (
              'Crear cuenta'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>¿Ya tienes cuenta? <a href="#login" onClick={(e) => { e.preventDefault(); onBackToLogin(); }}>Iniciar sesión</a></p>
        </div>
      </div>

      <div className="login-info">
        <p>© 2024 VinosStK. Todos los derechos reservados.</p>
      </div>
    </div>
  )
}

export default Register

