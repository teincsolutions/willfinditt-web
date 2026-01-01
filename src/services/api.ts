import axios from 'axios';
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearTokens,
} from '@/lib/auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isAuthRequest = error.config.url?.includes('/auth/login') || error.config.url?.includes('/auth/register');
    
    if (error.response?.status === 401 && !error.config._retry && !isAuthRequest) {
      error.config._retry = true;
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error('Session expired. Please log in again.');
        }

        const refreshResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {
            refreshToken,
          },
          {
            headers: {
              Authorization: `Bearer ${getAccessToken()}`
            }
          }
        );
        
        const newAccessToken = refreshResponse.data.access_token || refreshResponse.data.accessToken || refreshResponse.data.tokens?.accessToken;
        const newRefreshToken = refreshResponse.data.refresh_token || refreshResponse.data.refreshToken || refreshResponse.data.tokens?.refreshToken;
 
        if (newAccessToken) {
          setAccessToken(newAccessToken);
          if (newRefreshToken) setRefreshToken(newRefreshToken);
 
          error.config.headers.Authorization = `Bearer ${newAccessToken}`;
          return api.request(error.config);
        }
        throw new Error('Refresh failed');
      } catch (refreshError: any) {
        clearTokens();
        // Return a cleaner error message if possible
        const message = refreshError.response?.data?.message || refreshError.message || 'Session expired';
        return Promise.reject(new Error(message));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
