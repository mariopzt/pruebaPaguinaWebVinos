import { useState } from 'react'
import { sendWelcomeEmail } from '../../services/emailService'

// Componente temporal para probar el envío de emails
function TestEmail() {
  const [testEmail, setTestEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  const handleTest = async () => {
    if (!testEmail) {
      alert('Por favor ingresa un email')
      return
    }

    setSending(true)
    setResult(null)

    const emailResult = await sendWelcomeEmail({
      name: 'Usuario de Prueba',
      email: testEmail
    })

    setResult(emailResult)
    setSending(false)
  }

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 20, 
      right: 20, 
      background: '#1a1a24', 
      padding: 20, 
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.1)',
      zIndex: 99999,
      minWidth: 300
    }}>
      <h3 style={{ color: 'white', marginBottom: 10, fontSize: 14 }}>🧪 Test Email</h3>
      <input 
        type="email"
        placeholder="tu@email.com"
        value={testEmail}
        onChange={(e) => setTestEmail(e.target.value)}
        style={{
          width: '100%',
          padding: 8,
          marginBottom: 10,
          borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(255,255,255,0.05)',
          color: 'white',
          fontSize: 13
        }}
      />
      <button 
        onClick={handleTest}
        disabled={sending}
        style={{
          width: '100%',
          padding: 8,
          background: '#667eea',
          border: 'none',
          borderRadius: 6,
          color: 'white',
          cursor: sending ? 'not-allowed' : 'pointer',
          fontSize: 13,
          fontWeight: 600
        }}
      >
        {sending ? 'Enviando...' : 'Enviar Email de Prueba'}
      </button>
      {result && (
        <div style={{ 
          marginTop: 10, 
          padding: 8, 
          borderRadius: 6,
          background: result.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: result.success ? '#10b981' : '#ef4444',
          fontSize: 12
        }}>
          {result.success ? '✅ Email enviado! Revisa tu bandeja' : '❌ Error al enviar'}
        </div>
      )}
      <p style={{ color: '#9ca3af', fontSize: 10, marginTop: 10, marginBottom: 0 }}>
        Abre la consola (F12) para ver detalles
      </p>
    </div>
  )
}

export default TestEmail

