import api from '../lib/api';
import type { AxiosResponse } from 'axios';
import type { User, ApiResponse } from '../types';

export const userService = {
  getAll: (params?: object) => api.get<ApiResponse<User[]>>('/users', { params }).then((r) => r.data),
  getById: (id: number | string): Promise<User> => api.get(`/users/${id}`).then((r: AxiosResponse<ApiResponse<User>>) => r.data.data),
  create: (data: object): Promise<User> => api.post('/users', data).then((r: AxiosResponse<ApiResponse<User>>) => r.data.data),
  update: (id: number | string, data: object): Promise<User> => api.put(`/users/${id}`, data).then((r: AxiosResponse<ApiResponse<User>>) => r.data.data),
  updateStatus: (id: number | string, status: string): Promise<User> =>
    api.put(`/users/${id}/status`, { status }).then((r: AxiosResponse<ApiResponse<User>>) => r.data.data),
  delete: (id: number | string) => api.delete(`/users/${id}`),
  getProfile: (): Promise<User> => api.get('/user/profile').then((r: AxiosResponse<ApiResponse<User>>) => r.data.data),
  updateProfile: (data: object): Promise<User> => api.put('/user/profile', data).then((r: AxiosResponse<ApiResponse<User>>) => r.data.data),
};
