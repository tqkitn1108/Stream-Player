import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaUserCircle, FaSearch, FaCalendarAlt, FaHome, FaFilm, FaStream, FaUpload, FaSignOutAlt, FaAd } from "react-icons/fa";
import { login, logout, isAuthenticated, getUser, hasRole } from "../services/keycloak";

function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  // Kiểm tra người dùng có quyền ADMIN hoặc EDITOR
  const [isAdminOrEditor, setIsAdminOrEditor] = useState(
    hasRole('ADMIN') || hasRole('EDITOR')
  );
  
  // Kiểm tra người dùng có quyền ADMIN hoặc MODERATOR
  const [isAdminOrModerator, setIsAdminOrModerator] = useState(
    hasRole('ADMIN') || hasRole('MODERATOR')
  );

  // Cập nhật thông tin user khi component mount và khi trạng thái xác thực thay đổi
  useEffect(() => {
    const updateUserInfo = () => {
      const isAuth = isAuthenticated();
      setAuthenticated(isAuth);
        if (isAuth) {
        setUser(getUser());
        setIsAdminOrEditor(hasRole('ADMIN') || hasRole('EDITOR'));
        setIsAdminOrModerator(hasRole('ADMIN') || hasRole('MODERATOR'));
      } else {
        setUser(null);
        setIsAdminOrEditor(false);
        setIsAdminOrModerator(false);
      }
    };

    // Gọi ngay lập tức
    updateUserInfo();

    // Thêm event listeners
    const authSuccessHandler = () => {
      console.log("Navbar: Auth success event");
      updateUserInfo();
    };

    const authLogoutHandler = () => {
      console.log("Navbar: Auth logout event");
      updateUserInfo();
    };

    // Đăng ký lắng nghe sự kiện
    window.addEventListener('keycloak-auth-success', authSuccessHandler);
    window.addEventListener('keycloak-auth-logout', authLogoutHandler);

    // Cleanup
    return () => {
      window.removeEventListener('keycloak-auth-success', authSuccessHandler);
      window.removeEventListener('keycloak-auth-logout', authLogoutHandler);
    };
  }, []);

  // Xử lý hiệu ứng scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogin = () => {
    login({ redirectUri: window.location.origin + location.pathname });
  };

  const handleLogout = () => {
    logout({ redirectUri: window.location.origin });
    setUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-gray-900 shadow-lg' : 'bg-gradient-to-b from-gray-900 to-transparent'}`}>
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-transparent bg-clip-text">TVNext</span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`flex items-center space-x-1 text-sm font-medium transition-colors ${isActive('/') ? 'text-indigo-400 border-b-2 border-indigo-400 pb-1' : 'text-gray-300 hover:text-white'}`}
            >
              <FaHome className="text-lg" />
              <span>Trang chủ</span>
            </Link>
            <Link
              to="/live"
              className={`flex items-center space-x-1 text-sm font-medium transition-colors ${isActive('/live') ? 'text-indigo-400 border-b-2 border-indigo-400 pb-1' : 'text-gray-300 hover:text-white'}`}
            >
              <FaStream className="text-lg" />
              <span>Kênh Live</span>
            </Link>
            <Link
              to="/videos"
              className={`flex items-center space-x-1 text-sm font-medium transition-colors ${isActive('/videos') ? 'text-indigo-400 border-b-2 border-indigo-400 pb-1' : 'text-gray-300 hover:text-white'}`}
            >
              <FaFilm className="text-lg" />
              <span>Videos</span>
            </Link>
            
            {/* Chỉ hiển thị menu Lịch phát sóng và Upload Video khi là ADMIN hoặc EDITOR */}
            {isAdminOrEditor && (
              <>
                <Link
                  to="/schedule"
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${isActive('/schedule') ? 'text-indigo-400 border-b-2 border-indigo-400 pb-1' : 'text-gray-300 hover:text-white'}`}
                >
                  <FaCalendarAlt className="text-lg" />
                  <span>Lịch phát sóng</span>
                </Link>                <Link
                  to="/upload"
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${isActive('/upload') ? 'text-indigo-400 border-b-2 border-indigo-400 pb-1' : 'text-gray-300 hover:text-white'}`}
                >
                  <FaUpload className="text-lg" />
                  <span>Upload Video</span>
                </Link>
              </>
            )}
            
            {/* Chỉ hiển thị menu Quản lý quảng cáo khi là ADMIN hoặc MODERATOR */}
            {isAdminOrModerator && (
              <Link
                to="/ads"
                className={`flex items-center space-x-1 text-sm font-medium transition-colors ${isActive('/ads') ? 'text-indigo-400 border-b-2 border-indigo-400 pb-1' : 'text-gray-300 hover:text-white'}`}
              >
                <FaAd className="text-lg" />
                <span>Quản lý quảng cáo</span>
              </Link>
            )}
          </div>

          {/* Search and User */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex relative">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="bg-gray-800 text-white text-sm rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-56"
              />
              <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
            </div>
            {/* User section - show login button or user dropdown */}
            {authenticated ? (
              <div className="relative user-menu-container">
                <div 
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={toggleUserMenu}
                  onMouseEnter={() => setUserMenuOpen(true)}
                >
                  <FaUserCircle className="text-2xl text-gray-300 hover:text-white transition" />
                </div>
                {userMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-gray-700">
                      <p className="text-sm font-medium text-white">{user?.preferred_username || user?.name || 'Người dùng'}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <FaSignOutAlt className="mr-2" /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="text-sm font-medium px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white transition-colors cursor-pointer"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;