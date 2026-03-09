import api from '../lib/api';
import type { AxiosResponse } from 'axios';
import type { Notification, ApiResponse } from '../types';

export const notificationService = {
  getAll: (params?: object) => api.get<ApiResponse<Notification[]>>('/api/notifications', { params }).then((r) => r.data),
  markRead: (id: number | string): Promise<Notification> => api.put(`/api/notifications/${id}/read`).then((r: AxiosResponse<ApiResponse<Notification>>) => r.data.data),
  markAllRead: () => api.post('/api/notifications/read-all').then((r: AxiosResponse) => r.data),
};
