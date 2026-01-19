import api from './axios';

// Servicio de vinos
const wineService = {
  // Obtener todos los vinos
  getWines: async () => {
    try {
      const response = await api.get('/wines', {
        // Evita respuestas 304 vacías por caché
        headers: { 'Cache-Control': 'no-cache' },
        params: { t: Date.now() }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener vinos' };
    }
  },

  // Obtener un vino por ID
  getWine: async (id) => {
    try {
      const response = await api.get(`/wines/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener vino' };
    }
  },

  // Crear nuevo vino
  createWine: async (wineData) => {
    try {
      const response = await api.post('/wines', wineData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al crear vino' };
    }
  },

  // Actualizar vino
  updateWine: async (id, wineData) => {
    try {
      const response = await api.put(`/wines/${id}`, wineData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al actualizar vino' };
    }
  },

  // Eliminar vino
  deleteWine: async (id) => {
    try {
      const response = await api.delete(`/wines/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al eliminar vino' };
    }
  },

  // Toggle like en un vino (también para invitados)
  toggleLike: async (id, guestId = null) => {
    try {
      const body = guestId ? { guestId } : {};
      const response = await api.post(`/wines/${id}/like`, body);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al procesar like' };
    }
  }
};

export default wineService;

