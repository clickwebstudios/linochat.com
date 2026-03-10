import api from '../lib/api';
import type { AxiosResponse } from 'axios';
import type { Plan, Subscription, Invoice, ApiResponse } from '../types';

export const billingService = {
  getPlans: (): Promise<Plan[]> => api.get('/billing/plans').then((r: AxiosResponse<ApiResponse<Plan[]>>) => r.data.data),
  getSubscription: (): Promise<Subscription> => api.get('/billing/subscription').then((r: AxiosResponse<ApiResponse<Subscription>>) => r.data.data),
  updateSubscription: (data: { plan_id: number; billing_cycle: string }): Promise<Subscription> =>
    api.put('/billing/subscription', data).then((r: AxiosResponse<ApiResponse<Subscription>>) => r.data.data),
  getInvoices: (): Promise<Invoice[]> => api.get('/billing/invoices').then((r: AxiosResponse<ApiResponse<Invoice[]>>) => r.data.data),
};
