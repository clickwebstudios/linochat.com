import api from '../lib/api';
import type { AxiosResponse } from 'axios';
import type { Ticket, ApiResponse } from '../types';

export const ticketService = {
  getAll: (params?: object) => api.get<ApiResponse<Ticket[]>>('/tickets', { params }).then((r) => r.data),
  getById: (id: number | string): Promise<Ticket> => api.get(`/tickets/${id}`).then((r: AxiosResponse<ApiResponse<Ticket>>) => r.data.data),
  create: (data: object): Promise<Ticket> => api.post('/tickets', data).then((r: AxiosResponse<ApiResponse<Ticket>>) => r.data.data),
  update: (id: number | string, data: object): Promise<Ticket> => api.put(`/tickets/${id}`, data).then((r: AxiosResponse<ApiResponse<Ticket>>) => r.data.data),
  delete: (id: number | string) => api.delete(`/tickets/${id}`),
};
