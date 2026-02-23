import api from './axios';

const voucherService = {
  getAll: () => api.get('/vouchers'),
  create: (payload) => api.post('/vouchers', payload),
  update: (id, payload) => api.put(`/vouchers/${id}`, payload),
  delete: (id) => api.delete(`/vouchers/${id}`),
};

export default voucherService;
