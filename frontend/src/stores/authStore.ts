import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Project, WebsiteAnalysis } from '../types';
import { authApi } from '../api/auth';
import { isAuthenticated as checkIsAuthenticated, clearTokens } from '../api/client';

// ============ State Types ============

interface AuthState {
  // User data
  user: User | null;
  isAuthenticated: boolean;
  
  // Registration data (for analysis feedback)
  currentProject: Project | null;
  currentAnalysis: WebsiteAnalysis | null;
  kbArticlesCount: number;
  
  // Loading states
  isLoading: boolean;
  isInitializing: boolean;
  
  // Error state
  error: string | null;
  fieldErrors: Record<string, string>;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
  clearFieldErrors: () => void;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  website_url: string;
  company_name?: string;
}

// ============ Store Creation ============

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      currentProject: null,
      currentAnalysis: null,
      kbArticlesCount: 0,
      isLoading: false,
      isInitializing: true,
      error: null,
      fieldErrors: {},

      // ============ Actions ============

      /**
       * Login with email and password
       */
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null, fieldErrors: {} });
        
        try {
          const response = await authApi.login({ email, password });
          
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: unknown) {
          const apiError = error as { message: string; errors?: Record<string, string[]> };
          const fieldErrors: Record<string, string> = {};
          
          // Convert array errors to single string
          if (apiError.errors) {
            Object.entries(apiError.errors).forEach(([key, value]) => {
              fieldErrors[key] = Array.isArray(value) ? value[0] : value;
            });
          }
          
          set({
            isLoading: false,
            error: apiError.message || 'Login failed. Please try again.',
            fieldErrors,
          });
          throw error;
        }
      },

      /**
       * Register a new account
       */
      register: async (data: RegisterData) => {
        set({ 
          isLoading: true, 
          error: null, 
          fieldErrors: {},
          currentProject: null,
          currentAnalysis: null,
          kbArticlesCount: 0,
        });
        
        try {
          const response = await authApi.register(data);
          
          set({
            user: response.user,
            isAuthenticated: true,
            currentProject: response.project,
            currentAnalysis: response.analysis,
            kbArticlesCount: response.kb_articles_count,
            isLoading: false,
            error: null,
          });
        } catch (error: unknown) {
          const apiError = error as { message: string; errors?: Record<string, string[]> };
          const fieldErrors: Record<string, string> = {};
          
          if (apiError.errors) {
            Object.entries(apiError.errors).forEach(([key, value]) => {
              fieldErrors[key] = Array.isArray(value) ? value[0] : value;
            });
          }
          
          set({
            isLoading: false,
            error: apiError.message || 'Registration failed. Please try again.',
            fieldErrors,
          });
          throw error;
        }
      },

      /**
       * Logout the current user
       */
      logout: async () => {
        set({ isLoading: true });
        
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            currentProject: null,
            currentAnalysis: null,
            kbArticlesCount: 0,
            isLoading: false,
            error: null,
            fieldErrors: {},
          });
        }
      },

      /**
       * Initialize auth state on app load
       */
      initialize: async () => {
        set({ isInitializing: true });
        
        try {
          if (checkIsAuthenticated()) {
            const user = await authApi.getCurrentUser();
            set({
              user,
              isAuthenticated: true,
              isInitializing: false,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isInitializing: false,
            });
          }
        } catch (error) {
          // Token is invalid or expired
          clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            isInitializing: false,
          });
        }
      },

      /**
       * Clear error state
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Clear field errors
       */
      clearFieldErrors: () => {
        set({ fieldErrors: {} });
      },

      /**
       * Set user directly (useful for updates)
       */
      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      /**
       * Update user data partially
       */
      updateUser: (updates: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },
    }),
    {
      name: 'linochat-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ============ Selectors ============

export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectIsInitializing = (state: AuthState) => state.isInitializing;
export const selectAuthError = (state: AuthState) => state.error;
export const selectAuthFieldErrors = (state: AuthState) => state.fieldErrors;
export const selectCurrentProject = (state: AuthState) => state.currentProject;
export const selectCurrentAnalysis = (state: AuthState) => state.currentAnalysis;
export const selectKbArticlesCount = (state: AuthState) => state.kbArticlesCount;

export default useAuthStore;
