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
let isRedirecting = false;

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

const redirectToLogin = () => {
  if (isRedirecting) return;
  isRedirecting = true;
  clearTokens();
  
  // Use setTimeout to avoid interrupting current execution
  setTimeout(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  }, 100);
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Define public auth endpoints that should never trigger token refresh or redirects
    const publicAuthEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/verify-email',
      '/auth/verify-otp',
      '/auth/refresh',
      '/auth/social',
    ];
    
    // Define protected auth endpoints that should trigger refresh
    const protectedAuthEndpoints = [
      '/auth/profile',
      '/auth/change-password',
      '/auth/logout',
    ];
    
    const requestUrl = error.config.url || '';
    
    // Check if this is a public auth request (should NOT trigger refresh/redirect)
    const isPublicAuthRequest = publicAuthEndpoints.some(endpoint => 
      requestUrl.includes(endpoint)
    );
    
    // Check if this is a protected auth request (should trigger refresh)
    const isProtectedAuthRequest = protectedAuthEndpoints.some(endpoint => 
      requestUrl.includes(endpoint)
    );
    
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

    // Skip token refresh/redirect logic for public auth endpoints
    if (isPublicAuthRequest && statusCode === 401) {
      return Promise.reject(error);
    }

    // Handle Token Expiration - try refresh for protected endpoints and regular API calls
    if (statusCode === 401 && !originalRequest._retry && !isPublicAuthRequest) {
      if (!refreshToken) {
        redirectToLogin();
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
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Only clear tokens on explicit auth failure for non-public endpoints
    if (
        statusCode === 401 && 
        (errorCode === 'INVALID_USER') &&
        !isPublicAuthRequest
    ) {
        redirectToLogin();
        return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
