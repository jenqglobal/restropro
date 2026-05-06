import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('restropro-auth');
    if (token) {
      const parsed = JSON.parse(token);
      if (parsed.state?.accessToken) {
        config.headers.Authorization = `Bearer ${parsed.state.accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const token = localStorage.getItem('restropro-auth');
        if (token) {
          const parsed = JSON.parse(token);
          const refreshToken = parsed.state?.refreshToken;
          
          if (refreshToken) {
            const response = await axios.post('/api/auth/refresh', { refreshToken });
            const { accessToken } = response.data;
            
            const newState = {
              ...parsed.state,
              accessToken,
            };
            
            localStorage.setItem('restropro-auth', JSON.stringify({ state: newState }));
            
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        localStorage.removeItem('restropro-auth');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;