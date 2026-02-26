import type { ApiError, ApiResponse } from '../types';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Token storage keys
const TOKEN_KEY = 'linochat_access_token';
const TOKEN_EXPIRY_KEY = 'linochat_token_expiry';

/**
 * Get stored access token
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store access token
 */
export function setAccessToken(token: string, expiresIn: number): void {
  localStorage.setItem(TOKEN_KEY, token);
  const expiryTime = Date.now() + expiresIn * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
}

/**
 * Clear stored tokens
 */
export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

/**
 * Check if token is expired
 */
export function isTokenExpired(): boolean {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiry) return true;
  return Date.now() >= parseInt(expiry, 10);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getAccessToken();
  return !!token && !isTokenExpired();
}

/**
 * Build API URL
 */
function buildUrl(endpoint: string): string {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}

/**
 * Build request headers
 */
function buildHeaders(includeAuth = true, isFormData = false): HeadersInit {
  const headers: HeadersInit = {};
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json';
  }
  
  if (includeAuth) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Try to parse error response
    let error: ApiError;
    try {
      const errorData = await response.json();
      error = {
        message: errorData.message || `HTTP Error: ${response.status}`,
        errors: errorData.errors,
        code: errorData.code || `HTTP_${response.status}`,
      };
    } catch {
      error = {
        message: `HTTP Error: ${response.status} ${response.statusText}`,
        code: `HTTP_${response.status}`,
      };
    }
    
    // Handle 401 Unauthorized - clear tokens
    if (response.status === 401) {
      clearTokens();
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    
    throw error;
  }
  
  // Handle empty responses
  if (response.status === 204) {
    return null as T;
  }
  
  return response.json();
}

/**
 * HTTP GET request
 */
export async function get<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(endpoint), {
    ...options,
    method: 'GET',
    headers: {
      ...buildHeaders(),
      ...options?.headers,
    },
  });
  
  return handleResponse<T>(response);
}

/**
 * HTTP POST request
 */
export async function post<T>(
  endpoint: string, 
  data?: unknown, 
  options?: RequestInit
): Promise<T> {
  const isFormData = data instanceof FormData;
  
  const response = await fetch(buildUrl(endpoint), {
    ...options,
    method: 'POST',
    headers: {
      ...buildHeaders(true, isFormData),
      ...options?.headers,
    },
    body: isFormData ? data : data ? JSON.stringify(data) : undefined,
  });
  
  return handleResponse<T>(response);
}

/**
 * HTTP PUT request
 */
export async function put<T>(
  endpoint: string, 
  data?: unknown, 
  options?: RequestInit
): Promise<T> {
  const isFormData = data instanceof FormData;
  
  const response = await fetch(buildUrl(endpoint), {
    ...options,
    method: 'PUT',
    headers: {
      ...buildHeaders(true, isFormData),
      ...options?.headers,
    },
    body: isFormData ? data : data ? JSON.stringify(data) : undefined,
  });
  
  return handleResponse<T>(response);
}

/**
 * HTTP PATCH request
 */
export async function patch<T>(
  endpoint: string, 
  data?: unknown, 
  options?: RequestInit
): Promise<T> {
  const response = await fetch(buildUrl(endpoint), {
    ...options,
    method: 'PATCH',
    headers: {
      ...buildHeaders(),
      ...options?.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  
  return handleResponse<T>(response);
}

/**
 * HTTP DELETE request
 */
export async function del<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(endpoint), {
    ...options,
    method: 'DELETE',
    headers: {
      ...buildHeaders(),
      ...options?.headers,
    },
  });
  
  return handleResponse<T>(response);
}

// Export client object for convenience
export const apiClient = {
  get,
  post,
  put,
  patch,
  delete: del,
};

export default apiClient;
