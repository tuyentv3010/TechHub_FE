import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { tokenManager } from '@/lib/auth/token-manager';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'LEARNER' | 'INSTRUCTOR' | 'ADMIN';
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        
        setUser: (user) => {
          set({ 
            user, 
            isAuthenticated: !!user && tokenManager.hasValidTokens() 
          }, false, 'setUser');
        },
        
        setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),
        
        logout: () => {
          tokenManager.clearTokens();
          set(
            { user: null, isAuthenticated: false },
            false,
            'logout'
          );
        },
        
        checkAuth: () => {
          const isValid = tokenManager.hasValidTokens();
          const currentState = get();
          
          if (!isValid && currentState.isAuthenticated) {
            // Token expired, clear user
            set({ user: null, isAuthenticated: false }, false, 'checkAuth');
          } else if (isValid && !currentState.isAuthenticated && currentState.user) {
            // Token valid, update auth state
            set({ isAuthenticated: true }, false, 'checkAuth');
          }
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ 
          user: state.user 
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
);

// Initialize auth check on store creation
if (typeof window !== 'undefined') {
  useAuthStore.getState().checkAuth();
}