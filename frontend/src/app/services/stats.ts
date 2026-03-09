import api from '../lib/api';
import type { AxiosResponse } from 'axios';
import type { DashboardStats } from '../types';

export const statsService = {
  getDashboardStats: (): Promise<DashboardStats> =>
    api.get('/api/stats').then((r: AxiosResponse) => r.data),
};
