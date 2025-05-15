import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaUserCircle, FaSearch, FaCalendarAlt, FaHome, FaFilm, FaStream, FaUpload } from "react-icons/fa";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  
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

  // Kiểm tra đường dẫn hiện tại để highlight menu item
  const isActive = (path) => {
    return location.pathname === path;
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
            <Link
              to="/schedule"
              className={`flex items-center space-x-1 text-sm font-medium transition-colors ${isActive('/schedule') ? 'text-indigo-400 border-b-2 border-indigo-400 pb-1' : 'text-gray-300 hover:text-white'}`}
            >
              <FaCalendarAlt className="text-lg" />
              <span>Lịch phát sóng</span>
            </Link>
            <Link
              to="/upload"
              className={`flex items-center space-x-1 text-sm font-medium transition-colors ${isActive('/upload') ? 'text-indigo-400 border-b-2 border-indigo-400 pb-1' : 'text-gray-300 hover:text-white'}`}
            >
              <FaUpload className="text-lg" />
              <span>Upload Video</span>
            </Link>
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
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate("/login")}
                className="text-sm text-gray-300 hover:text-white transition"
              >
                Đăng nhập
              </button>
              <FaUserCircle className="text-2xl text-gray-300 hover:text-white cursor-pointer transition" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;