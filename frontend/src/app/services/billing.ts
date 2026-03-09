import api from '../lib/api';
import type { AxiosResponse } from 'axios';
import type { Plan, Subscription, Invoice, ApiResponse } from '../types';

export const billingService = {
  getPlans: (): Promise<Plan[]> => api.get('/api/billing/plans').then((r: AxiosResponse<ApiResponse<Plan[]>>) => r.data.data),
  getSubscription: (): Promise<Subscription> => api.get('/api/billing/subscription').then((r: AxiosResponse<ApiResponse<Subscription>>) => r.data.data),
  updateSubscription: (data: { plan_id: number; billing_cycle: string }): Promise<Subscription> =>
    api.put('/api/billing/subscription', data).then((r: AxiosResponse<ApiResponse<Subscription>>) => r.data.data),
  getInvoices: (): Promise<Invoice[]> => api.get('/api/billing/invoices').then((r: AxiosResponse<ApiResponse<Invoice[]>>) => r.data.data),
};
