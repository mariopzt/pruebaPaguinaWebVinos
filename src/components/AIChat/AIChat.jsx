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

function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function extractWineFragment(text = '', fromIndex = 0) {
  const full = String(text || '');
  const safeFromIndex = Math.max(0, Math.min(fromIndex, full.length));
  const raw = full.slice(safeFromIndex);
  const trimmed = raw.trim();
  if (!trimmed) return '';

  // Trabajar con el último segmento escrito (permite frases encadenadas con comas).
  const segments = trimmed.split(/[,\n]/).map((part) => part.trim()).filter(Boolean);
  const lastSegment = segments.length > 0 ? segments[segments.length - 1] : trimmed;

  const quoteMatch = trimmed.match(/["']([^"']*)$/);
  if (quoteMatch) return quoteMatch[1].trim();

  const commandMatch = lastSegment.match(/(?:sumar|sumale|sumarle|agregar|agrega|anadir|añadir|restar|resta|quitar|quita|buscar|busca|ver|mostrar|stock|precio|info|informacion|detalles|recomendar|recomienda|habla|hablame|cuentame|dime)(?:\s+\d+)?(?:\s+unidades?)?\s+(?:de|del|al|el|la|sobre|acerca\s+de)?\s*(.*)$/i);
  if (commandMatch) {
    const clean = commandMatch[1]
      .replace(/^[.\-:; ]+/, '')
      .replace(/\b(vino|vinos)\b/gi, '')
      .replace(/[.\-:; ]+$/g, '')
      .trim();
    return clean;
  }

  return lastSegment;
}

function injectSelectedWine(text = '', wineName = '', fromIndex = 0) {
  const fullInput = String(text || '');
  const safeFromIndex = Math.max(0, Math.min(fromIndex, fullInput.length));
  const fixedPrefix = fullInput.slice(0, safeFromIndex);
  const input = fullInput.slice(safeFromIndex);
  const safeWine = String(wineName || '').trim();
  if (!safeWine) return fullInput;

  // Reemplazar solo el último segmento (tras coma o salto de línea)
  // para permitir comandos encadenados: "suma 20 al X, 10 al Y, ..."
  const lastSeparatorIndex = Math.max(input.lastIndexOf(','), input.lastIndexOf('\n'));
  const prefix = lastSeparatorIndex >= 0 ? input.slice(0, lastSeparatorIndex + 1) : '';
  const segment = lastSeparatorIndex >= 0 ? input.slice(lastSeparatorIndex + 1) : input;
  const leadingSpaces = segment.match(/^\s*/)?.[0] || '';
  const workingSegment = segment.trimStart();

  if (/["'][^"']*$/.test(workingSegment)) {
    return `${fixedPrefix}${prefix}${leadingSpaces}${workingSegment.replace(/(["'])[^"']*$/, `$1${safeWine}`)}`;
  }

  const commandMatch = workingSegment.match(/^(.*?(?:sumar|sumale|sumarle|agregar|agrega|anadir|añadir|restar|resta|quitar|quita|buscar|busca|ver|mostrar|stock|precio|info|informacion|detalles|recomendar|recomienda|habla|hablame|cuentame|dime)(?:\s+\d+)?(?:\s+unidades?)?\s+(?:de|del|al|el|la|sobre|acerca\s+de)?\s*)(.*)$/i);
  if (commandMatch) {
    return `${fixedPrefix}${prefix}${leadingSpaces}${commandMatch[1]}${safeWine}`;
  }

  // Soporte para comandos encadenados abreviados:
  // "..., 10 al alba" -> "..., 10 al Albamar"
  const quantityPrepositionMatch = workingSegment.match(/^(.*?\b\d+(?:[.,]\d+)?\s+(?:unidades?\s+)?(?:de|del|al|el|la)\s*)(.*)$/i);
  if (quantityPrepositionMatch) {
    return `${fixedPrefix}${prefix}${leadingSpaces}${quantityPrepositionMatch[1]}${safeWine}`;
  }

  // Soporte para "20 albamar" (cantidad + nombre sin preposición)
  const quantityDirectMatch = workingSegment.match(/^(.*?\b\d+(?:[.,]\d+)?\s+)(.*)$/i);
  if (quantityDirectMatch) {
    return `${fixedPrefix}${prefix}${leadingSpaces}${quantityDirectMatch[1]}${safeWine}`;
  }

  const prepositionMatch = workingSegment.match(/^(.*?\b(?:de|del|al|el|la|sobre|acerca\s+de)\s*)(.*)$/i);
  if (prepositionMatch) {
    return `${fixedPrefix}${prefix}${leadingSpaces}${prepositionMatch[1]}${safeWine}`;
  }

  return `${fixedPrefix}${prefix}${leadingSpaces}${safeWine}`;
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
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isInputMultiline, setIsInputMultiline] = useState(false);
  const [autocompleteStartIndex, setAutocompleteStartIndex] = useState(0);
  const chatMessagesRef = useRef(null);
  const inputRef = useRef(null);
  const inputWrapperRef = useRef(null);

  const adjustInputHeight = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;

    const computed = window.getComputedStyle(el);
    const lineHeight = parseFloat(computed.lineHeight) || 18;
    const paddingTop = parseFloat(computed.paddingTop) || 0;
    const paddingBottom = parseFloat(computed.paddingBottom) || 0;
    const borderTop = parseFloat(computed.borderTopWidth) || 0;
    const borderBottom = parseFloat(computed.borderBottomWidth) || 0;
    const maxHeight = (lineHeight * 3) + paddingTop + paddingBottom + borderTop + borderBottom;
    const singleLineHeight = lineHeight + paddingTop + paddingBottom + borderTop + borderBottom;

    el.style.height = 'auto';
    const nextHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
    setIsInputMultiline(el.scrollHeight > (singleLineHeight + 1));
  }, []);

  useEffect(() => {
    adjustInputHeight();
  }, [inputMessage, adjustInputHeight]);

  const {
    sendMessage,
    isLoading,
    error,
    clearHistory,
    cancel
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
    setAutocompleteStartIndex(0);

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

  // Si el usuario cambia de sección y este componente se desmonta,
  // cancelamos la petición en curso para evitar estados desincronizados.
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  const handleSuggestedOption = (optionText) => {
    handleSendMessage(optionText);
  };

  const wineSuggestions = (() => {
    const fragment = extractWineFragment(inputMessage, autocompleteStartIndex);
    const normalizedFragment = normalizeText(fragment);
    const canSuggest = isInputFocused && wines.length > 0 && normalizedFragment.length >= 1;
    if (!canSuggest) return [];

    let filtered = wines
      .filter((wine) => {
        const name = normalizeText(wine?.name || '');
        if (!name) return false;
        if (!normalizedFragment) return true;
        return name.includes(normalizedFragment);
      })
      .sort((a, b) => {
        const aName = normalizeText(a?.name || '');
        const bName = normalizeText(b?.name || '');
        const aStarts = normalizedFragment ? aName.startsWith(normalizedFragment) : false;
        const bStarts = normalizedFragment ? bName.startsWith(normalizedFragment) : false;
        if (aStarts !== bStarts) return aStarts ? -1 : 1;
        return aName.localeCompare(bName, 'es');
      })
      .slice(0, 6);

    // Fallback: si escribió una frase larga y no hubo match directo,
    // intentamos con sufijos ("... vino albamar" -> "albamar")
    if (filtered.length === 0 && normalizedFragment.includes(' ')) {
      const tokens = normalizedFragment.split(/\s+/).filter(Boolean);
      for (let i = Math.floor(tokens.length / 2); i < tokens.length; i++) {
        const suffix = tokens.slice(i).join(' ');
        filtered = wines
          .filter((wine) => normalizeText(wine?.name || '').includes(suffix))
          .sort((a, b) => normalizeText(a?.name || '').localeCompare(normalizeText(b?.name || ''), 'es'))
          .slice(0, 6);
        if (filtered.length > 0) break;
      }
    }

    return filtered;
  })();

  useEffect(() => {
    setSelectedSuggestionIndex(0);
  }, [inputMessage]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!inputWrapperRef.current?.contains(event.target)) {
        setIsInputFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handlePickSuggestion = (wine) => {
    const wineName = wine?.name || '';
    if (!wineName) return;
    const nextMessage = injectSelectedWine(inputMessage, wineName, autocompleteStartIndex);
    setInputMessage(nextMessage);
    // Fija el texto autocompletado: lo siguiente se buscará solo desde aquí en adelante.
    setAutocompleteStartIndex(nextMessage.length);
    setSelectedSuggestionIndex(0);
    inputRef.current?.focus();
  };

  const handleInputChange = (e) => {
    const nextValue = e.target.value;
    setInputMessage(nextValue);
    if (autocompleteStartIndex > nextValue.length) {
      setAutocompleteStartIndex(nextValue.length);
    }
  };

  const handleKeyDown = (e) => {
    // No interceptar mientras el usuario compone texto (teclados IME)
    if (e.nativeEvent?.isComposing) return;

    if (wineSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev + 1) % wineSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev - 1 + wineSuggestions.length) % wineSuggestions.length);
        return;
      }
      if ((e.key === 'Enter' || e.key === 'Tab') && wineSuggestions[selectedSuggestionIndex]) {
        e.preventDefault();
        handlePickSuggestion(wineSuggestions[selectedSuggestionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setIsInputFocused(false);
        return;
      }
    }

    if (e.key === 'Enter' && e.shiftKey) {
      // En textarea dejamos que Shift+Enter inserte salto de línea.
      return;
    }

    if (
      e.key === 'Enter' &&
      !e.shiftKey &&
      !e.ctrlKey &&
      !e.altKey &&
      !e.metaKey
    ) {
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
                {msg.sender === 'user' && (
                  <span className="chat-message-icon">
                    <img
                      src={currentUser?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=user"}
                      alt="User avatar"
                      className="chat-avatar"
                    />
                  </span>
                )}
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
              <div className="chat-message">
                <p>{error}</p>
              </div>
            </div>
          )}
        </div>

        <div className="chat-input-container ia-chat-input">
          <div ref={inputWrapperRef} className="chat-input-wrapper">
            <textarea
              ref={inputRef}
              className={`chat-input ${isInputMultiline ? 'chat-input-multiline' : ''}`}
              placeholder="Ej: sumar 2 de Marqués de Riscal"
              value={inputMessage}
              onChange={handleInputChange}
              onFocus={() => setIsInputFocused(true)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading}
            />
            {wineSuggestions.length > 0 && (
              <div className="ia-wine-suggestions" role="listbox" aria-label="Sugerencias de vinos">
                {wineSuggestions.map((wine, index) => (
                  <button
                    key={wine?.id || wine?._id || `${wine?.name}-${index}`}
                    type="button"
                    className={`ia-wine-suggestion-item ${index === selectedSuggestionIndex ? 'active' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handlePickSuggestion(wine)}
                  >
                    <span className="ia-wine-suggestion-main">{wine?.name}</span>
                    <span className="ia-wine-suggestion-meta">
                      {[wine?.type, wine?.year ? `Año ${wine.year}` : null].filter(Boolean).join(' · ') || 'Vino en bodega'}
                    </span>
                  </button>
                ))}
              </div>
            )}
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
