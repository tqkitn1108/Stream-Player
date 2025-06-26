import Keycloak from "keycloak-js";
import { KEYCLOAK_CLIENT_ID, KEYCLOAK_REALM } from "../utils/constants";
import { 
  shouldUseSilentCheckSso, 
  shouldEnableIframeCheck, 
  shouldEnableLogging,
  getRedirectUriBase,
  getCurrentEnvironment 
} from "../utils/envConfig";

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
    // Lấy cấu hình cho môi trường hiện tại
    const currentEnv = getCurrentEnvironment();
    const useSilentCheckSso = shouldUseSilentCheckSso();
    const enableIframeCheck = shouldEnableIframeCheck();
    const enableLogging = shouldEnableLogging();
    const redirectUriBase = getRedirectUriBase();
    
    console.log(`Initializing Keycloak for environment: ${currentEnv}`);
    console.log('Current URL:', window.location.href);
    console.log('Environment config:', { 
      useSilentCheckSso, 
      enableIframeCheck, 
      enableLogging,
      redirectUriBase,
      currentOrigin: window.location.origin 
    });

    let initConfig = {
      onLoad: "check-sso",
      checkLoginIframe: enableIframeCheck,
      pkceMethod: "S256",
      enableLogging: enableLogging,
      // Đảm bảo redirect về đúng trang sau khi login
      redirectUri: window.location.origin + window.location.pathname + window.location.search,
    };

    // Chỉ thêm silentCheckSsoRedirectUri nếu môi trường hỗ trợ
    if (useSilentCheckSso) {
      initConfig.silentCheckSsoRedirectUri = redirectUriBase + "/silent-check-sso.html";
      console.log('Using silent check SSO with URI:', initConfig.silentCheckSsoRedirectUri);
    }

    console.log('Final Keycloak init config:', initConfig);

    keycloak
      .init(initConfig)
      .then((authenticated) => {
        console.log('Keycloak initialization result:', { 
          authenticated, 
          currentUrl: window.location.href,
          token: authenticated ? 'Present' : 'None'
        });
        
        // Đánh dấu là đã khởi tạo
        keycloakInitialized = true;
        
        // Thiết lập token refresh nếu đã authenticated
        if (authenticated) {
          setupTokenRefresh();
          console.log('User authenticated, roles:', getRoles());
        } else {
          console.log('User not authenticated');
        }
        
        // Đăng ký sự kiện khi token được cập nhật
        keycloak.onTokenExpired = () => {
          console.log('Token expired, refreshing...');
          keycloak.updateToken(70).catch(() => {
            console.error('Failed to refresh expired token');
            // Logout nếu không thể refresh token
            logout();
          });
        };
        
        resolve({ authenticated });
      })
      .catch((error) => {
        console.error("Keycloak init error:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          currentUrl: window.location.href
        });
        
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
    console.log('Setting up token refresh mechanism');
    setInterval(() => {
      keycloak.updateToken(70)
        .then((refreshed) => {
          if (refreshed) {
            console.log('Token was successfully refreshed');
          }
        })
        .catch((error) => {
          console.error('Failed to refresh token:', error);
          console.log('Logging out due to token refresh failure...');
          logout();
        });
    }, 60000); // Check mỗi phút
  }
};

/**
 * Reset Keycloak initialization state
 * Useful for development or when switching environments
 */
const resetKeycloakState = () => {
  keycloakInitialized = false;
  console.log('Keycloak state has been reset');
};

/**
 * Check if Keycloak is initialized
 * @returns {boolean} Initialization status
 */
const isKeycloakInitialized = () => {
  return keycloakInitialized;
};

/**
 * Wait for Keycloak to be initialized
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 * @returns {Promise} Promise resolving when Keycloak is initialized
 */
const waitForKeycloakInit = (timeout = 10000) => {
  return new Promise((resolve, reject) => {
    if (keycloakInitialized) {
      resolve({ authenticated: !!keycloak.authenticated });
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (keycloakInitialized) {
        clearInterval(checkInterval);
        resolve({ authenticated: !!keycloak.authenticated });
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(new Error('Keycloak initialization timeout'));
      }
    }, 100);
  });
};

/**
 * Force reinitialize Keycloak
 * Use this when you need to reinitialize Keycloak (e.g., after configuration changes)
 */
const forceReinitKeycloak = () => {
  keycloakInitialized = false;
  return initKeycloak();
};

/**
 * Login with Keycloak
 * @param {Object} options - Login options
 */
const login = (options = {}) => {
  const redirectUriBase = getRedirectUriBase();
  const defaultOptions = {
    redirectUri: redirectUriBase + window.location.pathname + window.location.search
  };
  console.log('Login redirect URI:', defaultOptions.redirectUri);
  return keycloak.login({...defaultOptions, ...options});
};

/**
 * Logout from Keycloak
 * @param {Object} options - Logout options
 */
const logout = (options = {}) => {
  const redirectUriBase = getRedirectUriBase();
  const defaultOptions = {
    redirectUri: redirectUriBase
  };
  console.log('Logout redirect URI:', defaultOptions.redirectUri);
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
  resetKeycloakState,
  isKeycloakInitialized,
  waitForKeycloakInit,
  forceReinitKeycloak,
  isAdmin,
  isEditor,
  isModerator,
  isUser,
};

export default keycloak;
