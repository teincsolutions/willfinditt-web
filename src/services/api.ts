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

console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL);

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`Requesting: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.params);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isAuthRequest = error.config.url?.includes('/auth/login') || error.config.url?.includes('/auth/register');
    
    if (error.code === 'ERR_NETWORK') {
      console.error('Network Error Details:', {
        message: error.message,
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        method: error.config?.method,
      });
    }

    const errorCode = error.response?.data?.code;
    const statusCode = error.response?.status;

    // Handle Token Expiration
    if (statusCode === 401 && errorCode === 'TOKEN_EXPIRED' && !error.config._retry && !isAuthRequest) {
      error.config._retry = true;
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error('Session expired');
        }

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
 
          error.config.headers.Authorization = `Bearer ${newAccessToken}`;
          return api.request(error.config);
        }
      } catch (refreshError) {
        // Refresh failed implies session is dead
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle Terminal Auth Errors
    if (
        statusCode === 401 && 
        (errorCode === 'INVALID_TOKEN' || errorCode === 'INVALID_USER' || errorCode === 'UNAUTHORIZED')
    ) {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
    }
    
    // Fallback for generic 401s (legacy or un-coded)
    if (statusCode === 401 && !isAuthRequest && !error.config._retry) {
       // Decide if we want to try refresh for generic 401 or just logout
       // For safety given "not every 401 is token expiration", we should probably default to logout 
       // UNLESS we are sure. The prompt says "not every 401 error that is due to token expiration".
       // So we should be conservative.
       // However, often generic 401 IS token expiration in systems that don't send codes.
       // But the user strictly asked to use the codes.
       // Let's assume if no code, we might redirect.
       // But to be safe vs legacy behavior, maybe we just reject and let UI handle it?
       // Or do we treat it as unauthorized?
       // Let's logout for safety if it's 401 and not one of the above, to avoid loops.
       clearTokens();
       if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
    }

    return Promise.reject(error);
  }
);

export default api;
