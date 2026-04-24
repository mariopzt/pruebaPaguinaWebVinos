import api from './axios';

const authService = {
  login: async ({ user, password }) => {
    try {
      const response = await api.post('/auth/login', { username: user, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error al iniciar sesion' };
    }
  },
};

export default authService;
