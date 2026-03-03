import api from '../lib/api';

export const billingService = {
  getPlans: () => api.get('/api/billing/plans').then(r => r.data.data),
  getSubscription: () => api.get('/api/billing/subscription').then(r => r.data.data),
  updateSubscription: (data: { plan_id: number; billing_cycle: string }) =>
    api.put('/api/billing/subscription', data).then(r => r.data.data),
  getInvoices: () => api.get('/api/billing/invoices').then(r => r.data.data),
};
