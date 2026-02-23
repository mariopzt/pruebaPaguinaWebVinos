import api from './axios';

const reviewService = {
  getAll: (params = {}) => api.get('/reviews', { params }),
  create: (payload) => api.post('/reviews', payload),
  update: (id, payload) => api.put(`/reviews/${id}`, payload),
  delete: (id, payload = null) =>
    payload ? api.delete(`/reviews/${id}`, { data: payload }) : api.delete(`/reviews/${id}`)
};

export default reviewService;
