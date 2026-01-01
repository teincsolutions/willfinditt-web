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
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const refreshResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {
            refreshToken,
          }
        );
        const newAccessToken = refreshResponse.data.accessToken || refreshResponse.data.tokens?.accessToken;
        const newRefreshToken = refreshResponse.data.refreshToken || refreshResponse.data.tokens?.refreshToken;
 
        if (newAccessToken) {
          setAccessToken(newAccessToken);
          if (newRefreshToken) setRefreshToken(newRefreshToken);
 
          error.config.headers.Authorization = `Bearer ${newAccessToken}`;
          return api.request(error.config);
        }
        throw new Error('Refresh failed');
      } catch (refreshError) {
        clearTokens();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
