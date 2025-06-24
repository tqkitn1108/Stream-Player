import axios from "axios";
import { getToken, isAuthenticated, refreshToken, logout } from "./keycloak";

/**
 * Các HTTP methods cần authentication
 */
const METHODS_REQUIRING_AUTH = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Các endpoints không cần authentication (whitelist)
 */
const PUBLIC_ENDPOINTS = [
  '/auth',
  '/login',
  '/register',
  '/public',
  '/health',
  '/status'
];

/**
 * Kiểm tra xem request có cần authentication không
 */
const requiresAuthentication = (config) => {
  const method = config.method?.toUpperCase();
  const url = config.url || '';
  
  // Kiểm tra xem có phải public endpoint không
  const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint => 
    url.includes(endpoint)
  );
  
  if (isPublicEndpoint) {
    return false;
  }
  
  // Luôn thêm token cho các method này
  if (METHODS_REQUIRING_AUTH.includes(method)) {
    return true;
  }
  
  // Với GET requests, chỉ thêm token nếu user đã đăng nhập
  return isAuthenticated();
};

/**
 * Thiết lập axios interceptor để tự động thêm token vào header
 * khi gọi API đến backend
 */
const setupAxiosInterceptors = () => {
  // Request interceptor
  axios.interceptors.request.use(
    async (config) => {
      // Logging chi tiết cho development
      if (import.meta.env.DEV) {
        const hasAuth = config.headers.Authorization ? '🔐' : '🔓';
        console.log(`📤 ${hasAuth} ${config.method?.toUpperCase()} ${config.url}`);
      }
      
      // Kiểm tra xem request có cần authentication không
      if (requiresAuthentication(config)) {
        if (isAuthenticated()) {
          const token = getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            if (import.meta.env.DEV) {
              console.log(`🔐 Token added to ${config.method?.toUpperCase()} ${config.url}`);
            }
          } else {
            console.warn(`⚠️ No token available for ${config.method?.toUpperCase()} ${config.url}`);
          }
        } else {
          // Đối với các method cần auth nhưng user chưa đăng nhập
          if (METHODS_REQUIRING_AUTH.includes(config.method?.toUpperCase())) {
            console.error(`🚫 Authentication required for ${config.method?.toUpperCase()} ${config.url}`);
            return Promise.reject(new Error('Authentication required'));
          }
        }
      }
      
      // Thêm Content-Type mặc định cho POST/PUT/PATCH nếu chưa có
      if (METHODS_REQUIRING_AUTH.includes(config.method?.toUpperCase()) && !config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }
      
      return config;
    },
    (error) => {
      console.error('❌ Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor - xử lý lỗi 401, 403
  axios.interceptors.response.use(
    (response) => {
      // Logging chi tiết cho development
      if (import.meta.env.DEV) {
        const status = response.status;
        const emoji = status >= 200 && status < 300 ? '✅' : '⚠️';
        console.log(`📥 ${emoji} ${status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
      }
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      
      // Logging lỗi
      if (import.meta.env.DEV) {
        const status = error.response?.status || 'Network Error';
        const method = originalRequest?.method?.toUpperCase() || 'UNKNOWN';
        const url = originalRequest?.url || 'unknown';
        console.error(`❌ ${status} ${method} ${url}`, error.response?.data || error.message);
      }

      // Xử lý các lỗi từ backend
      if (error.response) {
        // Lỗi 401 Unauthorized - token hết hạn hoặc không hợp lệ
        if (error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          console.log("🔄 401 Unauthorized: Attempting to refresh token");
          
          try {
            // Thử refresh token
            await refreshToken();
            const newToken = getToken();
            
            if (newToken) {
              console.log("✅ Token refreshed successfully, retrying request");
              // Cập nhật token mới cho request ban đầu
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return axios(originalRequest);
            } else {
              throw new Error('No token after refresh');
            }
          } catch (refreshError) {
            console.error("💥 Token refresh failed:", refreshError);
            // Nếu refresh token thất bại, logout user
            logout();
            return Promise.reject(new Error('Session expired. Please login again.'));
          }
        }

        // Lỗi 403 Forbidden - không có quyền truy cập
        if (error.response.status === 403) {
          console.log("🚫 Forbidden: Access denied");
          return Promise.reject(new Error('Access denied. You do not have permission to perform this action.'));
        }

        // Lỗi 422 Validation Error
        if (error.response.status === 422) {
          console.log("⚠️ Validation Error:", error.response.data);
          return Promise.reject(error);
        }

        // Lỗi 500 Server Error
        if (error.response.status >= 500) {
          console.error("🔥 Server Error:", error.response.status);
          return Promise.reject(new Error('Server error. Please try again later.'));
        }
      } else if (error.request) {
        // Network error
        console.error("🌐 Network Error:", error.message);
        return Promise.reject(new Error('Network error. Please check your connection.'));
      }

      return Promise.reject(error);
    }
  );
};

export default setupAxiosInterceptors;
