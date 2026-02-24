import { useState } from 'react'
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import { FaWineBottle } from 'react-icons/fa'
import Register from './Register'
import authService from '../../api/authService'
import './Login.css'

function Login({ onLogin }) {
  const GUEST_DEVICE_ID_KEY = 'vinosstk_guest_device_id'
  const GUEST_PROFILE_KEY = 'vinosstk_guest_profile'

  const [showRegister, setShowRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Validación básica
      if (!email || !password) {
        setError('Por favor, completa todos los campos')
        setIsLoading(false)
        return
      }

      // Intentar login con el backend (acepta usuario o correo)
      const response = await authService.login({ identifier: email, password })

      if (response.success) {
        // Login exitoso
        onLogin(response.data)
      } else {
        setError(response.message || 'Error al iniciar sesión')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error en login:', error)
      setError(error.message || 'Credenciales incorrectas')
      setIsLoading(false)
    }
  }

  const handleGuestLogin = () => {
    setIsLoading(true)

    // Obtener o crear un identificador estable del dispositivo/navegador.
    const getOrCreateGuestDeviceId = () => {
      const existing = localStorage.getItem(GUEST_DEVICE_ID_KEY)
      if (existing) return existing

      const generated =
        (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

      localStorage.setItem(GUEST_DEVICE_ID_KEY, generated)
      return generated
    }

    setTimeout(() => {
      const deviceId = getOrCreateGuestDeviceId()
      const guestId = `guest_${deviceId}`

      let guestProfile = null
      try {
        const stored = localStorage.getItem(GUEST_PROFILE_KEY)
        guestProfile = stored ? JSON.parse(stored) : null
      } catch (e) {
        guestProfile = null
      }

      const hydratedGuest =
        guestProfile && (guestProfile.id === guestId || guestProfile._id === guestId)
          ? {
            ...guestProfile,
            id: guestId,
            _id: guestId,
            email: guestProfile.email || `${guestId}@invitado.local`,
            name: guestProfile.name || 'Invitado',
            isGuest: true,
            deviceId,
            avatar: guestProfile.avatar || 'https://ui-avatars.com/api/?name=Invitado&background=6366f1&color=fff'
          }
          : {
            id: guestId,
            _id: guestId,
            email: `${guestId}@invitado.local`,
            name: 'Invitado',
            isGuest: true, // Marca especial para identificar usuarios invitados
            deviceId,
            avatar: 'https://ui-avatars.com/api/?name=Invitado&background=6366f1&color=fff'
          }

      localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(hydratedGuest))
      onLogin(hydratedGuest)
    }, 500)
  }

  // Si está en modo registro, mostrar el componente Register
  if (showRegister) {
    return (
      <Register 
        onRegister={onLogin} 
        onBackToLogin={() => setShowRegister(false)} 
      />
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
        <div className="login-header">
          <div className="login-logo">
            <FaWineBottle className="login-logo-icon" />
          </div>
          <h1 className="login-title">VinosStK</h1>
          <p className="login-subtitle">Gestión inteligente de tu bodega</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-input-group">
            <label className="login-label">Usuario</label>
            <div className="login-input-wrapper">
              <FiUser className="login-input-icon" />
              <input
                type="text"
                className="login-input"
                placeholder="Usuario"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                Iniciando...
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>

          <div className="login-divider">
            <span>o</span>
          </div>

          <button
            type="button"
            className="login-guest-button"
            onClick={handleGuestLogin}
            disabled={isLoading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Entrar como invitado
          </button>
        </form>

        <div className="login-footer">
          <p>¿No tienes cuenta? <a href="#register" onClick={(e) => { e.preventDefault(); setShowRegister(true); }}>Crear cuenta</a></p>
        </div>
      </div>

      <div className="login-info">
        <p>© 2024 VinosStK. Todos los derechos reservados.</p>
      </div>
    </div>
  )
}

export default Login
