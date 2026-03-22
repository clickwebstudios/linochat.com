import { apiClient, setTokens, clearTokens } from './client';
import type { ApiResponse, AuthResponse, User } from './types';

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await apiClient.post<ApiResponse<AuthResponse>>(
    '/auth/login',
    { email, password },
    { skipAuth: true }
  );
  await setTokens(
    res.data.access_token,
    res.data.refresh_token,
    res.data.expires_in
  );
  return res.data;
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // Ignore logout errors
  } finally {
    await clearTokens();
  }
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get<ApiResponse<User>>('/auth/me');
  return res.data;
}

export async function updateProfile(
  data: Partial<User>
): Promise<User> {
  const res = await apiClient.put<ApiResponse<User>>('/auth/me', data);
  return res.data;
}
