import api from '../lib/api';

export const authService = {
  login: (email: string, password: string, remember = false) =>
    api.post('/api/auth/login', { email, password, remember }).then(r => r.data.data ?? r.data),
  logout: () => api.post('/api/auth/logout'),
  register: (data: object) =>
    api.post('/api/auth/register', data).then(r => r.data.data ?? r.data),
  forgotPassword: (email: string) =>
    api.post('/api/auth/forgot-password', { email }).then(r => r.data),
  resetPassword: (data: object) =>
    api.post('/api/auth/reset-password', data).then(r => r.data),
  me: () => api.get('/api/auth/me').then(r => r.data.data ?? r.data),
};
