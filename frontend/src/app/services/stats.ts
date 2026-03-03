import api from '../lib/api';

export interface DashboardStats {
  active_chats: number;
  open_tickets: number;
  resolved_today: number;
  new_tickets: number;
  avg_response_time: string;
  satisfaction: string;
  total_agents: number;
  total_companies: number;
}

export const statsService = {
  getDashboardStats: (): Promise<DashboardStats> =>
    api.get('/api/stats').then(r => r.data),
};
