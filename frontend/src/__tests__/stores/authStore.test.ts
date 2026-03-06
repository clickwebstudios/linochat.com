import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuthStore } from '../../stores/authStore';

type Mock = ReturnType<typeof vi.fn>;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = vi.fn();

describe('Auth Store', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('should initialize with no user', () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle login success', async () => {
    const mockUser = {
      id: '1',
      first_name: 'Alex',
      last_name: 'Tester',
      email: 'alex@test.com',
      role: 'admin',
    };

    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: mockUser,
        access_token: 'test-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
      }),
    });

    const { result } = renderHook(() => useAuthStore());

    await result.current.login('alex@test.com', 'password');

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('linochat_access_token', 'test-token');
  });

  it('should handle login failure', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        message: 'Invalid credentials',
      }),
    });

    const { result } = renderHook(() => useAuthStore());

    await expect(result.current.login('wrong@test.com', 'wrong')).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it('should handle logout', async () => {
    (fetch as Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() => useAuthStore());

    await result.current.logout();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('linochat_access_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('linochat_token_expiry');
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
