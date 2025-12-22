import api from './axios';

const taskService = {
  getAll: () => api.get('/tasks'),
  create: (payload) => api.post('/tasks', payload),
  update: (id, payload) => api.put(`/tasks/${id}`, payload),
  delete: (id) => api.delete(`/tasks/${id}`),
};

export default taskService;

