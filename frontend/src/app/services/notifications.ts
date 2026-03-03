import api from '../lib/api';

export const notificationService = {
  getAll: (params?: object) => api.get('/api/notifications', { params }).then(r => r.data),
  markRead: (id: number | string) => api.put(`/api/notifications/${id}/read`).then(r => r.data.data),
  markAllRead: () => api.post('/api/notifications/read-all').then(r => r.data),
};
