import { useState, useRef, useEffect, useCallback } from 'react';
import { FiSend, FiCpu, FiBox, FiSlash, FiTag, FiTrendingUp, FiStar, FiShoppingBag, FiLoader } from 'react-icons/fi';
import { useAI } from '../../hooks/useAI';
import './AIChat.css';

const MESSAGES_STORAGE_KEY = 'vinosstk_ai_messages';

/**
 * Componente de Chat con IA - Diseño Original
 */
export function AIChat({ 
  wines = [], 
  onWinesChange, 
  onUIChange, 
  currentUser,
  isVisible = true 
}) {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState(() => {
    // Cargar mensajes de localStorage al iniciar
    const saved = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) || [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const chatMessagesRef = useRef(null);
  const inputRef = useRef(null);

  const {
    sendMessage,
    isLoading,
    error,
    clearHistory
  } = useAI({ wines, onWinesChange, onUIChange, currentUser });

  // Guardar mensajes en localStorage cuando cambien
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages.slice(-100))); // Últimos 100
    }
  }, [messages]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Enviar mensaje
  const handleSendMessage = useCallback(async (text) => {
    const message = text?.trim() || inputMessage.trim();
    if (!message || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      text: message,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');

    try {
      const response = await sendMessage(message);
      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        text: response?.response || 'Lo siento, no pude procesar tu mensaje.',
        sender: 'ai',
        timestamp: new Date()
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        text: 'Ocurrió un error. Por favor, intenta de nuevo.',
        sender: 'ai',
        isError: true,
        timestamp: new Date()
      }]);
    }
  }, [inputMessage, isLoading, sendMessage]);

  const handleSuggestedOption = (optionText) => {
    handleSendMessage(optionText);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Limpiar chat y localStorage
  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem(MESSAGES_STORAGE_KEY);
    clearHistory();
  };

  if (!isVisible) return null;

  return (
    <div className="section section-full" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '95vh' }}>
      {/* Hero + chips de acciones rápidas: visibles solo antes del primer mensaje */}
      <div className={`ia-quick-wrapper ${messages.length > 0 ? 'ia-quick-hide' : ''}`}>
        <div className="ia-hero">
          <h2 className="ia-hero-title">Bienvenido a VinosStK IA</h2>
          <p className="ia-hero-subtitle">
            Explora preguntas sugeridas o pregúntanos lo que quieras sobre tu bodega y tus vinos.
          </p>
        </div>

        <div className="ia-quick-actions">
          <button className="ia-quick-chip" onClick={() => handleSuggestedOption('Ver vinos disponibles')}>
            <span className="ia-quick-chip-icon"><FiBox size={12} /></span>
            <span>Disponibles</span>
          </button>
          <button className="ia-quick-chip" onClick={() => handleSuggestedOption('Vinos agotados')}>
            <span className="ia-quick-chip-icon"><FiSlash size={12} /></span>
            <span>Agotados</span>
          </button>
          <button className="ia-quick-chip" onClick={() => handleSuggestedOption('Ofertas especiales')}>
            <span className="ia-quick-chip-icon"><FiTag size={12} /></span>
            <span>Ofertas</span>
          </button>
          <button className="ia-quick-chip" onClick={() => handleSuggestedOption('Vinos más vendidos')}>
            <span className="ia-quick-chip-icon"><FiTrendingUp size={12} /></span>
            <span>Top ventas</span>
          </button>
          <button className="ia-quick-chip" onClick={() => handleSuggestedOption('Mejores valorados')}>
            <span className="ia-quick-chip-icon"><FiStar size={12} /></span>
            <span>Mejor valorados</span>
          </button>
          <button className="ia-quick-chip" onClick={() => handleSuggestedOption('Pedidos pendientes')}>
            <span className="ia-quick-chip-icon"><FiShoppingBag size={12} /></span>
            <span>Pedidos</span>
          </button>
          <button className="ia-quick-chip" onClick={() => handleSuggestedOption('Recomendaciones de hoy')}>
            <span className="ia-quick-chip-icon"><FiCpu size={12} /></span>
            <span>Recomendados</span>
          </button>
          <button className="ia-quick-chip" onClick={() => handleSuggestedOption('Vinos con poco stock')}>
            <span className="ia-quick-chip-icon"><FiSlash size={12} /></span>
            <span>Stock bajo</span>
          </button>
          <button className="ia-quick-chip" onClick={() => handleSuggestedOption('Nuevos vinos en la bodega')}>
            <span className="ia-quick-chip-icon"><FiBox size={12} /></span>
            <span>Nuevos vinos</span>
          </button>
        </div>
      </div>

      <div className="ia-chat-container">
        <div className="chat-messages ia-chat-messages" ref={chatMessagesRef}>
          {messages.length > 0 && (
            messages.map(msg => (
              <div key={msg.id} className={`chat-message-container ${msg.sender} ${msg.isError ? 'error' : ''}`}>
                <span className="chat-message-icon">
                  {msg.sender === 'user' ? (
                    <img
                      src={currentUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"}
                      alt="User avatar"
                      className="chat-avatar"
                    />
                  ) : (
                    <FiCpu size={14} />
                  )}
                </span>
                <div className="chat-message">
                  <p>{msg.text}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="chat-message-container ai">
              <span className="chat-message-icon"><FiCpu size={14} /></span>
              <div className="chat-message">
                <div className="ia-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="chat-message-container ai error">
              <span className="chat-message-icon"><FiCpu size={14} /></span>
              <div className="chat-message">
                <p>{error}</p>
              </div>
            </div>
          )}
        </div>

        <div className="chat-input-container ia-chat-input">
          <div className="chat-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Escribe tu mensaje..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button
              className={`chat-send-arrow ${isLoading ? 'loading' : ''}`}
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() && !isLoading}
            >
              {isLoading ? <FiLoader className="spin" /> : <FiSend />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIChat;
