import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, setToken, setRefreshToken, clearTokens, User, Project } from '../api/client';
import { agentStatusStore } from '../data/agentStatusStore';
import { useProjectsStore } from './projectsStore';

interface AuthState {
  // State
  user: User | null;
  project: Project | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  register: (data: RegisterData) => Promise<{ analysisStatus: string; kbCount: number }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  website: string;
  company_name: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      project: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(email, password);
          
          if (response.success) {
            useProjectsStore.getState().clearProjects();
            setToken(response.data.access_token);
            setRefreshToken(response.data.refresh_token);
            set({
              user: response.data.user,
              project: response.data.project || null,
              isAuthenticated: true,
              isLoading: false,
            });
            // Set user status to Active
            if (response.data.user?.id) {
              agentStatusStore.setStatus(String(response.data.user.id), 'Active');
            }
          }
        } catch (error: any) {
          set({
            error: error.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      // Google Login
      googleLogin: async (credential: string): Promise<{ isNewUser: boolean }> => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.googleLogin(credential);
          if (response.success) {
            useProjectsStore.getState().clearProjects();
            setToken(response.data.access_token);
            setRefreshToken(response.data.refresh_token);
            set({
              user: response.data.user,
              project: response.data.project || null,
              isAuthenticated: true,
              isLoading: false,
            });
            if (response.data.user?.id) {
              agentStatusStore.setStatus(String(response.data.user.id), 'Active');
            }
          }
          return { isNewUser: response.data.is_new_user ?? false };
        } catch (error: any) {
          set({
            error: error.message || 'Google login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      // Register
      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(data);
          
          if (response.success) {
            useProjectsStore.getState().clearProjects();
            setToken(response.data.access_token);
            setRefreshToken(response.data.refresh_token);
            set({
              user: response.data.user,
              project: response.data.project || null,
              isAuthenticated: true,
              isLoading: false,
            });
            // Set user status to Active
            if (response.data.user?.id) {
              agentStatusStore.setStatus(String(response.data.user.id), 'Active');
            }
            return {
              analysisStatus: response.data.analysis || 'completed',
              kbCount: response.data.kb_articles_count || 0,
            };
          }
          throw new Error(response.message || 'Registration failed');
        } catch (error: any) {
          set({
            error: error.message || 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      // Logout
      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Set user status to Offline before clearing
          const currentUser = get().user;
          if (currentUser?.id) {
            agentStatusStore.setStatus(String(currentUser.id), 'Offline');
          }
          clearTokens();
          useProjectsStore.getState().clearProjects();
          set({
            user: null,
            project: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // Check auth on app load
      checkAuth: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await authApi.me();
          if (response.success) {
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
            });
            // Set user status to Active
            if (response.data?.id) {
              agentStatusStore.setStatus(String(response.data.id), 'Active');
            }
          }
        } catch (error) {
          clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),
      setUser: (user) => set({ user }),
      
      // Initialize - alias for checkAuth, used in App.tsx
      initialize: async () => {
        await get().checkAuth();
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        project: state.project,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
