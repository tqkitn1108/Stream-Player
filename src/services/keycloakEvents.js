import keycloak, { getUser, isAuthenticated } from './keycloak';

/**
 * Keycloak event listeners
 * Quản lý các sự kiện của Keycloak để cập nhật UI
 */
const setupKeycloakListeners = () => {
  if (!keycloak) return;

  // Sự kiện khi đăng nhập thành công
  keycloak.onAuthSuccess = () => {
    console.log('Đăng nhập thành công!');
    const user = getUser();
    console.log('User info:', user);
    
    // Dispatch event để các component khác biết có người dùng đăng nhập
    const event = new CustomEvent('keycloak-auth-success', { 
      detail: { user } 
    });
    window.dispatchEvent(event);

    // Kiểm tra xem có URL redirect lưu trữ không
    const redirectUri = sessionStorage.getItem('redirectUri');
    if (redirectUri) {
      sessionStorage.removeItem('redirectUri');
      // Nếu đang ở trang chủ và có URL redirect, thực hiện chuyển hướng
      if (window.location.pathname === '/') {
        window.location.href = redirectUri;
      }
    }
  };

  // Sự kiện khi đăng xuất
  keycloak.onAuthLogout = () => {
    console.log('Đã đăng xuất!');
    
    // Dispatch event để các component khác biết người dùng đã đăng xuất
    const event = new CustomEvent('keycloak-auth-logout');
    window.dispatchEvent(event);
  };

  // Sự kiện khi token hết hạn
  keycloak.onTokenExpired = () => {
    console.log('Token hết hạn, đang làm mới...');
    
    keycloak.updateToken(70)
      .then((refreshed) => {
        if (refreshed) {
          console.log('Token được làm mới thành công');
          
          // Dispatch event khi token được làm mới
          const event = new CustomEvent('keycloak-token-refreshed');
          window.dispatchEvent(event);
        }
      })
      .catch((error) => {
        console.error('Không thể làm mới token:', error);
        // Có thể đăng xuất hoặc hiển thị thông báo
      });
  };

  // Sự kiện khi xảy ra lỗi
  keycloak.onAuthError = (error) => {
    console.error('Lỗi xác thực:', error);
  };
};

export default setupKeycloakListeners;
