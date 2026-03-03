import api from '../lib/api';

export const ticketService = {
  getAll: (params?: object) => api.get('/api/tickets', { params }).then(r => r.data),
  getById: (id: number | string) => api.get(`/api/tickets/${id}`).then(r => r.data.data),
  create: (data: object) => api.post('/api/tickets', data).then(r => r.data.data),
  update: (id: number | string, data: object) => api.put(`/api/tickets/${id}`, data).then(r => r.data.data),
  delete: (id: number | string) => api.delete(`/api/tickets/${id}`),
};
