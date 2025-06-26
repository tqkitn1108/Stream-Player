import { useState, useEffect } from 'react';
import { 
  initKeycloak, 
  isAuthenticated, 
  isKeycloakInitialized,
  waitForKeycloakInit 
} from '../services/keycloak';
import { debugKeycloak } from '../utils/keycloakDebug';

/**
 * Custom hook để quản lý authentication state với Keycloak
 * Xử lý việc khôi phục session sau khi reload trang
 */
const useKeycloakAuth = () => {
  const [authState, setAuthState] = useState({
    initialized: false,
    authenticated: false,
    loading: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log('useKeycloakAuth: Initializing authentication...');
        console.log('useKeycloakAuth: Current URL:', window.location.href);
        console.log('useKeycloakAuth: Keycloak initialized?', isKeycloakInitialized());
        
        let authenticated = false;
        
        // Kiểm tra xem Keycloak đã được khởi tạo chưa
        if (isKeycloakInitialized()) {
          console.log('useKeycloakAuth: Keycloak already initialized, waiting for completion...');
          const result = await waitForKeycloakInit();
          authenticated = result.authenticated;
        } else {
          console.log('useKeycloakAuth: Initializing Keycloak...');
          // Thử khôi phục authentication state từ token đã lưu
          const result = await initKeycloak();
          authenticated = result.authenticated;
        }
        
        if (isMounted) {
          setAuthState({
            initialized: true,
            authenticated,
            loading: false,
            error: null
          });
          
          console.log('useKeycloakAuth: Authentication initialized:', { 
            authenticated, 
            url: window.location.href,
            origin: window.location.origin 
          });
          
          // Enable debug in development
          if (process.env.NODE_ENV === 'development') {
            debugKeycloak();
          }
        }
      } catch (error) {
        console.error('useKeycloakAuth: Authentication initialization failed:', error);
        
        if (isMounted) {
          setAuthState({
            initialized: true,
            authenticated: false,
            loading: false,
            error: error.message
          });
        }
      }
    };

    initializeAuth();

    // Listen for Keycloak auth events
    const handleAuthSuccess = () => {
      console.log('Auth success event received');
      if (isMounted) {
        setAuthState(prev => ({
          ...prev,
          authenticated: true,
          error: null
        }));
      }
    };

    const handleAuthLogout = () => {
      console.log('Auth logout event received');
      if (isMounted) {
        setAuthState(prev => ({
          ...prev,
          authenticated: false
        }));
      }
    };

    // Add event listeners
    window.addEventListener('keycloak-auth-success', handleAuthSuccess);
    window.addEventListener('keycloak-auth-logout', handleAuthLogout);

    return () => {
      isMounted = false;
      window.removeEventListener('keycloak-auth-success', handleAuthSuccess);
      window.removeEventListener('keycloak-auth-logout', handleAuthLogout);
    };
  }, []);

  // Function để refresh authentication state
  const refreshAuthState = () => {
    const currentAuthState = isAuthenticated();
    console.log('Refreshing auth state:', currentAuthState);
    setAuthState(prev => ({
      ...prev,
      authenticated: currentAuthState
    }));
  };

  return {
    ...authState,
    refreshAuthState
  };
};

export default useKeycloakAuth;
