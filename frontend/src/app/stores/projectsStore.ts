import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Project {
  id: string;
  name: string;
  slug: string;
  website: string;
  color: string;
  status: 'active' | 'inactive' | 'archived';
  description?: string;
  created_at?: string;
  totalTickets?: number;
  activeTickets?: number;
}

interface ProjectsState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  currentCompanyId: string | null;
  
  // Actions
  fetchProjects: (companyId?: string | null) => Promise<void>;
  fetchProjectById: (id: string) => Promise<Project | null>;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  clearProjects: () => void;
  refreshProjects: (companyId?: string | null) => Promise<void>;
  setCurrentCompanyId: (companyId: string | null) => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: [],
      loading: false,
      error: null,
      lastFetched: null,
      currentCompanyId: null,

      setCurrentCompanyId: (companyId: string | null) => {
        set({ currentCompanyId: companyId });
      },

      fetchProjects: async (companyId?: string | null) => {
        const { lastFetched, loading, currentCompanyId } = get();
        
        // Use provided companyId or currentCompanyId
        const targetCompanyId = companyId !== undefined ? companyId : currentCompanyId;
        
        // Update current company id if changed
        if (targetCompanyId !== currentCompanyId) {
          set({ currentCompanyId: targetCompanyId });
        }
        
        // Skip if already loading
        if (loading) return;
        
        // Skip if cached data is fresh and company hasn't changed
        if (lastFetched && Date.now() - lastFetched < CACHE_DURATION && get().projects.length > 0 && targetCompanyId === currentCompanyId) {
          console.log('Using cached projects');
          return;
        }

        set({ loading: true, error: null });

        try {
          const token = localStorage.getItem('access_token');
          if (!token) {
            set({ loading: false, error: 'No access token', lastFetched: Date.now() });
            return;
          }

          const url = targetCompanyId 
            ? `/api/projects?company_id=${targetCompanyId}` 
            : '/api/projects';
          
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          if (data.success) {
            const projectsData = data.data?.data || data.data || [];
            set({ 
              projects: projectsData, 
              loading: false, 
              lastFetched: Date.now(),
              error: null 
            });
          } else {
            throw new Error(data.message || 'Failed to fetch projects');
          }
        } catch (error) {
          console.error('Failed to fetch projects:', error);
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : 'Unknown error',
            lastFetched: Date.now()
          });
        }
      },

      fetchProjectById: async (id: string) => {
        const { projects } = get();
        
        // Check if already in store
        const cached = projects.find(p => p.id === id);
        if (cached) return cached;

        try {
          const token = localStorage.getItem('access_token');
          if (!token) return null;

          const response = await fetch(`/api/projects/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });

          if (!response.ok) return null;

          const data = await response.json();
          if (data.success && data.data) {
            const project = data.data;
            set(state => ({
              projects: [...state.projects.filter(p => p.id !== id), project]
            }));
            return project;
          }
        } catch (error) {
          console.error('Failed to fetch project:', error);
        }
        return null;
      },

      addProject: (project: Project) => {
        set(state => ({
          projects: [...state.projects, project]
        }));
      },

      updateProject: (id: string, updates: Partial<Project>) => {
        set(state => ({
          projects: state.projects.map(p => 
            p.id === id ? { ...p, ...updates } : p
          )
        }));
      },

      removeProject: (id: string) => {
        set(state => ({
          projects: state.projects.filter(p => p.id !== id)
        }));
      },

      clearProjects: () => {
        set({ projects: [], lastFetched: null, error: null });
      },

      refreshProjects: async () => {
        set({ lastFetched: null }); // Force refresh
        await get().fetchProjects();
      }
    }),
    {
      name: 'projects-storage',
      partialize: (state) => ({ 
        projects: state.projects,
        lastFetched: state.lastFetched 
      }),
    }
  )
);

// Selector hooks for better performance
export const selectProjects = (state: ProjectsState) => state.projects;
export const selectProjectsLoading = (state: ProjectsState) => state.loading;
export const selectProjectsError = (state: ProjectsState) => state.error;
export const selectProjectById = (id: string) => (state: ProjectsState) => 
  state.projects.find(p => p.id === id);
