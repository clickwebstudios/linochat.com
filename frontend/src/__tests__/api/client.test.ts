import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('API_BASE_URL should be defined', async () => {
    const { API_BASE_URL } = await import('../../app/api/client');
    expect(API_BASE_URL).toBeDefined();
    expect(typeof API_BASE_URL).toBe('string');
  });

  it('api object should have get, post, put, delete methods', async () => {
    const { api } = await import('../../app/api/client');
    expect(api.get).toBeDefined();
    expect(api.post).toBeDefined();
    expect(api.put).toBeDefined();
    expect(api.delete).toBeDefined();
    expect(typeof api.get).toBe('function');
    expect(typeof api.post).toBe('function');
  });
});
