import { apiClient } from './client';
import type { ApiResponse, Company, CompanyDetail, Chat } from './types';

export async function getCompanies(): Promise<Company[]> {
  const res = await apiClient.get<ApiResponse<Company[]>>('/superadmin/companies');
  return res.data;
}

export async function getCompanyDetail(id: number): Promise<CompanyDetail> {
  const res = await apiClient.get<ApiResponse<CompanyDetail>>(
    `/superadmin/companies/${id}`
  );
  return res.data;
}

export async function getCompanyChats(companyId: number): Promise<Chat[]> {
  const res = await apiClient.get<ApiResponse<Chat[]>>(
    `/superadmin/companies/${companyId}/chats`
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function getDashboardStats(): Promise<any> {
  const res = await apiClient.get<ApiResponse<any>>('/superadmin/dashboard-stats');
  return res.data;
}

export async function getAllAgents(): Promise<any[]> {
  const res = await apiClient.get<ApiResponse<any[]>>('/superadmin/agents');
  return res.data;
}
