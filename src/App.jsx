import './App.css'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { IoSend } from 'react-icons/io5'
import { AiOutlineWarning } from 'react-icons/ai'
import { FiHome, FiShoppingBag, FiBox, FiSlash, FiCheckSquare, FiChevronDown, FiChevronUp, FiHelpCircle, FiCpu, FiUser, FiStar, FiTrendingUp, FiLogOut, FiTag, FiSettings, FiBell, FiMenu, FiPackage, FiMessageSquare, FiCheckCircle, FiHeart, FiRefreshCw, FiWifi, FiDatabase, FiType, FiEye, FiZap, FiFilter } from 'react-icons/fi'
import { FaArrowAltCircleLeft, FaWineBottle } from 'react-icons/fa'
import Bodega from './components/Bodega/Bodega'
import Agotados from './components/Bodega/Agotados'
import WineModal from './components/Bodega/WineModal'
import AddWineModal from './components/Bodega/AddWineModal'
import Login from './components/Login/Login'
import wineService from './api/wineService'
import notificationService from './api/notificationService'
import taskService from './api/taskService'
import orderService from './api/orderService'
import voucherService from './api/voucherService'
import pendingService from './api/pendingService'
import userService from './api/userService'
import statsService from './api/statsService'
import reviewService from './api/reviewService'
import { AIChat } from './components/AIChat'

function App() {
  const DEFAULT_AVATARS = useMemo(
    () => [
      '/avatars/avatar-01.svg',
      '/avatars/avatar-02.svg',
      '/avatars/avatar-03.svg',
      '/avatars/avatar-04.svg',
      '/avatars/avatar-05.svg',
      '/avatars/avatar-06.svg',
      '/avatars/avatar-07.svg',
      '/avatars/avatar-08.svg',
      '/avatars/avatar-09.svg',
      '/avatars/avatar-10.svg',
      '/avatars/avatar-11.svg',
      '/avatars/avatar-12.svg',
      '/avatars/avatar-13.svg',
      '/avatars/avatar-14.svg',
      '/avatars/avatar-15.svg',
      '/avatars/avatar-16.svg',
      '/avatars/avatar-17.svg',
      '/avatars/avatar-18.svg',
      '/avatars/avatar-19.svg',
      '/avatars/avatar-20.svg'
    ],
    []
  )
  const getDeterministicAvatar = useCallback(
    (seed) => {
      if (!seed) return DEFAULT_AVATARS[0]
      let hash = 0
      for (let i = 0; i < seed.length; i += 1) {
        hash = (hash << 5) - hash + seed.charCodeAt(i)
        hash |= 0 // 32-bit
      }
      const idx = Math.abs(hash) % DEFAULT_AVATARS.length
      return DEFAULT_AVATARS[idx]
    },
    [DEFAULT_AVATARS]
  )

  const getUserAvatar = useCallback(
    (user) => {
      if (!user) return DEFAULT_AVATARS[0]
      if (user.avatar) return user.avatar
      const seed = user.email || user.name || user.id || user._id || 'seed'
      return getDeterministicAvatar(seed)
    },
    [getDeterministicAvatar]
  )

  // Fallback para referencias anteriores
  const randomDefaultAvatar = useMemo(
    () => getDeterministicAvatar('fallback'),
    [getDeterministicAvatar]
  )
  // Estado de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const currentUserId = currentUser?._id || currentUser?.id

  // Vinos (desde backend)
  const [wines, setWines] = useState([])
  const [winesLoading, setWinesLoading] = useState(false)
  const [winesError, setWinesError] = useState('')

  // Estadísticas (ventas y pérdidas)
  const [stats, setStats] = useState({
    sales: { total: 0, tinto: 0, blanco: 0, rosado: 0, espumoso: 0, dulce: 0 },
    losses: { total: 0, tinto: 0, blanco: 0, rosado: 0, espumoso: 0, dulce: 0 },
    trends: { total: 0, tinto: 0, blanco: 0, rosado: 0, espumoso: 0, dulce: 0, losses: 0 }
  })

  // Hidratar sesión desde localStorage al cargar
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        setCurrentUser(user)
        setIsAuthenticated(true)
      } catch (e) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  }, [])

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  // Restaurar la vista anterior al recargar la página
  const [currentView, setCurrentView] = useState(() => {
    const savedView = localStorage.getItem('currentView')
    return savedView || 'home'
  })
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const stored = localStorage.getItem('notificationsEnabled')
    return stored ? stored === 'true' : true
  })

  // Guardar la vista actual en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('currentView', currentView)
  }, [currentView])

  useEffect(() => {
    localStorage.setItem('notificationsEnabled', String(notificationsEnabled))
  }, [notificationsEnabled])

  useEffect(() => {
    if (!notificationsEnabled && currentView === 'ayuda') {
      setCurrentView('home')
    }
  }, [notificationsEnabled, currentView])

  const [selectedWine, setSelectedWine] = useState(null)
  const [showAddWineModal, setShowAddWineModal] = useState(false)
  const [wineListVersion, setWineListVersion] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [pendingNotificationWineId, setPendingNotificationWineId] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [suggestedOptions, setSuggestedOptions] = useState([])
  const [aiChatMessages, setAiChatMessages] = useState([]) // Mensajes del chat IA (persisten entre vistas)
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
  const [tasksFilter, setTasksFilter] = useState('todas')
  const [tasksAnimating, setTasksAnimating] = useState(false)
  const [currentGuideSet, setCurrentGuideSet] = useState(0)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [tasks, setTasks] = useState([])

  // Estado para Pedidos
  const [orders, setOrders] = useState([])
  const [ordersFilter, setOrdersFilter] = useState('todos')
  const [showAddOrderModal, setShowAddOrderModal] = useState(false)
  const [vouchers, setVouchers] = useState([])
  const [vouchersLoading, setVouchersLoading] = useState(false)
  const [vouchersError, setVouchersError] = useState('')
  const [vouchersFilter, setVouchersFilter] = useState('activos')
  const [showAddVoucherModal, setShowAddVoucherModal] = useState(false)
  const [showEditVoucherModal, setShowEditVoucherModal] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState(null)
  // Activación por token (se lee desde la URL en el estado inicial)
  const [activationToken, setActivationToken] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('token')
  })
  const [activationInfo, setActivationInfo] = useState(null)
  const [activationError, setActivationError] = useState('')
  const [activationLoading, setActivationLoading] = useState(false)
  const [activationDone, setActivationDone] = useState(false)
  const [activationPassword, setActivationPassword] = useState('')
  const [activationPassword2, setActivationPassword2] = useState('')
  const [showEditOrderModal, setShowEditOrderModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Estado para Valoraciones
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsError, setReviewsError] = useState('')
  const [reviewsFilter, setReviewsFilter] = useState('todos') // todos, 5stars, 4stars, 3stars, 2stars, 1star
  const [showAddReviewModal, setShowAddReviewModal] = useState(false)
  const [showEditReviewModal, setShowEditReviewModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState(null)
  const [isReviewsFilterMenuOpen, setIsReviewsFilterMenuOpen] = useState(false)
  const [detailReview, setDetailReview] = useState(null)
  const [isTareasFilterMenuOpen, setIsTareasFilterMenuOpen] = useState(false)

  // Estados para ajustes
  const [ajustesData, setAjustesData] = useState({
    userName: 'Jonny Alvarez',
    userEmail: 'jonny.alvarez@vinos.com',
    userAvatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=120'
  })
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)

  // Helpers de tiempo para notificaciones (formato relativo sencillo)
  const formatTimeAgoEs = (date) => {
    if (!date) return ''
    const now = Date.now()
    const diffMs = now - new Date(date).getTime()
    const minutes = Math.floor(diffMs / (1000 * 60))
    if (minutes < 1) return 'Ahora'
    if (minutes === 1) return 'Hace 1 min'
    if (minutes < 60) return `Hace ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours === 1) return 'Hace 1 hora'
    if (hours < 24) return `Hace ${hours} horas`
    const days = Math.floor(hours / 24)
    if (days === 1) return 'Ayer'
    return `Hace ${days} días`
  }

  // Estado para notificaciones
  const seedNotifications = [
    {
      id: 1,
      type: 'stock-bajo',
      icon: 'FiBox',
      title: 'Stock bajo en bodega',
      message: '**Viña Albali Reserva 2018** tiene solo 2 unidades restantes. Considera hacer un nuevo pedido.',
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      unread: true,
      actions: ['Ver bodega', 'Hacer pedido']
    },
    {
      id: 2,
      type: 'pedido-nuevo',
      icon: 'FiPackage',
      title: 'Nuevo pedido recibido',
      message: 'Pedido **#P-047** ha sido recibido y está listo para procesar. 5 productos, total: €234.50',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      unread: true,
      actions: ['Ver pedido']
    },
    {
      id: 3,
      type: 'tarea-completada',
      icon: 'FiCheckCircle',
      title: 'Tarea completada',
      message: 'La tarea **"Actualizar inventario"** ha sido completada exitosamente.',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      unread: false,
      actions: []
    },
    {
      id: 4,
      type: 'tarea-pendiente',
      icon: 'FiCheckSquare',
      title: 'Recordatorio: Nota para hoy',
      message: 'Tienes **3 notas** programadas para hoy que requieren tu atención.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      unread: true,
      actions: ['Ver notas']
    },
    {
      id: 5,
      type: 'resumen-dia',
      icon: 'FiTrendingUp',
      title: 'Resumen del día',
      message: 'Hoy has vendido **€1,248.00** en 12 pedidos. ¡Excelente día! +18% vs ayer.',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      unread: false,
      actions: ['Ver estadísticas']
    },
    {
      id: 6,
      type: 'valoracion-nueva',
      icon: 'FiStar',
      title: 'Nueva valoración recibida',
      message: '**María García** ha valorado con 5 estrellas el **Marqués de Riscal Reserva**',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      unread: false,
      actions: ['Ver valoración']
    },
    {
      id: 7,
      type: 'vino-popular',
      icon: 'FiHeart',
      title: 'Vino en tendencia',
      message: '**Martín Códax Albariño** ha recibido +25 likes hoy y está en el top 3 de vinos más populares.',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      unread: false,
      actions: ['Ver en Top Vinos']
    },
    {
      id: 8,
      type: 'pedido-completado',
      icon: 'FiCheckCircle',
      title: 'Pedido completado',
      message: 'El pedido **#P-042** ha sido completado y enviado al cliente.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      unread: false,
      actions: []
    }
  ]

  const loadNotifications = () => {
    try {
      const stored = localStorage.getItem('notifications')
      if (stored) return JSON.parse(stored)
    } catch (e) {
      // ignore
    }
    return seedNotifications
  }

  const [notifications, setNotifications] = useState([])
  const [newNotifPulse, setNewNotifPulse] = useState(false)

  // Estado para likes de vinos en bodega (por wineId)
  const [wineLikes, setWineLikes] = useState({})

  // Estado para Top Vinos - se calcula dinámicamente basado en wineLikes
  const [topWines, setTopWines] = useState([])
  const [topWinesLoading, setTopWinesLoading] = useState(false)
  const [topWinesError, setTopWinesError] = useState('')

  // Normalizar vinos desde backend a formato de la UI
  const normalizeWine = (wine) => ({
    ...wine,
    id: wine.id || wine._id,
  })

  // Cargar vinos desde API (público, optionalAuth en backend)
  useEffect(() => {
    const fetchWines = async () => {
      setWinesLoading(true)
      setWinesError('')
      try {
        const response = await wineService.getWines()
        // wineService.getWines devuelve response.data -> { success, count, data: [...] }
        const list = response?.data?.data || response?.data || response
        const normalized = (list || []).map(normalizeWine)
        setWines(normalized)
      } catch (error) {
        console.error('Error al cargar vinos:', error)
        setWinesError(error.message || 'Error al cargar vinos')
      } finally {
        setWinesLoading(false)
      }
    }

    fetchWines()
  }, [])

  // useEffect separado para cargar estadísticas solo si el usuario está autenticado y NO es invitado
  useEffect(() => {
    // No cargar estadísticas si no hay usuario o si es invitado
    if (!currentUser || currentUser.isGuest) return;

    const fetchStats = async () => {
      try {
        const response = await statsService.getStats()
        if (response.success && response.data) {
          setStats({
            sales: response.data.sales || { total: 0, tinto: 0, blanco: 0, rosado: 0, espumoso: 0, dulce: 0 },
            losses: response.data.losses || { total: 0, tinto: 0, blanco: 0, rosado: 0, espumoso: 0, dulce: 0 },
            trends: response.data.trends || { total: 0, tinto: 0, blanco: 0, rosado: 0, espumoso: 0, dulce: 0, losses: 0 }
          })
        }
      } catch (error) {
        // Solo mostrar error si no es 401 (no autorizado)
        if (error.message !== 'No autorizado para acceder a esta ruta') {
          console.error('Error al cargar estadísticas:', error)
        }
      }
    }

    fetchStats()
    // Recargar estadísticas cada 30 segundos (no cada 3 segundos para evitar spam)
    const statsInterval = setInterval(fetchStats, 30000)
    return () => clearInterval(statsInterval)
  }, [currentUser])

  // Redirigir a invitados si intentan acceder a vistas restringidas
  useEffect(() => {
    if (!currentUser?.isGuest) return;
    
    const restrictedViews = ['tareas', 'tareas-completadas', 'tareas-pendientes', 'pedidos', 'vales', 'valoraciones', 'ajustes', 'ayuda', 'ia'];
    if (restrictedViews.includes(currentView)) {
      setCurrentView('bodega');
    }
  }, [currentUser?.isGuest, currentView])

  // Referencia para saber si ya se inicializaron los likes
  const likesInitializedRef = useRef(false);

  // Inicializar likes SOLO UNA VEZ cuando llegan los vinos por primera vez
  useEffect(() => {
    if (!wines || wines.length === 0) return
    if (likesInitializedRef.current) return; // Ya se inicializó, no volver a hacerlo
    
    const initialLikes = {}
    wines.forEach((wine) => {
      const id = wine._id || wine.id
      // Usar likes del backend si existen
      initialLikes[id] = {
        count: wine.likes?.count || 0,
        liked: wine.likes?.users?.includes(currentUser?._id || currentUser?.id) || false
      }
    })
    setWineLikes(initialLikes)
    likesInitializedRef.current = true; // Marcar como inicializado
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wines.length, currentUser?._id])

  useEffect(() => {
    if (!pendingNotificationWineId || !wines || wines.length === 0) return
    const targetWine = wines.find(w => (w.id || w._id) === pendingNotificationWineId)
    if (targetWine) {
      setSelectedWine(targetWine)
      setPendingNotificationWineId(null)
    }
  }, [pendingNotificationWineId, wines])

  const filteredOrders =
    ordersFilter === 'todos'
      ? orders.filter(
        (o) =>
          // Mostrar como pendientes mientras están en animación
          !o.items.every((item) => item.completed) || o.completing
      )
      : ordersFilter === 'terminados'
        ? orders.filter(
          (o) =>
            // Mostrar también mientras se anima su salida de Terminados
            o.items.every((item) => item.completed) || o.completing
        )
        : orders

  const pendingOrdersCount = orders.filter(
    (o) =>
      !o.items.every((item) => item.completed) || o.completing
  ).length

  const completedOrdersCount = orders.filter(
    (o) =>
      o.items.every((item) => item.completed) && !o.completing
  ).length

  const inProgressOrdersCount = orders.filter((o) => {
    const completedItems = o.items.filter((item) => item.completed).length
    return completedItems > 0 && completedItems < o.items.length
  }).length

  const totalOrdersCount = orders.length

  const isVoucherExpired = (voucher) => {
    const expiryTime = new Date(voucher.expiresAt).getTime()
    return voucher.status === 'activo' && Number.isFinite(expiryTime) && expiryTime < Date.now()
  }

  const filteredVouchers = vouchers.filter((voucher) => {
    if (vouchersFilter === 'todos') return true
    if (vouchersFilter === 'activos') return voucher.status === 'activo' && !isVoucherExpired(voucher)
    if (vouchersFilter === 'usados') return voucher.status === 'usado'
    if (vouchersFilter === 'vencidos') return isVoucherExpired(voucher)
    return true
  })

  const activeVouchersCount = vouchers.filter((v) => v.status === 'activo' && !isVoucherExpired(v)).length
  const usedVouchersCount = vouchers.filter((v) => v.status === 'usado').length
  const expiredVouchersCount = vouchers.filter((v) => isVoucherExpired(v)).length

  const taskFilters = [
    { id: 'todas', label: 'Todas' },
    { id: 'hoy', label: 'Hoy' },
    { id: 'ayer', label: 'Ayer' },
    { id: 'semana', label: 'Semana' },
    { id: 'terminadas', label: 'Terminadas' },
  ]

  const filteredTasks =
    tasksFilter === 'todas'
      ? tasks.filter((t) => t.status !== 'completed')
      : tasksFilter === 'hoy'
        ? tasks.filter((t) => t.group === 'hoy' && t.status !== 'completed')
      : tasksFilter === 'ayer'
          ? tasks.filter((t) => t.group === 'ayer' && t.status !== 'completed')
          : tasksFilter === 'semana'
            ? tasks.filter((t) => t.group === 'semana' && t.status !== 'completed')
              : tasksFilter === 'terminadas'
                ? tasks.filter((t) => t.status === 'completed')
                : tasks

  const filteredReviews = reviews.filter((review) => {
    if (reviewsFilter === 'todos') return true
    if (reviewsFilter === '5stars') return review.rating === 5
    if (reviewsFilter === '4stars') return review.rating === 4
    if (reviewsFilter === '3stars') return review.rating === 3
    return true
  })

  const reviewPlaceholderMessage =
    reviews.length === 0
      ? 'Todavía no hay valoraciones. Sé el primero en dejar una reseña.'
      : 'No hay valoraciones que coincidan con ese filtro.'

  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setShowTaskModal(true)
  }

  const handleAddTask = () => {
    setShowAddTaskModal(true)
  }

  const handleSaveTask = async (taskData) => {
    try {
      if (taskData.id) {
        const resp = await taskService.update(taskData.id, taskData)
        const saved = resp.data?.data || resp.data || taskData
        setTasks(tasks.map(t => t.id === taskData.id ? { ...saved, id: saved._id || saved.id } : t))
      } else {
        const payload = {
          ...taskData,
          avatars: taskData.avatars && taskData.avatars.length
            ? taskData.avatars
            : [getUserAvatar(currentUser)],
          userName: currentUser?.name,
          extraCount: taskData.extraCount ?? 0,
        };
        const resp = await taskService.create(payload)
        const saved = resp.data?.data || resp.data || taskData
        setTasks([...tasks, { ...saved, id: saved._id || saved.id }])
      }
    } catch (e) {
      console.error('Error al guardar tarea', e)
    }
    setShowTaskModal(false)
    setShowAddTaskModal(false)
  }

  const handleDeleteTask = async (taskId) => {
    try {
      await taskService.delete(taskId)
    } catch (e) {
      console.error('No se pudo eliminar en backend, borrando local')
    }
    setTasks(tasks.filter(t => t.id !== taskId))
    setShowTaskModal(false)
  }

  // Handlers para Pedidos
  const handleAddOrder = () => {
    setShowAddOrderModal(true)
  }

  const handleCreateVoucher = () => {
    setSelectedVoucher(null)
    setShowAddVoucherModal(true)
  }

  const handleToggleVoucherStatus = async (voucherId) => {
    const target = vouchers.find((voucher) => voucher.id === voucherId || voucher._id === voucherId)
    if (!target) return

    const nextStatus = target.status === 'activo' ? 'usado' : 'activo'
    const nextUsesLeft = nextStatus === 'usado' ? 0 : (target.usesLeft > 0 ? target.usesLeft : 1)

    setVouchers((prev) => prev.map((voucher) => {
      if (voucher.id !== voucherId && voucher._id !== voucherId) return voucher
      return { ...voucher, status: nextStatus, usesLeft: nextUsesLeft }
    }))

    try {
      await voucherService.update(voucherId, {
        status: nextStatus,
        usesLeft: nextUsesLeft
      })
    } catch (error) {
      console.error('Error al actualizar vale', error)
      setVouchers((prev) => prev.map((voucher) => {
        if (voucher.id !== voucherId && voucher._id !== voucherId) return voucher
        return target
      }))
      alert('No se pudo actualizar el vale')
    }
  }

  const handleSaveVoucher = async (voucherData) => {
    try {
      const payload = {
        ...voucherData,
        code: (voucherData.code || '').trim().toUpperCase(),
      }
      const resp = await voucherService.create(payload)
      const saved = normalizeVoucher(resp.data?.data || resp.data || payload)
      setVouchers((prev) => [saved, ...prev])
      setShowAddVoucherModal(false)
    } catch (error) {
      console.error('Error al crear vale', error)
      alert(error.response?.data?.message || 'No se pudo crear el vale')
    }
  }

  const handleOpenEditVoucher = (voucher) => {
    setSelectedVoucher(voucher)
    setShowEditVoucherModal(true)
  }

  const handleUpdateVoucher = async (voucherData) => {
    if (!voucherData?.id) return
    try {
      const payload = {
        ...voucherData,
        code: (voucherData.code || '').trim().toUpperCase(),
      }
      const resp = await voucherService.update(voucherData.id, payload)
      const saved = normalizeVoucher(resp.data?.data || resp.data || payload)
      setVouchers((prev) => prev.map((voucher) =>
        voucher.id === saved.id || voucher._id === saved._id ? saved : voucher
      ))
      setShowEditVoucherModal(false)
      setSelectedVoucher(null)
    } catch (error) {
      console.error('Error al editar vale', error)
      alert(error.response?.data?.message || 'No se pudo editar el vale')
    }
  }

  const handleDeleteVoucher = async (voucherId) => {
    if (!voucherId) return
    const shouldDelete = window.confirm('¿Eliminar este vale? Esta acción no se puede deshacer.')
    if (!shouldDelete) return

    try {
      await voucherService.delete(voucherId)
      setVouchers((prev) => prev.filter((voucher) => voucher.id !== voucherId && voucher._id !== voucherId))
      setShowEditVoucherModal(false)
      setSelectedVoucher(null)
    } catch (error) {
      console.error('Error al eliminar vale', error)
      alert(error.response?.data?.message || 'No se pudo eliminar el vale')
    }
  }

  const handleSaveOrder = async (orderData) => {
    console.log('handleSaveOrder recibido:', orderData)
    try {
      const orderId = orderData.id || orderData._id;
      console.log('orderId detectado:', orderId)
      if (orderId) {
        // Actualizar pedido existente
        const payload = {
          ...orderData,
          items: (orderData.items || []).map(it => {
            const { id, _id, ...rest } = it;
            // Solo incluir _id si es un ObjectId válido de MongoDB (24 caracteres hex)
            const validMongoId = (_id && typeof _id === 'string' && _id.length === 24) ? _id : 
                                 (id && typeof id === 'string' && id.length === 24) ? id : null;
            return validMongoId ? { _id: validMongoId, ...rest } : { ...rest };
          })
        }
        console.log('Enviando update con payload:', payload)
        const resp = await orderService.update(orderId, payload)
        console.log('Respuesta del servidor:', resp)
        const saved = normalizeOrder(resp.data?.data || resp.data || payload)
        setOrders(orders.map(o => (o.id === saved.id || o._id === saved._id) ? saved : o))
      } else {
        // Crear nuevo pedido
        const payload = {
          ...orderData,
          completed: false,
          status: 'pending',
          items: (orderData.items || []).map(it => {
            const { id, _id, ...rest } = it;
            return { ...rest, completed: !!rest.completed };
          })
        }
        console.log('Creando nuevo pedido con payload:', payload)
        const resp = await orderService.create(payload)
        console.log('Respuesta del servidor:', resp)
        const saved = normalizeOrder(resp.data?.data || resp.data || payload)
        setOrders([...orders, saved])
      }
      // Refrescar desde API para asegurar consistencia
      fetchOrders()
    } catch (e) {
      console.error('Error al guardar pedido', e)
      alert('Error al guardar el pedido: ' + (e.message || 'Error desconocido'))
    }
    setShowAddOrderModal(false)
    setShowEditOrderModal(false)
  }

  const handleDeleteOrder = async (orderId) => {
    try {
      await orderService.delete(orderId)
    } catch (e) {
      console.error('No se pudo eliminar pedido en backend, borrando local')
    }
    setOrders(orders.filter(o => o.id !== orderId))
    setShowEditOrderModal(false)
  }

  const handleToggleOrderItem = async (orderId, itemId) => {
    // Buscar el pedido actual
    const currentOrder = orders.find(o => o.id === orderId || o._id === orderId);
    if (!currentOrder) {
      console.error('Pedido no encontrado:', orderId);
      return;
    }

    // Encontrar el item que se está actualizando
    let toggledItem = null;
    let newCompletedState = false;

    // Calcular el nuevo estado del pedido
    const updatedItems = currentOrder.items.map((item, idx) => {
      if (item.id === itemId || item._id === itemId || idx === itemId) {
        const newCompleted = !item.completed;
        toggledItem = item;
        newCompletedState = newCompleted;
        return {
          ...item,
          completed: newCompleted,
          // Guardar quién lo marcó como completado
          completedBy: newCompleted ? {
            id: currentUser?._id || currentUser?.id,
            name: currentUser?.name || 'Usuario',
            avatar: currentUser?.avatar || getUserAvatar(currentUser)
          } : null
        };
      }
      return item;
    });

    const allCompleted = updatedItems.every((item) => item.completed);
    const wasCompleted = currentOrder.items.every((item) => item.completed);
    const changedCompletionState = allCompleted !== wasCompleted;

    const updatedOrder = {
      ...currentOrder,
      items: updatedItems,
      completing: changedCompletionState ? true : false,
      completed: allCompleted,
      status: allCompleted ? 'completed' : 'pending',
    };

    // Actualizar estado local inmediatamente
    setOrders((prevOrders) =>
      prevOrders.map((order) => (order.id === orderId || order._id === orderId) ? updatedOrder : order)
    );

    // Actualizar stock del vino si se encontró el item
    if (toggledItem) {
      // Buscar el vino correspondiente por nombre
      const matchingWine = wines.find(wine => 
        wine.name.toLowerCase() === toggledItem.name.toLowerCase()
      );
      
      if (matchingWine) {
        const quantityChange = newCompletedState ? toggledItem.quantity : -toggledItem.quantity;
        const newStock = Math.max(0, (matchingWine.stock || 0) + quantityChange);
        
        try {
          // Actualizar el stock del vino en el backend
          const payload = { stock: newStock };
          const response = await wineService.updateWine(matchingWine.id || matchingWine._id, payload);
          const updatedWine = normalizeWine(response.data?.data || response.data);
          
          // Actualizar el estado local de vinos
          setWines(prev => prev.map(w => 
            (w.id === matchingWine.id || w._id === matchingWine._id) ? updatedWine : w
          ));
          
          console.log(`Stock de "${matchingWine.name}" actualizado: ${matchingWine.stock} → ${newStock}`);
        } catch (error) {
          console.error('Error al actualizar stock del vino:', error);
        }
      }
    }

    // Persistir en backend
    try {
      const payload = {
        ...updatedOrder,
        items: updatedOrder.items.map(({ id, _id, ...rest }) => ({ _id: _id || id, ...rest })),
      };
      console.log('Enviando update de pedido:', updatedOrder.id || updatedOrder._id, payload);
      const resp = await orderService.update(updatedOrder.id || updatedOrder._id, payload);
      console.log('Respuesta del servidor:', resp.data);
      const saved = normalizeOrder(resp.data?.data || resp.data || updatedOrder);
      setOrders((prev) => prev.map((o) => (o.id === saved.id ? saved : o)));
    } catch (e) {
      console.error('No se pudo persistir el pedido', e);
      // Revertir cambio local si falla
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === orderId || order._id === orderId) ? currentOrder : order)
      );
    }

    // Limpiar la animación después de un tiempo
    setTimeout(() => {
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order.id !== orderId && order._id !== orderId) return order
          const allCompletedNow = order.items.every((item) => item.completed)
          return { ...order, completing: false, completed: allCompletedNow }
        })
      )
    }, 450)
  }

  // Handlers para Valoraciones
  const handleAddReview = () => {
    if (!isAuthenticated || currentUser?.isGuest) {
      alert('Para escribir una reseña debes iniciar sesión.')
      return
    }

    setSelectedReview(null)
    setShowAddReviewModal(true)
  }

  // Función para marcar todas las notificaciones como leídas
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications(prev => prev.map(notif => ({ ...notif, unread: false, readAt: new Date() })))
    } catch (e) {
      console.error('No se pudo marcar todas como leídas', e)
    }
  }

  // Referencia para guardar la vista anterior
  const prevViewRef = useRef(currentView)

  // Marcar notificaciones como leídas AL SALIR de la sección de notificaciones
  useEffect(() => {
    const prevView = prevViewRef.current
    
    // Si estábamos en notificaciones ('ayuda') y ahora estamos en otra vista
    if (prevView === 'ayuda' && currentView !== 'ayuda') {
      // Marcar todas como leídas al salir
      const markAsReadOnExit = async () => {
        try {
          await notificationService.markAllAsRead()
          setNotifications(prev => prev.map(notif => ({ ...notif, unread: false, readAt: new Date() })))
        } catch (e) {
          console.warn('No se pudo marcar como leídas al salir')
        }
      }
      markAsReadOnExit()
    }
    
    // Actualizar la referencia con la vista actual
    prevViewRef.current = currentView
  }, [currentView])

  const fetchTopWines = useCallback(async () => {
    if (!isAuthenticated || currentUser?.isGuest) {
      setTopWines([])
      return
    }

    setTopWinesLoading(true)
    setTopWinesError('')

    try {
      const response = await statsService.getTopWines()
      const topData = response.data?.data || response.data || []
      setTopWines(topData.map((item, index) => ({
        ...item,
        wine: normalizeWine(item.wine),
        rank: item.rank || index + 1
      })))
    } catch (error) {
      console.error('Error al cargar top vinos', error)
      setTopWinesError(error.response?.data?.message || error.message || 'No se pudo cargar el ranking de vinos')
    } finally {
      setTopWinesLoading(false)
    }
  }, [isAuthenticated, currentUser?.isGuest, currentUserId])

  useEffect(() => {
    fetchTopWines()
  }, [fetchTopWines])

  // Función para toggle like en vinos de bodega (también para invitados)
  const handleToggleWineLike = async (wineId) => {
    if (!wineId) return
    
    // Actualizar inmediatamente en el UI (el corazón se llena al instante)
    const wasLiked = wineLikes[wineId]?.liked || false;
    const prevCount = wineLikes[wineId]?.count || 0;
    
    setWineLikes(prev => ({
      ...prev,
      [wineId]: {
        count: wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1,
        liked: !wasLiked
      }
    }));

    // Enviar al backend (sin bloquear la UI)
    try {
      // Si es invitado, enviar su guestId (puede ser .id o ._id)
      const guestId = currentUser?.isGuest ? (currentUser._id || currentUser.id) : null;
      const response = await wineService.toggleLike(wineId, guestId);
      
      if (response.success) {
        // Sincronizar con la respuesta del servidor
        setWineLikes(prev => ({
          ...prev,
          [wineId]: {
            count: response.data.likes,
            liked: response.data.liked
          }
        }));

        // Actualizar el array de vinos para persistir el cambio
        setWines(prevWines => 
          prevWines.map(wine => 
            (wine._id || wine.id) === wineId 
              ? { ...wine, likes: { count: response.data.likes, users: wine.likes?.users || [] } }
              : wine
          )
        );
        await fetchTopWines()
      }
    } catch (error) {
      // Si falla el backend, NO revertimos - el usuario ve su like inmediatamente
      // Solo mostramos un warning en consola
      console.warn('No se pudo sincronizar like con el servidor:', error.message);
    }
  }

  const handleOpenReviewDetail = (review) => {
    setDetailReview(review)
  }

  const handleEditReviewFromDetail = (review) => {
    setSelectedReview(review)
    setShowEditReviewModal(true)
    setDetailReview(null)
  }

  const handleSaveReview = async (reviewData) => {
    if (!isAuthenticated || currentUser?.isGuest) {
      alert('Necesitas iniciar sesión para publicar una valoración')
      return
    }

    try {
      if (reviewData.id) {
        const response = await reviewService.update(reviewData.id, {
          rating: reviewData.rating,
          comment: reviewData.comment
        })
      const saved = response.data?.data || response.data
      setReviews((prev) => prev.map((r) => (r.id === saved.id ? saved : r)))
    } else {
      const payload = {
        wineId: reviewData.wineId,
        rating: reviewData.rating,
        comment: reviewData.comment
      }
      const response = await reviewService.create(payload)
      const saved = response.data?.data || response.data
      setReviews((prev) => [saved, ...prev])
    }
      setShowAddReviewModal(false)
      setShowEditReviewModal(false)
    } catch (error) {
      console.error('Error al guardar valoración', error)
      alert(error.response?.data?.message || error.message || 'No se pudo guardar la valoración')
    }
  }

  const handleDeleteReview = async (reviewId) => {
    try {
      await reviewService.delete(reviewId)
      setReviews((prev) => prev.filter((r) => r.id !== reviewId))
    } catch (error) {
      console.error('Error al eliminar valoración', error)
      alert(error.response?.data?.message || error.message || 'No se pudo eliminar la valoración')
    } finally {
      setShowEditReviewModal(false)
    }
  }

  const handleDeleteReviewFromDetail = async (reviewId) => {
    await handleDeleteReview(reviewId)
    setDetailReview(null)
  }

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
  const addNotification = async (wine) => {
    if (!notificationsEnabled) return
    const newNotification = {
      type: 'stock-bajo',
      icon: 'FiBox',
      title: 'Stock bajo en bodega',
      wineId: wine.id,
      wineName: wine.name,
      message: `**${wine.name}** se ha agotado temporalmente. Te sugerimos hacer tu pedido cuanto antes para no quedarte sin él.`,
      createdAt: new Date().toISOString(),
      unread: true,
      actions: ['Ver bodega', 'Hacer pedido']
    }
    try {
      const resp = await notificationService.create(newNotification)
      const saved = resp.data?.data || resp.data || newNotification
      setNotifications(prev => [saved, ...prev])
      setNewNotifPulse(true)
      setTimeout(() => setNewNotifPulse(false), 1200)
    } catch (e) {
      console.error('Error al crear notificación', e)
      // fallback local
      setNotifications(prev => [newNotification, ...prev])
    }
  }

  // Abrir el panel de notificaciones (ya NO marca como leídas automáticamente)
  const handleOpenNotifications = async () => {
    if (!notificationsEnabled) return
    setShowNotifications(true);
    // Ya no marcamos como leídas al entrar, el usuario debe hacerlo manualmente
  };

  // Manejar click en notificación - marcar solo esa como leída
  const handleNotificationClick = async (wineId, notificationId) => {
    // Asegurar que tenemos un ID válido
    if (notificationId) {
      try {
        await notificationService.markAsRead(notificationId)
      } catch (e) {
        console.warn('No se pudo marcar como leída, usando estado local')
      }
    }

    setNotifications(prev => prev.map(notif =>
      (notif.id === notificationId || notif._id === notificationId) 
        ? { ...notif, unread: false, readAt: new Date() } 
        : notif
    ));
    
    setCurrentView('bodega');
    if (wineId) {
      const targetWine = wines.find(w => (w.id || w._id) === wineId)
      if (targetWine) {
        setSelectedWine(targetWine)
      } else {
        setPendingNotificationWineId(wineId)
      }
    }
    setShowNotifications(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Remover notificación
  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => (n.id !== notificationId && n._id !== notificationId)));
  };

  // Derivados de notificaciones
  const unreadNotifications = notifications.filter(n => n.unread);
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.unread !== b.unread) return a.unread ? -1 : 1;
    const da = new Date(a.createdAt || a.id).getTime();
    const db = new Date(b.createdAt || b.id).getTime();
    return db - da;
  });
  const getNotificationTime = (notif) => notif.createdAt ? formatTimeAgoEs(notif.createdAt) : (notif.time || '');

  // Activar cuenta desde token
  const handleActivateAccount = async () => {
    if (!activationToken) return;
    if (!activationPassword || activationPassword.length < 6) {
      setActivationError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (activationPassword !== activationPassword2) {
      setActivationError('Las contraseñas no coinciden');
      return;
    }
    setActivationLoading(true);
    setActivationError('');
    try {
      await pendingService.activate(activationToken, activationPassword);
      setActivationDone(true);

      // Intentar iniciar sesión automáticamente tras activar
      if (activationInfo?.email) {
        try {
          const loginResp = await authService.login({
            email: activationInfo.email,
            password: activationPassword
          });
          // loginResp puede venir como { data: { token, user... } } o { success, data }
          const data = loginResp.data || loginResp;
          if (data?.token || data?.data?.token) {
            const userData = data.data ? data.data : data;
            handleLogin(userData);
            // limpiar token de la URL
            const url = new URL(window.location.href);
            url.searchParams.delete('token');
            window.history.replaceState({}, '', url.toString());
            setActivationToken(null);
          }
        } catch (e) {
          console.warn('Activación ok, pero auto-login falló; prueba manual');
        }
      }
    } catch (e) {
      setActivationError(e?.message || 'No se pudo activar la cuenta');
    } finally {
      setActivationLoading(false);
    }
  };

  // Cargar notificaciones desde API al autenticarse (solo si están habilitadas)
  useEffect(() => {
    if (!notificationsEnabled || !isAuthenticated) {
      setNotifications([]);
      return;
    }
    
    const fetchNotifications = async () => {
      try {
        const resp = await notificationService.getAll();
        const list = resp.data?.data || resp.data || [];
        
        // Respetar el estado unread del backend
        const normalized = (list || []).map(n => ({ 
          ...n, 
          id: n._id || n.id,
          unread: n.unread === true || n.unread === undefined
        }));
        
        setNotifications(normalized);
        
        // Si hay notificaciones nuevas, activar la animación
        const hasUnread = normalized.some(n => n.unread);
        if (hasUnread) {
          setNewNotifPulse(true);
          setTimeout(() => setNewNotifPulse(false), 3000);
        }
      } catch (e) {
        // Solo loggear si no es error de autenticación
        if (e?.response?.status !== 401) {
          console.error('Error al cargar notificaciones', e);
        }
      }
    };
    
    fetchNotifications();
    
    // Recargar notificaciones cada 30 segundos (solo si autenticado)
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, notificationsEnabled]);

  // Detectar token de activación en URL (aunque no esté /activate en la ruta)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setActivationToken(token);
    }
  }, []);

  // Cargar info del token
  useEffect(() => {
    const loadTokenInfo = async () => {
      if (!activationToken) return;
      setActivationLoading(true);
      setActivationError('');
      try {
        const resp = await pendingService.getByToken(activationToken);
        const data = resp.data?.data || resp.data;
        setActivationInfo(data);
      } catch (e) {
        setActivationError(e?.message || 'Token inválido o expirado');
      } finally {
        setActivationLoading(false);
      }
    };
    loadTokenInfo();
  }, [activationToken]);

  // Releer token al montar (por si el estado inicial no lo captura)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token && token !== activationToken) {
      setActivationToken(token);
    }
  }, [activationToken]);

  // Cargar tareas y pedidos al autenticarse
  const normalizeOrder = (o) => {
    const itemsNorm = (o.items || []).map((it) => ({
      ...it,
      id: it._id || it.id,
      _id: it._id || it.id,
    }));
    const allCompleted = itemsNorm.length > 0 && itemsNorm.every((it) => it.completed);
    return {
      ...o,
      id: o._id || o.id,
      items: itemsNorm,
      completed: o.completed ?? allCompleted,
      status: o.status ?? (allCompleted ? 'completed' : 'pending'),
    };
  };

  function normalizeVoucher(voucher) {
    return {
      ...voucher,
      id: voucher._id || voucher.id,
      code: (voucher.code || '').toUpperCase(),
      expiresAt: voucher.expiresAt ? new Date(voucher.expiresAt).toISOString() : null,
    }
  }

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setOrders([]);
      return;
    }
    try {
      const resp = await orderService.getAll();
      const ordersData = resp.data?.data || resp.data || [];
      setOrders(ordersData.map(normalizeOrder));
    } catch (e) {
      console.error('Error al cargar pedidos', e);
    }
  }, [isAuthenticated]);

  const fetchVouchers = useCallback(async () => {
    if (!isAuthenticated) {
      setVouchers([]);
      return;
    }
    setVouchersLoading(true);
    setVouchersError('');
    try {
      const resp = await voucherService.getAll();
      const vouchersData = resp.data?.data || resp.data || [];
      setVouchers(vouchersData.map(normalizeVoucher));
    } catch (e) {
      console.error('Error al cargar vales', e);
      setVouchersError('No se pudieron cargar los vales');
    } finally {
      setVouchersLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchTasksAndOrders = async () => {
      if (!isAuthenticated) {
        setTasks([]);
        setOrders([]);
        setVouchers([]);
        return;
      }
      try {
        const [tasksResp] = await Promise.all([
          taskService.getAll(),
        ]);
        const tasksData = tasksResp.data?.data || tasksResp.data || [];
        const normalizeTask = (t) => ({
          ...t,
          id: t._id || t.id,
          displayName: t.user?.name || t.userName || currentUser?.name || 'Usuario',
          avatars: t.avatars && t.avatars.length
            ? t.avatars
            : [getUserAvatar(t.user || currentUser)],
          extraCount: t.extraCount ?? 0,
        });
        setTasks(tasksData.map(normalizeTask));
        fetchOrders();
        fetchVouchers();
      } catch (e) {
        console.error('Error al cargar tareas/pedidos', e);
      }
    };
    fetchTasksAndOrders();
  }, [isAuthenticated, fetchOrders, fetchVouchers]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!isAuthenticated || currentUser?.isGuest) {
        setReviews([])
        return
      }

      setReviewsLoading(true)
      setReviewsError('')
      try {
        const resp = await reviewService.getAll()
        const fetched = resp.data?.data || resp.data || []
        setReviews(fetched)
      } catch (error) {
        console.error('Error al cargar valoraciones', error)
        setReviewsError(error.response?.data?.message || error.message || 'No se pudieron cargar las valoraciones')
      } finally {
        setReviewsLoading(false)
      }
    }

    fetchReviews()
  }, [isAuthenticated, currentUser?.isGuest]);

  // Manejar acciones de las notificaciones
  const handleNotificationAction = async (action, notif) => {
    const notificationId = notif?.id || notif?._id
    try {
      if (notificationId) {
        await notificationService.markAsRead(notificationId)
      }
    } catch (e) {
      // ignorar si falla
    }
    setNotifications(prev => prev.map(notif => 
      (notif.id === notificationId || notif._id === notificationId) ? { ...notif, unread: false, readAt: new Date() } : notif
    ));

    // Navegar según la acción
    switch(action) {
      case 'Ver bodega':
        setCurrentView('bodega');
        if (notif?.wineId) {
          const targetWine = wines.find(w => (w.id || w._id) === notif.wineId)
          if (targetWine) {
            setSelectedWine(targetWine)
          } else {
            setPendingNotificationWineId(notif.wineId)
          }
        }
        break;
      case 'Hacer pedido':
        setCurrentView('pedidos');
        break;
      case 'Ver pedido':
        setCurrentView('pedidos');
        setOrdersFilter('pendientes'); // Mostrar pedidos pendientes
        break;
      case 'Ver notas':
        setCurrentView('tareas');
        break;
      case 'Ver estadísticas':
        setCurrentView('home'); // Ir al home donde están las estadísticas
        break;
      case 'Ver valoración':
        setCurrentView('valoraciones');
        break;
      case 'Ver en Top Vinos':
        setCurrentView('top-vinos');
        break;
      default:
        console.log('Acción no reconocida:', action);
    }

    setShowNotifications(false);
    // Scroll suave al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (!wines || wines.length === 0) return
    let wine = wines.find(w => w.name?.toLowerCase().includes(wineName.toLowerCase()))
    if (!wine) {
      wine = wines.find(w => {
        const searchTerms = wineName.toLowerCase().split(' ')
        return searchTerms.some(term => w.name?.toLowerCase().includes(term))
      })
    }
    if (!wine) {
      wine = wines[0]
    }
    setSelectedWine(wine)
  }

  // Agregar nuevo vino
  const handleAddWine = async (newWine) => {
    try {
      const response = await wineService.createWine(newWine)
      const created = normalizeWine(response.data?.data || response.data)
      setWines(prev => [...prev, created])
    setShowAddWineModal(false)
    setWineListVersion(prev => prev + 1)
    } catch (error) {
      console.error('Error al crear vino:', error)
      alert('No se pudo crear el vino. Revisa la conexión.')
    }
  }

  // Actualizar vino
  const handleUpdateWine = async (wineId, updates) => {
    try {
      const payload = { ...updates }
      delete payload._id
      const response = await wineService.updateWine(wineId, payload)
      const updated = normalizeWine(response.data?.data || response.data)
      setWines(prev => prev.map(w => (w.id === wineId || w._id === wineId ? updated : w)))
      setSelectedWine(updated)
      return { success: true }
    } catch (error) {
      console.error('Error al actualizar vino:', error)
      return { success: false, message: error.message || 'No se pudo actualizar el vino' }
    }
  }

  const handleDeleteWine = async (wineId) => {
    try {
      await wineService.deleteWine(wineId)
      setWines(prev => prev.filter(w => w.id !== wineId && w._id !== wineId))
      setSelectedWine(null)
      setWineListVersion(prev => prev + 1)
      return { success: true }
    } catch (error) {
      console.error('Error al eliminar vino:', error)
      return { success: false, message: error.message || 'No se pudo eliminar el vino' }
    }
  }

  useEffect(() => {
    if (chatMessagesContainerRef.current) {
      chatMessagesContainerRef.current.scrollTop = chatMessagesContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Bloquear scroll del fondo si ajustes lo permiten (solo si están habilitadas)
  useEffect(() => {
    if (!notificationsEnabled) return;
    if (showNotifications && settings.lockScrollOnNotifications) {
      const previousOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = previousOverflow
      }
    }
  }, [showNotifications, settings.lockScrollOnNotifications, notificationsEnabled])

  // NOTA: Ya no marcamos como leídas automáticamente al cerrar el panel
  // Solo se marcan cuando el usuario entra a la vista de notificaciones

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

  // Vista de activación por token (bloquea el resto hasta activar)
  if (activationToken) {
    return (
      <div className="login-container">
        <div className="login-background">
          <div className="login-gradient-orb orb-1"></div>
          <div className="login-gradient-orb orb-2"></div>
          <div className="login-gradient-orb orb-3"></div>
        </div>
        <div className="login-card register-confirmation-card" style={{ maxWidth: 480 }}>
          <div className="register-confirmation-content">
            <div className="register-confirmation-icon">
              <FiCheckCircle />
            </div>
            <h2 className="register-confirmation-title">
              {activationDone ? 'Cuenta activada' : 'Activa tu cuenta'}
            </h2>
            {activationLoading && <p className="register-confirmation-message">Validando token...</p>}
            {activationError && <p className="register-confirmation-message" style={{ color: '#f87171' }}>{activationError}</p>}
            {activationInfo && !activationDone && (
              <>
                <p className="register-confirmation-message">
                  Usuario: <strong>{activationInfo.email}</strong>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                  <input
                    type="password"
                    className="login-input"
                    placeholder="Contraseña (mín. 6)"
                    value={activationPassword}
                    onChange={(e) => setActivationPassword(e.target.value)}
                  />
                  <input
                    type="password"
                    className="login-input"
                    placeholder="Repite la contraseña"
                    value={activationPassword2}
                    onChange={(e) => setActivationPassword2(e.target.value)}
                  />
                  <button
                    className="login-button"
                    onClick={handleActivateAccount}
                    disabled={activationLoading}
                  >
                    {activationLoading ? 'Activando...' : 'Activar cuenta'}
                  </button>
                </div>
              </>
            )}
            {activationDone && (
              <p className="register-confirmation-message">
                Ya puedes iniciar sesión con tu correo y la contraseña que acabas de crear.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Funciones de autenticación
  const handleLogin = (userData) => {
    const hydratedUser = {
      ...userData,
      avatar: userData.avatar || getUserAvatar(userData)
    }
    setCurrentUser(hydratedUser)
    setIsAuthenticated(true)
    // Actualizar datos de usuario en ajustes
    setAjustesData(prev => ({
      ...prev,
      userName: hydratedUser.name,
      userEmail: hydratedUser.email,
      userAvatar: hydratedUser.avatar
    }))
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentUser(null)
    setCurrentView('home')
    setIsMenuOpen(false)
    // Limpiar localStorage al cerrar sesión
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('currentView')
    // Resetear likes para que se reinicialicen en próximo login
    likesInitializedRef.current = false
    setWineLikes({})
    setTasks([])
    setOrders([])
    setVouchers([])
  }

  // Si no está autenticado, mostrar Login
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

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
                src={currentUser?.avatar || getUserAvatar(currentUser)}
                alt={currentUser?.name || 'Avatar'}
              />
            </div>
            <div className="sidebar-user-name">
              {currentUser?.name || 'Usuario'}
              {currentUser?.isGuest && <span className="guest-badge">Invitado</span>}
            </div>
            {!currentUser?.isGuest && (
              <div className="sidebar-user-email">{currentUser?.email || 'Sin email'}</div>
            )}
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

            {/* Nav item simple para Notas (sin plegado) - Solo usuarios registrados */}
            {!currentUser?.isGuest && (
              <div 
                className={`nav-item ${['tareas','tareas-completadas','tareas-pendientes'].includes(currentView) ? 'active' : ''}`} 
                onClick={() => setCurrentView('tareas')}
              >
                <div className="nav-item-content">
                  <span className="nav-icon"><FiCheckSquare size={10} /></span>
                  <span className="nav-text">Notas</span>
                </div>
              </div>
            )}
            
            {/* Pedidos - Solo usuarios registrados */}
            {!currentUser?.isGuest && (
              <div 
                className={`nav-item ${currentView === 'pedidos' ? 'active' : ''}`} 
                onClick={() => setCurrentView('pedidos')}
              >
                <div className="nav-item-content">
                  <span className="nav-icon"><FiShoppingBag size={10} /></span>
                  <span className="nav-text">Pedidos</span>
                </div>
              </div>
            )}
            {!currentUser?.isGuest && (
              <div 
                className={`nav-item ${currentView === 'vales' ? 'active' : ''}`} 
                onClick={() => setCurrentView('vales')}
              >
                <div className="nav-item-content">
                  <span className="nav-icon"><FiTag size={10} /></span>
                  <span className="nav-text">Vales</span>
                </div>
              </div>
            )}
          </nav>

          {/* Sección Opiniones (subida bajo Menú) */}
          <div className="sidebar-menu-label">Opiniones</div>
          <nav className="sidebar-nav">
            {/* Valoraciones - Solo usuarios registrados */}
            {!currentUser?.isGuest && (
              <div 
                className={`nav-item ${currentView === 'valoraciones' ? 'active' : ''}`} 
                onClick={() => setCurrentView('valoraciones')}
              >
                <div className="nav-item-content">
                  <span className="nav-icon"><FiStar size={10} /></span>
                  <span className="nav-text">Valoraciones</span>
                </div>
              </div>
            )}
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

          {/* Sección adicional: Acerca de / Ayuda / IA - Solo usuarios registrados */}
          {!currentUser?.isGuest && (
            <>
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
                {notificationsEnabled && (
                  <div 
                    className={`nav-item ${currentView === 'ayuda' ? 'active' : ''}`} 
                    onClick={() => {
                      setCurrentView('ayuda');
                      setNewNotifPulse(false);
                    }}
                  >
                    <div className="nav-item-content">
                      <span className={`nav-icon ${notifications.filter(n => n.unread).length > 0 ? 'has-notifications' : ''} ${newNotifPulse ? 'notif-pulse' : ''}`}>
                        <FiBell size={10} />
                      </span>
                      <span className="nav-text">Notificaciones</span>
                    </div>
                  </div>
                )}
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
            </>
          )}

          {/* Logout / Salir */}
          <div className="sidebar-logout nav-item" onClick={handleLogout}>
            <div className="nav-item-content">
              <span className="nav-icon"><FiLogOut size={10} /></span>
              <span className="nav-text">{currentUser?.isGuest ? 'Salir' : 'Cerrar sesión'}</span>
            </div>
          </div>

        </div>

        {/* Botón flotante para abrir menú en móviles */}
        <button
          type="button"
          className="floating-menu-button"
          onClick={toggleMenu}
          aria-label="Abrir menú"
        >
          <FiMenu />
        </button>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="mobile-menu-overlay" onClick={toggleMenu}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <h2>Menú</h2>
              <button className="close-menu" onClick={toggleMenu}>×</button>
            </div>
            <div className="mobile-menu-content">
              {/* Sección MENÚ */}
              <div className="mobile-menu-section-label">MENÚ</div>
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
                <span className="mobile-nav-icon"><FaWineBottle /></span>
                <span className="mobile-nav-text">Bodega</span>
              </div>
              <div 
                className="mobile-nav-item" 
                onClick={() => { navigateToAgotados(); setIsMenuOpen(false); }}
              >
                <span className="mobile-nav-icon"><FiSlash /></span>
                <span className="mobile-nav-text">Agotados</span>
              </div>
              {/* Notas - Solo usuarios registrados */}
              {!currentUser?.isGuest && (
                <div 
                  className="mobile-nav-item" 
                  onClick={() => { setCurrentView('tareas'); setIsMenuOpen(false); }}
                >
                  <span className="mobile-nav-icon"><FiCheckSquare /></span>
                  <span className="mobile-nav-text">Notas</span>
                </div>
              )}
              {/* Pedidos - Solo usuarios registrados */}
              {!currentUser?.isGuest && (
                <div 
                  className="mobile-nav-item" 
                  onClick={() => { setCurrentView('pedidos'); setIsMenuOpen(false); }}
                >
                  <span className="mobile-nav-icon"><FiPackage /></span>
                  <span className="mobile-nav-text">Pedidos</span>
                </div>
              )}
              {!currentUser?.isGuest && (
                <div 
                  className="mobile-nav-item" 
                  onClick={() => { setCurrentView('vales'); setIsMenuOpen(false); }}
                >
                  <span className="mobile-nav-icon"><FiTag /></span>
                  <span className="mobile-nav-text">Vales</span>
                </div>
              )}

              {/* Sección OPINIONES */}
              <div className="mobile-menu-section-label">OPINIONES</div>
              {/* Valoraciones - Solo usuarios registrados */}
              {!currentUser?.isGuest && (
                <div 
                  className="mobile-nav-item" 
                  onClick={() => { setCurrentView('valoraciones'); setIsMenuOpen(false); }}
                >
                  <span className="mobile-nav-icon"><FiStar /></span>
                  <span className="mobile-nav-text">Valoraciones</span>
                </div>
              )}
              <div 
                className="mobile-nav-item" 
                onClick={() => { setCurrentView('top-vinos'); setIsMenuOpen(false); }}
              >
                <span className="mobile-nav-icon"><FiTrendingUp /></span>
                <span className="mobile-nav-text">Top Vinos</span>
              </div>

              {/* Sección ACERCA DE - Solo usuarios registrados */}
              {!currentUser?.isGuest && (
                <>
                  <div className="mobile-menu-section-label">ACERCA DE</div>
                  <div 
                    className="mobile-nav-item" 
                    onClick={() => { setCurrentView('ajustes'); setIsMenuOpen(false); }}
                  >
                    <span className="mobile-nav-icon"><FiSettings /></span>
                    <span className="mobile-nav-text">Ajustes</span>
                  </div>
                  {notificationsEnabled && (
                    <div 
                      className="mobile-nav-item" 
                      onClick={() => { 
                        setCurrentView('ayuda'); 
                        setIsMenuOpen(false);
                        setNewNotifPulse(false);
                      }}
                    >
                    <span className={`mobile-nav-icon ${notifications.filter(n => n.unread).length > 0 ? 'has-notifications' : ''} ${newNotifPulse ? 'notif-pulse' : ''}`}>
                        <FiBell />
                      </span>
                      <span className="mobile-nav-text">Notificaciones</span>
                    </div>
                  )}
                  <div 
                    className="mobile-nav-item" 
                    onClick={() => { setCurrentView('ia'); setIsMenuOpen(false); }}
                  >
                    <span className="mobile-nav-icon"><FiCpu /></span>
                    <span className="mobile-nav-text">IA</span>
                  </div>
                </>
              )}

              {/* Cerrar sesión / Salir */}
              <div className="mobile-menu-divider"></div>
              <div 
                className="mobile-nav-item mobile-nav-logout" 
                onClick={handleLogout}
              >
                <span className="mobile-nav-icon"><FiLogOut /></span>
                <span className="mobile-nav-text">{currentUser?.isGuest ? 'Salir' : 'Cerrar sesión'}</span>
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
                          <strong> Agotados</strong> para gestionar el stock, y <strong>Notas</strong> para organizar tu trabajo diario.
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
                  <span className="home-metric-value">{stats.sales.total.toLocaleString('es-ES')}</span>
                  <div className={`home-metric-trend ${parseFloat(stats.trends.total) >= 0 ? 'home-metric-trend-positive' : 'home-metric-trend-negative'}`}>
                    <span className="home-metric-trend-icon">{parseFloat(stats.trends.total) >= 0 ? '▲' : '▼'}</span>
                    <span>{parseFloat(stats.trends.total) >= 0 ? '+' : ''}{stats.trends.total}%</span>
                  </div>
                </div>
                <div className="home-metric">
                  <span className="home-metric-label">Tintos vendidos</span>
                  <span className="home-metric-value">{stats.sales.tinto.toLocaleString('es-ES')}</span>
                  <div className={`home-metric-trend ${parseFloat(stats.trends.tinto) >= 0 ? 'home-metric-trend-positive' : 'home-metric-trend-negative'}`}>
                    <span className="home-metric-trend-icon">{parseFloat(stats.trends.tinto) >= 0 ? '▲' : '▼'}</span>
                    <span>{parseFloat(stats.trends.tinto) >= 0 ? '+' : ''}{stats.trends.tinto}%</span>
                  </div>
                </div>
                <div className="home-metric">
                  <span className="home-metric-label">Blancos vendidos</span>
                  <span className="home-metric-value">{stats.sales.blanco.toLocaleString('es-ES')}</span>
                  <div className={`home-metric-trend ${parseFloat(stats.trends.blanco) >= 0 ? 'home-metric-trend-positive' : 'home-metric-trend-negative'}`}>
                    <span className="home-metric-trend-icon">{parseFloat(stats.trends.blanco) >= 0 ? '▲' : '▼'}</span>
                    <span>{parseFloat(stats.trends.blanco) >= 0 ? '+' : ''}{stats.trends.blanco}%</span>
                  </div>
                </div>
                <div className="home-metric">
                  <span className="home-metric-label">Espumosos vendidos</span>
                  <span className="home-metric-value">{stats.sales.espumoso.toLocaleString('es-ES')}</span>
                  <div className={`home-metric-trend ${parseFloat(stats.trends.espumoso) >= 0 ? 'home-metric-trend-positive' : 'home-metric-trend-negative'}`}>
                    <span className="home-metric-trend-icon">{parseFloat(stats.trends.espumoso) >= 0 ? '▲' : '▼'}</span>
                    <span>{parseFloat(stats.trends.espumoso) >= 0 ? '+' : ''}{stats.trends.espumoso}%</span>
                  </div>
                </div>
                <div className="home-metric">
                  <span className="home-metric-label">Vinos perdidos</span>
                  <span className="home-metric-value">{stats.losses.total.toLocaleString('es-ES')}</span>
                  <div className={`home-metric-trend ${parseFloat(stats.trends.losses) <= 0 ? 'home-metric-trend-positive' : 'home-metric-trend-negative'}`}>
                    <span className="home-metric-trend-icon">{parseFloat(stats.trends.losses) <= 0 ? '▼' : '▲'}</span>
                    <span>{parseFloat(stats.trends.losses) >= 0 ? '+' : ''}{stats.trends.losses}%</span>
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
                      onOpenAddWine={!currentUser?.isGuest ? () => setShowAddWineModal(true) : null}
                      wineLikes={wineLikes}
                      onToggleWineLike={handleToggleWineLike}
                      wines={wines}
                      isGuest={currentUser?.isGuest}
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
                      wines={wines}
                      wineLikes={wineLikes}
                      onToggleWineLike={handleToggleWineLike}
                    />
                  </div>
                )}

        {/* Vista Notas */}
        {currentView === 'tareas' && (
          <div key="tareas-view" className="content view-enter">
            <div className="section section-full tareas-section">
              <div className="tareas-top-section">
                <div className="tareas-filters-row">
                  {/* Filtros individuales (solo desktop) */}
                  <div className="tareas-filter-buttons-desktop">
                {taskFilters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    className={`tareas-filter-chip ${tasksFilter === filter.id ? 'active' : ''}`}
                        onClick={() => {
                          setTasksAnimating(true)
                          setTimeout(() => {
                            setTasksFilter(filter.id)
                            setTasksAnimating(false)
                          }, 300)
                        }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

                  {/* Dropdown de filtros (solo móvil) */}
                  <div className="filter-dropdown-container tareas-filter-dropdown-mobile">
                <button
                      type="button"
                      className={`filter-dropdown-button ${isTareasFilterMenuOpen ? 'open' : ''}`}
                      onClick={() => setIsTareasFilterMenuOpen(!isTareasFilterMenuOpen)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                      </svg>
                      Filtros
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chevron">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                </button>

                    {isTareasFilterMenuOpen && (
                      <div className="filter-dropdown-menu">
                        {taskFilters.map((filter) => (
                <button
                            key={filter.id}
                            type="button"
                            className={`filter-dropdown-item ${tasksFilter === filter.id ? 'active' : ''}`}
                            onClick={() => {
                              setTasksAnimating(true)
                              setTimeout(() => {
                                setTasksFilter(filter.id)
                                setTasksAnimating(false)
                              }, 300)
                              setIsTareasFilterMenuOpen(false)
                            }}
                          >
                            {tasksFilter === filter.id && <span className="checkmark">✓</span>}
                            {filter.label}
                </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Botón nueva tarea */}
                  <button className="tareas-add-btn" onClick={handleAddTask}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    Nuevo
                  </button>
                </div>
              </div>

              {/* Lista de tareas estilo cards moderno */}
              <div className={`tareas-grid-new ${tasksAnimating ? 'animating-out' : ''}`}>
                {!tasksAnimating && filteredTasks.map((task) => (
                  <article 
                    key={task.id} 
                    className={`tarea-card-new tarea-card-blue ${task.removing ? 'removing' : ''}`}
                    onClick={() => handleTaskClick(task)}
                  >
                    <div className="tarea-card-header-new">
                <button
                        className={`tarea-card-checkbox ${task.status === 'completed' ? 'checked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          
                          // Marcar la tarea como "removing" para activar la animación
                          setTasks(tasks.map(t => 
                            t.id === task.id ? { ...t, removing: true } : t
                          ))
                          
                          // Después de la animación, actualizar el estado
                          setTimeout(() => {
                            const updatedTask = {
                              ...task,
                              status: task.status === 'completed' ? 'pending' : 'completed',
                              removing: false
                            }
                            setTasks(tasks.map(t => t.id === task.id ? updatedTask : t))

                            // Persistir en backend
                            taskService.update(task.id, updatedTask).catch(() => {})
                          }, 400)
                        }}
                      >
                        {task.status === 'completed' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                </button>
              </div>

                    <h3 className="tarea-card-title-new">{task.title}</h3>
                    <p className="tarea-card-description-new">{task.description}</p>
                    
                    <div className="tarea-card-footer-new">
                      <div className="tarea-card-user">
                        <img 
                          src={(task.avatars && task.avatars[0]) || DEFAULT_AVATAR} 
                          alt="Avatar"
                          className="tarea-user-avatar"
                        />
                        <span className="tarea-user-name">{task.displayName || 'Usuario'}</span>
              </div>

                      <div className="tarea-card-date-new">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <span>{task.date}</span>
                      </div>
                      </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Vista Notas Completadas */}
        {currentView === 'tareas-completadas' && (
          <div key="tareas-completadas-view" className="content view-enter">
            <div className="section section-full tareas-section">
              <div className="section-header tareas-header">
                <h2 className="section-title">Notas</h2>
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
                Aquí verás el detalle de todas las notas completadas. De momento es solo un diseño de ejemplo.
              </p>
            </div>
          </div>
        )}

        {/* Vista Notas Pendientes */}
        {currentView === 'tareas-pendientes' && (
          <div key="tareas-pendientes-view" className="content view-enter">
            <div className="section section-full tareas-section">
              <div className="section-header tareas-header">
                <h2 className="section-title">Notas</h2>
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
            <div className="section section-full pedidos-section">
              {/* Filtros de pedidos */}
              <div className="tareas-filters-row" style={{ marginBottom: 16 }}>
                <div className="tareas-filter-bar">
                  <button
                    type="button"
                    className={`tareas-filter-chip ${ordersFilter === 'todos' ? 'active' : ''}`}
                    onClick={() => setOrdersFilter('todos')}
                  >
                    Pendientes
                  </button>
                  <button
                    type="button"
                    className={`tareas-filter-chip ${ordersFilter === 'terminados' ? 'active' : ''}`}
                    onClick={() => setOrdersFilter('terminados')}
                  >
                    Terminados
                  </button>
              </div>
                
                {/* Botón nuevo pedido */}
                <button className="tareas-add-btn" onClick={handleAddOrder}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Nuevo
                </button>
              </div>

              {/* Grid de pedidos */}
              <div className="pedidos-grid-new">
                {filteredOrders.map((order) => {
                    const completedItems = order.items.filter(item => item.completed).length
                    const totalItems = order.items.length
                    const progress = (completedItems / totalItems) * 100
                    const isCompleted = completedItems === totalItems

                    return (
                      <article
                        key={order.id}
                        className={`pedido-card-new ${order.completing ? 'completing' : ''}`}
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowEditOrderModal(true)
                        }}
                      >
                        <div className="pedido-card-header-new">
                          <div>
                            <h3 className="pedido-card-title-new">{order.orderNumber}</h3>
                            <p style={{ fontSize: '13px', color: '#9ca3c0', margin: '4px 0 0 0' }}>
                              {order.supplier}
                            </p>
                          </div>
                          <div
                            className="pedido-card-badge"
                            style={{
                              background: isCompleted
                                ? 'rgba(99, 102, 241, 0.15)'
                                : 'rgba(99, 102, 241, 0.1)',
                              color: isCompleted ? '#a5b4fc' : '#9ca3c0',
                              borderColor: isCompleted
                                ? 'rgba(99, 102, 241, 0.3)'
                                : 'rgba(99, 102, 241, 0.2)',
                            }}
                          >
                            {isCompleted ? 'Completado' : 'Pendiente'}
                          </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#9ca3c0' }}>
                              Progreso: {completedItems}/{totalItems}
                            </span>
                            <span style={{ fontSize: '12px', color: '#9ca3c0', fontWeight: '600' }}>
                              {Math.round(progress)}%
                            </span>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              height: '6px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '999px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${progress}%`,
                                height: '100%',
                                background: isCompleted
                                  ? 'linear-gradient(90deg, #6366f1, #a5b4fc)'
                                  : 'linear-gradient(90deg, #6366f1, #4f46e5)',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                          {order.items.map((item) => (
                            <div
                              key={item.id || item._id}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px 0',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={() => handleToggleOrderItem(order.id, item.id || item._id)}
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  cursor: 'pointer',
                                  accentColor: '#6366f1',
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: '13px',
                                    color: item.completed ? '#7f85a3' : '#ffffff',
                                    textDecoration: item.completed ? 'line-through' : 'none',
                                  }}
                                >
                                  {item.name}
                                </div>
                                <div style={{ fontSize: '11px', color: '#7f85a3' }}>
                                  Cantidad: {item.quantity}
                                </div>
                              </div>
                              {/* Avatar del usuario que completó el item */}
                              {item.completed && item.completedBy && (
                                <div 
                                  style={{ 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}
                                  title={`Recibido por ${item.completedBy.name}`}
                                >
                                  <img
                                    src={item.completedBy.avatar}
                                    alt={item.completedBy.name}
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      borderRadius: '50%',
                                      border: '2px solid #6366f1',
                                      objectFit: 'cover'
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="pedido-card-footer-new">
                          <div className="pedido-info-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                              <line x1="16" y1="2" x2="16" y2="6"/>
                              <line x1="8" y1="2" x2="8" y2="6"/>
                              <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            <span>Pedido: {order.orderDate}</span>
                          </div>
                          <div className="pedido-info-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            <span>Llegada: {order.expectedDate}</span>
                          </div>
                        </div>
                      </article>
                    )
                  })}
              </div>

              {/* Resumen de estado de pedidos al final */}
              <div className="pedidos-summary" style={{ marginTop: '24px' }}>
                <div className="pedido-stat-card pendiente">
                  <div className="pedido-stat-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="6" x2="12" y2="12" />
                      <line x1="12" y1="12" x2="16" y2="16" />
                    </svg>
                  </div>
                  <div className="pedido-stat-content">
                    <div className="pedido-stat-value">{pendingOrdersCount}</div>
                    <div className="pedido-stat-label">Pendientes</div>
                  </div>
                </div>

                <div className="pedido-stat-card en-proceso">
                  <div className="pedido-stat-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20" />
                      <path d="M5 9l7-7 7 7" />
                    </svg>
                  </div>
                  <div className="pedido-stat-content">
                    <div className="pedido-stat-value">{inProgressOrdersCount}</div>
                    <div className="pedido-stat-label">En proceso</div>
                  </div>
                </div>

                <div className="pedido-stat-card completado">
                  <div className="pedido-stat-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="pedido-stat-content">
                    <div className="pedido-stat-value">{completedOrdersCount}</div>
                    <div className="pedido-stat-label">Completados</div>
                  </div>
                </div>

                <div className="pedido-stat-card total">
                  <div className="pedido-stat-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    </svg>
                  </div>
                  <div className="pedido-stat-content">
                    <div className="pedido-stat-value">{totalOrdersCount}</div>
                    <div className="pedido-stat-label">Total</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vista Vales */}
        {currentView === 'vales' && (
          <div key="vales-view" className="content view-enter">
            <div className="section section-full vales-section">
              <div className="tareas-filters-row" style={{ marginBottom: 16 }}>
                <div className="tareas-filter-bar">
                  <button
                    type="button"
                    className={`tareas-filter-chip ${vouchersFilter === 'activos' ? 'active' : ''}`}
                    onClick={() => setVouchersFilter('activos')}
                  >
                    Activos
                  </button>
                  <button
                    type="button"
                    className={`tareas-filter-chip ${vouchersFilter === 'usados' ? 'active' : ''}`}
                    onClick={() => setVouchersFilter('usados')}
                  >
                    Usados
                  </button>
                  <button
                    type="button"
                    className={`tareas-filter-chip ${vouchersFilter === 'vencidos' ? 'active' : ''}`}
                    onClick={() => setVouchersFilter('vencidos')}
                  >
                    Vencidos
                  </button>
                  <button
                    type="button"
                    className={`tareas-filter-chip ${vouchersFilter === 'todos' ? 'active' : ''}`}
                    onClick={() => setVouchersFilter('todos')}
                  >
                    Todos
                  </button>
                </div>
                <button className="tareas-add-btn" onClick={handleCreateVoucher}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Nuevo vale
                </button>
              </div>

              <div className="vales-grid">
                {vouchersLoading && (
                  <div className="empty-state">Cargando vales...</div>
                )}
                {!vouchersLoading && vouchersError && (
                  <div className="empty-state">{vouchersError}</div>
                )}
                {!vouchersLoading && !vouchersError && filteredVouchers.length === 0 && (
                  <div className="empty-state">No hay vales en este filtro.</div>
                )}
                {!vouchersLoading && !vouchersError && filteredVouchers.map((voucher) => {
                  const expired = isVoucherExpired(voucher)
                  const statusLabel = expired ? 'Vencido' : (voucher.status === 'usado' ? 'Usado' : 'Activo')

                  return (
                    <article key={voucher.id} className={`vale-card ${expired ? 'is-expired' : ''}`}>
                      <div className="vale-badge-row">
                        <span className={`vale-badge vale-badge-floating ${expired ? 'expired' : voucher.status}`}>
                          {statusLabel}
                        </span>
                      </div>

                      <h3 className="vale-main-title">Vale "Dejate llevar"</h3>

                      <div className="vale-layout">
                        <div className="vale-layout-main">
                          <div className="vale-form-field">
                            <span>Para:</span>
                            <strong>{voucher.title}</strong>
                          </div>

                          <div className="vale-form-row">
                            <div className="vale-form-field">
                              <span>Ref:</span>
                              <strong>{voucher.code}</strong>
                            </div>
                            <div className="vale-form-field">
                              <span>Expira:</span>
                              <strong>{new Date(voucher.expiresAt).toLocaleDateString('es-ES')}</strong>
                            </div>
                          </div>

                          <div className="vale-contact">
                            Plaza de Espana 6-7<br />
                            881 924 882<br />
                            miga@migacoruna.com
                          </div>

                          <div className="vale-note">
                            Vale por un menu degustacion "Dejate llevar". Consulta condiciones en el local.
                          </div>
                        </div>
                      </div>

                      <div className="vale-actions">
                        <button
                          type="button"
                          className="vale-action-btn vale-action-btn-secondary"
                          onClick={() => handleOpenEditVoucher(voucher)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="vale-action-btn"
                          onClick={() => handleToggleVoucherStatus(voucher.id)}
                          disabled={expired}
                        >
                          {voucher.status === 'activo' ? 'Marcar usado' : 'Reactivar'}
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>

              <div className="vales-summary">
                <div className="vale-stat-card">
                  <div className="vale-stat-value">{activeVouchersCount}</div>
                  <div className="vale-stat-label">Activos</div>
                </div>
                <div className="vale-stat-card">
                  <div className="vale-stat-value">{usedVouchersCount}</div>
                  <div className="vale-stat-label">Usados</div>
                </div>
                <div className="vale-stat-card">
                  <div className="vale-stat-value">{expiredVouchersCount}</div>
                  <div className="vale-stat-label">Vencidos</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vista Ajustes */}
        {currentView === 'ajustes' && (
          <div key="ajustes-view" className="content view-enter">
            <div className="section section-full ajustes-section">
              <div className="ajustes-container">
                {/* Perfil del usuario */}
                <div className="ajustes-profile">
                  <div className="ajustes-profile-avatar">
                    <img src={currentUser?.avatar || ajustesData.userAvatar || getUserAvatar(currentUser)} alt="Usuario" />
              </div>
                  <div className="ajustes-profile-info">
                    <h3>{currentUser?.name || ajustesData.userName}</h3>
                    <p>{currentUser?.email || ajustesData.userEmail}</p>
                  </div>
                  <button 
                    className="ajustes-profile-edit"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('Estado antes:', showEditProfileModal)
                      setShowEditProfileModal(true)
                      console.log('Estado después:', true)
                    }}
                  >
                    Editar perfil
                  </button>
                </div>

                {/* Notificaciones */}
                <div className="ajustes-group">
                  <h4 className="ajustes-group-title">Notificaciones</h4>
                  <div className="ajustes-items">
                    <div className="ajustes-item">
                      <div className="ajustes-item-left">
                        <FiBell className="ajustes-item-icon" />
                        <div className="ajustes-item-info">
                          <span className="ajustes-item-label">Activar notificaciones</span>
                          <span className="ajustes-item-desc">
                            {notificationsEnabled ? 'Recibir alertas y avisos' : 'Notificaciones desactivadas'}
                          </span>
                        </div>
                      </div>
                      <label className="ajustes-toggle">
                        <input 
                          type="checkbox" 
                          checked={notificationsEnabled}
                          onChange={(e) => {
                            const enabled = e.target.checked
                            setNotificationsEnabled(enabled)
                            if (!enabled) {
                              setShowNotifications(false)
                              if (currentView === 'ayuda') {
                                setCurrentView('home')
                              }
                            }
                          }}
                        />
                        <span className="ajustes-toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Seguridad */}
                <div className="ajustes-group">
                  <h4 className="ajustes-group-title">Seguridad</h4>
                  <div className="ajustes-items">
                    <div className="ajustes-item" onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowChangePasswordModal(true)
                    }}>
                      <div className="ajustes-item-left">
                        <FiSettings className="ajustes-item-icon" />
                        <div className="ajustes-item-info">
                          <span className="ajustes-item-label">Cambiar contraseña</span>
                          <span className="ajustes-item-desc">Actualiza tu contraseña</span>
                        </div>
                      </div>
                      <FiChevronDown className="ajustes-item-arrow" style={{ transform: 'rotate(-90deg)' }} />
                    </div>
                  </div>
                </div>

                {/* Botón de cerrar sesión */}
                <button className="ajustes-logout" onClick={handleLogout}>
                  <FiLogOut />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Vista Notificaciones (antes Ayuda) */}
        {currentView === 'ayuda' && notificationsEnabled && (
          <div key="notificaciones-view" className="content view-enter">
            <div className="section section-full notificaciones-section">
              <div className="notificaciones-header">
                <button 
                  className="notificaciones-mark-all"
                  onClick={handleMarkAllAsRead}
                >
                  Marcar todas como leídas
                </button>
              </div>

              <div className="notificaciones-container">
                {sortedNotifications.map((notif, index) => {
                  const IconComponent = 
                    notif.icon === 'FiBox' ? FiBox :
                    notif.icon === 'FiPackage' ? FiPackage :
                    notif.icon === 'FiCheckCircle' ? FiCheckCircle :
                    notif.icon === 'FiCheckSquare' ? FiCheckSquare :
                    notif.icon === 'FiTrendingUp' ? FiTrendingUp :
                    notif.icon === 'FiStar' ? FiStar :
                    notif.icon === 'FiHeart' ? FiHeart : FiBox

                  return (
                    <div 
                      key={notif.id || `${notif.title}-${notif.message}-${notif.createdAt}`}
                      className={`notificacion-item ${notif.unread ? 'unread' : ''}`}
                      style={{ '--stagger': `${index * 35}ms` }}
                    >
                      <div className={`notificacion-icon ${notif.type}`}>
                        <IconComponent />
                      </div>
                      <div className="notificacion-content">
                        <div className="notificacion-header">
                          <h4 className="notificacion-titulo">{notif.title}</h4>
                          <span className="notificacion-time">{getNotificationTime(notif)}</span>
                        </div>
                        <p 
                          className="notificacion-mensaje"
                          dangerouslySetInnerHTML={{ __html: notif.message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                        />
                        {notif.actions && notif.actions.length > 0 && (
                          <div className="notificacion-actions">
                            {notif.actions.map((action, idx) => (
                              <button 
                                key={idx}
                                className={idx === 0 ? 'notificacion-btn-primary' : 'notificacion-btn-secondary'}
                                onClick={() => handleNotificationAction(action, notif)}
                              >
                                {action}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {notif.unread && <div className="notificacion-badge"></div>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* IA embebida persistente: se mantiene montada para conservar estado de "pensando" */}
        <AIChat
          wines={wines}
          onWinesChange={setWines}
          onUIChange={(changes) => {
            if (changes.currentView) setCurrentView(changes.currentView);
            if (changes.searchTerm !== undefined) {
              console.log('Buscar:', changes.searchTerm);
            }
          }}
          currentUser={currentUser}
          isVisible={currentView === 'ia'}
          messages={aiChatMessages}
          onMessagesChange={setAiChatMessages}
        />

        {/* Vista Valoraciones */}
        {currentView === 'valoraciones' && (
          <div key="valoraciones-view" className="content view-enter">
            <div className="section section-full valoraciones-section">
              {/* Filtros y Botón Nuevo */}
              <div className="tareas-filters-row" style={{ marginBottom: 16 }}>
                {/* Filtros individuales (solo desktop) */}
                <div className="valoraciones-filter-buttons-desktop">
                  <button
                    type="button"
                    className={`tareas-filter-chip ${reviewsFilter === 'todos' ? 'active' : ''}`}
                    onClick={() => setReviewsFilter('todos')}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    className={`tareas-filter-chip ${reviewsFilter === '5stars' ? 'active' : ''}`}
                    onClick={() => setReviewsFilter('5stars')}
                  >
                    5 ★
                  </button>
                  <button
                    type="button"
                    className={`tareas-filter-chip ${reviewsFilter === '4stars' ? 'active' : ''}`}
                    onClick={() => setReviewsFilter('4stars')}
                  >
                    4 ★
                  </button>
                  <button
                    type="button"
                    className={`tareas-filter-chip ${reviewsFilter === '3stars' ? 'active' : ''}`}
                    onClick={() => setReviewsFilter('3stars')}
                  >
                    3 ★
                  </button>
              </div>

                {/* Dropdown de filtros (solo móvil) */}
                <div className="filter-dropdown-container valoraciones-filter-dropdown-mobile">
                  <button
                    type="button"
                    className={`filter-dropdown-button ${isReviewsFilterMenuOpen ? 'open' : ''}`}
                    onClick={() => setIsReviewsFilterMenuOpen(!isReviewsFilterMenuOpen)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                    </svg>
                    Filtros
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chevron">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {isReviewsFilterMenuOpen && (
                    <div className="filter-dropdown-menu">
                      <button
                        type="button"
                        className={`filter-dropdown-item ${reviewsFilter === 'todos' ? 'active' : ''}`}
                        onClick={() => {
                          setReviewsFilter('todos')
                          setIsReviewsFilterMenuOpen(false)
                        }}
                      >
                        {reviewsFilter === 'todos' && <span className="checkmark">✓</span>}
                        Todas
                      </button>
                      <button
                        type="button"
                        className={`filter-dropdown-item ${reviewsFilter === '5stars' ? 'active' : ''}`}
                        onClick={() => {
                          setReviewsFilter('5stars')
                          setIsReviewsFilterMenuOpen(false)
                        }}
                      >
                        {reviewsFilter === '5stars' && <span className="checkmark">✓</span>}
                        5 ★
                      </button>
                      <button
                        type="button"
                        className={`filter-dropdown-item ${reviewsFilter === '4stars' ? 'active' : ''}`}
                        onClick={() => {
                          setReviewsFilter('4stars')
                          setIsReviewsFilterMenuOpen(false)
                        }}
                      >
                        {reviewsFilter === '4stars' && <span className="checkmark">✓</span>}
                        4 ★
                      </button>
                      <button
                        type="button"
                        className={`filter-dropdown-item ${reviewsFilter === '3stars' ? 'active' : ''}`}
                        onClick={() => {
                          setReviewsFilter('3stars')
                          setIsReviewsFilterMenuOpen(false)
                        }}
                      >
                        {reviewsFilter === '3stars' && <span className="checkmark">✓</span>}
                        3 ★
                      </button>
            </div>
                  )}
                </div>

                <button className="tareas-add-btn" onClick={handleAddReview}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Nueva Reseña
                </button>
              </div>

              {reviewsError && (
                <div className="valoraciones-error">
                  {reviewsError}
                </div>
              )}
              {/* Grid de Valoraciones */}
              <div className="valoraciones-grid">
                {reviewsLoading && (
                  <div className="valoraciones-placeholder">
                    Cargando valoraciones...
                  </div>
                )}
                {!reviewsLoading && filteredReviews.length === 0 && (
                  <div className="valoraciones-placeholder">
                    {reviewPlaceholderMessage}
                  </div>
                )}
                {!reviewsLoading && filteredReviews.length > 0 && filteredReviews.map((review) => (
                    <div
                      key={review.id}
                      className="valoracion-card"
                      onClick={() => handleOpenReviewDetail(review)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="valoracion-card-header">
                        <img
                          src={review.wineImage}
                          alt={review.wineName}
                          className="valoracion-wine-image"
                        />
                        <div className="valoracion-wine-info">
                          <h3 className="valoracion-wine-name">{review.wineName}</h3>
                          <span className="valoracion-wine-type">{review.wineType}</span>
                        </div>
                      </div>

                      <div className="valoracion-rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar
                            key={star}
                            className={star <= review.rating ? 'star-filled' : 'star-empty'}
                          />
                        ))}
                      </div>

                      <p className="valoracion-comment">{review.comment}</p>

                      <div className="valoracion-card-footer">
                        <div className="valoracion-user">
                          <img
                            src={review.userAvatar}
                            alt={review.userName}
                            className="valoracion-user-avatar"
                          />
                          <div className="valoracion-user-info">
                            <span className="valoracion-user-name">{review.userName}</span>
                            {review.verified && (
                              <span className="valoracion-verified">
                                <FiCheckCircle size={12} /> Verificada
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="valoracion-date">{review.date}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Vista Top Vinos */}
        {currentView === 'top-vinos' && (
          <div key="top-vinos-view" className="content view-enter">
            <div className="section section-full top-vinos-section">
              {/* Lista de top vinos estilo horizontal */}
              <div className="top-vinos-list">
                {topWinesLoading && (
                  <div className="top-vinos-placeholder">
                    Cargando ranking de vinos...
                  </div>
                )}
                {!topWinesLoading && topWinesError && (
                  <div className="top-vinos-error">
                    {topWinesError}
                  </div>
                )}
                {!topWinesLoading && !topWinesError && topWines.length === 0 && (
                  <div className="top-vinos-placeholder">
                    Todavía no hay datos suficientes para generar el ranking. Dale like a tus vinos favoritos y crea algunas reseñas.
                  </div>
                )}
                {!topWinesLoading && !topWinesError && topWines.length > 0 && topWines.map((item, index) => (
                  <div 
                    key={item.id} 
                    className={`top-vino-item ${item.rank <= 3 ? 'top-three' : ''}`}
                    style={{ '--stagger': `${index * 45}ms` }}
                  >
                    {/* Icono y nombre del vino */}
                    <div className="top-vino-main" onClick={() => setSelectedWine(item.wine)}>
                      <div className="top-vino-icon">
                        <img src={item.wine.image} alt={item.wine.name} />
                        <span className="top-vino-rank">#{item.rank}</span>
                      </div>
                      <div className="top-vino-info">
                        <h3 className="top-vino-title">{item.wine.name}</h3>
                        <div className="top-vino-subtitle">
                          <span className="vino-category">{item.wine.type}</span>
                          <span className="vino-divider">|</span>
                          <span className="vino-risk">Año {item.wine.year}</span>
                        </div>
                      </div>
                    </div>

                    {/* Estadísticas en columnas */}
                    <div className="top-vino-stats">
                      <div className="top-stat-col">
                        <div className="stat-label">Likes</div>
                        <div className="stat-value">{item.likes}</div>
                      </div>
                      
                      <div className="top-stat-col">
                        <div className="stat-label">Crecimiento</div>
                        <div className={`stat-value ${item.growth.includes('-') ? 'negative' : 'positive'}`}>
                          {item.growth}
                        </div>
                      </div>
                      
                      <div className="top-stat-col">
                        <div className="stat-label">Valoración</div>
                        <div className="stat-value">{item.rating} pts</div>
                      </div>
                      
                      <div className="top-stat-col">
                        <div className="stat-label">Reseñas</div>
                        <div className="stat-value">{item.reviews}</div>
                      </div>
                    </div>

                    {/* Botón de like y ver detalles */}
                    <div className="top-vino-actions">
                      <button 
                        className={`top-vino-like-btn ${item.liked ? 'liked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleWineLike(item.wine.id);
                        }}
                      >
                        <FiHeart size={18} />
                        <span>{item.liked ? 'Te gusta' : 'Me gusta'}</span>
                      </button>
                      <button 
                        className="top-vino-btn"
                        onClick={() => setSelectedWine(item.wine)}
                      >
                        + Ver detalles
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
      </div>
      </div>
     
    </div>


    {/* Panel de Notificaciones */}
    {notificationsEnabled && showNotifications && (
      <div 
        className="notifications-overlay"
        onClick={() => setShowNotifications(false)}
      >
        <div 
          className={`notifications-panel ${settings.compactNotifications ? 'notifications-compact' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="notifications-header">
            <h2>Notificaciones ({sortedNotifications.length})</h2>
            <button 
              className="notifications-close"
              onClick={() => setShowNotifications(false)}
            >
              ✕
            </button>
          </div>
          
          <div className="notifications-list">
            {sortedNotifications.length > 0 ? (
              sortedNotifications.map((notification, index) => (
                <div 
                  key={notification._id || notification.id || `${notification.title}-${notification.createdAt}`}
                  className={`notification-item ${notification.unread ? 'unread' : ''}`}
                  style={{ '--stagger': `${index * 22}ms` }}
                  onClick={() => handleNotificationClick(notification.wineId, notification._id || notification.id)}
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
                    <span className="notification-time">{getNotificationTime(notification)}</span>
                  </div>
                  {notification.unread && <span className="notification-badge-item">NUEVA</span>}
                  <button
                    className="notification-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      notificationService.delete(notification.id).catch(() => {})
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
        onUpdateWine={!currentUser?.isGuest ? handleUpdateWine : null}
        onDeleteWine={!currentUser?.isGuest ? handleDeleteWine : null}
        isGuest={currentUser?.isGuest}
      />
    )}

    {/* Modal de agregar vino - fuera del contenedor principal */}
    {showAddWineModal && (
      <AddWineModal
        onClose={() => setShowAddWineModal(false)}
        onAddWine={handleAddWine}
      />
    )}

    {/* Modal de detalles/edición de tarea */}
    {showTaskModal && selectedTask && (
      <TaskModal
        task={selectedTask}
        onClose={() => {
          setShowTaskModal(false)
          setSelectedTask(null)
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    )}

    {/* Modal de agregar tarea */}
    {showAddTaskModal && (
      <AddTaskModal
        onClose={() => setShowAddTaskModal(false)}
        onSave={handleSaveTask}
      />
    )}

    {/* Modal de agregar pedido */}
    {showAddOrderModal && (
      <AddOrderModal
        onClose={() => setShowAddOrderModal(false)}
        onSave={handleSaveOrder}
        wines={wines}
      />
    )}

    {/* Modal de agregar vale */}
    {showAddVoucherModal && (
      <AddVoucherModal
        onClose={() => setShowAddVoucherModal(false)}
        onSave={handleSaveVoucher}
      />
    )}

    {/* Modal de editar pedido */}
    {showEditOrderModal && selectedOrder && (
      <EditOrderModal
        order={selectedOrder}
        onClose={() => {
          setShowEditOrderModal(false)
          setSelectedOrder(null)
        }}
        onSave={handleSaveOrder}
        onDelete={handleDeleteOrder}
        wines={wines}
      />
    )}

    {/* Modal de editar/eliminar vale */}
    {showEditVoucherModal && selectedVoucher && (
      <EditVoucherModal
        voucher={selectedVoucher}
        onClose={() => {
          setShowEditVoucherModal(false)
          setSelectedVoucher(null)
        }}
        onSave={handleUpdateVoucher}
        onDelete={handleDeleteVoucher}
      />
    )}

    {/* Modal de agregar valoración */}
    {showAddReviewModal && (
      <AddReviewModal
        onClose={() => setShowAddReviewModal(false)}
        onSave={handleSaveReview}
        wines={wines}
      />
    )}

    {detailReview && (
      <ReviewDetailModal
        review={detailReview}
        onClose={() => setDetailReview(null)}
        isOwner={detailReview.userId === currentUserId}
        onEdit={handleEditReviewFromDetail}
        onDelete={handleDeleteReviewFromDetail}
      />
    )}

    {/* Modal de ver/eliminar valoración */}
    {showEditReviewModal && selectedReview && (
      <EditReviewModal
        review={selectedReview}
        onClose={() => {
          setShowEditReviewModal(false)
          setSelectedReview(null)
        }}
        onDelete={handleDeleteReview}
      />
    )}

    {/* Modal de editar perfil */}
    {showEditProfileModal && (
      <EditProfileModal
        data={{
          userName: currentUser?.name || ajustesData.userName,
          userEmail: currentUser?.email || ajustesData.userEmail
        }}
        currentAvatar={currentUser?.avatar || getUserAvatar(currentUser)}
        availableAvatars={DEFAULT_AVATARS}
        onClose={() => setShowEditProfileModal(false)}
        onSave={async (newData) => {
          try {
            console.log('Guardando perfil...', { newData, currentUser })
            
            // Actualizar el avatar en el backend
            if (currentUser?._id || currentUser?.id) {
              const userId = currentUser._id || currentUser.id
              console.log('Actualizando usuario:', userId)
              
              const response = await userService.updateProfile(userId, {
                name: newData.userName,
                email: newData.userEmail,
                avatar: newData.avatar
              })
              
              console.log('Respuesta del servidor:', response)
              
              // Actualizar el usuario local
              const updatedUser = { 
                ...currentUser, 
                name: newData.userName,
                email: newData.userEmail,
                avatar: newData.avatar 
              }
              setCurrentUser(updatedUser)
              localStorage.setItem('user', JSON.stringify(updatedUser))
              
              // Actualizar ajustesData con el nuevo avatar (usando userAvatar para compatibilidad)
              setAjustesData({
                ...ajustesData, 
                userName: newData.userName,
                userEmail: newData.userEmail,
                userAvatar: newData.avatar
              })
              
              setShowEditProfileModal(false)
            } else {
              console.error('No se encontró el ID del usuario:', currentUser)
              alert('Error: No se pudo identificar al usuario. Por favor, inicia sesión de nuevo.')
            }
          } catch (error) {
            console.error('Error al actualizar perfil:', error)
            console.error('Detalles del error:', error.response?.data || error.message)
            alert(`Error al actualizar el perfil: ${error.response?.data?.message || error.message}`)
          }
        }}
      />
    )}

    {/* Modal de cambiar contraseña */}
    {showChangePasswordModal && (
      <ChangePasswordModal
        onClose={() => setShowChangePasswordModal(false)}
        onSave={async ({ currentPassword, newPassword }) => {
          try {
            const userId = currentUser?._id || currentUser?.id
            if (!userId) {
              alert('No se pudo identificar al usuario. Inicia sesión de nuevo.')
              return
            }
            await userService.changePassword(userId, { currentPassword, newPassword })
            alert('Contraseña actualizada')
            setShowChangePasswordModal(false)
          } catch (error) {
            alert(error.response?.data?.message || error.message || 'No se pudo cambiar la contraseña')
          }
        }}
      />
    )}

    </>
  )
}

// Componente Select personalizado para usar el mismo estilo de la página
function CustomSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const selectRef = useRef(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div className={`custom-select ${open ? 'open' : ''}`} ref={selectRef}>
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{selectedOption ? selectedOption.label : 'Seleccionar'}</span>
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="1 1 6 6 11 1" />
        </svg>
      </button>
      {open && (
        <div className="custom-select-options">
          {options.map((opt) => (
            <button
              type="button"
              key={opt.value}
              className={`custom-select-option ${opt.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Componente de Calendario Personalizado
function CustomCalendar({ selectedDate, onDateSelect, onClose }) {
  // Inicializar currentMonth correctamente desde selectedDate
  const initMonth = () => {
    if (selectedDate) {
      const [year, month] = selectedDate.split('-').map(Number)
      return new Date(year, month - 1, 1)
    }
    return new Date()
  }
  const [currentMonth, setCurrentMonth] = useState(initMonth())
  
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  
  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Días del mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, isCurrentMonth: false })
    }
    
    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true })
    }
    
    // Días del siguiente mes
    const remainingDays = 42 - days.length // 6 semanas * 7 días
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, isCurrentMonth: false })
    }
    
    return days
  }
  
  const handlePrevMonth = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }
  
  const handleNextMonth = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }
  
  const handleDayClick = (e, day) => {
    e.preventDefault()
    e.stopPropagation()
    if (day.isCurrentMonth) {
      const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day.day)
      onDateSelect(newDate)
      onClose()
    }
  }
  
  const isSelectedDay = (day) => {
    if (!selectedDate || !day.isCurrentMonth) return false
    // Usar split para evitar problemas de zona horaria
    const [year, month, dayNum] = selectedDate.split('-').map(Number)
    return (
      dayNum === day.day &&
      (month - 1) === currentMonth.getMonth() &&
      year === currentMonth.getFullYear()
    )
  }
  
  const isToday = (day) => {
    if (!day.isCurrentMonth) return false
    const today = new Date()
    return (
      today.getDate() === day.day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    )
  }
  
  const days = getDaysInMonth(currentMonth)
  
  return (
    <div className="calendar-overlay" onClick={onClose}>
      <div className="calendar-popup" onClick={(e) => e.stopPropagation()}>
        <div className="calendar-header">
          <button type="button" className="calendar-nav-btn" onClick={handlePrevMonth}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h3 className="calendar-month-title">
            {monthNames[currentMonth.getMonth()]}
          </h3>
          <button type="button" className="calendar-nav-btn" onClick={handleNextMonth}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
        
        <div className="calendar-weekdays">
          {daysOfWeek.map((day) => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>
        
        <div className="calendar-days">
          {days.map((day, index) => (
            <button
              key={index}
              type="button"
              className={`calendar-day ${!day.isCurrentMonth ? 'calendar-day-other' : ''} ${
                isSelectedDay(day) ? 'calendar-day-selected' : ''
              } ${isToday(day) ? 'calendar-day-today' : ''}`}
              onClick={(e) => handleDayClick(e, day)}
            >
              {day.day}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Componente Modal de Tarea
function TaskModal({ task, onClose, onSave, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState(task)
  const [showCalendar, setShowCalendar] = useState(false)

  const handleSave = () => {
    onSave(editedTask)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedTask(task)
    setIsEditing(false)
  }

  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', width: '90%', overflowX: 'hidden' }}>
        {/* Header con botón editar */}
        <div className="task-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>{isEditing ? 'Editar Tarea' : 'Detalles de la Tarea'}</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                ✎ Editar
              </button>
            )}
            <button className="task-modal-close" onClick={onClose}>✕</button>
          </div>
        </div>
        
        {/* Contenido */}
        <div className="task-modal-content" style={{ padding: '20px', overflowX: 'hidden', wordWrap: 'break-word' }}>
          {isEditing ? (
            /* MODO EDICIÓN */
            <>
              <div className="task-modal-field" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#9ca3c0' }}>Título</label>
                <input
                  type="text"
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                />
              </div>

              <div className="task-modal-field" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#9ca3c0' }}>Descripción</label>
                <textarea
                  value={editedTask.description}
                  onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
                  rows="4"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                />
              </div>

              <div className="task-modal-field" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#9ca3c0' }}>Fecha</label>
                <div 
                  onClick={() => setShowCalendar(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#fff'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span>{editedTask.date}</span>
                </div>
                {showCalendar && (
                  <CustomCalendar
                    selectedDate={editedTask.dateValue}
                    onDateSelect={(date) => {
                      const year = date.getFullYear()
                      const month = String(date.getMonth() + 1).padStart(2, '0')
                      const day = String(date.getDate()).padStart(2, '0')
                      const dateValue = `${year}-${month}-${day}`
                      const formattedDate = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
                      setEditedTask({ ...editedTask, date: formattedDate, dateValue: dateValue })
                    }}
                    onClose={() => setShowCalendar(false)}
                  />
                )}
              </div>

              {/* Botones de edición */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleCancelEdit}
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Guardar
                </button>
              </div>
            </>
          ) : (
            /* MODO SOLO LECTURA */
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#9ca3c0', textTransform: 'uppercase' }}>Título</label>
                <p style={{ margin: 0, fontSize: '18px', color: '#fff', fontWeight: '600', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{task.title}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#9ca3c0', textTransform: 'uppercase' }}>Descripción</label>
                <p style={{ margin: 0, fontSize: '14px', color: '#e5e7eb', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{task.description || 'Sin descripción'}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#9ca3c0', textTransform: 'uppercase' }}>Fecha</label>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3c0" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <span style={{ color: '#fff', fontSize: '14px' }}>{task.date}</span>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#9ca3c0', textTransform: 'uppercase' }}>Estado</label>
                <span style={{
                  display: 'inline-block',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: task.status === 'completed' ? 'rgba(16,185,129,0.15)' : 'rgba(251,191,36,0.15)',
                  color: task.status === 'completed' ? '#10b981' : '#fbbf24'
                }}>
                  {task.status === 'completed' ? '✓ Completada' : '⏳ Pendiente'}
                </span>
              </div>

              {/* Botones de acciones */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                  onClick={() => {
                    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
                      onDelete(task.id)
                    }
                  }}
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Eliminar
                </button>
                <button
                  onClick={onClose}
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cerrar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Componente Modal de Agregar Tarea
function AddTaskModal({ onClose, onSave }) {
  const [showCalendar, setShowCalendar] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' }),
    dateValue: new Date().toISOString().split('T')[0],
    color: 'purple',
    status: 'pending',
    priority: 'medium',
    group: 'hoy'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(newTask)
  }

  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="task-modal-header">
          <h3>Nueva Tarea</h3>
          <button className="task-modal-close" onClick={onClose}>✕</button>
        </div>
        
        <form className="task-modal-content" onSubmit={handleSubmit}>
          <div className="task-modal-field">
            <label>Título</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              placeholder="Ej: Revisar inventario"
              required
            />
          </div>

          <div className="task-modal-field">
            <label>Descripción</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              placeholder="Describe la tarea..."
              rows="4"
              required
            />
          </div>

          <div className="task-modal-row">
            <div className="task-modal-field">
              <label>Fecha</label>
              <div 
                className="date-display-field"
                onClick={() => setShowCalendar(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>{newTask.date}</span>
              </div>
              {showCalendar && (
                <CustomCalendar
                  selectedDate={newTask.dateValue}
                  onDateSelect={(date) => {
                    const year = date.getFullYear()
                    const month = String(date.getMonth() + 1).padStart(2, '0')
                    const day = String(date.getDate()).padStart(2, '0')
                    const dateValue = `${year}-${month}-${day}`
                    
                    const formattedDate = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
                    setNewTask({
                      ...newTask,
                      date: formattedDate,
                      dateValue: dateValue
                    })
                  }}
                  onClose={() => setShowCalendar(false)}
                />
              )}
            </div>

          </div>

          <div className="task-modal-actions">
            <div className="task-modal-actions-right">
              <button
                type="button"
                className="task-modal-btn task-modal-btn-cancel"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="task-modal-btn task-modal-btn-save"
              >
                Crear Tarea
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal base para crear/editar vales
function VoucherModal({ title, initialVoucher, submitLabel, onClose, onSave, onDelete = null, simpleCreate = false }) {
  const [voucher, setVoucher] = useState(() => ({
    id: initialVoucher?.id || '',
    code: initialVoucher?.code || '',
    title: initialVoucher?.title || '',
    discountType: initialVoucher?.discountType || 'percent',
    discountValue: initialVoucher?.discountValue ?? 10,
    minOrder: initialVoucher?.minOrder ?? 0,
    usesLeft: initialVoucher?.usesLeft ?? 1,
    expiresAt: initialVoucher?.expiresAt
      ? new Date(initialVoucher.expiresAt).toISOString().split('T')[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: initialVoucher?.status || 'activo',
  }))
  const [showExpiryCalendar, setShowExpiryCalendar] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!voucher.code.trim()) {
      alert('El codigo del vale es obligatorio')
      return
    }
    if (!voucher.title.trim()) {
      alert('El titulo del vale es obligatorio')
      return
    }
    if (!voucher.expiresAt) {
      alert('La fecha de caducidad es obligatoria')
      return
    }

    onSave({
      ...voucher,
      code: voucher.code.trim().toUpperCase(),
      title: voucher.title.trim(),
      discountValue: Number(voucher.discountValue),
      minOrder: Number(voucher.minOrder),
      usesLeft: Number(voucher.usesLeft),
      expiresAt: new Date(`${voucher.expiresAt}T23:59:59`).toISOString(),
    })
  }

  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="task-modal-header">
          <h3>{title}</h3>
          <button className="task-modal-close" onClick={onClose}>x</button>
        </div>

        <form className="task-modal-content" onSubmit={handleSubmit}>
          {simpleCreate ? (
            <>
              <div className="task-modal-field">
                <label>Para:</label>
                <input
                  type="text"
                  value={voucher.title}
                  onChange={(e) => setVoucher({ ...voucher, title: e.target.value })}
                  placeholder="Nombre o concepto"
                  maxLength={80}
                  required
                />
              </div>

              <div className="task-modal-field">
                <label>Referencia:</label>
                <input
                  type="text"
                  value={voucher.code}
                  onChange={(e) => setVoucher({ ...voucher, code: e.target.value.toUpperCase() })}
                  placeholder="Ej: VALE-2026-001"
                  maxLength={30}
                  required
                />
              </div>

              <div className="task-modal-field">
                <label>Expira:</label>
                <div
                  className="date-display-field"
                  onClick={() => setShowExpiryCalendar(true)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>{voucher.expiresAt}</span>
                </div>
                {showExpiryCalendar && (
                  <CustomCalendar
                    selectedDate={voucher.expiresAt}
                    onDateSelect={(date) => {
                      const year = date.getFullYear()
                      const month = String(date.getMonth() + 1).padStart(2, '0')
                      const day = String(date.getDate()).padStart(2, '0')
                      const dateValue = `${year}-${month}-${day}`
                      setVoucher({ ...voucher, expiresAt: dateValue })
                    }}
                    onClose={() => setShowExpiryCalendar(false)}
                  />
                )}
              </div>
            </>
          ) : (
            <>
              <div className="task-modal-row">
                <div className="task-modal-field">
                  <label>Codigo</label>
                  <input
                    type="text"
                    value={voucher.code}
                    onChange={(e) => setVoucher({ ...voucher, code: e.target.value.toUpperCase() })}
                    placeholder="Ej: BIENVENIDA10"
                    maxLength={30}
                    required
                  />
                </div>
                <div className="task-modal-field">
                  <label>Estado</label>
                  <select
                    value={voucher.status}
                    onChange={(e) => setVoucher({ ...voucher, status: e.target.value })}
                  >
                    <option value="activo">Activo</option>
                    <option value="usado">Usado</option>
                  </select>
                </div>
              </div>

              <div className="task-modal-field">
                <label>Titulo</label>
                <input
                  type="text"
                  value={voucher.title}
                  onChange={(e) => setVoucher({ ...voucher, title: e.target.value })}
                  placeholder="Ej: Vale de bienvenida"
                  maxLength={80}
                  required
                />
              </div>

              <div className="task-modal-row">
                <div className="task-modal-field">
                  <label>Tipo de descuento</label>
                  <select
                    value={voucher.discountType}
                    onChange={(e) => setVoucher({ ...voucher, discountType: e.target.value })}
                  >
                    <option value="percent">Porcentaje (%)</option>
                    <option value="fixed">Importe fijo (EUR)</option>
                  </select>
                </div>
                <div className="task-modal-field">
                  <label>Valor descuento</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={voucher.discountValue}
                    onChange={(e) => setVoucher({ ...voucher, discountValue: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="task-modal-row">
                <div className="task-modal-field">
                  <label>Pedido minimo (EUR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={voucher.minOrder}
                    onChange={(e) => setVoucher({ ...voucher, minOrder: e.target.value })}
                  />
                </div>
                <div className="task-modal-field">
                  <label>Usos restantes</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={voucher.usesLeft}
                    onChange={(e) => setVoucher({ ...voucher, usesLeft: e.target.value })}
                  />
                </div>
              </div>

              <div className="task-modal-field">
                <label>Caduca el</label>
                <input
                  type="date"
                  value={voucher.expiresAt}
                  onChange={(e) => setVoucher({ ...voucher, expiresAt: e.target.value })}
                  required
                />
              </div>
            </>
          )}

          <div className="task-modal-actions">
            {onDelete ? (
              <button
                type="button"
                className="task-modal-btn task-modal-btn-delete"
                onClick={() => onDelete(voucher.id)}
              >
                Eliminar
              </button>
            ) : (
              <div />
            )}
            <div className="task-modal-actions-right">
              <button
                type="button"
                className="task-modal-btn task-modal-btn-cancel"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button type="submit" className="task-modal-btn task-modal-btn-save">
                {submitLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddVoucherModal({ onClose, onSave }) {
  return (
    <VoucherModal
      title="Nuevo Vale"
      submitLabel="Crear Vale"
      simpleCreate
      initialVoucher={null}
      onClose={onClose}
      onSave={onSave}
    />
  )
}

function EditVoucherModal({ voucher, onClose, onSave, onDelete }) {
  return (
    <VoucherModal
      title="Editar Vale"
      submitLabel="Guardar Cambios"
      simpleCreate
      initialVoucher={voucher}
      onClose={onClose}
      onSave={onSave}
      onDelete={onDelete}
    />
  )
}

// Componente Modal de Agregar Pedido
function AddOrderModal({ onClose, onSave, wines = [] }) {
  const [showOrderDateCalendar, setShowOrderDateCalendar] = useState(false)
  const [showExpectedDateCalendar, setShowExpectedDateCalendar] = useState(false)
  const [newOrder, setNewOrder] = useState({
    orderNumber: '',
    supplier: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate: new Date().toISOString().split('T')[0],
    items: []
  })
  const [newItemName, setNewItemName] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredWines, setFilteredWines] = useState([])
  const [justSelected, setJustSelected] = useState(false)
  const inputRef = useRef(null)

  // Filtrar vinos del almacén cuando el usuario escribe (incluye agotados para pedidos)
  useEffect(() => {
    if (justSelected) {
      // Si acabamos de seleccionar un vino, no mostrar sugerencias
      return
    }
    
    if (newItemName.trim().length > 0) {
      const searchTerm = newItemName.toLowerCase()
      
      // Si el nombre coincide exactamente con un vino, no mostrar sugerencias
      const exactMatch = wines.find(wine => 
        wine.name.toLowerCase() === searchTerm
      )
      
      if (exactMatch) {
        setFilteredWines([])
        setShowSuggestions(false)
        return
      }
      
      // Mostrar todos los vinos del almacén (con y sin stock) para poder hacer pedidos
      const filtered = wines.filter(wine => 
        wine.name.toLowerCase().includes(searchTerm)
      ).slice(0, 5) // Máximo 5 sugerencias
      setFilteredWines(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setFilteredWines([])
      setShowSuggestions(false)
    }
  }, [newItemName, wines, justSelected])

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectWine = (wine) => {
    setJustSelected(true)
    setShowSuggestions(false)
    setFilteredWines([])
    setNewItemName(wine.name)
    // Reset justSelected después de un pequeño delay
    setTimeout(() => setJustSelected(false), 100)
  }

  const handleAddItem = () => {
    if (newItemName && newItemQuantity) {
      // Validar que el vino existe en el almacén (incluye agotados)
      const wineExists = wines.find(wine => 
        wine.name.toLowerCase() === newItemName.toLowerCase()
      )
      
      if (!wineExists) {
        alert('⚠️ Solo puedes agregar vinos que están en el almacén. Por favor, selecciona un vino de la lista de sugerencias.')
        return
      }

      const newItem = {
        id: Date.now(),
        name: wineExists.name, // Usar el nombre exacto del vino
        quantity: parseInt(newItemQuantity),
        completed: false
      }
      setNewOrder({ ...newOrder, items: [...newOrder.items, newItem] })
      setNewItemName('')
      setNewItemQuantity('')
      setShowSuggestions(false)
      setFilteredWines([])
    }
  }

  const handleRemoveItem = (itemId) => {
    setNewOrder({
      ...newOrder,
      items: newOrder.items.filter(item => item.id !== itemId)
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (newOrder.items.length > 0) {
      onSave(newOrder)
    } else {
      alert('Debes agregar al menos un item al pedido')
    }
  }

  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="task-modal-header">
          <h3>Nuevo Pedido</h3>
          <button className="task-modal-close" onClick={onClose}>✕</button>
        </div>
        
        <form className="task-modal-content" onSubmit={handleSubmit}>
          <div className="task-modal-field">
            <label>Número de Pedido</label>
            <input
              type="text"
              value={newOrder.orderNumber}
              onChange={(e) => setNewOrder({...newOrder, orderNumber: e.target.value})}
              placeholder="Ej: PED-2024-001"
              required
            />
          </div>

          <div className="task-modal-field">
            <label>Proveedor</label>
            <input
              type="text"
              value={newOrder.supplier}
              onChange={(e) => setNewOrder({...newOrder, supplier: e.target.value})}
              placeholder="Ej: Bodegas Rioja Premium"
              required
            />
          </div>

          <div className="task-modal-row">
            <div className="task-modal-field">
              <label>Fecha de Pedido</label>
              <div 
                className="date-display-field"
                onClick={() => setShowOrderDateCalendar(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>{newOrder.orderDate}</span>
              </div>
              {showOrderDateCalendar && (
                <CustomCalendar
                  selectedDate={newOrder.orderDate}
                  onDateSelect={(date) => {
                    const year = date.getFullYear()
                    const month = String(date.getMonth() + 1).padStart(2, '0')
                    const day = String(date.getDate()).padStart(2, '0')
                    const dateValue = `${year}-${month}-${day}`
                    setNewOrder({...newOrder, orderDate: dateValue})
                  }}
                  onClose={() => setShowOrderDateCalendar(false)}
                />
              )}
            </div>

            <div className="task-modal-field">
              <label>Fecha Esperada</label>
              <div 
                className="date-display-field"
                onClick={() => setShowExpectedDateCalendar(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>{newOrder.expectedDate}</span>
              </div>
              {showExpectedDateCalendar && (
                <CustomCalendar
                  selectedDate={newOrder.expectedDate}
                  onDateSelect={(date) => {
                    const year = date.getFullYear()
                    const month = String(date.getMonth() + 1).padStart(2, '0')
                    const day = String(date.getDate()).padStart(2, '0')
                    const dateValue = `${year}-${month}-${day}`
                    setNewOrder({...newOrder, expectedDate: dateValue})
                  }}
                  onClose={() => setShowExpectedDateCalendar(false)}
                />
              )}
            </div>
          </div>

          <div className="task-modal-field">
            <label>Items del Pedido</label>
            <div style={{ marginBottom: '12px' }}>
              {newOrder.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', color: '#ffffff' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3c0' }}>Cantidad: {item.quantity}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div ref={inputRef} style={{ flex: 2, position: 'relative' }}>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onFocus={() => {
                    if (filteredWines.length > 0) setShowSuggestions(true)
                  }}
                  placeholder="Buscar vino en stock..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '13px',
                  }}
                />
                {showSuggestions && filteredWines.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: 'rgba(30, 33, 45, 0.98)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  }}>
                    {filteredWines.map(wine => (
                      <div
                        key={wine.id}
                        onClick={() => handleSelectWine(wine)}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(102, 126, 234, 0.15)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#ffffff', 
                          fontWeight: '500',
                          marginBottom: '2px'
                        }}>
                          {wine.name}
                        </div>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#9ca3c0',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}>
                          <span>{wine.type} {wine.year}</span>
                          <span style={{ 
                            color: wine.stock > 10 ? '#10b981' : wine.stock > 5 ? '#f59e0b' : '#ef4444'
                          }}>
                            Stock: {wine.stock}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="number"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                placeholder="Cant."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '13px',
                }}
              />
              <button
                type="button"
                onClick={handleAddItem}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Agregar
              </button>
            </div>
          </div>

          <div className="task-modal-actions">
            <div className="task-modal-actions-right">
              <button
                type="button"
                className="task-modal-btn task-modal-btn-cancel"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="task-modal-btn task-modal-btn-save"
              >
                Crear Pedido
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// Componente Modal de Editar Pedido
function EditOrderModal({ order, onClose, onSave, onDelete, wines = [] }) {
  const [showOrderDateCalendar, setShowOrderDateCalendar] = useState(false)
  const [showExpectedDateCalendar, setShowExpectedDateCalendar] = useState(false)
  // Asegurar que el estado inicial mantiene los ids
  const [editedOrder, setEditedOrder] = useState({
    ...order,
    id: order.id || order._id,
    _id: order._id || order.id
  })
  const [newItemName, setNewItemName] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredWines, setFilteredWines] = useState([])
  const [justSelected, setJustSelected] = useState(false)
  const inputRef = useRef(null)

  // Filtrar vinos del almacén cuando el usuario escribe (incluye agotados para pedidos)
  useEffect(() => {
    if (justSelected) {
      // Si acabamos de seleccionar un vino, no mostrar sugerencias
      return
    }
    
    if (newItemName.trim().length > 0) {
      const searchTerm = newItemName.toLowerCase()
      
      // Si el nombre coincide exactamente con un vino, no mostrar sugerencias
      const exactMatch = wines.find(wine => 
        wine.name.toLowerCase() === searchTerm
      )
      
      if (exactMatch) {
        setFilteredWines([])
        setShowSuggestions(false)
        return
      }
      
      // Mostrar todos los vinos del almacén (con y sin stock) para poder hacer pedidos
      const filtered = wines.filter(wine => 
        wine.name.toLowerCase().includes(searchTerm)
      ).slice(0, 5) // Máximo 5 sugerencias
      setFilteredWines(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setFilteredWines([])
      setShowSuggestions(false)
    }
  }, [newItemName, wines, justSelected])

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectWine = (wine) => {
    setJustSelected(true)
    setShowSuggestions(false)
    setFilteredWines([])
    setNewItemName(wine.name)
    // Reset justSelected después de un pequeño delay
    setTimeout(() => setJustSelected(false), 100)
  }

  const handleAddItem = () => {
    if (newItemName && newItemQuantity) {
      // Validar que el vino existe en el almacén (incluye agotados)
      const wineExists = wines.find(wine => 
        wine.name.toLowerCase() === newItemName.toLowerCase()
      )
      
      if (!wineExists) {
        alert('⚠️ Solo puedes agregar vinos que están en el almacén. Por favor, selecciona un vino de la lista de sugerencias.')
        return
      }

      const newItem = {
        id: Date.now(),
        name: wineExists.name, // Usar el nombre exacto del vino
        quantity: parseInt(newItemQuantity),
        completed: false
      }
      setEditedOrder({ ...editedOrder, items: [...editedOrder.items, newItem] })
      setNewItemName('')
      setNewItemQuantity('')
      setShowSuggestions(false)
      setFilteredWines([])
    }
  }

  const handleRemoveItem = (itemId) => {
    setEditedOrder({
      ...editedOrder,
      items: editedOrder.items.filter(item => item.id !== itemId)
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editedOrder.items.length > 0) {
      // Asegurar que el id del pedido se mantiene
      const orderToSave = {
        ...editedOrder,
        id: editedOrder.id || editedOrder._id || order.id || order._id,
        _id: editedOrder._id || editedOrder.id || order._id || order.id,
      }
      console.log('Guardando pedido:', orderToSave)
      onSave(orderToSave)
    } else {
      alert('Debes tener al menos un item en el pedido')
    }
  }

  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="task-modal-header">
          <h3>Editar Pedido</h3>
          <button className="task-modal-close" onClick={onClose}>✕</button>
        </div>
        
        <form className="task-modal-content" onSubmit={handleSubmit}>
          <div className="task-modal-field">
            <label>Número de Pedido</label>
            <input
              type="text"
              value={editedOrder.orderNumber}
              onChange={(e) => setEditedOrder({...editedOrder, orderNumber: e.target.value})}
              required
            />
          </div>

          <div className="task-modal-field">
            <label>Proveedor</label>
            <input
              type="text"
              value={editedOrder.supplier}
              onChange={(e) => setEditedOrder({...editedOrder, supplier: e.target.value})}
              required
            />
          </div>

          <div className="task-modal-row">
            <div className="task-modal-field">
              <label>Fecha de Pedido</label>
              <div 
                className="date-display-field"
                onClick={() => setShowOrderDateCalendar(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>{editedOrder.orderDate}</span>
              </div>
              {showOrderDateCalendar && (
                <CustomCalendar
                  selectedDate={editedOrder.orderDate}
                  onDateSelect={(date) => {
                    const year = date.getFullYear()
                    const month = String(date.getMonth() + 1).padStart(2, '0')
                    const day = String(date.getDate()).padStart(2, '0')
                    const dateValue = `${year}-${month}-${day}`
                    setEditedOrder({...editedOrder, orderDate: dateValue})
                  }}
                  onClose={() => setShowOrderDateCalendar(false)}
                />
              )}
            </div>

            <div className="task-modal-field">
              <label>Fecha Esperada</label>
              <div 
                className="date-display-field"
                onClick={() => setShowExpectedDateCalendar(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>{editedOrder.expectedDate}</span>
              </div>
              {showExpectedDateCalendar && (
                <CustomCalendar
                  selectedDate={editedOrder.expectedDate}
                  onDateSelect={(date) => {
                    const year = date.getFullYear()
                    const month = String(date.getMonth() + 1).padStart(2, '0')
                    const day = String(date.getDate()).padStart(2, '0')
                    const dateValue = `${year}-${month}-${day}`
                    setEditedOrder({...editedOrder, expectedDate: dateValue})
                  }}
                  onClose={() => setShowExpectedDateCalendar(false)}
                />
              )}
            </div>
          </div>

          <div className="task-modal-field">
            <label>Items del Pedido</label>
            <div style={{ marginBottom: '12px' }}>
              {editedOrder.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', color: '#ffffff' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3c0' }}>
                      Cantidad: {item.quantity} {item.completed && '✓ Recibido'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div ref={inputRef} style={{ flex: 2, position: 'relative' }}>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onFocus={() => {
                    if (filteredWines.length > 0) setShowSuggestions(true)
                  }}
                  placeholder="Buscar vino en stock..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '13px',
                  }}
                />
                {showSuggestions && filteredWines.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: 'rgba(30, 33, 45, 0.98)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  }}>
                    {filteredWines.map(wine => (
                      <div
                        key={wine.id}
                        onClick={() => handleSelectWine(wine)}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(102, 126, 234, 0.15)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#ffffff', 
                          fontWeight: '500',
                          marginBottom: '2px'
                        }}>
                          {wine.name}
                        </div>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#9ca3c0',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}>
                          <span>{wine.type} {wine.year}</span>
                          <span style={{ 
                            color: wine.stock > 10 ? '#10b981' : wine.stock > 5 ? '#f59e0b' : '#ef4444'
                          }}>
                            Stock: {wine.stock}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="number"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                placeholder="Cant."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '13px',
                }}
              />
              <button
                type="button"
                onClick={handleAddItem}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Agregar
              </button>
            </div>
          </div>

          <div className="task-modal-actions">
            <button
              type="button"
              className="task-modal-btn task-modal-btn-delete"
              onClick={() => {
                if (confirm('¿Estás seguro de eliminar este pedido?')) {
                  onDelete(order.id)
                }
              }}
            >
              Eliminar
            </button>
            <div className="task-modal-actions-right">
              <button
                type="button"
                className="task-modal-btn task-modal-btn-cancel"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="task-modal-btn task-modal-btn-save"
              >
                Guardar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// Componente Modal de Agregar Valoración
function AddReviewModal({ onClose, onSave, wines = [] }) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [reviewData, setReviewData] = useState({
    wineId: '',
    wineName: '',
    wineImage: '',
    wineType: '',
    rating: 0,
    comment: ''
  })

  const handleWineSelect = (e) => {
    const wineId = e.target.value
    const selectedWine = wines.find(w => w.id === wineId)
    
    if (selectedWine) {
      setReviewData({
        ...reviewData,
        wineId: selectedWine.id,
        wineName: selectedWine.name,
        wineImage: selectedWine.image,
        wineType: selectedWine.type
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (reviewData.wineId && rating > 0 && reviewData.comment.trim()) {
      onSave({ ...reviewData, rating })
    }
  }

  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="task-modal-header">
            <h2>Nueva Valoración</h2>
            <button
              type="button"
              className="task-modal-close"
              onClick={onClose}
            >
              ×
            </button>
          </div>

          <div className="task-modal-content">
            <div className="task-modal-field">
              <label>Vino *</label>
              <select
                value={reviewData.wineId}
                onChange={handleWineSelect}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(20, 20, 30, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px'
                }}
              >
                <option value="">Selecciona un vino</option>
                {wines.map((wine) => (
                  <option key={wine.id} value={wine.id}>
                    {wine.name}
                  </option>
                ))}
              </select>
            </div>

            {reviewData.wineId && (
              <div className="review-wine-display">
                <img src={reviewData.wineImage} alt={reviewData.wineName} />
                <div>
                  <div style={{ fontWeight: 600, color: '#ffffff' }}>{reviewData.wineName}</div>
                  <div style={{ fontSize: '13px', color: '#9ca3c0' }}>{reviewData.wineType}</div>
                </div>
              </div>
            )}

            <div className="task-modal-field">
              <label>Puntuación *</label>
              <div className="review-rating-selector">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar
                    key={star}
                    className={`rating-star ${star <= (hoveredRating || rating) ? 'active' : ''}`}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>

            <div className="task-modal-field">
              <label>Comentario *</label>
              <textarea
                value={reviewData.comment}
                onChange={(e) => setReviewData({...reviewData, comment: e.target.value})}
                placeholder="Comparte tu experiencia con este vino..."
                required
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(20, 20, 30, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          <div className="task-modal-actions">
            <div className="task-modal-actions-right">
              <button
                type="button"
                className="task-modal-btn task-modal-btn-cancel"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="task-modal-btn task-modal-btn-save"
              >
                Publicar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// Componente Modal de Ver/Eliminar Valoración (solo para valoraciones propias)
function EditReviewModal({ review, onClose, onDelete }) {
  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="task-modal-header">
          <h2>Tu Valoración</h2>
          <button
            type="button"
            className="task-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="task-modal-content">
          <div className="task-modal-field">
            <label>Vino</label>
            <div className="review-wine-display">
              <img src={review.wineImage} alt={review.wineName} />
              <div>
                <div style={{ fontWeight: 600, color: '#ffffff' }}>{review.wineName}</div>
                <div style={{ fontSize: '13px', color: '#9ca3c0' }}>{review.wineType}</div>
              </div>
            </div>
          </div>

          <div className="task-modal-field">
            <label>Puntuación</label>
            <div className="review-rating-selector">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  className={`rating-star ${star <= review.rating ? 'active' : ''}`}
                  style={{ cursor: 'default' }}
                />
              ))}
            </div>
          </div>

          <div className="task-modal-field">
            <label>Comentario</label>
            <div style={{
              padding: '12px',
              background: 'rgba(20, 20, 30, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              color: '#c0c2d8',
              fontSize: '14px',
              lineHeight: '1.6',
              minHeight: '100px'
            }}>
              {review.comment}
            </div>
          </div>
        </div>

        <div className="task-modal-actions">
          <button
            type="button"
            className="task-modal-btn task-modal-btn-delete"
            onClick={() => {
              if (confirm('¿Estás seguro de eliminar esta valoración?')) {
                onDelete(review.id)
              }
            }}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

function ReviewDetailModal({ review, onClose, isOwner, onEdit, onDelete }) {
  const ratingValue = Number(review.rating) || 0
  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="review-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="review-detail-header">
          <h2>Valoración completa</h2>
          <button className="task-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="review-detail-content">
          <div className="review-detail-wine">
            <img src={review.wineImage} alt={review.wineName} />
            <div className="review-detail-wine-info">
              <strong>{review.wineName}</strong>
              <span>{review.wineType}</span>
            </div>
          </div>

          <div className="review-detail-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <FiStar
                key={star}
                className={star <= ratingValue ? 'star-filled' : 'star-empty'}
              />
            ))}
            {review.verified && (
              <span className="review-detail-verified">
                <FiCheckCircle size={14} /> Verificada
              </span>
            )}
          </div>

          <div className="review-detail-comment">{review.comment}</div>

          <div className="review-detail-meta">
            <span>Por {review.userName}</span>
            {review.date && <span>{review.date}</span>}
          </div>
        </div>

        <div className="review-detail-actions">
          {isOwner && (
            <>
              <button
                type="button"
                className="task-modal-btn task-modal-btn-cancel"
                onClick={() => onEdit(review)}
              >
                Editar
              </button>
              <button
                type="button"
                className="task-modal-btn task-modal-btn-delete"
                onClick={() => onDelete(review.id)}
              >
                Eliminar
              </button>
            </>
          )}
          <button
            type="button"
            className="task-modal-btn task-modal-btn-save"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal para editar perfil
function EditProfileModal({ data, onClose, onSave, currentAvatar, availableAvatars }) {
  const [userName, setUserName] = useState(data.userName)
  const [userEmail, setUserEmail] = useState(data.userEmail)
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ userName, userEmail, avatar: selectedAvatar })
  }

  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="task-modal-header">
          <h2>Editar perfil</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="task-modal-content">
          <div className="task-modal-field">
            <label>Avatar</label>
            <div className="avatar-selector">
              <div className="avatar-current">
                <img src={selectedAvatar} alt="Avatar seleccionado" className="avatar-preview" />
                <span className="avatar-label">Avatar actual</span>
              </div>
              <div className="avatar-grid">
                {availableAvatars.map((avatar, index) => (
                  <div
                    key={index}
                    className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
                    onClick={() => setSelectedAvatar(avatar)}
                  >
                    <img src={avatar} alt={`Avatar ${index + 1}`} />
                    {selectedAvatar === avatar && (
                      <div className="avatar-check">✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="task-modal-field">
            <label>Nombre completo</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Ingresa tu nombre"
              required
            />
          </div>

          <div className="task-modal-field">
            <label>Email</label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="task-modal-actions">
            <button type="button" className="task-modal-btn task-modal-btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="task-modal-btn task-modal-btn-save">
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal para cambiar contraseña
function ChangePasswordModal({ onClose, onSave }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    await onSave({ currentPassword, newPassword })
  }

  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="task-modal-header">
          <h2>Cambiar contraseña</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="task-modal-content">
          <div className="task-modal-field">
            <label>Contraseña actual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Ingresa tu contraseña actual"
              required
            />
          </div>

          <div className="task-modal-field">
            <label>Nueva contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div className="task-modal-field">
            <label>Confirmar nueva contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu nueva contraseña"
              required
            />
          </div>

          {error && (
            <div style={{ 
              color: '#ef4444', 
              fontSize: '12px', 
              marginTop: '8px',
              padding: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '6px'
            }}>
              {error}
            </div>
          )}

          <div className="task-modal-actions">
            <button type="button" className="task-modal-btn task-modal-btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="task-modal-btn task-modal-btn-save">
              Cambiar contraseña
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default App





