import api from './axios';

const orderService = {
  getAll: () => api.get('/orders'),
  create: (payload) => api.post('/orders', payload),
  update: (id, payload) => api.put(`/orders/${id}`, payload),
  delete: (id) => api.delete(`/orders/${id}`),
};

export default orderService;

