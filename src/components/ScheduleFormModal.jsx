import React, { useState, useEffect } from 'react';
import { FaEye } from 'react-icons/fa';
import { useForm } from 'react-hook-form';

function ScheduleFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData: initialFormData, 
  isEditing, 
  currentItem,
  isItemInPast
}) {
  if (!isOpen) return null;
  
  // Theo dõi trạng thái bật/tắt hiển thị label
  const [showLabel, setShowLabel] = useState(
    initialFormData.labels && initialFormData.labels.length > 0
  );
  
  // Form chính
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: initialFormData
  });
  
  // Lấy giá trị title từ form để tạo label tự động
  const currentTitle = watch("title");
  
  // Xử lý submit form với việc thêm/xóa label
  const onFormSubmit = (formData) => {
    // Clone data để tránh tham chiếu
    const data = {...formData};
    
    if (showLabel) {
      // Nếu bật label, tạo label tự động từ title
      data.labels = [{
        name: data.title,
        color: "#28A745",
        displayDuration: -1
      }];
    } else {
      // Nếu tắt label, gửi mảng rỗng
      data.labels = [];
    }
    
    // Gọi onSubmit từ component cha với data đã được cập nhật labels
    onSubmit(data);
  };

  const modalTitle = isEditing 
    ? (isItemInPast(currentItem) ? "Xem" : "Chỉnh sửa") 
    : "Thêm mới";
  
  const isDisabled = isEditing && isItemInPast(currentItem);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">
          {modalTitle} lịch phát sóng
        </h2>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Form fields giữ nguyên */}
          <div>
            <label className="block text-gray-200 mb-2">Thời gian bắt đầu</label>
            <input
              type="datetime-local"
              {...register("startTime", { required: "Thời gian bắt đầu là bắt buộc" })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isDisabled}
              step="1"
            />
            {errors.startTime && (
              <span className="text-red-400 text-sm">{errors.startTime.message}</span>
            )}
          </div>
          
          <div>
            <label className="block text-gray-200 mb-2">Thời gian kết thúc</label>
            <input
              type="datetime-local"
              {...register("endTime", { required: "Thời gian kết thúc là bắt buộc" })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isDisabled}
              step="1"
            />
            {errors.endTime && (
              <span className="text-red-400 text-sm">{errors.endTime.message}</span>
            )}
          </div>
          
          <div>
            <label className="block text-gray-200 mb-2">Tiêu đề</label>
            <input
              type="text"
              {...register("title", { required: "Tiêu đề là bắt buộc" })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isDisabled}
            />
            {errors.title && (
              <span className="text-red-400 text-sm">{errors.title.message}</span>
            )}
          </div>
          
          <div>
            <label className="block text-gray-200 mb-2">Video URL</label>
            <input
              type="text"
              {...register("videoPath", { required: "Video URL là bắt buộc" })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="http://example.com/video.mp4"
              disabled={isDisabled}
            />
            {errors.videoPath && (
              <span className="text-red-400 text-sm">{errors.videoPath.message}</span>
            )}
          </div>
          
          {/* Thêm field ẩn để lưu trữ thông tin labels */}
          <input type="hidden" {...register("labels")} />
          
          {/* Checkbox hiển thị label */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showLabel"
              checked={showLabel}
              onChange={() => setShowLabel(!showLabel)}
              disabled={isDisabled}
              className="w-4 h-4 text-indigo-600 border-gray-500 rounded focus:ring-indigo-500"
            />
            <label htmlFor="showLabel" className="ml-2 block text-sm text-gray-200">
              Hiển thị nhãn chương trình 
            </label>
          </div>
          
          {/* Khi bật hiển thị label, cho xem trước */}
          {showLabel && (
            <div className="mt-2 p-2 bg-gray-700 rounded">
              <div className="text-sm text-gray-300 mb-1">Label sẽ được tạo:</div>
              <span 
                className="inline-block px-2 py-1 rounded-full text-sm"
                style={{ backgroundColor: "#28A745" }}
              >
                {currentTitle || "Tên chương trình"}
              </span>
              <div className="text-xs text-gray-400 mt-1">
                Hiển thị xuyên suốt chương trình
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition"
            >
              {isDisabled ? "Đóng" : "Hủy"}
            </button>
            
            {!isDisabled && (
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              >
                {isEditing ? "Cập nhật" : "Thêm"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ScheduleFormModal;