import Keycloak from "keycloak-js";
import { KEYCLOAK_CLIENT_ID, KEYCLOAK_REALM } from "../utils/constants";

// Biến global để theo dõi trạng thái khởi tạo của Keycloak
let keycloakInitialized = false;

// Khởi tạo instance Keycloak trước khi sử dụng
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: KEYCLOAK_REALM,
  clientId: KEYCLOAK_CLIENT_ID,
});

/**
 * Initialize Keycloak instance with silent check
 * @returns {Promise} Promise resolving with Keycloak initialization status
 */
const initKeycloak = () => {
  // Nếu đã khởi tạo, trả về promise với trạng thái hiện tại
  if (keycloakInitialized) {
    return Promise.resolve({
      authenticated: !!keycloak.authenticated,
    });
  }

  return new Promise((resolve, reject) => {
    keycloak
      .init({
        onLoad: "check-sso", // Don't redirect if not authenticated
        silentCheckSsoRedirectUri:
          window.location.origin + "/silent-check-sso.html",
        checkLoginIframe: false, // Disable login iframe check as it can cause issues
        pkceMethod: "S256",
        enableLogging: true,
      })
      .then((authenticated) => {
        // Đánh dấu là đã khởi tạo
        keycloakInitialized = true;
        
        // Thiết lập token refresh
        setupTokenRefresh();
        
        // Đăng ký sự kiện khi token được cập nhật
        keycloak.onTokenExpired = () => {
          console.log('Token expired, refreshing...');
          keycloak.updateToken(70);
        };
        
        resolve({ authenticated });
      })
      .catch((error) => {
        console.error("Keycloak init error:", error);
        
        // Ngay cả khi có lỗi, vẫn đánh dấu là đã thử khởi tạo
        // để tránh khởi tạo lại nhiều lần
        keycloakInitialized = true;
        
        reject(error);
      });
  });
};

/**
 * Setup token refresh mechanism
 */
const setupTokenRefresh = () => {
  // Chỉ thiết lập refresh token nếu đã xác thực
  if (keycloak.authenticated) {
    setInterval(() => {
      keycloak.updateToken(70)
        .then((refreshed) => {
          if (refreshed) {
            console.log('Token was successfully refreshed');
          }
        })
        .catch(() => {
          console.error('Failed to refresh token, logging out...');
          keycloak.logout();
        });
    }, 60000); // Check mỗi phút
  }
};

/**
 * Login with Keycloak
 * @param {Object} options - Login options
 */
const login = (options = {}) => {
  // Mặc định chuyển hướng về trang hiện tại sau khi đăng nhập
  const defaultOptions = {
    redirectUri: window.location.href
  };
  return keycloak.login({...defaultOptions, ...options});
};

/**
 * Logout from Keycloak
 * @param {Object} options - Logout options
 */
const logout = (options = {}) => {
  // Mặc định chuyển hướng về trang chủ sau khi đăng xuất
  const defaultOptions = {
    redirectUri: window.location.origin
  };
  return keycloak.logout({...defaultOptions, ...options});
};

/**
 * Check if the user is authenticated
 * @returns {boolean} Authentication status
 */
const isAuthenticated = () => {
  return !!keycloak.authenticated;
};

/**
 * Refresh the current token
 * @returns {Promise} Promise resolving with token refresh status
 */
const refreshToken = () => {
  return keycloak.updateToken(70);
};

/**
 * Get user information
 * @returns {Object} User info from token
 */
const getUser = () => {
  return keycloak.tokenParsed;
};

/**
 * Get user roles
 * @returns {Array} Array of user roles
 */
const getRoles = () => {
  if (!keycloak.authenticated) return [];

  // For realm roles
  const realmRoles = keycloak.tokenParsed.realm_access?.roles || [];

  // For client roles
  const clientId = KEYCLOAK_CLIENT_ID;
  const clientRoles =
    keycloak.tokenParsed.resource_access?.[clientId]?.roles || [];

  return [...realmRoles, ...clientRoles];
};

/**
 * Get user roles as object for easy checking
 * @returns {Object} { realm: [], client: [] }
 */
const getUserRoles = () => {
  if (!keycloak.authenticated) return { realm: [], client: [] };
  const realm = keycloak.tokenParsed.realm_access?.roles || [];
  const clientId = KEYCLOAK_CLIENT_ID;
  const client = keycloak.tokenParsed.resource_access?.[clientId]?.roles || [];
  return { realm, client };
};

/**
 * Check if user has a specific role
 * @param {string} role - Role to check
 * @returns {boolean} Whether user has the role
 */
const hasRole = (role) => {
  const roles = getRoles();
  return roles.includes(role);
};

/**
 * Get authentication token
 * @returns {string} JWT token
 */
const getToken = () => {
  return keycloak.token;
};

// Helper functions để kiểm tra role cụ thể
const isAdmin = () => hasRole('ADMIN');
const isEditor = () => hasRole('EDITOR');
const isModerator = () => hasRole('MODERATOR');
const isUser = () => hasRole('USER');

export {
  initKeycloak,
  login,
  logout,
  isAuthenticated,
  getUser,
  getRoles,
  hasRole,
  getToken,
  getUserRoles,
  refreshToken,
  isAdmin,
  isEditor,
  isModerator,
  isUser,
};

export default keycloak;
