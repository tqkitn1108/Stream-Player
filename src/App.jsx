import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Home from "./components/Home";
import Live from "./components/Live";
import Videos from "./components/Videos";
import VideoPlayer from "./components/VideoPlayer";
import Schedule from "./components/Schedule";
import AdManagement from "./components/AdManagement";
import VideoManagement from "./components/VideoManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import useKeycloakAuth from "./hooks/useKeycloakAuth";
import setupAxiosInterceptors from "./services/axiosConfig";

function App() {
  const { initialized, authenticated, loading, error } = useKeycloakAuth();

  // Thiết lập axios interceptors khi app load
  useEffect(() => {
    setupAxiosInterceptors();
  }, []);

  // Hiển thị màn hình loading khi đang khởi tạo Keycloak
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <h2 className="text-xl text-white font-semibold">Đang tải...</h2>
          <p className="text-gray-400 mt-2">Đang khởi tạo hệ thống xác thực</p>
        </div>
      </div>
    );
  }

  // Hiển thị lỗi nếu có
  if (error && !initialized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl text-white font-semibold mb-2">
            Lỗi khởi tạo
          </h2>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/live" element={<Live />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/video/:videoId" element={<VideoPlayer />} />
        <Route path="/live/:channelId" element={<VideoPlayer />} />

        {/* Route bảo vệ - chỉ ADMIN và EDITOR mới truy cập được (bỏ route upload) */}
        <Route
          path="/schedule"
          element={
            <ProtectedRoute requiredRoles={["ADMIN", "EDITOR"]}>
              <Schedule />
            </ProtectedRoute>
          }
        />

        {/* Route quản lý kho nội dung - chỉ ADMIN và EDITOR mới truy cập được */}
        <Route
          path="/video-management"
          element={
            <ProtectedRoute requiredRoles={["ADMIN", "EDITOR"]}>
              <VideoManagement />
            </ProtectedRoute>
          }
        />

        {/* Route quản lý quảng cáo - ADMIN, MODERATOR và EDITOR đều có thể truy cập (EDITOR upload, MODERATOR xét duyệt) */}
        <Route
          path="/ads"
          element={
            <ProtectedRoute requiredRoles={["ADMIN", "MODERATOR", "EDITOR"]}>
              <AdManagement />
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
