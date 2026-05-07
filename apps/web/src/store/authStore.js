import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      role: null,

      login: (userData, token) => {
        set({
          user: userData,
          token,
          isAuthenticated: true,
          role: userData.role || null,
          isLoading: false,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          role: null,
          isLoading: false,
        });
        window.location.href = '/';
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
          role: userData.role || state.role,
        }));
      },

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'mmt-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
    }
  )
);
