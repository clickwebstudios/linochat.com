import api from '../lib/api';

export const userService = {
  getAll: (params?: object) => api.get('/api/users', { params }).then(r => r.data),
  getById: (id: number | string) => api.get(`/api/users/${id}`).then(r => r.data.data),
  create: (data: object) => api.post('/api/users', data).then(r => r.data.data),
  update: (id: number | string, data: object) => api.put(`/api/users/${id}`, data).then(r => r.data.data),
  updateStatus: (id: number | string, status: string) =>
    api.put(`/api/users/${id}/status`, { status }).then(r => r.data.data),
  delete: (id: number | string) => api.delete(`/api/users/${id}`),
  getProfile: () => api.get('/api/user/profile').then(r => r.data.data),
  updateProfile: (data: object) => api.put('/api/user/profile', data).then(r => r.data.data),
};
