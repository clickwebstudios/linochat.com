import api from '../lib/api';
import type { AxiosResponse } from 'axios';
import type { Company, ApiResponse } from '../types';

export const companyService = {
  getAll: (params?: object) => api.get<ApiResponse<Company[]>>('/companies', { params }).then((r) => r.data),
  getById: (id: number | string): Promise<Company> => api.get(`/companies/${id}`).then((r: AxiosResponse<ApiResponse<Company>>) => r.data.data),
  create: (data: object): Promise<Company> => api.post('/companies', data).then((r: AxiosResponse<ApiResponse<Company>>) => r.data.data),
  update: (id: number | string, data: object): Promise<Company> => api.put(`/companies/${id}`, data).then((r: AxiosResponse<ApiResponse<Company>>) => r.data.data),
  delete: (id: number | string) => api.delete(`/companies/${id}`),
};
