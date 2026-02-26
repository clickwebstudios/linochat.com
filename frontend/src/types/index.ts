/**
 * Type definitions for LinoChat frontend
 */

// ============ Auth Types ============

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  website_url: string;
  description?: string;
  status: 'active' | 'inactive' | 'pending';
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WebsiteAnalysis {
  id: string;
  project_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  pages_found?: number;
  pages_crawled?: number;
  kb_articles_count?: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  website_url: string;
  company_name?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface RegisterResponse extends AuthResponse {
  project: Project;
  analysis: WebsiteAnalysis;
  kb_articles_count: number;
}

// ============ API Types ============

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ============ UI Types ============

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface FormFieldError {
  message: string;
  type: string;
}

// ============ Route Types ============

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  protected?: boolean;
  layout?: boolean;
}
