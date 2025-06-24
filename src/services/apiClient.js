import axios from 'axios';
import { getToken, isAuthenticated } from './keycloak';

/**
 * Tạo một axios instance với cấu hình sẵn cho authenticated requests
 */
const createAuthenticatedAxios = () => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor cho instance này
  instance.interceptors.request.use(
    (config) => {
      // Luôn thêm token nếu có
      if (isAuthenticated()) {
        const token = getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return instance;
};

/**
 * Tạo một axios instance cho public API (không cần authentication)
 */
const createPublicAxios = () => {
  return axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Helper functions cho các HTTP methods với authentication
 */
export const authenticatedApi = {
  get: (url, config = {}) => {
    const instance = createAuthenticatedAxios();
    return instance.get(url, config);
  },
  
  post: (url, data = {}, config = {}) => {
    const instance = createAuthenticatedAxios();
    return instance.post(url, data, config);
  },
  
  put: (url, data = {}, config = {}) => {
    const instance = createAuthenticatedAxios();
    return instance.put(url, data, config);
  },
  
  patch: (url, data = {}, config = {}) => {
    const instance = createAuthenticatedAxios();
    return instance.patch(url, data, config);
  },
  
  delete: (url, config = {}) => {
    const instance = createAuthenticatedAxios();
    return instance.delete(url, config);
  },
};

/**
 * Helper functions cho public API (không cần authentication)
 */
export const publicApi = {
  get: (url, config = {}) => {
    const instance = createPublicAxios();
    return instance.get(url, config);
  },
  
  post: (url, data = {}, config = {}) => {
    const instance = createPublicAxios();
    return instance.post(url, data, config);
  },
};

export { createAuthenticatedAxios, createPublicAxios };
