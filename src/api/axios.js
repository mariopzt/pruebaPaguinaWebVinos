import axios from 'axios';

// Detectar la URL base del API automáticamente
// Si accedes desde localhost usa localhost, si accedes desde una IP usa esa IP
const getApiBaseUrl = () => {
  // Si hay una variable de entorno, usarla
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Detectar automáticamente basándose en el hostname actual
  const hostname = window.location.hostname;
  const apiPort = 5000;
  
  // Si estamos en localhost, usar localhost
  // Si estamos en una IP (ej: 192.168.x.x), usar esa misma IP para el backend
  return `http://${hostname}:${apiPort}/api`;
};

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // No cerrar sesión automáticamente por 401.
    // La sesión solo se cierra manualmente desde la UI.
    return Promise.reject(error);
  }
);

export default api;

