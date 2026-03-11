import { api } from '../api/client';

export interface FrubixClient {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company_name?: string;
  created_at?: string;
}

export interface FrubixAppointment {
  id: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  scheduled_at?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  duration?: number;
  status?: string;
  job_type?: string;
  notes?: string;
  address?: string;
  created_at?: string;
}

function qs(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v);
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&');
}

export const frubixService = {
  searchClients: (projectId: string, params: { phone?: string; email?: string }) =>
    api.get<any>(`/projects/${projectId}/integrations/frubix/clients${qs(params)}`),

  getSchedule: (projectId: string, params: { date_from?: string; date_to?: string; phone?: string }) =>
    api.get<any>(`/projects/${projectId}/integrations/frubix/schedule${qs(params)}`),

  createAppointment: (projectId: string, data: Record<string, any>) =>
    api.post<any>(`/projects/${projectId}/integrations/frubix/schedule`, data),

  updateAppointment: (projectId: string, appointmentId: string | number, data: Record<string, any>) =>
    api.put<any>(`/projects/${projectId}/integrations/frubix/schedule/${appointmentId}`, data),
};
