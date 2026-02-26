import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuthStore } from '../../stores/authStore';

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
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
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

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          user: mockUser,
          access_token: 'test-token',
          refresh_token: 'refresh-token',
        },
      }),
    });

    const { result } = renderHook(() => useAuthStore());
    
    await result.current.login('alex@test.com', 'password');

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'test-token');
  });

  it('should handle login failure', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        message: 'Invalid credentials',
      }),
    });

    const { result } = renderHook(() => useAuthStore());
    
    await expect(result.current.login('wrong@test.com', 'wrong')).rejects.toThrow();

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle logout', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    await result.current.logout();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
