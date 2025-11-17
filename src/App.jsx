import './App.css'
import { useState, useEffect, useRef } from 'react'
import { IoSend } from 'react-icons/io5'
import { AiOutlineWarning } from 'react-icons/ai'
import { FiHome, FiShoppingBag, FiBox, FiSlash, FiCheckSquare, FiChevronDown, FiChevronUp, FiHelpCircle, FiCpu, FiUser, FiStar, FiTrendingUp, FiLogOut, FiTag, FiSettings, FiBell } from 'react-icons/fi'
import { FaArrowAltCircleLeft } from 'react-icons/fa'
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
  const [chatMessages, setChatMessages] = useState([])
  const [suggestedOptions, setSuggestedOptions] = useState([])
  const chatMessagesContainerRef = useRef(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settings, setSettings] = useState({
    autoScrollCarousel: true,
    markReadOnOpen: true,
    lockScrollOnNotifications: true,
    showUnreadBadge: true,
  })
  const [settingsView, setSettingsView] = useState('menu')
  const [settingsTransition, setSettingsTransition] = useState('forward')

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

  // Marcar todas las notificaciones como leídas al abrir el panel (según ajustes)
  const handleOpenNotifications = () => {
    setShowNotifications(true);
    if (settings.markReadOnOpen) {
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    }
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

  // Bloquear scroll del fondo si ajustes lo permiten
  useEffect(() => {
    if (showNotifications && settings.lockScrollOnNotifications) {
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = previousOverflow
      }
    }
  }, [showNotifications, settings.lockScrollOnNotifications])

  // Inicializar opciones sugeridas del chat cuando entramos en la vista IA
  useEffect(() => {
    if (currentView === 'ia') {
      setSuggestedOptions([
        { label: 'Ver disponibles', selected: false },
        { label: 'Vinos agotados', selected: false },
        { label: 'Ofertas especiales', selected: false },
        { label: 'Ayuda', selected: false }
      ]);
    }
  }, [currentView])

  return (
    <>
    <div className="app">
      <div className="Padre-container">
        {/* Sidebar */}
        <div className="sidebar">
          {/* Perfil principal tipo tarjeta (como el ejemplo) */}
          <div className="sidebar-profile">
            <div className="sidebar-avatar-wrapper">
              <img
                className="sidebar-avatar"
                src="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=120"
                alt="User avatar"
              />
            </div>
            <div className="sidebar-user-name">Jonny Alvarez</div>
            <div className="sidebar-user-email">Administrador</div>
          </div>

          <div className="sidebar-menu-label">MENÚ</div>

          <nav className="sidebar-nav">
            <div 
              className={`nav-item ${currentView === 'home' ? 'active' : ''}`} 
              onClick={navigateToHome}
            >
              <div className="nav-item-content">
                <span className="nav-icon"><FiHome size={10} /></span>
                <span className="nav-text">Inicio</span>
              </div>
            </div>

            <div 
              className={`nav-item ${currentView === 'bodega' ? 'active' : ''}`} 
              onClick={navigateToBodega}
            >
              <div className="nav-item-content">
                <span className="nav-icon"><FiBox size={10} /></span>
                <span className="nav-text">Bodega</span>
              </div>
            </div>

            <div 
              className={`nav-item ${currentView === 'agotados' ? 'active' : ''}`} 
              onClick={navigateToAgotados}
            >
              <div className="nav-item-content">
                <span className="nav-icon"><FiSlash size={10} /></span>
                <span className="nav-text">Agotados</span>
              </div>
            </div>

            {/* Nav item simple para Tareas (sin plegado) */}
            <div 
              className={`nav-item ${['tareas','tareas-completadas','tareas-pendientes'].includes(currentView) ? 'active' : ''}`} 
              onClick={() => setCurrentView('tareas')}
            >
              <div className="nav-item-content">
                <span className="nav-icon"><FiCheckSquare size={10} /></span>
                <span className="nav-text">Tareas</span>
              </div>
            </div>
            
            <div 
              className={`nav-item ${currentView === 'pedidos' ? 'active' : ''}`} 
              onClick={() => setCurrentView('pedidos')}
            >
              <div className="nav-item-content">
                <span className="nav-icon"><FiShoppingBag size={10} /></span>
                <span className="nav-text">Pedidos</span>
              </div>
            </div>
          </nav>

          {/* Sección Opiniones (subida bajo Menú) */}
          <div className="sidebar-menu-label">Opiniones</div>
          <nav className="sidebar-nav">
            <div 
              className={`nav-item ${currentView === 'valoraciones' ? 'active' : ''}`} 
              onClick={() => setCurrentView('valoraciones')}
            >
              <div className="nav-item-content">
                <span className="nav-icon"><FiStar size={10} /></span>
                <span className="nav-text">Valoraciones</span>
              </div>
            </div>
            <div 
              className={`nav-item ${currentView === 'top-vinos' ? 'active' : ''}`} 
              onClick={() => setCurrentView('top-vinos')}
            >
              <div className="nav-item-content">
                <span className="nav-icon"><FiTrendingUp size={10} /></span>
                <span className="nav-text">Top Vinos</span>
              </div>
            </div>
          </nav>

          {/* Sección adicional: Acerca de / Ayuda / IA */}
          <div className="sidebar-menu-label">Acerca de</div>
          <nav className="sidebar-nav">
            <div 
              className={`nav-item ${currentView === 'ajustes' ? 'active' : ''}`} 
              onClick={() => setCurrentView('ajustes')}
            >
              <div className="nav-item-content">
                <span className="nav-icon"><FiSettings size={10} /></span>
                <span className="nav-text">Ajustes</span>
              </div>
            </div>
            <div 
              className={`nav-item ${currentView === 'ayuda' ? 'active' : ''}`} 
              onClick={() => setCurrentView('ayuda')}
            >
              <div className="nav-item-content">
                <span className="nav-icon"><FiBell size={10} /></span>
                <span className="nav-text">Notificaciones</span>
              </div>
            </div>
            <div 
              className={`nav-item ${currentView === 'ia' ? 'active' : ''}`} 
              onClick={() => setCurrentView('ia')}
            >
              <div className="nav-item-content">
                <span className="nav-icon"><FiCpu size={10} /></span>
                <span className="nav-text">IA</span>
              </div>
            </div>
          </nav>

          {/* Logout */}
          <div className="sidebar-logout nav-item">
            <div className="nav-item-content">
              <span className="nav-icon"><FiLogOut size={10} /></span>
              <span className="nav-text">Cerrar sesión</span>
            </div>
          </div>

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
              <div 
                className="mobile-nav-item" 
                onClick={() => { navigateToHome(); setIsMenuOpen(false); }}
              >
                <span className="mobile-nav-icon"><FiHome /></span>
                <span className="mobile-nav-text">Inicio</span>
              </div>
              <div 
                className="mobile-nav-item" 
                onClick={() => { navigateToBodega(); setIsMenuOpen(false); }}
              >
                <span className="mobile-nav-icon"><TbWine /></span>
                <span className="mobile-nav-text">Bodega</span>
              </div>
              <div 
                className="mobile-nav-item" 
                onClick={() => { navigateToAgotados(); setIsMenuOpen(false); }}
              >
                <span className="mobile-nav-icon"><TbCircleX /></span>
                <span className="mobile-nav-text">Agotados</span>
              </div>
              <div 
                className="mobile-nav-item" 
                onClick={() => { setCurrentView('tareas'); setIsMenuOpen(false); }}
              >
                <span className="mobile-nav-icon"><TbChecklist /></span>
                <span className="mobile-nav-text">Tareas</span>
              </div>
              <div 
                className="mobile-nav-item" 
                onClick={() => { setCurrentView('pedidos'); setIsMenuOpen(false); }}
              >
                <span className="mobile-nav-icon"><TbReceipt2 /></span>
                <span className="mobile-nav-text">Pedidos</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">
        {/* Vista Home */}
        {currentView === 'home' && (
          <div key="home-view" className="content view-enter">
            <section className="hero-section">
              <div className="hero-dashboard">
                <div className="hero-summary">
                  <h2 className="hero-summary-title">Panel de tu bodega</h2>
                  <p className="hero-summary-text">
                    Revisa de un vistazo cómo se mueve el vino: qué días vendes más, qué meses destacan y qué
                    referencias están tirando del stock.
                  </p>
                  <div className="hero-summary-stats">
                    <div className="hero-summary-pill">
                      <span className="pill-label">Ventas hoy</span>
                      <span className="pill-value">+38 botellas</span>
                    </div>
                    <div className="hero-summary-pill">
                      <span className="pill-label">Vinos en stock</span>
                      <span className="pill-value">124</span>
                    </div>
                    <div className="hero-summary-pill">
                      <span className="pill-label">Alertas de agotado</span>
                      <span className="pill-value pill-value-warn">3</span>
                    </div>
                  </div>
                </div>

                <div className="hero-charts">
                  <article className="hero-chart-card large">
                    <div className="hero-chart-header">
                      <span>Días con más ventas</span>
                      <span className="hero-chart-badge">Últimos 7 días</span>
                    </div>
                    <div className="hero-chart-bars">
                      {[40, 70, 55, 90, 65, 50, 80].map((height, idx) => (
                        <div key={idx} className="hero-chart-bar-wrapper">
                          <div
                            className="hero-chart-bar"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="hero-chart-axis">
                      {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
                        <span key={d}>{d}</span>
                      ))}
                    </div>
                  </article>

                  <article className="hero-chart-card">
                    <div className="hero-chart-header">
                      <span>Meses fuertes</span>
                      <span className="hero-chart-badge soft">Año actual</span>
                    </div>
                    <div className="hero-chart-grid">
                      {['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map(
                        (m, idx) => (
                          <div
                            key={m}
                            className={`hero-chart-cell ${idx % 3 === 0 ? 'high' : idx % 2 === 0 ? 'mid' : 'low'
                              }`}
                          >
                            <span>{m}</span>
                          </div>
                        )
                      )}
                    </div>
                  </article>

                  <article className="hero-chart-card">
                    <div className="hero-chart-header">
                      <span>Categorías clave</span>
                    </div>
                    <div className="hero-chart-pie">
                      <div className="hero-pie-inner" />
                      <div className="hero-pie-legend">
                        <div className="legend-row">
                          <span className="legend-dot verde" />
                          <span>Blancos &nbsp; · &nbsp; 35%</span>
                        </div>
                        <div className="legend-row">
                          <span className="legend-dot violeta" />
                          <span>Tintos &nbsp; · &nbsp; 45%</span>
                        </div>
                        <div className="legend-row">
                          <span className="legend-dot rosa" />
                          <span>Espumosos &nbsp; · &nbsp; 20%</span>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            </section>

            {/* Zona extra de gráficas bajo el hero */}
            <section className="home-analytics-section">
              <div className="home-analytics-main">
                <div className="home-analytics-header">
                  <span className="home-analytics-title">Evolución de ventas</span>
                  <span className="home-analytics-subtitle">Últimos 30 días</span>
                </div>
                <div className="home-analytics-chart">
                  <div className="home-analytics-yaxis">
                    {['300k', '290k', '280k', '270k'].map((tick) => (
                      <span key={tick}>{tick}</span>
                    ))}
                  </div>
                  <div className="home-analytics-bars">
                    {[
                      { day: 'Lun', value: 60, tone: 'neutral' },
                      { day: 'Mar', value: 68, tone: 'neutral-strong' },
                      { day: 'Mié', value: 60, tone: 'neutral' },
                      { day: 'Jue', value: 56, tone: 'neutral-soft' },
                      { day: 'Vie', value: 72, tone: 'positive-strong' },
                      { day: 'Sáb', value: 66, tone: 'positive' },
                      { day: 'Dom', value: 48, tone: 'low' },
                    ].map(({ day, value, tone }) => (
                      <div key={day} className="home-analytics-bar-wrapper">
                        <div
                          className={`home-analytics-bar ${tone}`}
                          style={{ height: `${Math.max(0, Math.min(1, (value - 40) / 30)) * 100}%` }}
                        />
                        <span className="home-analytics-day">{day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="home-analytics-side">
                <article className="home-mini-card">
                  <div className="home-mini-header">
                    <span>Rotación por sesión</span>
                  </div>
                  <div className="home-mini-body">
                    <div className="home-mini-ring">
                      <div className="home-mini-ring-inner">3.2x</div>
                    </div>
                    <div className="home-mini-legend">
                      <span>Media de botellas por servicio</span>
                    </div>
                  </div>
                </article>

                <article className="home-mini-card">
                  <div className="home-mini-header">
                    <span>Ocupación</span>
                  </div>
                  <div className="home-mini-body">
                    <div className="home-mini-gauge">
                      <div className="home-mini-gauge-fill" />
                    </div>
                    <div className="home-mini-legend">
                      <span>85% mesas activas en las horas punta</span>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            {/* Tira de métricas de resumen de vinos */}
            <section className="home-metrics-section">
              <div className="home-metrics-row">
                <div className="home-metric">
                  <span className="home-metric-label">Vinos vendidos</span>
                  <span className="home-metric-value">5.097</span>
                  <div className="home-metric-trend home-metric-trend-positive">
                    <span className="home-metric-trend-icon">▲</span>
                    <span>+12,4%</span>
                  </div>
                </div>
                <div className="home-metric">
                  <span className="home-metric-label">Tintos vendidos</span>
                  <span className="home-metric-value">2.843</span>
                  <div className="home-metric-trend home-metric-trend-positive">
                    <span className="home-metric-trend-icon">▲</span>
                    <span>+8,9%</span>
                  </div>
                </div>
                <div className="home-metric">
                  <span className="home-metric-label">Blancos vendidos</span>
                  <span className="home-metric-value">1.562</span>
                  <div className="home-metric-trend home-metric-trend-negative">
                    <span className="home-metric-trend-icon">▼</span>
                    <span>-3,1%</span>
                  </div>
                </div>
                <div className="home-metric">
                  <span className="home-metric-label">Espumosos vendidos</span>
                  <span className="home-metric-value">692</span>
                  <div className="home-metric-trend home-metric-trend-positive">
                    <span className="home-metric-trend-icon">▲</span>
                    <span>+4,6%</span>
                  </div>
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

        {/* Vista Tareas */}
        {currentView === 'tareas' && (
          <div key="tareas-view" className="content view-enter">
            <div className="section section-full tareas-section">
              <div className="section-header tareas-header">
                <h2 className="section-title">Tareas</h2>
                <div className="tareas-header-badge">HOY</div>
              </div>

              {/* Botones de sesión de tareas (provisional) */}
              <div className="tareas-actions-row">
                <button
                  className="tareas-action-btn primary"
                  onClick={() => setCurrentView('tareas-pendientes')}
                >
                  Pendientes
                </button>
                <button
                  className="tareas-action-btn"
                  onClick={() => setCurrentView('tareas-completadas')}
                >
                  Completadas
                </button>
                <button
                  className="tareas-action-btn"
                  onClick={() => setCurrentView('tareas')}
                >
                  Todas
                </button>
              </div>

              {/* Resumen rápido de tareas */}
              <div className="tareas-summary">
                <div className="tarea-card pendientes">
                  <span className="tarea-card-label">Pendientes</span>
                  <span className="tarea-card-value">8</span>
                </div>
                <div className="tarea-card en-progreso">
                  <span className="tarea-card-label">En progreso</span>
                  <span className="tarea-card-value">3</span>
                </div>
                <div className="tarea-card completadas">
                  <span className="tarea-card-label">Completadas</span>
                  <span className="tarea-card-value">21</span>
                </div>
              </div>

              <p className="settings-placeholder tareas-placeholder">
                Diseño provisional de la vista de tareas. Aquí luego podrás listar y gestionar tus tareas reales.
              </p>
            </div>
          </div>
        )}

        {/* Vista Tareas Completadas */}
        {currentView === 'tareas-completadas' && (
          <div key="tareas-completadas-view" className="content view-enter">
            <div className="section section-full tareas-section">
              <div className="section-header tareas-header">
                <h2 className="section-title">Tareas</h2>
                <div className="tareas-header-badge">COMPLETADAS</div>
              </div>

              <div className="tareas-actions-row">
                <button
                  className="tareas-action-btn"
                  onClick={() => setCurrentView('tareas-pendientes')}
                >
                  Pendientes
                </button>
                <button
                  className="tareas-action-btn primary"
                  onClick={() => setCurrentView('tareas-completadas')}
                >
                  Completadas
                </button>
                <button
                  className="tareas-action-btn"
                  onClick={() => setCurrentView('tareas')}
                >
                  Todas
                </button>
              </div>

              <div className="tareas-summary">
                <div className="tarea-card completadas">
                  <span className="tarea-card-label">Completadas hoy</span>
                  <span className="tarea-card-value">5</span>
                </div>
                <div className="tarea-card completadas">
                  <span className="tarea-card-label">Esta semana</span>
                  <span className="tarea-card-value">12</span>
                </div>
                <div className="tarea-card completadas">
                  <span className="tarea-card-label">Total</span>
                  <span className="tarea-card-value">21</span>
                </div>
              </div>

              <p className="settings-placeholder tareas-placeholder">
                Aquí verás el detalle de todas las tareas completadas. De momento es solo un diseño de ejemplo.
              </p>
            </div>
          </div>
        )}

        {/* Vista Tareas Pendientes */}
        {currentView === 'tareas-pendientes' && (
          <div key="tareas-pendientes-view" className="content view-enter">
            <div className="section section-full tareas-section">
              <div className="section-header tareas-header">
                <h2 className="section-title">Tareas</h2>
                <div className="tareas-header-badge">PENDIENTES</div>
              </div>

              <div className="tareas-actions-row">
                <button
                  className="tareas-action-btn primary"
                  onClick={() => setCurrentView('tareas-pendientes')}
                >
                  Pendientes
                </button>
                <button
                  className="tareas-action-btn"
                  onClick={() => setCurrentView('tareas-completadas')}
                >
                  Completadas
                </button>
                <button
                  className="tareas-action-btn"
                  onClick={() => setCurrentView('tareas')}
                >
                  Todas
                </button>
              </div>

              <div className="tareas-summary">
                <div className="tarea-card pendientes">
                  <span className="tarea-card-label">Pendientes hoy</span>
                  <span className="tarea-card-value">4</span>
                </div>
                <div className="tarea-card pendientes">
                  <span className="tarea-card-label">Para esta semana</span>
                  <span className="tarea-card-value">8</span>
                </div>
                <div className="tarea-card en-progreso">
                  <span className="tarea-card-label">En progreso</span>
                  <span className="tarea-card-value">3</span>
                </div>
              </div>

              <p className="settings-placeholder tareas-placeholder">
                Aquí verás el detalle de lo que te queda por hacer. Por ahora solo mostramos un resumen demo.
              </p>
            </div>
          </div>
        )}

        {/* Vista Pedidos */}
        {currentView === 'pedidos' && (
          <div key="pedidos-view" className="content view-enter">
            <div className="section section-full">
              <div className="section-header">
                <h2 className="section-title">Pedidos</h2>
              </div>
              <p className="settings-placeholder">Sección en preparación. Aquí verás y gestionarás pedidos.</p>
            </div>
          </div>
        )}

        {/* Vista Ajustes */}
        {currentView === 'ajustes' && (
          <div key="ajustes-view" className="content view-enter">
            <div className="section section-full">
              <div className="section-header">
                <h2 className="section-title">Ajustes</h2>
              </div>
              <p className="settings-placeholder">
                Aquí podrás configurar la experiencia de VinosStK: preferencias de vista, notificaciones y más.
              </p>
            </div>
          </div>
        )}

        {/* Vista Notificaciones (antes Ayuda) */}
        {currentView === 'ayuda' && (
          <div key="notificaciones-view" className="content view-enter">
            <div className="section section-full">
              <div className="section-header">
                <h2 className="section-title">Notificaciones</h2>
              </div>
              <p className="settings-placeholder">
                Aquí verás tus alertas recientes sobre vinos agotados, novedades y recordatorios importantes.
              </p>
            </div>
          </div>
        )}

        {/* Vista IA con chat embebido */}
        {currentView === 'ia' && (
          <div key="ia-view" className="content view-enter">
            <div className="section section-full">
              {/* Hero + chips de acciones rápidas: visibles solo antes del primer mensaje */}
              <div className={`ia-quick-wrapper ${chatMessages.length > 0 ? 'ia-quick-hide' : ''}`}>
                <div className="ia-hero">
                  <h2 className="ia-hero-title">Bienvenido a VinosStK IA</h2>
                  <p className="ia-hero-subtitle">
                    Explora preguntas sugeridas o pregúntanos lo que quieras sobre tu bodega y tus vinos.
                  </p>
                </div>

                <div className="ia-quick-actions">
                  <button
                    className="ia-quick-chip"
                    onClick={() => handleSuggestedOption('Ver vinos disponibles')}
                  >
                    <span className="ia-quick-chip-icon"><FiBox size={10} /></span>
                    <span>Disponibles</span>
                  </button>
                  <button
                    className="ia-quick-chip"
                    onClick={() => handleSuggestedOption('Vinos agotados')}
                  >
                    <span className="ia-quick-chip-icon"><FiSlash size={10} /></span>
                    <span>Agotados</span>
                  </button>
                  <button
                    className="ia-quick-chip"
                    onClick={() => handleSuggestedOption('Ofertas especiales')}
                  >
                    <span className="ia-quick-chip-icon"><FiTag size={10} /></span>
                    <span>Ofertas</span>
                  </button>
                  <button
                    className="ia-quick-chip"
                    onClick={() => handleSuggestedOption('Vinos más vendidos')}
                  >
                    <span className="ia-quick-chip-icon"><FiTrendingUp size={10} /></span>
                    <span>Top ventas</span>
                  </button>
                  <button
                    className="ia-quick-chip"
                    onClick={() => handleSuggestedOption('Mejores valorados')}
                  >
                    <span className="ia-quick-chip-icon"><FiStar size={10} /></span>
                    <span>Mejor valorados</span>
                  </button>
                  <button
                    className="ia-quick-chip"
                    onClick={() => handleSuggestedOption('Pedidos pendientes')}
                  >
                    <span className="ia-quick-chip-icon"><FiShoppingBag size={10} /></span>
                    <span>Pedidos</span>
                  </button>
                  <button
                    className="ia-quick-chip"
                    onClick={() => handleSuggestedOption('Recomendaciones de hoy')}
                  >
                    <span className="ia-quick-chip-icon"><FiCpu size={10} /></span>
                    <span>Recomendados</span>
                  </button>
                  <button
                    className="ia-quick-chip"
                    onClick={() => handleSuggestedOption('Vinos con poco stock')}
                  >
                    <span className="ia-quick-chip-icon"><FiSlash size={10} /></span>
                    <span>Stock bajo</span>
                  </button>
                  <button
                    className="ia-quick-chip"
                    onClick={() => handleSuggestedOption('Nuevos vinos en la bodega')}
                  >
                    <span className="ia-quick-chip-icon"><FiBox size={10} /></span>
                    <span>Nuevos vinos</span>
                  </button>
                </div>
              </div>

              <div className="ia-chat-container">
                <div className="chat-messages ia-chat-messages" ref={chatMessagesContainerRef}>
                  {chatMessages.length > 0 && (
                    chatMessages.map(msg => (
                      <div key={msg.id} className={`chat-message-container ${msg.sender}`}>
                        <span className="chat-message-icon">
                          {msg.sender === 'user' ? (
                            <img
                              src="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=80"
                              alt="User avatar"
                              className="chat-avatar"
                            />
                          ) : (
                            <FiCpu size={12} />
                          )}
                        </span>
                        <div className="chat-message">
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="chat-input-container ia-chat-input">
                  <div className="chat-input-wrapper">
                    <input
                      type="text"
                      className="chat-input"
                      placeholder="Escribe tu mensaje..."
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
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vista Valoraciones */}
        {currentView === 'valoraciones' && (
          <div key="valoraciones-view" className="content view-enter">
            <div className="section section-full">
              <div className="section-header">
                <h2 className="section-title">Valoraciones</h2>
              </div>
              <p className="settings-placeholder">
                Aquí podrás ver y gestionar las valoraciones de tus clientes sobre los vinos.
              </p>
            </div>
          </div>
        )}

        {/* Vista Top Vinos */}
        {currentView === 'top-vinos' && (
          <div key="top-vinos-view" className="content view-enter">
            <div className="section section-full">
              <div className="section-header">
                <h2 className="section-title">Top Vinos</h2>
              </div>
              <p className="settings-placeholder">
                Sección en preparación para mostrar los vinos mejor valorados y más vendidos.
              </p>
            </div>
          </div>
        )}
        
      </div>
      </div>
     
    </div>


    {/* Panel de Notificaciones */}
    {showNotifications && (
      <div 
        className="notifications-overlay"
        onClick={() => setShowNotifications(false)}
      >
        <div 
          className={`notifications-panel ${settings.compactNotifications ? 'notifications-compact' : ''}`}
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
                  <div className="notification-icon"><AiOutlineWarning size={14} /></div>
                  <div className="notification-content">
                    {(() => {
                      const parts = notification.message.split('.')
                      const primary = parts.shift()?.trim() || ''
                      const secondary = parts.join('.').trim()
                      return (
                        <p className="notification-text">
                          <span className="notification-primary">{primary}{primary && '.'}</span>
                          {secondary && (
                            <span className="notification-secondary"> {secondary}</span>
                          )}
                        </p>
                      )
                    })()}
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

    {/* Modal de Ajustes */}
    {isSettingsOpen && (
      <div className="settings-overlay" onClick={() => setIsSettingsOpen(false)}>
        <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
          <div className="settings-header">
            {settingsView !== 'menu' && (
              <button className="settings-back header-back" onClick={() => { setSettingsTransition('back'); setSettingsView('menu') }}><FaArrowAltCircleLeft size={16} /></button>
            )}
            <h3>{settingsView === 'menu' ? 'Ajustes' : `Ajustes / ${settingsView.charAt(0).toUpperCase() + settingsView.slice(1)}`}</h3>
            <button className="settings-close" onClick={() => setIsSettingsOpen(false)}>✕</button>
          </div>
          <div className="settings-content">
            {settingsView === 'menu' && (
              <div className={`settings-menu settings-section ${settingsTransition === 'back' ? 'back' : ''}`}>
                <button className="menu-btn" onClick={() => { setSettingsTransition('forward'); setSettingsView('vista') }}>Vista</button>
                <button className="menu-btn" onClick={() => { setSettingsTransition('forward'); setSettingsView('notificaciones') }}>Notificaciones</button>
                <button className="menu-btn" onClick={() => { setSettingsTransition('forward'); setSettingsView('apariencia') }}>Apariencia</button>
                <button className="menu-btn" onClick={() => { setSettingsTransition('forward'); setSettingsView('acerca') }}>Acerca de</button>
              </div>
            )}

            {settingsView === 'vista' && (
              <div className={`settings-section ${settingsTransition}`} key={settingsView}>
                <label className="setting-row">
                  <input type="checkbox" checked={settings.autoScrollCarousel} onChange={(e) => setSettings(s => ({...s, autoScrollCarousel: e.target.checked}))} />
                  <span>Animar carrusel de "Nuestros vinos"</span>
                </label>
                <label className="setting-row">
                  <input type="checkbox" checked={settings.markReadOnOpen} onChange={(e) => setSettings(s => ({...s, markReadOnOpen: e.target.checked}))} />
                  <span>Marcar notificaciones como leídas al abrir</span>
                </label>
                <label className="setting-row">
                  <input type="checkbox" checked={settings.lockScrollOnNotifications} onChange={(e) => setSettings(s => ({...s, lockScrollOnNotifications: e.target.checked}))} />
                  <span>Bloquear scroll del fondo con notificaciones abiertas</span>
                </label>
                <label className="setting-row">
                  <input type="checkbox" checked={settings.showUnreadBadge} onChange={(e) => setSettings(s => ({...s, showUnreadBadge: e.target.checked}))} />
                  <span>Mostrar contador en campana</span>
                </label>
              </div>
            )}

            {(settingsView === 'notificaciones' || settingsView === 'apariencia' || settingsView === 'acerca') && (
              <div className={`settings-section ${settingsTransition}`} key={settingsView}>
                <p className="settings-placeholder">Sección en preparación. Próximamente más opciones.</p>
              </div>
            )}
          </div>
          <div className="settings-footer">
            {settingsView !== 'menu' ? (
              <button className="settings-primary" onClick={() => setIsSettingsOpen(false)}>Guardar</button>
            ) : (
              <button className="settings-primary" onClick={() => setIsSettingsOpen(false)}>Cerrar</button>
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

