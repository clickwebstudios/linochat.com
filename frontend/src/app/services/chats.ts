import api from '../lib/api';
import type { AxiosResponse } from 'axios';
import type { Chat, ChatMessage, ApiResponse } from '../types';

export const chatService = {
  getAll: (params?: object) => api.get<ApiResponse<Chat[]>>('/api/chats', { params }).then((r) => r.data),
  getById: (id: number | string): Promise<Chat> => api.get(`/api/chats/${id}`).then((r: AxiosResponse<ApiResponse<Chat>>) => r.data.data),
  create: (data: object): Promise<Chat> => api.post('/api/chats', data).then((r: AxiosResponse<ApiResponse<Chat>>) => r.data.data),
  update: (id: number | string, data: object): Promise<Chat> => api.put(`/api/chats/${id}`, data).then((r: AxiosResponse<ApiResponse<Chat>>) => r.data.data),
  delete: (id: number | string) => api.delete(`/api/chats/${id}`),
  getMessages: (chatId: number | string) => api.get<ApiResponse<ChatMessage[]>>(`/api/chats/${chatId}/messages`).then((r) => r.data),
  sendMessage: (chatId: number | string, data: { sender: string; text: string }): Promise<ChatMessage> =>
    api.post(`/api/chats/${chatId}/messages`, data).then((r: AxiosResponse<ApiResponse<ChatMessage>>) => r.data.data),
};
