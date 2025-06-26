import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { 
  isAuthenticated, 
  hasRole, 
  login, 
  initKeycloak, 
  isKeycloakInitialized,
  waitForKeycloakInit 
} from '../services/keycloak';

/**
 * Component bảo vệ route, kiểm tra người dùng đã đăng nhập và có quyền truy cập hay không
 * @param {Object} props - Props của component
 * @param {React.ReactNode} props.children - Children elements sẽ render nếu đủ quyền
 * @param {string[]} props.requiredRoles - Các role yêu cầu để truy cập (ít nhất 1)
 * @returns {React.ReactNode}
 */
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Kiểm tra trạng thái đăng nhập và quyền truy cập
    const checkAuth = async () => {
      try {
        console.log('ProtectedRoute: Checking auth for path:', location.pathname);
        
        // Đảm bảo Keycloak đã được khởi tạo
        if (!isKeycloakInitialized()) {
          console.log('ProtectedRoute: Keycloak not initialized, initializing...');
          await initKeycloak();
        } else {
          // Đợi cho Keycloak hoàn thành khởi tạo
          await waitForKeycloakInit();
        }
        
        const authenticated = isAuthenticated();
        console.log('ProtectedRoute: Authentication status:', authenticated);
        
        if (!authenticated) {
          console.log('ProtectedRoute: User not authenticated, redirecting to login');
          // Lưu lại URL hiện tại để sau khi đăng nhập quay lại
          sessionStorage.setItem('redirectUri', location.pathname);
          
          // Delay một chút trước khi chuyển hướng để tránh lỗi
          setTimeout(() => {
            login({ redirectUri: window.location.origin + location.pathname });
          }, 300);
          
          setChecking(false);
          return;
        }
        
        // Kiểm tra quyền
        const hasRequiredRole = requiredRoles.length === 0 || 
                               requiredRoles.some(role => hasRole(role));
        
        console.log('ProtectedRoute: Role check result:', {
          requiredRoles,
          hasRequiredRole,
          userRoles: requiredRoles.length > 0 ? 'checking roles...' : 'no roles required'
        });
        
        setHasAccess(hasRequiredRole);
        setChecking(false);
      } catch (error) {
        console.error('ProtectedRoute: Error during auth check:', error);
        setError(error.message);
        setChecking(false);
        
        // Nếu có lỗi trong quá trình khởi tạo, thử redirect về login
        setTimeout(() => {
          login({ redirectUri: window.location.origin + location.pathname });
        }, 1000);
      }
    };
    
    checkAuth();
  }, [location, requiredRoles]);
  
  // Đang kiểm tra trạng thái
  if (checking) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold">Đang kiểm tra quyền truy cập...</h2>
        <p className="text-gray-400 mt-2">Vui lòng đợi...</p>
        {error && (
          <div className="mt-4 p-3 bg-red-800 text-red-200 rounded">
            <p className="text-sm">Lỗi: {error}</p>
            <p className="text-xs mt-1">Đang thử kết nối lại...</p>
          </div>
        )}
      </div>
    </div>;
  }

  // Nếu không có quyền
  if (!hasAccess) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="text-center bg-gray-800 p-8 rounded-lg shadow-lg max-w-md">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-2xl font-bold mb-4">Truy cập bị từ chối</h2>
        <p className="text-gray-300 mb-6">
          Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là sai sót.
        </p>
        <a 
          href="/" 
          className="inline-block px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
        >
          Quay lại trang chủ
        </a>
      </div>
    </div>;
  }

  // Nếu đã đăng nhập và có quyền, render children
  return children;
};

export default ProtectedRoute;
