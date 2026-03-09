import api from '../lib/api';
import type { AxiosResponse } from 'axios';
import type { User, ApiResponse } from '../types';

export const userService = {
  getAll: (params?: object) => api.get<ApiResponse<User[]>>('/api/users', { params }).then((r) => r.data),
  getById: (id: number | string): Promise<User> => api.get(`/api/users/${id}`).then((r: AxiosResponse<ApiResponse<User>>) => r.data.data),
  create: (data: object): Promise<User> => api.post('/api/users', data).then((r: AxiosResponse<ApiResponse<User>>) => r.data.data),
  update: (id: number | string, data: object): Promise<User> => api.put(`/api/users/${id}`, data).then((r: AxiosResponse<ApiResponse<User>>) => r.data.data),
  updateStatus: (id: number | string, status: string): Promise<User> =>
    api.put(`/api/users/${id}/status`, { status }).then((r: AxiosResponse<ApiResponse<User>>) => r.data.data),
  delete: (id: number | string) => api.delete(`/api/users/${id}`),
  getProfile: (): Promise<User> => api.get('/api/user/profile').then((r: AxiosResponse<ApiResponse<User>>) => r.data.data),
  updateProfile: (data: object): Promise<User> => api.put('/api/user/profile', data).then((r: AxiosResponse<ApiResponse<User>>) => r.data.data),
};
