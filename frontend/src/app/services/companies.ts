import api from '../lib/api';

export const companyService = {
  getAll: (params?: object) => api.get('/api/companies', { params }).then(r => r.data),
  getById: (id: number | string) => api.get(`/api/companies/${id}`).then(r => r.data.data),
  create: (data: object) => api.post('/api/companies', data).then(r => r.data.data),
  update: (id: number | string, data: object) => api.put(`/api/companies/${id}`, data).then(r => r.data.data),
  delete: (id: number | string) => api.delete(`/api/companies/${id}`),
};
