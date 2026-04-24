import api from './axios';

const cataService = {
  getCatas: async (params = {}) => {
    try {
      const response = await api.get('/catas', {
        params: { ...params, t: Date.now() },
        headers: { 'Cache-Control': 'no-cache' },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener catas' };
    }
  },

  createCata: async (cataData) => {
    try {
      const response = await api.post('/catas', cataData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al crear cata' };
    }
  },

  updateCata: async (id, cataData) => {
    try {
      const response = await api.put(`/catas/${id}`, cataData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al actualizar cata' };
    }
  },

  deleteCata: async (id) => {
    try {
      const response = await api.delete(`/catas/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al eliminar cata' };
    }
  },
};

export default cataService;
