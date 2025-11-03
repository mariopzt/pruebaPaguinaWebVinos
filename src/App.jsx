import './App.css'
import { useState, useEffect, useRef } from 'react'
import { IoSend } from 'react-icons/io5'
import Bodega from './components/Bodega/Bodega'
import Agotados from './components/Bodega/Agotados'
import WineModal from './components/Bodega/WineModal'
import { winesData } from './data/winesData'

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentView, setCurrentView] = useState('home') // 'home', 'bodega', o 'agotados'
  const [selectedWine, setSelectedWine] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [highlightedWineId, setHighlightedWineId] = useState(null)
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [suggestedOptions, setSuggestedOptions] = useState([])
  const chatMessagesContainerRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const navigateToBodega = () => {
    setCurrentView('bodega')
    setIsMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateToAgotados = () => {
    setCurrentView('agotados')
    setIsMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateToHome = () => {
    setCurrentView('home')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Agregar notificación cuando un vino se agota
  const addNotification = (wine) => {
    const newNotification = {
      id: Date.now(),
      wineId: wine.id,
      wineName: wine.name,
      message: `${wine.name} se ha agotado temporalmente. Te sugerimos hacer tu pedido cuanto antes para no quedarte sin él.`,
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Marcar todas las notificaciones como leídas al abrir el panel
  const handleOpenNotifications = () => {
    setShowNotifications(true);
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  // Manejar click en notificación
  const handleNotificationClick = (wineId) => {
    setCurrentView('agotados');
    setHighlightedWineId(wineId);
    setShowNotifications(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Remover highlight después de 2 segundos
    setTimeout(() => setHighlightedWineId(null), 2000);
  };

  // Remover notificación
  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Enviar mensaje en el chat
  const handleSendMessage = (message) => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now(),
        text: message,
        sender: 'user',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, newMessage]);
    }
  };

  // Manejar click en opción sugerida
  const handleSuggestedOption = (option) => {
    handleSendMessage(option);
    setSuggestedOptions(prev => 
      prev.map(opt => opt.label === option ? {...opt, selected: true} : opt)
    );
  };

  const handleWineClick = (wineName) => {
    // Buscar el vino en winesData por nombre
    let wine = winesData.find(w => w.name.toLowerCase().includes(wineName.toLowerCase()))
    
    // Si no encuentra coincidencia exacta, buscar por palabras clave
    if (!wine) {
      wine = winesData.find(w => {
        const searchTerms = wineName.toLowerCase().split(' ')
        return searchTerms.some(term => w.name.toLowerCase().includes(term))
      })
    }
    
    // Si aún no encuentra, usar el primer vino como fallback
    if (!wine) {
      wine = winesData[0]
    }
    
    setSelectedWine(wine)
  }

  useEffect(() => {
    if (chatMessagesContainerRef.current) {
      chatMessagesContainerRef.current.scrollTop = chatMessagesContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <>
    <div className="app">
      <div className="Padre-container">
{/* Sidebar */}
 <div className="sidebar">
        <div className="sidebar-header">
          <div className="hamburger-menu" onClick={toggleMenu}>
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
          </div>
        </div>
        
        <div className="sidebar-logo">
          <div className="wine-icon" onClick={(e) => {
            // mini animación al icono
            e.currentTarget.classList.add('pulse')
            setTimeout(() => e.currentTarget.classList.remove('pulse'), 500)

            setIsChatModalOpen(!isChatModalOpen);
            if (!isChatModalOpen) {
              setSuggestedOptions([
                { label: 'Ver disponibles', selected: false },
                { label: 'Vinos agotados', selected: false },
                { label: 'Ofertas especiales', selected: false },
                { label: 'Ayuda', selected: false }
              ]);
            }
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000010" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <circle cx="12" cy="5" r="2"/>
              <path d="M12 7v4"/>
              <line x1="8" y1="16" x2="8" y2="16"/>
              <line x1="16" y1="16" x2="16" y2="16"/>
              <path d="M12 19v2"/>
              <path d="M8 19v2"/>
              <path d="M16 19v2"/>
            </svg>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {currentView === 'home' ? (
            <>
              <div 
                className="nav-item" 
                onClick={navigateToBodega}
              >
                <span className="nav-icon">★</span>
                <span className="nav-text">Bodega</span>
              </div>
              <div 
                className="nav-item" 
                onClick={navigateToAgotados}
              >
                <span className="nav-icon">★</span>
                <span className="nav-text">Agotados</span>
              </div>
            </>
          ) : currentView === 'bodega' ? (
            <div 
              className="nav-item" 
              onClick={navigateToAgotados}
            >
              <span className="nav-icon">★</span>
              <span className="nav-text">Agotados</span>
            </div>
          ) : (
            <div 
              className="nav-item" 
              onClick={navigateToBodega}
            >
              <span className="nav-icon">★</span>
              <span className="nav-text">Bodega</span>
            </div>
          )}
          {currentView !== 'home' && (
            <div 
              className="nav-item" 
              onClick={navigateToHome}
            >
              <span className="nav-icon">🏠</span>
              <span className="nav-text">Inicio</span>
            </div>
          )}
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="mobile-menu-overlay" onClick={toggleMenu}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <h2>Menú</h2>
              <button className="close-menu" onClick={toggleMenu}>×</button>
            </div>
            <div className="mobile-menu-content">
              {currentView === 'home' ? (
                <>
                  <div 
                    className="mobile-nav-item" 
                    onClick={navigateToBodega}
                  >
                    <span className="mobile-nav-icon">★</span>
                    <span className="mobile-nav-text">Bodega</span>
                  </div>
                  <div 
                    className="mobile-nav-item" 
                    onClick={navigateToAgotados}
                  >
                    <span className="mobile-nav-icon">★</span>
                    <span className="mobile-nav-text">Agotados</span>
                  </div>
                </>
              ) : currentView === 'bodega' ? (
                <div 
                  className="mobile-nav-item" 
                  onClick={navigateToAgotados}
                >
                  <span className="mobile-nav-icon">★</span>
                  <span className="mobile-nav-text">Agotados</span>
                </div>
              ) : (
                <div 
                  className="mobile-nav-item" 
                  onClick={navigateToBodega}
                >
                  <span className="mobile-nav-icon">★</span>
                  <span className="mobile-nav-text">Bodega</span>
                </div>
              )}
              {currentView !== 'home' && (
                <div 
                  className="mobile-nav-item" 
                  onClick={navigateToHome}
                >
                  <span className="mobile-nav-icon">🏠</span>
                  <span className="mobile-nav-text">Inicio</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="hamburger-menu mobile-only" onClick={toggleMenu}>
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
          </div>
          <h1 className="app-title" onClick={navigateToHome} style={{ cursor: 'pointer' }}>
            {currentView === 'home' ? 'VinosStock' : currentView === 'bodega' ? 'Bodega' : 'Agotados'}
          </h1>
          <div className="header-icons">
            <div className="icon bell-icon" onClick={handleOpenNotifications}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
              </svg>
              {notifications.filter(n => !n.read).length > 0 && !showNotifications && <span className="notification-badge">{notifications.filter(n => !n.read).length}</span>}
            </div>
            <div className="icon gear-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </div>
          </div>
        </header>

        {/* Vista Home */}
        {currentView === 'home' && (
        <div key="home-view" className="content view-enter">
          {/* Mas vendidos Section */}
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Mas vendidos</h2>
              <span className="arrow-icon">→</span>
            </div>
            <div className="horizontal-scroll">
              {['Casal de arman', 'Arman doce', 'Amorodos', 'Revelde', 'Valdecontina', 'Almanova', 'Komakabras', 'Attis', 'Mix'].map((wine, index) => (
                <div key={index} className="wine-item rectangular" onClick={() => handleWineClick(wine)}>
                  <div className="wine-image">
                    <img 
                      src={`https://images.pexels.com/photos/${['1053914', '708777', '1267320', '1407855', '1283219', '1267320', '1407855', '1283219', '1053914'][index]}/pexels-photo-${['1053914', '708777', '1267320', '1407855', '1283219', '1267320', '1407855', '1283219', '1053914'][index]}.jpeg`}
                      alt={`Botella de vino ${wine}`}
                      className="wine-photo"
                    />
                  </div>
                  <span className="wine-name">{wine}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Tipos de Uvas Section */}
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Tipos de Uvas</h2>
              <span className="arrow-icon">→</span>
            </div>
            <div className="grape-grid">
              {['Tempranillo', 'Garnacha'].map((grape, index) => (
                <div key={index} className="grape-card rectangular">
                  <div className="grape-image">
                    <img 
                      src={index === 0 
                        ? "https://images.pexels.com/photos/1053914/pexels-photo-1053914.jpeg?_gl=1*1js1a58*_ga*MTI5NjI5NjIxOS4xNzYwOTA1MzA3*_ga_8JE65Q40S6*czE3NjA5MDUzMDckbzEkZzEkdDE3NjA5MDczOTAkajM2JGwwJGgw"
                        : "https://images.pexels.com/photos/708777/pexels-photo-708777.jpeg?_gl=1*13f3ecb*_ga*MTI5NjI5NjIxOS4xNzYwOTA1MzA3*_ga_8JE65Q40S6*czE3NjA5MDUzMDckbzEkZzEkdDE3NjA5MDc0MjAkajYkbDAkaDA"
                      } 
                      alt="Uvas de vino" 
                      className="grape-photo"
                    />
                  </div>
                  <span className="grape-name">{grape}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Nuestros vinos Section */}
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Nuestros vinos</h2>
              <span className="star-icon">★</span>
            </div>
            <div className="horizontal-scroll-viewport">
              <div className="horizontal-scroll auto-scroll">
                {['Casal de arman', 'Arman doce', 'Amorodos', 'Revelde', 'Valdecontina', 'Almanova', 'Attis', 'Albariño', 'Tempranillo', 'Garnacha', 'Mencía', 'Godello', 'Treixadura', 'Loureiro', 'Caiño', 'Brancellao', 'Espadeiro', 'Sousón'].map((wine, index) => (
                  <div key={index} className="wine-item rectangular" onClick={() => handleWineClick(wine)}>
                    <div className="wine-image">
                      <img 
                        src="https://images.pexels.com/photos/7270303/pexels-photo-7270303.jpeg?_gl=1*11emm52*_ga*MTI5NjI5NjIxOS4xNzYwOTA1MzA3*_ga_8JE65Q40S6*czE3NjA5MDUzMDckbzEkZzEkdDE3NjA5MDU2NTQkajM4JGwwJGgw" 
                        alt="Tres copas de vino" 
                        className="wine-photo"
                      />
                    </div>
                    <div className="wine-info">
                      <span className="wine-artist">{wine}</span>
                      <span className="wine-song">Ribeiro</span>
                    </div>
                  </div>
                ))}
                {/* Duplicado para animación continua */}
                {['Casal de arman', 'Arman doce', 'Amorodos', 'Revelde', 'Valdecontina', 'Almanova', 'Attis', 'Albariño', 'Tempranillo', 'Garnacha', 'Mencía', 'Godello', 'Treixadura', 'Loureiro', 'Caiño', 'Brancellao', 'Espadeiro', 'Sousón'].map((wine, index) => (
                  <div key={`duplicate-${index}`} className="wine-item rectangular" onClick={() => handleWineClick(wine)}>
                    <div className="wine-image">
                      <img 
                        src="https://images.pexels.com/photos/7270303/pexels-photo-7270303.jpeg?_gl=1*11emm52*_ga*MTI5NjI5NjIxOS4xNzYwOTA1MzA3*_ga_8JE65Q40S6*czE3NjA5MDUzMDckbzEkZzEkdDE3NjA5MDU2NTQkajM4JGwwJGgw" 
                        alt="Tres copas de vino" 
                        className="wine-photo"
                      />
                    </div>
                    <div className="wine-info">
                      <span className="wine-artist">{wine}</span>
                      <span className="wine-song">Ribeiro</span>
                    </div>
                  </div>
                ))}
                {/* Tercer duplicado para animación ultra suave */}
                {['Casal de arman', 'Arman doce', 'Amorodos', 'Revelde', 'Valdecontina', 'Almanova', 'Attis', 'Albariño', 'Tempranillo', 'Garnacha', 'Mencía', 'Godello', 'Treixadura', 'Loureiro', 'Caiño', 'Brancellao', 'Espadeiro', 'Sousón'].map((wine, index) => (
                  <div key={`duplicate-3-${index}`} className="wine-item rectangular" onClick={() => handleWineClick(wine)}>
                    <div className="wine-image">
                      <img 
                        src="https://images.pexels.com/photos/7270303/pexels-photo-7270303.jpeg?_gl=1*11emm52*_ga*MTI5NjI5NjIxOS4xNzYwOTA1MzA3*_ga_8JE65Q40S6*czE3NjA5MDUzMDckbzEkZzEkdDE3NjA5MDU2NTQkajM4JGwwJGgw" 
                        alt="Tres copas de vino" 
                        className="wine-photo"
                      />
                    </div>
                    <div className="wine-info">
                      <span className="wine-artist">{wine}</span>
                      <span className="wine-song">Ribeiro</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
        )}

        {/* Vista Bodega */}
                {currentView === 'bodega' && (
                  <div key="bodega-view" className="view-enter">
                    <Bodega onNavigateHome={navigateToHome} onSelectWine={setSelectedWine} />
                  </div>
                )}

        {/* Vista Agotados */}
                {currentView === 'agotados' && (
                  <div key="agotados-view" className="view-enter">
                    <Agotados 
                      onNavigateHome={navigateToHome} 
                      onSelectWine={setSelectedWine}
                      onWineOutOfStock={addNotification}
                      highlightedWineId={highlightedWineId}
                    />
                  </div>
                )}
        
      </div>
      </div>
     
    </div>

    {/* Chat Modal Flotante */}
    {isChatModalOpen && (
      <div className="chat-modal">
        <div className="chat-header">
          <h3>Asistente VinosStock</h3>
          <button 
            className="chat-close"
            onClick={() => {
              setIsChatModalOpen(false);
              setChatMessages([]);
            }}
          >
            ✕
          </button>
        </div>
        
        <div className="chat-messages" ref={chatMessagesContainerRef}>
          <div className="chat-message-container bot">
            <span className="chat-message-icon">🤖</span>
            <div className="chat-message">
              <p>¡Hola! ¿Cómo podemos ayudarte hoy?</p>
            </div>
          </div>

          {/* Botones de opciones sugeridas */}
          {suggestedOptions.length > 0 && (
            suggestedOptions.map((option, index) => (
              <div key={index} className="chat-message-container bot">
                <button
                  className={`chat-message chat-option-button ${option.selected ? 'selected' : ''}`}
                  onClick={() => handleSuggestedOption(option.label)}
                >
                  <p>{option.label}</p>
                </button>
              </div>
            ))
          )}

          {chatMessages.length > 0 && (
            chatMessages.map(msg => (
              <div key={msg.id} className={`chat-message-container ${msg.sender}`}>
                <span className="chat-message-icon">
                  {msg.sender === 'user' ? '👤' : '🤖'}
                </span>
                <div className="chat-message">
                  <p>{msg.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <input
              type="text"
              className="chat-input"
              placeholder="Ask me anything"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage(e.target.value);
                  e.target.value = '';
                }
              }}
            />
            <button
              className="chat-send-arrow"
              onClick={(e) => {
                const button = e.currentTarget;
                const input = button.closest('.chat-input-wrapper').querySelector('.chat-input');
                if (input.value.trim()) {
                  handleSendMessage(input.value);
                  input.value = '';
                }
              }}
            >
              <IoSend />
            </button>
          </div>
          <button
            className="chat-send chat-send-hidden"
            onClick={(e) => {
              const input = e.target.previousElementSibling;
              handleSendMessage(input.value);
              input.value = '';
            }}
          >
            →
          </button>
        </div>
      </div>
    )}

    {/* Panel de Notificaciones */}
    {showNotifications && (
      <div 
        className="notifications-overlay"
        onClick={() => setShowNotifications(false)}
      >
        <div 
          className="notifications-panel"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="notifications-header">
            <h2>Notificaciones ({notifications.length})</h2>
            <button 
              className="notifications-close"
              onClick={() => setShowNotifications(false)}
            >
              ✕
            </button>
          </div>
          
          <div className="notifications-list">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification.wineId)}
                >
                  <div className="notification-icon">⚠</div>
                  <div className="notification-content">
                    <p className="notification-text">{notification.message}</p>
                  </div>
                  {!notification.read && <span className="notification-badge-item">NUEVA</span>}
                  <button
                    className="notification-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <div className="notifications-empty">
                <p>No tienes notificaciones</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Modal de detalles de vino - fuera del contenedor principal */}
    {selectedWine && (
      <WineModal
        wine={selectedWine}
        onClose={() => setSelectedWine(null)}
        onWineOutOfStock={addNotification}
      />
    )}
    </>
  )
}

export default App

