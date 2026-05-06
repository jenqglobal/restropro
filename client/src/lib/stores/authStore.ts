import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

interface Tenant {
  id: string;
  name: string;
  logo?: string;
  subscription: string;
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        const { user, tenant, accessToken, refreshToken } = response.data;
        
        set({
          user,
          tenant,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
        
        // Set token for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      },

      register: async (data: any) => {
        const response = await api.post('/auth/register', data);
        const { user, tenant, accessToken, refreshToken } = response.data;
        
        set({
          user,
          tenant,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
        
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      },

      logout: () => {
        set({
          user: null,
          tenant: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        
        delete api.defaults.headers.common['Authorization'];
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const response = await api.post('/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        set({
          accessToken,
          refreshToken: newRefreshToken,
        });
        
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      },
    }),
    {
      name: 'restropro-auth',
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.accessToken}`;
        }
      },
    }
  )
);