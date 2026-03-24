// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'agent' | 'superadmin';
  status: 'Active' | 'Away' | 'Offline' | 'Deactivated' | 'Invited';
  avatar_url?: string;
  join_date: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  widget_id: string;
  website: string;
  color: string;
  status: 'active' | 'inactive' | 'archived';
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
  analysis?: 'completed' | 'failed';
  kb_articles_count?: number;
}

// Token management
const getToken = () => localStorage.getItem('access_token');
const setToken = (token: string) => localStorage.setItem('access_token', token);
const getRefreshToken = () => localStorage.getItem('refresh_token');
const setRefreshToken = (token: string) => localStorage.setItem('refresh_token', token);
const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// Base request function
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add auth token if available
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(response.ok ? 'Invalid response from server' : `Server error (${response.status})`);
    }

    if (!response.ok) {
      // Handle 401 - try to refresh token (skip for login/register endpoints)
      if (response.status === 401 &&
          !endpoint.includes('/auth/refresh') &&
          !endpoint.includes('/auth/login') &&
          !endpoint.includes('/auth/register')) {
        const refreshed = await deduplicatedRefresh();
        if (refreshed) {
          return request(endpoint, options);
        }
        clearTokens();
        const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password', '/', '/features', '/pricing', '/resources', '/about', '/contact', '/help'];
        if (!publicPaths.some(p => window.location.pathname === p || window.location.pathname.startsWith('/help'))) {
          window.location.href = '/login';
        }
      }
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Deduplicate concurrent refresh attempts (race condition fix)
let refreshPromise: Promise<boolean> | null = null;
function deduplicatedRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

// Refresh token
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        setToken(data.data.access_token);
        setRefreshToken(data.data.refresh_token);
        return true;
      }
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }
  return false;
}

// HTTP methods
export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body: unknown) => 
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: unknown) => 
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  register: (data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
    website: string;
    company_name: string;
  }) => api.post<AuthResponse>('/auth/register', data),

  sendVerificationCode: (email: string) =>
    api.post('/auth/send-verification-code', { email }),

  verifyEmailCode: (email: string, code: string) =>
    api.post('/auth/verify-email-code', { email, code }),

  logout: () => api.post('/auth/logout', {}),

  me: () => api.get<User>('/auth/me'),

  refresh: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refresh_token: refreshToken }),

  googleLogin: (credential: string) =>
    api.post<AuthResponse>('/auth/google', { credential }),
};

// Export token helpers for use in other modules
export { getToken, setToken, getRefreshToken, setRefreshToken, clearTokens, API_BASE_URL };
