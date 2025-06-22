import axios from "axios";
import { getToken, isAuthenticated, refreshToken, logout } from "./keycloak";

/**
 * Thiết lập axios interceptor để tự động thêm token vào header
 * khi gọi API đến backend
 */
const setupAxiosInterceptors = () => {
  // Request interceptor
  axios.interceptors.request.use(
    async (config) => {
      // Thêm token vào header Authorization nếu user đã đăng nhập
      if (isAuthenticated()) {
        const token = getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - xử lý lỗi 401, 403
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Xử lý các lỗi từ backend
      if (error.response) {
        // Lỗi 401 Unauthorized - token hết hạn hoặc không hợp lệ
        if (error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          console.log("401 Unauthorized: Attempting to refresh token");
          
          try {
            // Thử refresh token
            await refreshToken();
            const newToken = getToken();
            
            if (newToken) {
              // Cập nhật token mới cho request ban đầu
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            // Nếu refresh token thất bại, logout user
            logout();
            return Promise.reject(refreshError);
          }
        }

        // Lỗi 403 Forbidden - không có quyền truy cập
        if (error.response.status === 403) {
          console.log("Forbidden: Access denied");
          // Có thể điều hướng đến trang "Access Denied"
        }
      }

      return Promise.reject(error);
    }
  );
};

export default setupAxiosInterceptors;
