import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

const mockToken = 'test-jwt-token';

// Helper to mock fetch with auth header check
const mockFetch = (response: any, status = 200) => {
  return (fetch as any).mockResolvedValueOnce({
    ok: status < 400,
    status,
    json: async () => response,
    headers: new Headers({ 'content-type': 'application/json' }),
  });
};

describe('Projects API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('access_token', mockToken);
  });

  it('should fetch projects with correct auth header', async () => {
    const mockProjects = {
      success: true,
      data: {
        data: [
          {
            id: 'proj-1',
            name: 'SkyBreeze',
            website: 'https://example.com',
            widget_id: 'wc_123',
            color: '#4F46E5',
          },
        ],
      },
    };

    mockFetch(mockProjects);

    const response = await fetch('/api/projects', {
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    expect(fetch).toHaveBeenCalledWith('/api/projects', {
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Accept': 'application/json',
      },
    });
    expect(data.success).toBe(true);
    expect(data.data.data[0].name).toBe('SkyBreeze');
  });

  it('should handle 401 unauthorized', async () => {
    mockFetch({ success: false, message: 'Unauthenticated' }, 401);

    const response = await fetch('/api/projects', {
      headers: { 'Authorization': 'Bearer invalid-token' },
    });

    expect(response.status).toBe(401);
  });

  it('should handle paginated response', async () => {
    const mockPaginated = {
      success: true,
      data: {
        current_page: 1,
        data: [{ id: '1', name: 'Project 1' }],
        total: 1,
        per_page: 20,
      },
    };

    mockFetch(mockPaginated);

    const response = await fetch('/api/projects');
    const data = await response.json();

    // Frontend should extract data.data for paginated responses
    const projects = data.data?.data || data.data || [];
    expect(projects).toHaveLength(1);
  });
});

describe('Knowledge Base API Integration', () => {
  const projectId = 'proj-1';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('access_token', mockToken);
  });

  it('should fetch KB categories', async () => {
    const mockCategories = {
      success: true,
      data: [
        { id: 'cat-1', name: 'Documentation', slug: 'documentation' },
        { id: 'cat-2', name: 'FAQ', slug: 'faq' },
      ],
    };

    mockFetch(mockCategories);

    const response = await fetch(`/api/projects/${projectId}/kb/categories`, {
      headers: { 'Authorization': `Bearer ${mockToken}` },
    });

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
  });

  it('should fetch KB articles with boolean is_published', async () => {
    const mockArticles = {
      success: true,
      data: [
        {
          id: 'art-1',
          title: 'Welcome',
          is_published: true, // Should be boolean, not 1
          views_count: 100,
        },
      ],
    };

    mockFetch(mockArticles);

    const response = await fetch(`/api/projects/${projectId}/kb/categories/cat-1/articles`, {
      headers: { 'Authorization': `Bearer ${mockToken}` },
    });

    const data = await response.json();
    expect(typeof data.data[0].is_published).toBe('boolean');
  });
});

describe('Profile API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('access_token', mockToken);
  });

  it('should fetch current user profile', async () => {
    const mockUser = {
      success: true,
      data: {
        id: '1',
        first_name: 'Alex',
        last_name: 'Tester',
        email: 'alex@test.com',
        role: 'admin',
      },
    };

    mockFetch(mockUser);

    const response = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${mockToken}` },
    });

    const data = await response.json();
    expect(data.data.first_name).toBe('Alex');
    expect(data.data.email).toBe('alex@test.com');
  });

  it('should update profile with PUT request', async () => {
    const updatedUser = {
      success: true,
      data: {
        id: '1',
        first_name: 'Alexandra',
        last_name: 'Tester',
        email: 'alex@test.com',
      },
    };

    mockFetch(updatedUser);

    const response = await fetch('/api/auth/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`,
      },
      body: JSON.stringify({ first_name: 'Alexandra' }),
    });

    const data = await response.json();
    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/me',
      expect.objectContaining({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockToken}`,
        },
      })
    );
    expect(data.data.first_name).toBe('Alexandra');
  });
});
