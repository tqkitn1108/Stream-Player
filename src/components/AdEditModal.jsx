import React, { useState, useRef, useEffect } from "react";
import { FaSave, FaTimes, FaSpinner, FaPlay, FaUpload } from "react-icons/fa";
import axios from "axios";

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/v1` || "http://localhost:8080/api/v1";

function AdEditModal({ ad, onClose, onSave, categories }) {const [formData, setFormData] = useState({
    id: ad.id,
    title: ad.title,
    description: ad.description,
    categoryId: ad.categoryId,
    duration: ad.duration,
    videoUrl: ad.videoUrl,
    status: ad.status,
    rejectionReason: ad.rejectionReason || "",
  });
  
  const [videoFile, setVideoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(ad.videoUrl || "");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const videoRef = useRef(null);  useEffect(() => {
    // Reset form when ad changes
    setFormData({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      categoryId: ad.categoryId,
      duration: ad.duration,
      videoUrl: ad.videoUrl,
      status: ad.status,
      rejectionReason: ad.rejectionReason || "",
    });
    setPreviewUrl(ad.videoUrl || "");
    setVideoFile(null);
    setErrors({});
    setShowVideoPlayer(false);
  }, [ad]);
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Tiêu đề là bắt buộc";
    if (!formData.description.trim()) newErrors.description = "Mô tả là bắt buộc";
    if (!formData.categoryId) newErrors.categoryId = "Vui lòng chọn thể loại";
    if (!previewUrl && !videoFile) newErrors.video = "Cần có video quảng cáo";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "categoryId" ? parseInt(value) : value,
    });
  };  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);

      // Create a temporary video element to get the duration
      const tempVideo = document.createElement('video');
      tempVideo.src = fileUrl;
      
      // Set video duration after metadata is loaded
      tempVideo.onloadedmetadata = () => {
        setFormData({
          ...formData,
          duration: Math.round(tempVideo.duration),
        });
      };
    }
  };const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (videoFile) {
        // If a new video file was selected, upload it
        const uploadFormData = new FormData();
        uploadFormData.append('file', videoFile);
        uploadFormData.append('filename', videoFile.name);
        uploadFormData.append('categoryId', formData.categoryId);
        uploadFormData.append('title', formData.title);
        uploadFormData.append('duration', formData.duration);
        uploadFormData.append('description', formData.description);
        uploadFormData.append('fileSize', videoFile.size);
        uploadFormData.append('adId', ad.id); // Include ad ID for update
        
        console.log("Uploading updated video...");        setUploadProgress(10);
          const uploadResponse = await axios.put(
          `${API_BASE_URL}/ads/${ad.id}`, 
          uploadFormData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round((progressEvent.loaded * 80) / progressEvent.total) + 10;
              setUploadProgress(progress);
            }
          }
        );
        
        if (!uploadResponse.data || uploadResponse.data.code !== 200) {
          throw new Error("Failed to upload updated ad");
        }
        
        setUploadProgress(100);
        onSave(uploadResponse.data.data);
      } else {
        // If no new video file, just update the metadata        console.log("Updating ad metadata only...");
        setUploadProgress(30);
        
        const updateResponse = await axios.put(`${API_BASE_URL}/ads/${ad.id}`, {
          title: formData.title,
          description: formData.description,
          categoryId: formData.categoryId,
          status: formData.status
        });
        
        if (!updateResponse.data || updateResponse.data.code !== 200) {
          throw new Error("Failed to update ad metadata");
        }
        
        setUploadProgress(100);
        onSave(updateResponse.data.data);
      }
    } catch (error) {
      console.error("Error updating ad:", error);
      alert("Có lỗi xảy ra khi cập nhật quảng cáo. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose} // Close when clicking the backdrop
    >
      <div 
        className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            {ad.status === "pending" ? "Xét duyệt" : "Chỉnh sửa"} quảng cáo
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            disabled={loading}
          >
            <FaTimes size={20} />
          </button>
        </div>

        {ad.status === "rejected" && (
          <div className="mb-4 p-3 bg-red-900 bg-opacity-50 rounded-lg">
            <p className="text-red-300 text-sm font-semibold">
              Quảng cáo này đã bị từ chối với lý do:
            </p>
            <p className="text-white text-sm mt-1">{ad.rejectionReason}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Tiêu đề
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 ${
                  errors.title ? "border border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"
                }`}
                disabled={loading}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Thể loại
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 ${
                  errors.categoryId ? "border border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"
                }`}
                disabled={loading}
              >
                <option value="">Chọn thể loại</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-500">{errors.categoryId}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Mô tả
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className={`w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 ${
                errors.description ? "border border-red-500 focus:ring-red-500" : "focus:ring-indigo-500"
              }`}
              disabled={loading}
            ></textarea>
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Video quảng cáo
              </label>
              {previewUrl && !videoFile ? (
                <div className="border rounded-lg p-4 bg-gray-700">
                  <div className="text-center mb-3">
                    <button
                      type="button"
                      onClick={() => setShowVideoPlayer(!showVideoPlayer)}
                      className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition inline-flex items-center"
                    >
                      <FaPlay className="mr-2" />
                      {showVideoPlayer ? "Ẩn video" : "Xem video"}
                    </button>
                  </div>
                  
                  {showVideoPlayer && (
                    <video 
                      src={previewUrl} 
                      className="w-full rounded"
                      controls
                      ref={videoRef}
                    />
                  )}
                  
                  <div className="mt-2 flex justify-between items-center">
                    <p className="text-gray-300 text-sm">
                      Thời lượng: {formData.duration}s
                    </p>
                    <button
                      type="button"
                      onClick={() => document.getElementById("videoInput").click()}
                      className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-white"
                      disabled={loading}
                    >
                      Thay đổi
                    </button>
                    <input
                      id="videoInput"
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                      disabled={loading}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center relative ${
                    errors.video 
                      ? "border-red-500" 
                      : videoFile 
                      ? "border-green-500" 
                      : "border-gray-600 hover:border-indigo-500"
                  } transition-colors`}
                >
                  {videoFile ? (
                    <div className="space-y-2">
                      <video 
                        ref={videoRef}
                        src={previewUrl} 
                        className="mx-auto max-h-40"
                        controls
                      />
                      <p className="text-gray-300 text-sm truncate">
                        {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </p>
                      <p className="text-gray-400 text-xs">
                        Thời lượng: {formData.duration}s
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FaUpload className="mx-auto text-gray-400 text-3xl" />
                      <p className="text-gray-300">Nhấp để tải lên video mới</p>
                      <p className="text-gray-400 text-xs">
                        MP4, MOV, WebM. Tối đa 100MB
                      </p>
                    </div>
                  )}                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={loading}
                    tabIndex="0"
                    aria-label="Upload new video"
                  />
                </div>
              )}
              {errors.video && (
                <p className="mt-1 text-sm text-red-500">{errors.video}</p>              )}
            </div>

          </div>

          {videoFile && loading && (
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-center text-gray-300 text-sm mt-2">
                {uploadProgress < 100
                  ? `Đang tải lên... ${uploadProgress}%`
                  : "Đang xử lý..."}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdEditModal;
