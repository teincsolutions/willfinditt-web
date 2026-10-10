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
  // Client identification for server-side diagnostics (which app is calling)
  config.headers['X-Client'] = 'web';
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
  
  if (typeof window !== 'undefined') {
    window.location.href = '/auth/login';
  }
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const refreshResponse = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
          'X-Client': 'web',
        }
      }
    );
    
    const newAccessToken = refreshResponse.data.access_token || refreshResponse.data.accessToken;
    const newRefreshToken = refreshResponse.data.refresh_token || refreshResponse.data.refreshToken;
 
    if (newAccessToken) {
      setAccessToken(newAccessToken);
      if (newRefreshToken) setRefreshToken(newRefreshToken);
      return newAccessToken;
    }
    return null;
  } catch (error) {
    return null;
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
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
    
    const requestUrl = error.config?.url || '';
    
    const isPublicAuthRequest = publicAuthEndpoints.some(endpoint => 
      requestUrl.includes(endpoint)
    );
    
    const originalRequest = error.config;
    const statusCode = error.response?.status;

    // Skip token refresh/redirect logic for public auth endpoints
    if (isPublicAuthRequest && statusCode === 401) {
      return Promise.reject(error);
    }

    if (statusCode === 401 && !originalRequest._retry && !isPublicAuthRequest) {
      const refreshToken = getRefreshToken();
      
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
          redirectToLogin();
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();
        
        if (newAccessToken) {
          api.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
          processQueue(null, newAccessToken);
          originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
          return api(originalRequest);
        } else {
          throw new Error('Failed to refresh token');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
