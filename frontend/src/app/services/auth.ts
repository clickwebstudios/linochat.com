import api from '../lib/api';
import type { AxiosResponse } from 'axios';
import type { User, AuthResponse, ApiResponse } from '../types';

export const authService = {
  login: (email: string, password: string, remember = false): Promise<AuthResponse> =>
    api.post('/api/auth/login', { email, password, remember }).then((r: AxiosResponse<ApiResponse<AuthResponse>>) => r.data.data ?? r.data),
  logout: () => api.post('/api/auth/logout'),
  register: (data: object): Promise<AuthResponse> =>
    api.post('/api/auth/register', data).then((r: AxiosResponse<ApiResponse<AuthResponse>>) => r.data.data ?? r.data),
  forgotPassword: (email: string) =>
    api.post('/api/auth/forgot-password', { email }).then((r: AxiosResponse) => r.data),
  resetPassword: (data: object) =>
    api.post('/api/auth/reset-password', data).then((r: AxiosResponse) => r.data),
  me: (): Promise<User> => api.get('/api/auth/me').then((r: AxiosResponse<ApiResponse<User>>) => r.data.data ?? r.data),
};
