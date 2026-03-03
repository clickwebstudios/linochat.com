import api from '../lib/api';

export const projectService = {
  getAll: (params?: object) => api.get('/api/projects', { params }).then(r => r.data),
  getById: (id: number | string) => api.get(`/api/projects/${id}`).then(r => r.data.data),
  create: (data: object) => api.post('/api/projects', data).then(r => r.data.data),
  update: (id: number | string, data: object) => api.put(`/api/projects/${id}`, data).then(r => r.data.data),
  delete: (id: number | string) => api.delete(`/api/projects/${id}`),
  getTeam: (id: number | string) => api.get(`/api/projects/${id}/team`).then(r => r.data.data),
};
