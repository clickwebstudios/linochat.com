import api from '../lib/api';

export const articleService = {
  getAll: (params?: object) => api.get('/api/articles', { params }).then(r => r.data),
  getById: (id: number | string) => api.get(`/api/articles/${id}`).then(r => r.data.data),
  create: (data: object) => api.post('/api/articles', data).then(r => r.data.data),
  update: (id: number | string, data: object) => api.put(`/api/articles/${id}`, data).then(r => r.data.data),
  delete: (id: number | string) => api.delete(`/api/articles/${id}`),
  generateFromWebsite: (projectId: string | number) =>
    api.post('/api/articles/generate', { project_id: projectId }).then(r => r.data),
};
