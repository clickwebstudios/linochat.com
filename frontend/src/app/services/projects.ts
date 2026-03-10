import api from '../lib/api';
import type { AxiosResponse } from 'axios';
import type { Project, User, ApiResponse } from '../types';

export const projectService = {
  getAll: (params?: object) => api.get<ApiResponse<Project[]>>('/projects', { params }).then((r) => r.data),
  getById: (id: number | string): Promise<Project> => api.get(`/projects/${id}`).then((r: AxiosResponse<ApiResponse<Project>>) => r.data.data),
  create: (data: object): Promise<Project> => api.post(`/projects`, data).then((r: AxiosResponse<ApiResponse<Project>>) => r.data.data),
  update: (id: number | string, data: object): Promise<Project> => api.put(`/projects/${id}`, data).then((r: AxiosResponse<ApiResponse<Project>>) => r.data.data),
  delete: (id: number | string) => api.delete(`/projects/${id}`),
  getTeam: (id: number | string): Promise<User[]> => api.get(`/projects/${id}/team`).then((r: AxiosResponse<ApiResponse<User[]>>) => r.data.data),
};
