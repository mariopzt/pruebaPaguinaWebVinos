import { useState, useRef, useEffect, useCallback } from 'react';
import { FiSend, FiCpu, FiBox, FiSlash, FiTag, FiTrendingUp, FiStar, FiShoppingBag, FiLoader } from 'react-icons/fi';
import { useAI } from '../../hooks/useAI';
import './AIChat.css';

/**
 * Formatea texto plano a HTML con estilos
 */
function formatMessage(text) {
  if (!text) return '';
  
  let formatted = text;
  
  // Detectar y formatear bloques de código (texto entre ```)
  formatted = formatted.replace(/```([\s\S]*?)```/g, (match, code) => {
    return `<code>${code.trim()}</code>`;
  });
  
  // Detectar código inline (texto entre `)
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline">$1</code>');
  
  // Detectar texto en negritas (**texto** o __texto__)
  formatted = formatted.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');
  
  // Detectar separadores (--- o ***)
  formatted = formatted.replace(/^[\-*]{3,}$/gm, '<hr>');
  
  // Detectar títulos (# Título)
  formatted = formatted.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  formatted = formatted.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  formatted = formatted.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  formatted = formatted.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
  
  // Dividir en líneas para procesar listas
  const lines = formatted.split('\n');
  const processedLines = [];
  let inNumberedList = false;
  let inBulletList = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Detectar lista numerada
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      if (!inNumberedList) {
        processedLines.push('<ol>');
        inNumberedList = true;
      }
      processedLines.push(`<li>${numberedMatch[2]}</li>`);
      continue;
    } else if (inNumberedList) {
      processedLines.push('</ol>');
      inNumberedList = false;
    }
    
    // Detectar lista sin orden
    const bulletMatch = trimmed.match(/^[•\-→]\s+(.+)$/);
    if (bulletMatch) {
      if (!inBulletList) {
        processedLines.push('<ul>');
        inBulletList = true;
      }
      processedLines.push(`<li>${bulletMatch[1]}</li>`);
      continue;
    } else if (inBulletList) {
      processedLines.push('</ul>');
      inBulletList = false;
    }
    
    // Línea normal
    if (trimmed) {
      processedLines.push(line);
    } else if (processedLines.length > 0) {
      processedLines.push('</p><p>');
    }
  }
  
  // Cerrar listas si quedaron abiertas
  if (inNumberedList) processedLines.push('</ol>');
  if (inBulletList) processedLines.push('</ul>');
  
  // Unir líneas
  formatted = processedLines.join('\n');
  
  // Envolver en párrafo si no hay ya elementos de bloque
  if (!formatted.includes('<ol>') && !formatted.includes('<ul>') && 
      !formatted.includes('<h1>') && !formatted.includes('<h2>') &&
      !formatted.includes('<h3>') && !formatted.includes('<h4>') &&
      !formatted.includes('<code>')) {
    formatted = `<p>${formatted}</p>`;
  }
  
  // Limpiar párrafos vacíos
  formatted = formatted.replace(/<p>\s*<\/p>/g, '');
  formatted = formatted.replace(/<p>\n+<\/p>/g, '');
  
  return formatted;
}

/**
 * Componente de texto con efecto typing
 */
function TypingText({ text, speed = 15, onComplete }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const textRef = useRef(text);

  // Actualizar refs sin causar re-render
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Solo reiniciar si el texto realmente cambió
    if (textRef.current === text && displayedText) return;
    textRef.current = text;
    
    if (!text) return;
    
    let index = 0;
    setDisplayedText('');
    setIsComplete(false);

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setIsComplete(true);
        onCompleteRef.current?.();
      }
    }, speed);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed]);

  return (
    <span className={`typing-text ${isComplete ? 'complete' : 'typing'}`}>
      {displayedText}
      {!isComplete && <span className="typing-cursor">|</span>}
    </span>
  );
}

/**
 * Componente de Chat con IA - Diseño Original
 * Los mensajes se pasan desde el padre para persistir entre vistas
 */
export function AIChat({ 
  wines = [], 
  onWinesChange, 
  onUIChange, 
  currentUser,
  isVisible = true,
  messages = [],
  onMessagesChange
}) {
  const [inputMessage, setInputMessage] = useState('');
  const [typingMessageId, setTypingMessageId] = useState(null);
  const chatMessagesRef = useRef(null);
  const inputRef = useRef(null);

  const {
    sendMessage,
    isLoading,
    error,
    clearHistory
  } = useAI({ wines, onWinesChange, onUIChange, currentUser });

  // Auto-scroll al último mensaje con animación suave
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTo({
        top: chatMessagesRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Scroll continuo durante typing con animación suave
  useEffect(() => {
    if (typingMessageId && chatMessagesRef.current) {
      const scrollInterval = setInterval(() => {
        if (chatMessagesRef.current) {
          chatMessagesRef.current.scrollTo({
            top: chatMessagesRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 10); // Aumentado a 100ms para dar tiempo a la animación suave
      return () => clearInterval(scrollInterval);
    }
  }, [typingMessageId]);

  // Enviar mensaje
  const handleSendMessage = useCallback(async (text) => {
    const message = text?.trim() || inputMessage.trim();
    if (!message || isLoading || !onMessagesChange) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      text: message,
      sender: 'user',
      timestamp: new Date()
    };
    onMessagesChange(prev => [...prev, userMsg]);
    setInputMessage('');

    try {
      const response = await sendMessage(message);
      const aiMsgId = `ai-${Date.now()}`;
      setTypingMessageId(aiMsgId);
      onMessagesChange(prev => [...prev, {
        id: aiMsgId,
        text: response?.response || 'Lo siento, no pude procesar tu mensaje.',
        sender: 'ai',
        timestamp: new Date(),
        isNew: true
      }]);
    } catch (err) {
      onMessagesChange(prev => [...prev, {
        id: `error-${Date.now()}`,
        text: 'Ocurrió un error. Por favor, intenta de nuevo.',
        sender: 'ai',
        isError: true,
        timestamp: new Date()
      }]);
    }
  }, [inputMessage, isLoading, sendMessage, onMessagesChange]);

  const handleSuggestedOption = (optionText) => {
    handleSendMessage(optionText);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Limpiar chat
  const handleClearChat = () => {
    if (onMessagesChange) {
      onMessagesChange([]);
    }
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
                <div className={`chat-message ${msg.sender}`}>
                  {msg.sender === 'ai' && msg.id === typingMessageId ? (
                    <p>
                      <TypingText 
                        text={msg.text} 
                        speed={5}
                        onComplete={() => setTypingMessageId(null)}
                      />
                    </p>
                  ) : msg.sender === 'ai' ? (
                    <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />
                  ) : (
                    <p>{msg.text}</p>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="chat-message-container ai">
              <span className="chat-message-icon">
                <FiCpu size={16} className="ai-icon-pulse" />
              </span>
              <div className="chat-message ai-thinking">
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
