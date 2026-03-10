import api from '../lib/api';
import type { AxiosResponse } from 'axios';
import type { Article, ApiResponse } from '../types';

export const articleService = {
  getAll: (params?: object) => api.get<ApiResponse<Article[]>>('/articles', { params }).then((r) => r.data),
  getById: (id: number | string): Promise<Article> => api.get(`/articles/${id}`).then((r: AxiosResponse<ApiResponse<Article>>) => r.data.data),
  create: (data: object): Promise<Article> => api.post('/articles', data).then((r: AxiosResponse<ApiResponse<Article>>) => r.data.data),
  update: (id: number | string, data: object): Promise<Article> => api.put(`/articles/${id}`, data).then((r: AxiosResponse<ApiResponse<Article>>) => r.data.data),
  delete: (id: number | string) => api.delete(`/articles/${id}`),
  generateFromWebsite: (projectId: string | number) =>
    api.post('/articles/generate', { project_id: projectId }).then((r: AxiosResponse) => r.data),
};
