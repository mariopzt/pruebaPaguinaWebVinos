import api from './axios';

const notificationService = {
  getAll: () => api.get('/notifications'),
  create: (payload) => api.post('/notifications', payload),
  markAsRead: (id) => api.patch(`/notifications/${id}`, { unread: false }),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export default notificationService;

