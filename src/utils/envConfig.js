/**
 * Cấu hình môi trường cho các domain khác nhau
 * Xử lý các vấn đề về CORS và authentication
 */

export const ENV_CONFIG = {
  // Development environments
  localhost: {
    enableSilentCheckSso: false,
    enableIframeCheck: false,
    enableLogging: true,
    redirectUriBase: 'http://localhost:5173'
  },
  
  // IP address (usually works better with Keycloak)
  ipAddress: {
    enableSilentCheckSso: true,
    enableIframeCheck: false,
    enableLogging: true,
    redirectUriBase: null // Will use window.location.origin
  },
  
  // Production on Vercel
  vercel: {
    enableSilentCheckSso: false,
    enableIframeCheck: false,
    enableLogging: false,
    redirectUriBase: null // Will use window.location.origin
  }
};

/**
 * Xác định môi trường hiện tại dựa trên hostname
 */
export const getCurrentEnvironment = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'localhost';
  }
  
  if (hostname.includes('vercel.app')) {
    return 'vercel';
  }
  
  // Default to IP address configuration for other cases
  return 'ipAddress';
};

/**
 * Lấy cấu hình cho môi trường hiện tại
 */
export const getCurrentConfig = () => {
  const env = getCurrentEnvironment();
  return ENV_CONFIG[env];
};

/**
 * Kiểm tra xem có nên sử dụng silent check SSO không
 */
export const shouldUseSilentCheckSso = () => {
  const config = getCurrentConfig();
  return config.enableSilentCheckSso;
};

/**
 * Kiểm tra xem có nên enable iframe check không
 */
export const shouldEnableIframeCheck = () => {
  const config = getCurrentConfig();
  return config.enableIframeCheck;
};

/**
 * Kiểm tra xem có nên enable logging không
 */
export const shouldEnableLogging = () => {
  const config = getCurrentConfig();
  return config.enableLogging;
};

/**
 * Lấy redirect URI base
 */
export const getRedirectUriBase = () => {
  const config = getCurrentConfig();
  return config.redirectUriBase || window.location.origin;
};
