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
              <div className="hero-card">
                <div className="hero-bg" />
                <div className="hero-content">
                  <h2 className="hero-title">
                    Las Uvas de Nuestra Bodega: Tradición y Sabor
                  </h2>
                  <p className="hero-subtitle">
                    Bienvenido a nuestra bodega, un espacio donde tradición y pasión se unen para crear vinos únicos.
                    Explora una selección cuidada, llena de carácter, aroma y sabor incomparable. Sumérgete en una
                    experiencia pensada para quienes disfrutan cada detalle del buen vino.
                  </p>
                  <div className="hero-grape-grid">
                    <div className="hero-grape-card">
                      <h3 className="hero-grape-title">Monastrell</h3>
                      <ul className="hero-grape-list">
                        <li>Regiones: Murcia, Alicante, Yecla.</li>
                        <li>Potente, frutos negros, cuerpo intenso.</li>
                        <li>Perfecta para vinos robustos.</li>
                      </ul>
                    </div>
                    <div className="hero-grape-card">
                      <h3 className="hero-grape-title">Garnacha</h3>
                      <ul className="hero-grape-list">
                        <li>Regiones: Aragón, Navarra, Priorat.</li>
                        <li>Dulce, afrutada, notas de fresa y especias.</li>
                        <li>Ideal para vinos jóvenes y rosados.</li>
                      </ul>
                    </div>
                    <div className="hero-grape-card">
                      <h3 className="hero-grape-title">Tempranillo</h3>
                      <ul className="hero-grape-list">
                        <li>Regiones: Rioja, Ribera del Duero, La Mancha.</li>
                        <li>Frutos rojos, tabaco, cuero.</li>
                        <li>Versátil para crianza en barrica.</li>
                      </ul>
                    </div>
                    <div className="hero-grape-card">
                      <h3 className="hero-grape-title">Mencía</h3>
                      <ul className="hero-grape-list">
                        <li>Regiones: Bierzo, Galicia.</li>
                        <li>Elegante, frutos rojos y florales.</li>
                        <li>Vinos frescos, aromáticos y suaves.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Sección de métricas de la bodega */}
            <section className="heritage-section">
              <div className="heritage-left">
                <h3 className="heritage-title">De nuestra tierra al mundo</h3>
                

                <div className="heritage-grid">
                  <div className="heritage-card">
                    <div className="heritage-number">120+</div>
                    <div className="heritage-label">Referencias en bodega</div>
                    <p className="heritage-description">
                      Desde blancos jóvenes hasta tintos de guarda y espumosos de celebración.
                    </p>
                  </div>
                  <div className="heritage-card accent">
                    <div className="heritage-number">15+</div>
                    <div className="heritage-label">Denominaciones de origen</div>
                    <p className="heritage-description">
                      Trabajamos con zonas clave para ofrecer variedad sin perder identidad.
                    </p>
                  </div>
                  <div className="heritage-card">
                    <div className="heritage-number">3000+</div>
                    <div className="heritage-label">Botellas gestionadas al año</div>
                    <p className="heritage-description">
                      Controladas desde este panel: stock, rotación y momentos de consumo.
                    </p>
                  </div>
                  <div className="heritage-card">
                    <div className="heritage-number">50+</div>
                    <div className="heritage-label">Cartas personalizadas</div>
                    <p className="heritage-description">
                      Configuradas para restaurantes, eventos y experiencias a medida.
                    </p>
                  </div>
                </div>
              </div>

              <div className="heritage-right">
                <div className="heritage-image-card">
                  <div className="heritage-image" />
                  <div className="heritage-text">
                    <div className="heritage-text-col">
                      <p>
                        VinosStK nace con una idea sencilla: que la gestión de tu bodega sea tan cuidada como el vino
                        que sirves cada día. Aquí conectas stock, cartas y experiencia en un solo lugar.
                      </p>
                    </div>
                    <div className="heritage-text-col">
                      <p>
                        Desde un pequeño local hasta una carta amplia, puedes ver qué se vende, qué falta y qué
                        recomendar, manteniendo siempre la esencia de tu proyecto y lo que tus clientes esperan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Nuestros mejores puntos */}
            <section className="gallery-section">
              <div className="gallery-header">
                <h3 className="gallery-title">Nuestros mejores puntos</h3>
                <p className="gallery-subtitle">
                  Lo que nos diferencia: una bodega pensada para que disfrutes siempre el mejor vino, al mejor precio.
                </p>
              </div>
              <div className="gallery-grid">
                {[
                  {
                    title: 'Gestión de stock',
                    description: 'Controla el inventario de tu bodega, vinos disponibles y agotados desde un solo panel.',
                  },
                  {
                    title: 'Pedidos rápidos',
                    description: 'Visualiza y organiza tus pedidos para reponer stock sin perder de vista ninguna referencia.',
                  },
                  {
                    title: 'Vista de bodega',
                    description: 'Explora tu catálogo completo con fichas, detalles y estados de cada vino.',
                  },
                  {
                    title: 'Panel de tareas',
                    description: 'Organiza tareas pendientes, completadas y generales para el día a día de la bodega.',
                  },
                  {
                    title: 'Alertas y avisos',
                    description: 'Recibe notificaciones sobre vinos agotados, movimientos clave y recordatorios.',
                  },
                  {
                    title: 'IA y recomendaciones',
                    description: 'Consulta a la IA para descubrir vinos, tendencias y sugerencias basadas en tu stock.',
                  },
                ].map((item, index) => (
                  <figure key={index} className="gallery-card">
                    <div className="gallery-icon">
                      {index === 0 && <FiStar size={18} />}
                      {index === 1 && <FiTrendingUp size={18} />}
                      {index === 2 && <FiBox size={18} />}
                      {index === 3 && <FiUser size={18} />}
                      {index === 4 && <FiShoppingBag size={18} />}
                      {index === 5 && <FiCpu size={18} />}
                    </div>
                    <figcaption className="gallery-caption">
                      <div className="gallery-caption-title">{item.title}</div>
                      <div className="gallery-caption-text">{item.description}</div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>

            {/* Carrusel de vinos destacados */}
            <section className="wine-carousel-section">
              <div className="wine-carousel-header">
                <h3 className="wine-carousel-title">Vinos que no te puedes perder</h3>
                <p className="wine-carousel-subtitle">
                  Una selección rápida de botellas clave de tu bodega: ideales para destacar en promociones o recomendaciones.
                </p>
              </div>
              <div className="wine-carousel">
                <div className="wine-carousel-track">
                  {[
                    {
                      name: 'Casal de Armán',
                      type: 'Blanco · Ribeiro',
                      note: 'Perfecto para iniciar la carta con un blanco fresco y aromático.',
                      image: 'https://images.pexels.com/photos/1407855/pexels-photo-1407855.jpeg?auto=compress&cs=tinysrgb&w=640',
                    },
                    {
                      name: 'Mencía Atlántica',
                      type: 'Tinto · Bierzo',
                      note: 'Ideal para maridar con carnes y platos de cuchara en temporada.',
                      image: 'https://images.pexels.com/photos/5947021/pexels-photo-5947021.jpeg?auto=compress&cs=tinysrgb&w=640',
                    },
                    {
                      name: 'Selección Barrica',
                      type: 'Tinto · Crianza',
                      note: 'Vino de carta para ofrecer experiencias más complejas y estructuradas.',
                      image: 'https://images.pexels.com/photos/3952042/pexels-photo-3952042.jpeg?auto=compress&cs=tinysrgb&w=640',
                    },
                    {
                      name: 'Espumoso Brut',
                      type: 'Espumoso · Celebración',
                      note: 'La opción perfecta para brindar en eventos y momentos especiales.',
                      image: 'https://images.pexels.com/photos/3171768/pexels-photo-3171768.jpeg?auto=compress&cs=tinysrgb&w=640',
                    },
                  ].map((wine, index) => (
                    <article key={index} className="wine-feature-card">
                      <div
                        className="wine-feature-image"
                        style={{ backgroundImage: `url(${wine.image})` }}
                      />
                      <div className="wine-feature-content">
                        <span className="wine-feature-type">{wine.type}</span>
                        <h4 className="wine-feature-name">{wine.name}</h4>
                        <p className="wine-feature-note">{wine.note}</p>
                      </div>
                    </article>
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

