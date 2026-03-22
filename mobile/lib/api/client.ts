import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'linochat_access_token';
const REFRESH_TOKEN_KEY = 'linochat_refresh_token';
const TOKEN_EXPIRY_KEY = 'linochat_token_expiry';

// Platform-safe storage (SecureStore on native, localStorage on web)
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

// For simulator/emulator: use machine's local IP
// For physical device: use your computer's network IP
const DEFAULT_API_URL = Platform.select({
  ios: 'http://localhost:8001/api',
  android: 'http://10.0.2.2:8001/api',
  default: 'http://localhost:8001/api',
});

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

// Token management
export async function getAccessToken(): Promise<string | null> {
  return storage.getItem(TOKEN_KEY);
}

export async function setTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  const expiry = (Date.now() + expiresIn * 1000).toString();
  await Promise.all([
    storage.setItem(TOKEN_KEY, accessToken),
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken),
    storage.setItem(TOKEN_EXPIRY_KEY, expiry),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    storage.deleteItem(TOKEN_KEY),
    storage.deleteItem(REFRESH_TOKEN_KEY),
    storage.deleteItem(TOKEN_EXPIRY_KEY),
  ]);
}

export async function isTokenExpired(): Promise<boolean> {
  const expiry = await storage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiry) return true;
  return Date.now() >= parseInt(expiry, 10);
}

async function getRefreshToken(): Promise<string | null> {
  return storage.getItem(REFRESH_TOKEN_KEY);
}

// HTTP client
interface RequestOptions extends Omit<RequestInit, 'body'> {
  skipAuth?: boolean;
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (data.success && data.data?.access_token) {
        await setTokens(
          data.data.access_token,
          data.data.refresh_token || refreshToken,
          data.data.expires_in || 7200
        );
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  endpoint: string,
  method: string,
  data?: unknown,
  options?: RequestOptions
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (!(data instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (!options?.skipAuth) {
    const token = await getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    method,
    headers,
    ...options,
  };

  if (data !== undefined) {
    config.body = data instanceof FormData ? data : JSON.stringify(data);
  }

  let response = await fetch(url, config);

  // Handle 401 - try refresh
  if (response.status === 401 && !options?.skipAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = await getAccessToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      config.headers = headers;
      response = await fetch(url, config);
    } else {
      await clearTokens();
      throw new ApiError('Session expired', 401);
    }
  }

  if (response.status === 204) {
    return {} as T;
  }

  const json = await response.json();

  if (!response.ok) {
    throw new ApiError(
      json.message || 'Request failed',
      response.status,
      json.errors
    );
  }

  return json;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, 'GET', undefined, options),

  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, 'POST', data, options),

  put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, 'PUT', data, options),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, 'PATCH', data, options),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, 'DELETE', undefined, options),
};
