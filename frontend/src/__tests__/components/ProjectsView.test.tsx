import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProjectsView } from '../../components/agent-dashboard/ProjectsView';

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ProjectsView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    localStorageMock.getItem.mockReturnValue('test-token');
    (fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <MemoryRouter>
        <ProjectsView basePath="/agent" onAddProjectClick={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByRole('status')).toBeInTheDocument(); // Loader2 has role="status"
  });

  it('should display real projects from API', async () => {
    localStorageMock.getItem.mockReturnValue('test-token');
    
    const mockProjects = {
      success: true,
      data: {
        data: [
          {
            id: 'proj-1',
            name: 'SkyBreeze',
            website: 'https://skybreeze.example.com',
            widget_id: 'wc_abc123',
            color: '#4F46E5',
            description: 'Main project',
          },
        ],
      },
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProjects,
    });

    render(
      <MemoryRouter>
        <ProjectsView basePath="/agent" onAddProjectClick={() => {}} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('SkyBreeze')).toBeInTheDocument();
    });

    expect(screen.getByText('Main project')).toBeInTheDocument();
    expect(screen.getByText('ID: wc_abc123')).toBeInTheDocument();
  });

  it('should show empty state when no projects', async () => {
    localStorageMock.getItem.mockReturnValue('test-token');
    
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { data: [] },
      }),
    });

    render(
      <MemoryRouter>
        <ProjectsView basePath="/agent" onAddProjectClick={() => {}} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No projects yet')).toBeInTheDocument();
    });
  });

  it('should show empty state when no token', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <MemoryRouter>
        <ProjectsView basePath="/agent" onAddProjectClick={() => {}} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No projects yet')).toBeInTheDocument();
    });
  });
});
