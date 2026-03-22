export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'agent' | 'superadmin';
  status: 'Active' | 'Away' | 'Offline' | 'Deactivated' | 'Invited';
  avatar_url?: string;
  phone?: string;
  location?: string;
  country?: string;
  bio?: string;
  company_name?: string;
  join_date: string;
  last_active_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  name: string;
  widget_id: string;
  website?: string;
  color?: string;
  description?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
  project?: Project;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface Company {
  id: number;
  name: string;
  domain?: string;
  email?: string;
  phone?: string;
  location?: string;
  status: 'active' | 'trial' | 'suspended' | 'inactive';
  agents_count: number;
  members_count: number;
  projects_count: number;
  total_conversations?: number;
  avg_response_time?: string;
  satisfaction_rate?: number;
  created_at: string;
}

export interface CompanyDetail extends Company {
  projects: Project[];
  users: User[];
}

export interface Agent {
  id: number;
  name: string;
  type: string;
  model?: string;
  conversations: number;
  satisfaction: number;
  status: 'active' | 'inactive';
}

export interface Chat {
  id: string;
  customer_name: string;
  customer_email?: string;
  status: 'active' | 'waiting' | 'closed' | 'ai_handling';
  agent_id?: number;
  agent_name?: string;
  preview?: string;
  last_message_at: string;
  unread: number;
  project_id: number;
  ai_enabled: boolean;
}

export interface DashboardStats {
  total_chats: number;
  active_chats: number;
  total_tickets: number;
  open_tickets: number;
  avg_response_time?: string;
  satisfaction_rate?: number;
  total_companies?: number;
  total_agents?: number;
}

export interface SuperadminDashboardStats {
  total_companies: number;
  total_chats: number;
  total_agents: number;
  total_projects: number;
  recent_signups: CompanySignup[];
  system_alerts: SystemAlert[];
}

export interface CompanySignup {
  id: number;
  company_name: string;
  admin_name: string;
  admin_email: string;
  status: string;
  agents_count: number;
  created_at: string;
}

export interface SystemAlert {
  id: string;
  type: 'warning' | 'info' | 'error';
  message: string;
  created_at: string;
}

export interface Member {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'agent' | 'superadmin';
  status: 'Active' | 'Away' | 'Offline' | 'Deactivated' | 'Invited';
  avatar_url?: string;
}
