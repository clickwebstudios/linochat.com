// ============ API Response Wrappers ============

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ============ Core Entities ============

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  company_name?: string;
  email: string;
  phone?: string;
  location?: string;
  country?: string;
  bio?: string;
  avatar_url?: string;
  role: 'admin' | 'agent' | 'superadmin';
  company_plan?: string;
  status: 'Active' | 'Away' | 'Offline' | 'Deactivated' | 'Invited';
  two_factor_enabled?: boolean;
  last_active_at?: string;
  join_date?: string;
  created_at?: string;
  updated_at?: string;
  // Computed / included via API
  name?: string;
  username?: string;
  projects?: Project[];
}

export interface Project {
  id: number;
  user_id?: number;
  name: string;
  slug: string;
  widget_id: string;
  color: string;
  widget_settings?: Record<string, unknown>;
  settings_updated_at?: string;
  website: string;
  status: 'active' | 'inactive' | 'archived';
  description?: string;
  created_at?: string;
  updated_at?: string;
  // Relationships
  owner?: User;
  agents?: User[];
  chats_count?: number;
  tickets_count?: number;
}

export interface Company {
  id: number;
  name: string;
  plan?: string;
  created_at?: string;
  updated_at?: string;
  // Relationships / computed
  users?: User[];
  projects?: Project[];
  subscription?: Subscription;
  users_count?: number;
  projects_count?: number;
}

// ============ Chat ============

export interface Chat {
  id: number;
  project_id: number;
  agent_id?: number;
  customer_email?: string;
  customer_name?: string;
  customer_id?: string;
  status: 'active' | 'pending' | 'resolved' | 'closed';
  ai_enabled?: boolean;
  subject?: string;
  priority?: string;
  last_message_at?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  // Relationships
  project?: Project;
  agent?: User;
  messages?: ChatMessage[];
  // Computed
  last_message?: string;
  unread_count?: number;
  projectId?: number;
}

export interface ChatMessage {
  id: number;
  chat_id: number;
  sender_type: 'customer' | 'agent' | 'ai' | 'system';
  sender_id?: number;
  content: string;
  is_ai?: boolean;
  metadata?: {
    attachments?: Array<{ url: string; name: string }>;
    [key: string]: unknown;
  };
  read_at?: string;
  created_at?: string;
  updated_at?: string;
}

// ============ Ticket ============

export interface Ticket {
  id: number;
  project_id: number;
  assigned_to?: number;
  customer_email?: string;
  customer_name?: string;
  subject: string;
  description?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  resolved_at?: string;
  created_at?: string;
  updated_at?: string;
  // Relationships
  project?: Project;
  assigned_agent?: User;
  messages?: TicketMessage[];
  // Aliases used by frontend
  title?: string;
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  sender_type: 'customer' | 'agent' | 'system';
  sender_id?: number;
  content: string;
  metadata?: Record<string, unknown>;
  is_internal?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============ Knowledge Base ============

export interface Article {
  id: number;
  author_id?: number;
  title: string;
  slug?: string;
  category?: string;
  category_id?: number;
  status?: 'draft' | 'published';
  excerpt?: string;
  content: string;
  tags?: string[];
  views?: number;
  helpful?: number;
  created_at?: string;
  updated_at?: string;
  // Relationships
  author?: User;
}

export interface KbArticle {
  id: number;
  category_id?: number;
  project_id: number;
  author_id?: number;
  title: string;
  slug?: string;
  content: string;
  status?: string;
  is_published?: boolean;
  views_count?: number;
  helpful_count?: number;
  not_helpful_count?: number;
  source_url?: string;
  is_ai_generated?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============ Billing ============

export interface Plan {
  id: number;
  name: string;
  price_monthly: number;
  price_annual: number;
  features: string[];
  is_popular?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Subscription {
  id: number;
  company_id: number;
  plan_id: number;
  billing_cycle: 'monthly' | 'annual';
  status: 'active' | 'cancelled' | 'paused';
  started_at?: string;
  ends_at?: string;
  renews_at?: string;
  created_at?: string;
  updated_at?: string;
  // Relationships
  plan?: Plan;
}

export interface Invoice {
  id: number;
  company_id: number;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  issued_at?: string;
  created_at?: string;
  updated_at?: string;
}

// ============ Token Top-Up ============

export interface TopUpPack {
  tokens: number;
  price_cents: number;
  label: string;
}

export interface TopUpPacksResponse {
  [packType: string]: TopUpPack;
}

export interface TopUpIntent {
  client_secret: string;
  purchase_id: number;
  tokens: number;
  amount: number;
  label: string;
}

export interface TokenBalance {
  tokens_used: number;
  tokens_allowance: number;
  tokens_rollover: number;
  token_cycle_reset_at: string;
}

// ============ Notifications ============

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============ Auth ============

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
  project?: Project;
  analysis?: string;
  kb_articles_count?: number;
}

// ============ Stats ============

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
