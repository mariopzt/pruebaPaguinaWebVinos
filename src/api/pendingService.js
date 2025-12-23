import api from './axios';

const pendingService = {
  create: (payload) => api.post('/pending', payload),
  getByToken: (token) => api.get(`/pending/${token}`),
  activate: (token, password) => api.post(`/pending/activate/${token}`, { password }),
};

export default pendingService;

