import { post, get, del, setAccessToken, clearTokens } from './client';
import type { 
  AuthResponse, 
  RegisterResponse, 
  LoginCredentials, 
  RegisterCredentials,
  User,
  ApiResponse,
} from '../types';

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await post<AuthResponse>('/auth/login', credentials);
  
  // Store token on successful login
  if (response.access_token) {
    setAccessToken(response.access_token, response.expires_in);
  }
  
  return response;
}

/**
 * Register a new account with website analysis
 */
export async function register(credentials: RegisterCredentials): Promise<RegisterResponse> {
  const response = await post<RegisterResponse>('/auth/register', credentials);
  
  // Store token on successful registration
  if (response.access_token) {
    setAccessToken(response.access_token, response.expires_in);
  }
  
  return response;
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User> {
  const response = await get<ApiResponse<User>>('/auth/me');
  return response.data;
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
  try {
    await post<void>('/auth/logout');
  } finally {
    // Always clear tokens locally
    clearTokens();
  }
}

/**
 * Refresh the access token
 */
export async function refreshToken(): Promise<AuthResponse> {
  const response = await post<AuthResponse>('/auth/refresh');
  
  if (response.access_token) {
    setAccessToken(response.access_token, response.expires_in);
  }
  
  return response;
}

// Export auth API object
export const authApi = {
  login,
  register,
  getCurrentUser,
  logout,
  refreshToken,
};

export default authApi;
