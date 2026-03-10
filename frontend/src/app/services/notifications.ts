import api from '../lib/api';
import type { AxiosResponse } from 'axios';
import type { Notification, ApiResponse } from '../types';

export const notificationService = {
  getAll: (params?: object) => api.get<ApiResponse<Notification[]>>('/notifications', { params }).then((r) => r.data),
  markRead: (id: number | string): Promise<Notification> => api.put(`/notifications/${id}/read`).then((r: AxiosResponse<ApiResponse<Notification>>) => r.data.data),
  markAllRead: () => api.post('/notifications/read-all').then((r: AxiosResponse) => r.data),
};
