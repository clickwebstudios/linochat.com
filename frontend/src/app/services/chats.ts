import api from '../lib/api';

export const chatService = {
  getAll: (params?: object) => api.get('/api/chats', { params }).then(r => r.data),
  getById: (id: number | string) => api.get(`/api/chats/${id}`).then(r => r.data.data),
  create: (data: object) => api.post('/api/chats', data).then(r => r.data.data),
  update: (id: number | string, data: object) => api.put(`/api/chats/${id}`, data).then(r => r.data.data),
  delete: (id: number | string) => api.delete(`/api/chats/${id}`),
  getMessages: (chatId: number | string) => api.get(`/api/chats/${chatId}/messages`).then(r => r.data),
  sendMessage: (chatId: number | string, data: { sender: string; text: string }) =>
    api.post(`/api/chats/${chatId}/messages`, data).then(r => r.data.data),
};
