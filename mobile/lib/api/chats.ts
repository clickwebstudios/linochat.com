import { apiClient } from './client';
import type { ApiResponse, Chat, DashboardStats } from './types';

export async function getChats(status?: string): Promise<Chat[]> {
  const query = status ? `?status=${status}` : '';
  const res = await apiClient.get<ApiResponse<Chat[]>>(`/agent/chats${query}`);
  return res.data;
}

export async function getAgentStats(): Promise<DashboardStats> {
  const res = await apiClient.get<ApiResponse<DashboardStats>>('/agent/stats');
  return res.data;
}

export async function getAdminDashboardStats(): Promise<DashboardStats> {
  const res = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats');
  return res.data;
}
