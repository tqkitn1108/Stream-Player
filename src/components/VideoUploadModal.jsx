import React, { useState } from "react";
import { FaUpload, FaLink, FaTimes } from "react-icons/fa";
import { useForm } from "react-hook-form";

function VideoUploadModal({ isOpen, onClose, onSubmit, categories = [] }) {
  if (!isOpen) return null;

  const [uploadType, setUploadType] = useState("url"); // "url" or "file"
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();  const handleFormSubmit = async (data) => {
    setUploading(true);
    try {
      const videoData = {
        title: data.title,
        description: data.description || "",
        inputUrl: data.inputUrl,
        thumbnail: data.thumbnail || "",
        duration: data.duration ? parseInt(data.duration) : null,
        categoryId: data.categoryId ? parseInt(data.categoryId) : null,
        verifyStatus: false, // Mặc định chưa được duyệt
      };

      await onSubmit(videoData);
      reset();
      onClose();
    } catch (error) {
      console.error("Error submitting video:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Thêm video mới</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-gray-200 mb-2">
              Tiêu đề <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              {...register("title", { required: "Tiêu đề là bắt buộc" })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Nhập tiêu đề video"
            />
            {errors.title && (
              <span className="text-red-400 text-sm">
                {errors.title.message}
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-200 mb-2">Mô tả</label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Nhập mô tả video (tùy chọn)"
            />
          </div>          {/* Video URL */}
          <div>
            <label className="block text-gray-200 mb-2">
              URL Video <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <FaLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                {...register("inputUrl", {
                  required: "URL video là bắt buộc",
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: "URL không hợp lệ",
                  },
                })}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://example.com/video.mp4"
              />
            </div>
            {errors.inputUrl && (
              <span className="text-red-400 text-sm">{errors.inputUrl.message}</span>
            )}
          </div>

          {/* Thumbnail URL */}
          <div>
            <label className="block text-gray-200 mb-2">URL Thumbnail</label>
            <div className="relative">
              <FaLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                {...register("thumbnail", {
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: "URL không hợp lệ",
                  },
                })}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://example.com/thumbnail.jpg (tùy chọn)"
              />
            </div>
            {errors.thumbnail && (
              <span className="text-red-400 text-sm">{errors.thumbnail.message}</span>
            )}
          </div>          {/* Category and Duration - Same row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-gray-200 mb-2">Danh mục</label>
              <select
                {...register("categoryId")}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Chọn danh mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-gray-200 mb-2">
                Thời lượng (giây)
              </label>
              <input
                type="number"
                {...register("duration", {
                  min: { value: 1, message: "Thời lượng phải lớn hơn 0" },
                })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ví dụ: 120 (2 phút)"
              />
              {errors.duration && (
                <span className="text-red-400 text-sm">
                  {errors.duration.message}
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-800 bg-opacity-50 text-blue-100 p-3 rounded text-sm">
            <strong>Lưu ý:</strong> Video sẽ được thêm vào trạng thái "Chờ duyệt" 
            và cần được Moderator hoặc Admin duyệt trước khi có thể sử dụng trong lịch phát sóng.
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
              disabled={uploading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors flex items-center"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Đang thêm...
                </>
              ) : (
                <>
                  <FaUpload className="mr-2" />
                  Thêm video
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VideoUploadModal;
