import api from '../lib/api';
import type { AxiosResponse } from 'axios';
import type { Plan, Subscription, Invoice, ApiResponse, TopUpPacksResponse, TopUpIntent } from '../types';

export const billingService = {
  getPlans: (): Promise<Plan[]> => api.get('/billing/plans').then((r: AxiosResponse<ApiResponse<Plan[]>>) => r.data.data),
  getSubscription: (): Promise<Subscription> => api.get('/billing/subscription').then((r: AxiosResponse<ApiResponse<Subscription>>) => r.data.data),
  updateSubscription: (data: { plan_id: number; billing_cycle: string }): Promise<Subscription> =>
    api.put('/billing/subscription', data).then((r: AxiosResponse<ApiResponse<Subscription>>) => r.data.data),
  getInvoices: (): Promise<Invoice[]> => api.get('/billing/invoices').then((r: AxiosResponse<ApiResponse<Invoice[]>>) => r.data.data),
  getTokenBalance: (): Promise<{ token_balance: number; tokens_used_this_cycle: number; monthly_token_allowance: number; token_rollover: number; token_cycle_reset_at: string | null; agent_count: number }> =>
    api.get('/billing/token-balance').then((r: AxiosResponse<ApiResponse<{ token_balance: number; tokens_used_this_cycle: number; monthly_token_allowance: number; token_rollover: number; token_cycle_reset_at: string | null; agent_count: number }>>) => r.data.data),
  getTopUpPacks: (): Promise<TopUpPacksResponse> =>
    api.get('/billing/topup-packs').then((r: AxiosResponse<ApiResponse<TopUpPacksResponse>>) => r.data.data),
  createTopUpIntent: (packType: string): Promise<TopUpIntent> =>
    api.post('/billing/topup', { pack_type: packType }).then((r: AxiosResponse<ApiResponse<TopUpIntent>>) => r.data.data),
  createCheckoutSession: (data: { plan_id: number; billing_cycle: string; success_url: string; cancel_url: string }): Promise<string> =>
    api.post('/billing/checkout', data).then((r: AxiosResponse<{ url: string }>) => r.data.url),
  createPortalSession: (returnUrl: string): Promise<string> =>
    api.post('/billing/portal', { return_url: returnUrl }).then((r: AxiosResponse<{ url: string }>) => r.data.url),
  cancelSubscription: (): Promise<void> =>
    api.delete('/billing/subscription').then(() => undefined),
  createTopUpCheckout: (data: { pack_type: string; success_url: string; cancel_url: string }): Promise<string> =>
    api.post('/billing/topup-checkout', data).then((r: AxiosResponse<{ url: string }>) => r.data.url),
};
