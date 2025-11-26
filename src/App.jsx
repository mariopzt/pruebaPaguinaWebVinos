import './App.css'
import { useState, useEffect, useRef } from 'react'
import { IoSend } from 'react-icons/io5'
import { AiOutlineWarning } from 'react-icons/ai'
import { FiHome, FiShoppingBag, FiBox, FiSlash, FiCheckSquare, FiChevronDown, FiChevronUp, FiHelpCircle, FiCpu, FiUser, FiStar, FiTrendingUp, FiLogOut, FiTag, FiSettings, FiBell } from 'react-icons/fi'
import { FaArrowAltCircleLeft } from 'react-icons/fa'
import Bodega from './components/Bodega/Bodega'
import Agotados from './components/Bodega/Agotados'
import WineModal from './components/Bodega/WineModal'
import AddWineModal from './components/Bodega/AddWineModal'
import { winesData } from './data/winesData'

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentView, setCurrentView] = useState('home') // 'home', 'bodega', o 'agotados'
  const [selectedWine, setSelectedWine] = useState(null)
  const [showAddWineModal, setShowAddWineModal] = useState(false)
  const [wineListVersion, setWineListVersion] = useState(0)
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
  const [tasksFilter, setTasksFilter] = useState('hoy')
  const [currentGuideSet, setCurrentGuideSet] = useState(0)

  const taskFilters = [
    { id: 'hoy', label: 'Hoy' },
    { id: 'ayer', label: 'Ayer' },
    { id: 'semana', label: 'Semana' },
    { id: 'mes', label: 'Mes' },
    { id: 'nueva', label: '+ Nueva tarea' },
  ]

  const sampleTasks = [
    {
      id: 1,
      title: 'Revisar stock de tintos',
      description: 'Comprueba las referencias con menos de 10 botellas y prepara una propuesta de reposición.',
      group: 'hoy',
      comments: 3,
      attachments: 1,
      initials: 'ST',
      timeLabel: 'Hace 10 min',
    },
    {
      id: 2,
      title: 'Actualizar carta de vinos por copa',
      description: 'Añadir las nuevas referencias sugeridas por la IA y retirar las de rotación lenta.',
      group: 'hoy',
      comments: 1,
      attachments: 0,
      initials: 'CV',
      timeLabel: 'Hace 25 min',
    },
    {
      id: 3,
      title: 'Analizar ventas del fin de semana',
      description: 'Revisar qué vinos han tenido mejor salida para ajustar recomendaciones.',
      group: 'ayer',
      comments: 2,
      attachments: 2,
      initials: 'VS',
      timeLabel: 'Ayer',
    },
    {
      id: 4,
      title: 'Planificar cata interna del equipo',
      description: 'Seleccionar 6 vinos y preparar una mini ficha para el personal de sala.',
      group: 'semana',
      comments: 0,
      attachments: 1,
      initials: 'CE',
      timeLabel: 'Esta semana',
    },
  ]

  const filteredTasks =
    tasksFilter === 'hoy'
      ? sampleTasks.filter((t) => t.group === 'hoy')
      : tasksFilter === 'ayer'
        ? sampleTasks.filter((t) => t.group === 'ayer')
        : sampleTasks

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

  // Agregar nuevo vino
  const handleAddWine = (newWine) => {
    winesData.push(newWine)
    setShowAddWineModal(false)
    // Incrementar versión para forzar re-render
    setWineListVersion(prev => prev + 1)
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

  // Rotar guías cada 10 minutos (600000 ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGuideSet(prev => (prev + 1) % 2)
    }, 600000) // 10 minutos
    return () => clearInterval(interval)
  }, [])

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
            {/* Sección de Guías de Uso */}
            <section className="guides-section">
              <div className="guides-container">
                {currentGuideSet === 0 ? (
                  <>
                    {/* Primer set de guías */}
                    <article className="guide-card">
                      <div className="guide-icon-wrapper">
                        <div className="guide-icon blue">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9 22 9 12 15 12 15 22"/>
                          </svg>
                        </div>
                      </div>
                      <div className="guide-content">
                        <h3 className="guide-title">Navegación Principal</h3>
                        <p className="guide-description">
                          Utiliza el menú lateral para acceder a las diferentes secciones: <strong>Bodega</strong> para ver todos tus vinos disponibles, 
                          <strong> Agotados</strong> para gestionar el stock, y <strong>Tareas</strong> para organizar tu trabajo diario.
                        </p>
                        <div className="guide-steps">
                          <div className="guide-step">
                            <span className="step-number">1</span>
                            <span className="step-text">Haz clic en cualquier sección del menú lateral</span>
                          </div>
                          <div className="guide-step">
                            <span className="step-number">2</span>
                            <span className="step-text">Explora el contenido de cada vista</span>
                          </div>
                          <div className="guide-step">
                            <span className="step-number">3</span>
                            <span className="step-text">Regresa a Inicio cuando quieras</span>
                          </div>
                        </div>
                      </div>
                    </article>

                    <article className="guide-card">
                      <div className="guide-icon-wrapper">
                        <div className="guide-icon purple">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                            <line x1="12" y1="22.08" x2="12" y2="12"/>
                          </svg>
                        </div>
                      </div>
                      <div className="guide-content">
                        <h3 className="guide-title">Gestión de Bodega</h3>
                        <p className="guide-description">
                          En la sección <strong>Bodega</strong>, puedes ver todos tus vinos, filtrarlos por tipo y acceder a información detallada. 
                          Haz clic en cualquier vino para ver su ficha completa con precio, origen y características.
                        </p>
                        <div className="guide-steps">
                          <div className="guide-step">
                            <span className="step-number">1</span>
                            <span className="step-text">Accede a la sección Bodega desde el menú</span>
                          </div>
                          <div className="guide-step">
                            <span className="step-number">2</span>
                            <span className="step-text">Usa los filtros para encontrar vinos específicos</span>
                          </div>
                          <div className="guide-step">
                            <span className="step-number">3</span>
                            <span className="step-text">Haz clic en un vino para ver todos sus detalles</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </>
                ) : (
                  <>
                    {/* Segundo set de guías */}
                    <article className="guide-card">
                      <div className="guide-icon-wrapper">
                        <div className="guide-icon green">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                          </svg>
                        </div>
                      </div>
                      <div className="guide-content">
                        <h3 className="guide-title">Asistente IA</h3>
                        <p className="guide-description">
                          El <strong>Asistente IA</strong> te ayuda a gestionar tu bodega de forma inteligente. Pregúntale sobre disponibilidad, 
                          recomendaciones, análisis de ventas y mucho más. Está disponible 24/7 para responder tus consultas.
                        </p>
                        <div className="guide-steps">
                          <div className="guide-step">
                            <span className="step-number">1</span>
                            <span className="step-text">Accede a la sección IA desde el menú</span>
                          </div>
                          <div className="guide-step">
                            <span className="step-number">2</span>
                            <span className="step-text">Escribe tu pregunta o usa las opciones rápidas</span>
                          </div>
                          <div className="guide-step">
                            <span className="step-number">3</span>
                            <span className="step-text">Recibe respuestas instantáneas y precisas</span>
                          </div>
                        </div>
                      </div>
                    </article>

                    <article className="guide-card">
                      <div className="guide-icon-wrapper">
                        <div className="guide-icon orange">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                          </svg>
                        </div>
                      </div>
                      <div className="guide-content">
                        <h3 className="guide-title">Notificaciones y Alertas</h3>
                        <p className="guide-description">
                          Mantente informado con el sistema de <strong>Notificaciones</strong>. Recibe alertas cuando un vino se agota, 
                          cuando hay nuevas tareas pendientes o cuando necesitas realizar acciones importantes en tu bodega.
                        </p>
                        <div className="guide-steps">
                          <div className="guide-step">
                            <span className="step-number">1</span>
                            <span className="step-text">Revisa el icono de campana en el menú</span>
                          </div>
                          <div className="guide-step">
                            <span className="step-number">2</span>
                            <span className="step-text">Haz clic en las notificaciones para más detalles</span>
                          </div>
                          <div className="guide-step">
                            <span className="step-number">3</span>
                            <span className="step-text">Configura tus preferencias en Ajustes</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </>
                )}
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
                  <div key={`bodega-view-${wineListVersion}`} className="view-enter">
                    <Bodega 
                      onNavigateHome={navigateToHome} 
                      onSelectWine={setSelectedWine}
                      onOpenAddWine={() => setShowAddWineModal(true)}
                    />
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

              {/* Barra de filtros tipo chips */}
              <div className="tareas-filter-bar">
                {taskFilters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    className={`tareas-filter-chip ${tasksFilter === filter.id ? 'active' : ''}`}
                    onClick={() => setTasksFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Botones de sesión de tareas (pendientes / completadas / todas) */}
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

              {/* Lista de tareas estilo cards */}
              <div className="tareas-list">
                {filteredTasks.map((task) => (
                  <article key={task.id} className="tarea-item-card">
                    <header className="tarea-item-header">
                      <div className="tarea-item-header-left">
                        <span className="tarea-item-initial-pill">{task.initials}</span>
                        <h3 className="tarea-item-title">{task.title}</h3>
                      </div>
                      <span className="tarea-item-time">{task.timeLabel}</span>
                    </header>
                    <p className="tarea-item-description">{task.description}</p>
                    <footer className="tarea-item-footer">
                      <div className="tarea-item-meta">
                        <span className="tarea-item-pill">
                          {task.group === 'hoy' && 'Hoy'}
                          {task.group === 'ayer' && 'Ayer'}
                          {task.group === 'semana' && 'Esta semana'}
                        </span>
                        <span className="tarea-item-meta-text">
                          {task.attachments > 0 && `${task.attachments} adj.`}
                          {task.attachments > 0 && task.comments > 0 && ' · '}
                          {task.comments > 0 && `${task.comments} comentarios`}
                        </span>
                      </div>
                      <div className="tarea-item-avatars">
                        <span className="tarea-avatar-circle" />
                        <span className="tarea-avatar-circle secondary" />
                      </div>
                    </footer>
                  </article>
                ))}
              </div>
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

    {/* Modal de agregar vino - fuera del contenedor principal */}
    {showAddWineModal && (
      <AddWineModal
        onClose={() => setShowAddWineModal(false)}
        onAddWine={handleAddWine}
      />
    )}
    </>
  )
}

export default App

