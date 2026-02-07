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


let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Exclude public auth endpoints from triggering interceptor logic
    const isAuthUrl = error.config.url?.includes('/auth/');
    // We want to allow /auth/profile and /auth/change-password to trigger refresh as they are protected
    // accessible only with access token.
    const isProtectedAuth = error.config.url?.includes('/auth/profile') || error.config.url?.includes('/auth/change-password') || error.config.url?.includes('/auth/logout');
    
    // So we skip interceptor if it is an auth url BUT NOT a protected one (like profile)
    // effectively excluding login, register, refresh, forgot-password, etc.
    const isAuthRequest = isAuthUrl && !isProtectedAuth;
    
    if (error.code === 'ERR_NETWORK') {
      console.error('Network Error Details:', {
        message: error.message,
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        method: error.config?.method,
      });
    }

    const originalRequest = error.config;
    const errorCode = error.response?.data?.code;
    const statusCode = error.response?.status;

    const refreshToken = getRefreshToken();

    // Handle Token Expiration - try refresh for any 401 on protected endpoints
    if (statusCode === 401 && !originalRequest._retry && !isAuthRequest) {
      if (!refreshToken) {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({resolve, reject});
        }).then((token) => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
        
        const newAccessToken = refreshResponse.data.access_token || refreshResponse.data.accessToken || refreshResponse.data.tokens?.accessToken;
        const newRefreshToken = refreshResponse.data.refresh_token || refreshResponse.data.refreshToken || refreshResponse.data.tokens?.refreshToken;
 
        if (newAccessToken) {
          setAccessToken(newAccessToken);
          if (newRefreshToken) setRefreshToken(newRefreshToken);
 
          api.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
          
          processQueue(null, newAccessToken);
          
          originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Only clear tokens on explicit auth failure, not on token expiration during refresh
    if (
        statusCode === 401 && 
        (errorCode === 'INVALID_USER') &&
        !isAuthRequest
    ) {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
