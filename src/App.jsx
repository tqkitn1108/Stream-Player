import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Home from "./components/Home";
import VideoPlayer from "./components/VideoPlayer";
import VideoUpload from "./components/VideoUpload";
import Schedule from "./components/Schedule";
import ProtectedRoute from "./components/ProtectedRoute";
import { initKeycloak, isAuthenticated } from "./services/keycloak";

function App() {
  const [keycloakReady, setKeycloakReady] = useState(false);
  const [loading, setLoading] = useState(true);

  // Khởi tạo Keycloak khi app load
  useEffect(() => {
    // Tạo biến để theo dõi xem component có bị unmount không
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { authenticated } = await initKeycloak();
        console.log("Keycloak initialized, user authenticated:", authenticated);
        
        // Chỉ cập nhật state nếu component vẫn mounted
        if (isMounted) {
          setKeycloakReady(true);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to initialize keycloak:", error);
        
        // Ngay cả khi có lỗi vẫn render UI
        if (isMounted) {
          setKeycloakReady(true);
          setLoading(false);
        }
      }
    };

    initAuth();

    // Cleanup function để tránh memory leak
    return () => {
      isMounted = false;
    };
  }, []);

  // Hiển thị màn hình loading khi đang khởi tạo Keycloak
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <h2 className="text-xl text-white font-semibold">Đang tải...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/video/:videoId" element={<VideoPlayer />} />
        <Route path="/live/:channelId" element={<VideoPlayer />} />
        
        {/* Route bảo vệ - chỉ ADMIN và EDITOR mới truy cập được */}
        <Route 
          path="/upload" 
          element={
            <ProtectedRoute requiredRoles={['ADMIN', 'EDITOR']}>
              <VideoUpload />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/schedule" 
          element={
            <ProtectedRoute requiredRoles={['ADMIN', 'EDITOR']}>
              <Schedule />
            </ProtectedRoute>
          } 
        />
        
        {/* Route mặc định - redirect về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
