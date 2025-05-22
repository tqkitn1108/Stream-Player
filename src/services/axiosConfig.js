import axios from "axios";
import { getToken, isAuthenticated } from "./keycloak";

/**
 * Thiết lập axios interceptor để tự động thêm token vào header
 * khi gọi API đến backend
 */
const setupAxiosInterceptors = () => {
  // Request interceptor
  axios.interceptors.request.use(
    (config) => {
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
    (error) => {
      // Xử lý các lỗi từ backend
      if (error.response) {
        // Lỗi 401 Unauthorized - token hết hạn hoặc không hợp lệ
        if (error.response.status === 401) {
          console.log("Unauthorized request: Token invalid or expired");
          // Có thể thêm logic refresh token hoặc logout ở đây
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
