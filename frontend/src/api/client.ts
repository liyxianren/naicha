import axios from 'axios';
import type { ApiResponse } from '../types';
import { useSessionStore } from '../stores/sessionStore';

const SESSION_STORAGE_KEY = 'mt_session';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
  timeout: 30000, // 30s timeout for slow remote DB
  headers: {
    'Content-Type': 'application/json',
  },
});

const getSessionToken = () => {
  const tokenFromStore = useSessionStore.getState().sessionToken;
  if (tokenFromStore) return tokenFromStore;

  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed?.sessionToken || null;
      }
    } catch (e) {
      console.warn('Failed to parse session storage', e);
    }
  }
  return null;
};

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const sessionToken = getSessionToken();
    if (sessionToken) {
      config.headers = {
        ...config.headers,
        'X-Session-Token': sessionToken,
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      if (import.meta.env.DEV && error.response.status >= 400) {
        console.error('API Error:', error.config?.url, error.response.status, error.response.data);
      }
      return Promise.reject({
        ...(error.response.data || {}),
        status: error.response.status,
      });
    }
    if (error.request) {
      if (import.meta.env.DEV) {
        console.error('Network Error: 无法连接到服务器', error.config?.url);
      }
      return Promise.reject({ success: false, error: '网络异常，请稍后再试' });
    }
    if (import.meta.env.DEV) {
      console.error('Error:', error.message);
    }
    return Promise.reject({ success: false, error: error.message });
  }
);

export default apiClient;

export const request = {
  get: <T>(url: string, params?: any): Promise<ApiResponse<T>> => apiClient.get(url, { params }),
  post: <T>(url: string, data?: any): Promise<ApiResponse<T>> => apiClient.post(url, data),
  put:  <T>(url: string, data?: any): Promise<ApiResponse<T>> => apiClient.put(url, data),
  patch:<T>(url: string, data?: any): Promise<ApiResponse<T>> => apiClient.patch(url, data),
  delete:<T>(url: string): Promise<ApiResponse<T>> => apiClient.delete(url),
};
