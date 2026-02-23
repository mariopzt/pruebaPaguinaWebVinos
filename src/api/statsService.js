import api from './axios';

const statsService = {
  // Obtener estadísticas actuales
  getStats: async () => {
    try {
      const response = await api.get('/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener estadísticas' };
    }
  },

  // Obtener top vinos
  getTopWines: async () => {
    try {
      const response = await api.get('/stats/top-wines');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener top vinos' };
    }
  },

  // Registrar venta
  registerSale: async (wineId, quantity) => {
    try {
      const response = await api.post('/stats/sale', { wineId, quantity });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al registrar venta' };
    }
  },

  // Registrar pérdida
  registerLoss: async (wineId, quantity, reason) => {
    try {
      const response = await api.post('/stats/loss', { wineId, quantity, reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al registrar pérdida' };
    }
  },

  // Resetear estadísticas
  resetStats: async () => {
    try {
      const response = await api.delete('/stats/reset');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al resetear estadísticas' };
    }
  }
};

export default statsService;

