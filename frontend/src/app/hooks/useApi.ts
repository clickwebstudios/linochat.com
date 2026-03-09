import { useState, useCallback } from 'react';
import api from '../lib/api';

/**
 * Thin wrapper around the Axios instance so components can call API methods
 * without manually reading the token or handling loading/error state.
 *
 * Usage:
 *   const { request, loading, error } = useApi();
 *   const data = await request(() => api.get('/api/projects'));
 */
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Request failed';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { api, loading, error, request, clearError: () => setError(null) };
}
