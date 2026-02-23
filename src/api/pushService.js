import api from './axios';

const pushService = {
  getPublicKey: () => api.get('/push/public-key'),
  subscribe: (payload) => api.post('/push/subscribe', payload),
  unsubscribe: (payload) => api.post('/push/unsubscribe', payload),
};

export default pushService;
