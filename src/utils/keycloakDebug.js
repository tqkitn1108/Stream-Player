import { isAuthenticated, getToken, getUser, getRoles } from '../services/keycloak';
import { getCurrentEnvironment, getCurrentConfig } from './envConfig';

/**
 * Debug utilities cho Keycloak
 * Giúp troubleshoot các vấn đề về authentication
 */

/**
 * Log thông tin debug về Keycloak
 */
export const logKeycloakDebugInfo = () => {
  const env = getCurrentEnvironment();
  const config = getCurrentConfig();
  const authenticated = isAuthenticated();
  
  console.group('🔐 Keycloak Debug Info');
  console.log('Environment:', env);
  console.log('Config:', config);
  console.log('Current URL:', window.location.href);
  console.log('Origin:', window.location.origin);
  console.log('Hostname:', window.location.hostname);
  console.log('Authenticated:', authenticated);
  
  if (authenticated) {
    const token = getToken();
    const user = getUser();
    const roles = getRoles();
    
    console.log('User:', user);
    console.log('Roles:', roles);
    console.log('Token (first 50 chars):', token ? token.substring(0, 50) + '...' : 'No token');
    
    // Token expiry check
    if (user && user.exp) {
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = user.exp - now;
      console.log('Token expires in:', timeUntilExpiry, 'seconds');
      console.log('Token expired:', timeUntilExpiry <= 0);
    }
  }
  
  console.groupEnd();
};

/**
 * Kiểm tra localStorage và sessionStorage để debug
 */
export const logStorageDebugInfo = () => {
  console.group('💾 Storage Debug Info');
  
  // Check localStorage for Keycloak data
  const localStorageKeys = Object.keys(localStorage).filter(key => 
    key.includes('keycloak') || key.includes('kc-') || key.includes('auth')
  );
  
  console.log('LocalStorage Keycloak keys:', localStorageKeys);
  localStorageKeys.forEach(key => {
    console.log(`${key}:`, localStorage.getItem(key));
  });
  
  // Check sessionStorage for Keycloak data
  const sessionStorageKeys = Object.keys(sessionStorage).filter(key => 
    key.includes('keycloak') || key.includes('kc-') || key.includes('auth')
  );
  
  console.log('SessionStorage Keycloak keys:', sessionStorageKeys);
  sessionStorageKeys.forEach(key => {
    console.log(`${key}:`, sessionStorage.getItem(key));
  });
  
  console.groupEnd();
};

/**
 * Debug function toàn diện
 */
export const debugKeycloak = () => {
  console.log('🚀 Starting Keycloak debug...');
  logKeycloakDebugInfo();
  logStorageDebugInfo();
  
  // Add to window for easy access in browser console
  window.keycloakDebug = {
    logKeycloakDebugInfo,
    logStorageDebugInfo,
    debugKeycloak
  };
  
  console.log('💡 Debug functions added to window.keycloakDebug');
};
