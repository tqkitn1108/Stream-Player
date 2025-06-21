import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import axios from "axios";
import {
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaEye,
  FaCheck,
  FaTimes,
  FaPlay,
  FaClock,
  FaUpload,
  FaSearch,
  FaFilter,
} from "react-icons/fa";
import VideoUploadModal from "./VideoUploadModal";
import VideoEditModal from "./VideoEditModal";
import ThumbnailImage from "./ThumbnailImage";
import keycloak from "../services/keycloak";
import dayjs from "dayjs";

const API_BASE_URL =
  `${import.meta.env.VITE_BACKEND_URL}/api/v1` ||
  "http://34.126.102.97:8080/api/v1";

function VideoManagement() {
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, verified, pending
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    fetchVideos();
    fetchCategories();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/videos`);
      if (response.data.code === 200) {
        setVideos(response.data.data || []);
      } else {
        setError(response.data.message || "Không thể tải danh sách video");
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
      setError("Lỗi khi tải dữ liệu: " + (error.message || "Không xác định"));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/videos/category`);
      if (response.data.code === 200) {
        setCategories(response.data.data || []);
      } else {
        console.error("Error fetching categories:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Kiểm tra quyền của user
  const hasRole = (role) => {
    try {
      return keycloak.hasRealmRole(role) || keycloak.hasResourceRole(role);
    } catch (error) {
      console.error("Error checking role:", error);
      return false;
    }
  };

  const canEdit = () => hasRole("ADMIN") || hasRole("EDITOR");
  const canModerate = () => hasRole("ADMIN") || hasRole("MODERATOR");
  const handleUpload = async (videoData) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/videos`, videoData);
      if (response.data.code === 201) {
        setVideos([...videos, response.data.data]);
        setIsUploadModalOpen(false);
        alert("Thêm video thành công! Video đang chờ được duyệt.");
      } else {
        throw new Error(response.data.message || "Không thể thêm video");
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      alert("Lỗi khi thêm video: " + (error.message || "Không xác định"));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (videoData) => {
    try {
      setLoading(true);
      const response = await axios.put(
        `${API_BASE_URL}/videos/${currentVideo.id}`,
        videoData
      );
      if (response.data.code === 200) {
        setVideos(
          videos.map((video) =>
            video.id === currentVideo.id ? response.data.data : video
          )
        );
        setIsEditModalOpen(false);
        setCurrentVideo(null);
        alert("Cập nhật video thành công!");
      } else {
        throw new Error(response.data.message || "Không thể cập nhật video");
      }
    } catch (error) {
      console.error("Error updating video:", error);
      alert("Lỗi khi cập nhật video: " + (error.message || "Không xác định"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId) => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn xóa video này? Hành động này không thể hoàn tác."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(`${API_BASE_URL}/videos/${videoId}`);
      if (response.data.code === 200) {
        setVideos(videos.filter((video) => video.id !== videoId));
        alert("Xóa video thành công!");
      } else {
        throw new Error(response.data.message || "Không thể xóa video");
      }
    } catch (error) {
      console.error("Error deleting video:", error);
      alert("Lỗi khi xóa video: " + (error.message || "Không xác định"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (videoId, verifyStatus) => {
    try {
      setLoading(true);
      const video = videos.find((v) => v.id === videoId);
      const updatedVideo = { ...video, verifyStatus };

      const response = await axios.put(
        `${API_BASE_URL}/videos/${videoId}`,
        updatedVideo
      );
      if (response.data.code === 200) {
        setVideos(
          videos.map((video) =>
            video.id === videoId ? response.data.data : video
          )
        );
        const statusText = verifyStatus ? "duyệt" : "từ chối";
        alert(`Đã ${statusText} video thành công!`);
      } else {
        throw new Error(response.data.message || "Không thể cập nhật video");
      }
    } catch (error) {
      console.error("Error verifying video:", error);
      alert("Lỗi khi duyệt video: " + (error.message || "Không xác định"));
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (video) => {
    setCurrentVideo(video);
    setIsEditModalOpen(true);
  };
  // Filter videos based on search, status, and category
  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.title
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "verified" && video.verifyStatus === true) ||
      (filterStatus === "pending" && video.verifyStatus === false);
    const matchesCategory =
      filterCategory === "all" || video.categoryId === parseInt(filterCategory);
    return matchesSearch && matchesFilter && matchesCategory;
  });

  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-gray-900 min-h-screen">
      <Navbar />
      <div className="container mx-auto p-4 pt-24">
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white flex items-center">
              <FaPlay className="mr-3 text-indigo-400" />
              Quản lý kho nội dung
            </h1>
            {canEdit() && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                disabled={loading}
              >
                <FaUpload className="mr-2" />
                Thêm video mới
              </button>
            )}
          </div>
          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-2">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm video..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <div className="relative">
                <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="verified">Đã duyệt</option>
                  <option value="pending">Chờ duyệt</option>
                </select>
              </div>
            </div>
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                <option value="all">Tất cả danh mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && (
            <div className="mb-4 p-3 bg-red-800 bg-opacity-50 text-red-100 rounded-lg">
              {error}
            </div>
          )}
          {/* Videos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-full flex justify-center items-center py-12">
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang tải...
                </div>
              </div>
            ) : filteredVideos.length > 0 ? (
              filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-gray-700 rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105 flex flex-col"
                >
                  <div className="relative bg-gray-600 flex-shrink-0 h-40">
                    <ThumbnailImage
                      videoUrl={video.inputUrl || video.url}
                      thumbnailUrl={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded flex items-center">
                      <FaClock className="mr-1" />
                      {formatDuration(video.duration)}
                    </div>
                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      {video.verifyStatus ? (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded flex items-center">
                          <FaCheck className="mr-1" />
                          Đã duyệt
                        </span>
                      ) : (
                        <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded">
                          Chờ duyệt
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-4 flex flex-col h-full">
                    <div className="flex-grow">
                      <h3 className="font-medium text-white mb-2 line-clamp-2 leading-relaxed">
                        {video.title}
                      </h3>
                      {video.description && (
                        <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                          {video.description}
                        </p>
                      )}
                      {/* Metadata */}
                      <div className="text-xs text-gray-400 mb-3 space-y-1">
                        {video.categoryId && (
                          <div>
                            Danh mục: {categories.find(
                              (cat) => cat.id === video.categoryId
                            )?.name || "N/A"}
                          </div>
                        )}
                        {video.createdAt && (
                          <div>
                            Tạo: {dayjs(video.createdAt).format("DD/MM/YYYY HH:mm")}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions - Fixed at bottom */}
                    <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-600">
                      <div className="flex space-x-2">
                        {canEdit() && (
                          <button
                            onClick={() => openEditModal(video)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-600 rounded transition"
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                          </button>
                        )}
                        {canEdit() && (
                          <button
                            onClick={() => handleDelete(video.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-600 rounded transition"
                            title="Xóa"
                            disabled={loading}
                          >
                            <FaTrashAlt />
                          </button>
                        )}
                      </div>

                      {/* Moderation Actions */}
                      {canModerate() && !video.verifyStatus && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleVerify(video.id, true)}
                            className="p-2 text-green-400 hover:text-green-300 hover:bg-gray-600 rounded transition"
                            title="Duyệt"
                            disabled={loading}
                          >
                            <FaCheck />
                          </button>
                          <button
                            onClick={() => handleVerify(video.id, false)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-600 rounded transition"
                            title="Từ chối"
                            disabled={loading}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400">
                  {searchTerm || filterStatus !== "all"
                    ? "Không tìm thấy video nào phù hợp"
                    : "Chưa có video nào"}
                </div>
              </div>
            )}
          </div>
          {/* Summary */}
          <div className="mt-6 text-sm text-gray-400 text-center">
            Hiển thị {filteredVideos.length} / {videos.length} video
          </div>
        </div>
      </div>
      {/* Upload Modal */}
      <VideoUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSubmit={handleUpload}
        categories={categories}
      />
      {/* Edit Modal */}
      <VideoEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setCurrentVideo(null);
        }}
        onSubmit={handleEdit}
        video={currentVideo}
        categories={categories}
      />
    </div>
  );
}

export default VideoManagement;
