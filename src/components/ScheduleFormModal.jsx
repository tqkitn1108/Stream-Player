import React, { useState, useEffect } from "react";
import {
  FaEye,
  FaLink,
  FaDatabase,
  FaCheck,
  FaPlus,
  FaAd,
  FaTrashAlt,
  FaClock,
} from "react-icons/fa";
import { useForm } from "react-hook-form";
import axios from "axios";
import dayjs from "dayjs";
import ContentLibraryModal from "./ContentLibraryModal";
import AdsSelectionModal from "./AdsSelectionModal";

const API_BASE_URL =
  `${import.meta.env.VITE_BACKEND_URL}/api/v1` ||
  "http://localhost:8080/api/v1";

function ScheduleFormModal({
  isOpen,
  onClose,
  onSubmit,
  formData: initialFormData,
  isEditing,
  currentItem,
  isItemInPast,
}) {
  if (!isOpen) return null;
  const [showLabel, setShowLabel] = useState(true);

  // Thêm state cho content selection
  const [contentSelectionType, setContentSelectionType] = useState("url"); // "url" hoặc "library"
  const [contentLibrary, setContentLibrary] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [showContentLibraryPopup, setShowContentLibraryPopup] = useState(false);

  // State cho quảng cáo
  const [adsList, setAdsList] = useState([]);
  const [scheduleAds, setScheduleAds] = useState(initialFormData.ads || []);
  const [loadingAds, setLoadingAds] = useState(false);
  const [showAdsPopup, setShowAdsPopup] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);
  const [adStartTime, setAdStartTime] = useState("");
  const [adEndTime, setAdEndTime] = useState("");
  const [adErrors, setAdErrors] = useState({});

  // Form chính
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    defaultValues: initialFormData,
  });

  // Lấy giá trị title từ form để tạo label tự động
  const currentTitle = watch("title");
  // Fetch nội dung từ kho khi mở popup thư viện
  useEffect(() => {
    if (showContentLibraryPopup) {
      fetchContentLibrary();
    }
  }, [showContentLibraryPopup]);

  // Fetch danh sách quảng cáo khi mở popup quảng cáo
  useEffect(() => {
    if (showAdsPopup) {
      fetchAdsList();
    }
  }, [showAdsPopup]);

  const fetchContentLibrary = async () => {
    try {
      setLoadingContent(true);
      const response = await axios.get(`${API_BASE_URL}/videos/verified`);
      if (response.data.code === 200) {
        setContentLibrary(response.data.data || []);
      } else {
        console.error("Error fetching content:", response.data.message);
      }
    } catch (error) {
      console.error("Failed to fetch content library:", error);
    } finally {
      setLoadingContent(false);
    }
  };

  const fetchAdsList = async () => {
    try {
      setLoadingAds(true);
      const response = await axios.get(`${API_BASE_URL}/ads/verified`);
      if (response.data.code === 200) {
        setAdsList(response.data.data || []);
      } else {
        console.error("Error fetching ads:", response.data.message);
      }
    } catch (error) {
      console.error("Failed to fetch ads list:", error);
    } finally {
      setLoadingAds(false);
    }
  };
  // Xử lý khi chọn nội dung từ thư viện
  const handleSelectContent = (content) => {
    setSelectedContent(content);
    setValue("videoId", content.id);
    setValue("title", content.title);
    setShowContentLibraryPopup(false);
  };

  // Xử lý thêm quảng cáo
  const handleAddAd = (ad) => {
    setCurrentAd(ad);
    const formStartTime = watch("startTime");
    const formEndTime = watch("endTime");

    // Đặt thời gian bắt đầu quảng cáo mặc định (thời gian bắt đầu + 30s)
    const defaultStartTime = dayjs(formStartTime).add(30, "second");
    const defaultEndTime = dayjs(defaultStartTime).add(
      ad.duration || 30,
      "second"
    );

    // Kiểm tra không vượt quá thời gian kết thúc chương trình
    const programEndTime = dayjs(formEndTime);

    setAdStartTime(
      defaultStartTime.isBefore(programEndTime)
        ? defaultStartTime.format("YYYY-MM-DDTHH:mm:ss")
        : formStartTime
    );

    setAdEndTime(
      defaultEndTime.isBefore(programEndTime)
        ? defaultEndTime.format("YYYY-MM-DDTHH:mm:ss")
        : programEndTime.format("YYYY-MM-DDTHH:mm:ss")
    );
  };

  // Kiểm tra và xác nhận thêm quảng cáo
  const confirmAddAd = () => {
    // Reset lỗi
    setAdErrors({});

    if (!currentAd) {
      setAdErrors({ ad: "Chưa chọn quảng cáo" });
      return;
    }

    // Thời gian của chương trình
    const programStartTime = dayjs(watch("startTime"));
    const programEndTime = dayjs(watch("endTime"));

    // Thời gian của quảng cáo
    const adStart = dayjs(adStartTime);
    const adEnd = dayjs(adEndTime);

    // Kiểm tra thời gian quảng cáo nằm trong thời gian chương trình
    if (adStart.isBefore(programStartTime)) {
      setAdErrors({
        startTime:
          "Thời gian bắt đầu quảng cáo phải sau thời gian bắt đầu chương trình",
      });
      return;
    }

    if (adEnd.isAfter(programEndTime)) {
      setAdErrors({
        endTime:
          "Thời gian kết thúc quảng cáo phải trước thời gian kết thúc chương trình",
      });
      return;
    }

    if (adStart.isAfter(adEnd) || adStart.isSame(adEnd)) {
      setAdErrors({
        startTime: "Thời gian bắt đầu phải trước thời gian kết thúc",
      });
      return;
    }

    // Kiểm tra không chồng lấn với quảng cáo khác
    const overlapping = scheduleAds.some((existingAd) => {
      const existingStart = dayjs(existingAd.startTime);
      const existingEnd = dayjs(existingAd.endTime);

      // Kiểm tra có chồng lấn không
      return (
        (adStart.isAfter(existingStart) && adStart.isBefore(existingEnd)) ||
        (adEnd.isAfter(existingStart) && adEnd.isBefore(existingEnd)) ||
        (adStart.isBefore(existingStart) && adEnd.isAfter(existingEnd)) ||
        adStart.isSame(existingStart) ||
        adEnd.isSame(existingEnd)
      );
    });

    if (overlapping) {
      setAdErrors({
        overlap: "Quảng cáo này chồng lấn thời gian với quảng cáo khác",
      });
      return;
    }

    // Thêm quảng cáo vào danh sách
    const newAd = {
      adId: currentAd.id,
      title: currentAd.title,
      startTime: adStartTime,
      endTime: adEndTime,
    };

    setScheduleAds([...scheduleAds, newAd]);
    setShowAdsPopup(false);
    setCurrentAd(null);
  };

  // Xóa quảng cáo
  const removeAd = (index) => {
    const newAds = [...scheduleAds];
    newAds.splice(index, 1);
    setScheduleAds(newAds);
  };
  // Xử lý submit form với việc thêm/xóa label và quảng cáo
  const onFormSubmit = (formData) => {
    // Clone data để tránh tham chiếu và xóa các trường không cần thiết
    const data = {
      title: formData.title,
      startTime: formData.startTime,
      endTime: formData.endTime,
    };

    // Xử lý video dựa trên loại lựa chọn
    if (contentSelectionType === "url") {
      data.video = formData.videoPath || ""; // Gán URL vào trường video
    } else if (contentSelectionType === "library" && selectedContent) {
      data.videoId = selectedContent.id; // Gán ID từ kho vào trường videoId
    }

    // Xử lý labels
    if (showLabel) {
      // Nếu bật label, tạo label tự động từ title, không có trường color
      data.labels = [
        {
          name: data.title,
          displayDuration: -1,
        },
      ];
    } else {
      // Nếu tắt label, gửi mảng rỗng
      data.labels = [];
    }

    // Thêm danh sách quảng cáo
    data.ads = scheduleAds.map((ad) => ({
      adId: ad.adId,
      startTime: ad.startTime,
      endTime: ad.endTime,
    }));

    // Gọi onSubmit từ component cha với data đã được cập nhật
    onSubmit(data);
  };

  const modalTitle = isEditing
    ? isItemInPast(currentItem)
      ? "Xem"
      : "Chỉnh sửa"
    : "Thêm mới";

  const isDisabled = isEditing && isItemInPast(currentItem);
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-4">
          {modalTitle} lịch phát sóng
        </h2>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Form fields with improved layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-gray-200 mb-1">
                Thời gian bắt đầu
              </label>
              <input
                type="datetime-local"
                {...register("startTime", {
                  required: "Thời gian bắt đầu là bắt buộc",
                })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isDisabled}
                step="1"
              />
              {errors.startTime && (
                <span className="text-red-400 text-sm">
                  {errors.startTime.message}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-gray-200 mb-1">
                Thời gian kết thúc
              </label>
              <input
                type="datetime-local"
                {...register("endTime", {
                  required: "Thời gian kết thúc là bắt buộc",
                })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isDisabled}
                step="1"
              />
              {errors.endTime && (
                <span className="text-red-400 text-sm">
                  {errors.endTime.message}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-gray-200 mb-1">Tiêu đề</label>
            <input
              type="text"
              {...register("title", { required: "Tiêu đề là bắt buộc" })}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isDisabled}
            />
            {errors.title && (
              <span className="text-red-400 text-sm">
                {errors.title.message}
              </span>
            )}
          </div>
          <div className="space-y-2 mt-1">
            <div className="block text-gray-200 mb-2">Chọn nội dung</div>
            <div className="space-y-3">
              {/* Toggle content selection type */}
              <div className="flex border border-gray-600 rounded overflow-hidden mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setContentSelectionType("url");
                    setSelectedContent(null);
                  }}
                  className={`flex-1 py-2 px-3 flex items-center justify-center ${
                    contentSelectionType === "url"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-300"
                  } transition-colors`}
                  disabled={isDisabled}
                >
                  <FaLink className="mr-2" />
                  Nhập URL
                </button>
                <button
                  type="button"
                  onClick={() => setContentSelectionType("library")}
                  className={`flex-1 py-2 px-3 flex items-center justify-center ${
                    contentSelectionType === "library"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-300"
                  } transition-colors`}
                  disabled={isDisabled}
                >
                  <FaDatabase className="mr-2" />
                  Kho nội dung
                </button>
              </div>
              {/* URL Input */}
              {contentSelectionType === "url" && (
                <div className="flex items-center overflow-hidden border border-gray-600 rounded bg-gray-700 focus-within:ring-2 focus-within:ring-indigo-500">
                  <span className="pl-3 text-gray-400">
                    <FaLink />
                  </span>
                  <input
                    type="text"
                    {...register("videoPath", {
                      required:
                        contentSelectionType === "url"
                          ? "Video URL là bắt buộc"
                          : false,
                    })}
                    className="w-full px-3 py-3 bg-gray-700 text-white focus:outline-none border-none"
                    placeholder="http://example.com/video.mp4"
                    disabled={isDisabled}
                  />
                </div>
              )}
              {/* Library option: Show selected content or button */}
              {contentSelectionType === "library" && (
                <div>
                  {selectedContent ? (
                    <div className="flex justify-between items-center p-3 border border-gray-600 rounded bg-gray-700 hover:bg-gray-650 transition-colors">
                      <div className="overflow-hidden">
                        <h4 className="font-medium text-white truncate">
                          {selectedContent.title}
                        </h4>
                        <p className="text-xs text-gray-400 flex items-center">
                          {selectedContent.duration && (
                            <span className="flex items-center ml-2">
                              <FaClock
                                className="mr-1 text-gray-500"
                                size={10}
                              />
                              {selectedContent.duration}s
                            </span>
                          )}
                        </p>
                      </div>
                      {!isDisabled && (
                        <button
                          type="button"
                          onClick={() => setShowContentLibraryPopup(true)}
                          className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-white ml-2 transition-colors"
                        >
                          Thay đổi
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowContentLibraryPopup(true)}
                      className="w-full py-3 px-3 border border-dashed border-gray-500 rounded bg-gray-700 text-gray-300 hover:bg-gray-650 flex items-center justify-center transition-colors"
                      disabled={isDisabled}
                    >
                      <FaDatabase className="mr-2" />
                      Chọn nội dung từ kho
                    </button>
                  )}
                </div>
              )}
              {/* Trường ẩn cho videoId khi chọn từ kho nội dung */}
              {contentSelectionType === "library" && (
                <input type="hidden" {...register("videoId")} />
              )}
              {errors.videoPath && contentSelectionType === "url" && (
                <span className="text-red-400 text-sm">
                  {errors.videoPath.message}
                </span>
              )}
              {!selectedContent && contentSelectionType === "library" && (
                <span className="text-red-400 text-sm">
                  Vui lòng chọn nội dung từ kho
                </span>
              )}
            </div>
          </div>
          {/* Quảng cáo */}
          <div>
            <div className="text-gray-200 mb-2 flex items-center">
              <FaAd className="mr-2" />
              Quảng cáo trong chương trình
            </div>
            <div className="space-y-3">
              <div className="border border-gray-600 rounded p-2 bg-gray-700">
                {scheduleAds.length > 0 ? (
                  <div className="space-y-2">
                    {scheduleAds.map((ad, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-gray-650 rounded"
                      >
                        <div>
                          <div className="font-medium text-white">
                            {ad.title}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center">
                            <FaClock className="mr-1" />
                            {dayjs(item.startTime).format("HH:mm:ss")} -{" "}
                            {dayjs(item.endTime).format("HH:mm:ss")}
                          </div>
                        </div>
                        {!isDisabled && (
                          <button
                            type="button"
                            onClick={() => removeAd(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <FaTrashAlt />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2 text-gray-400">
                    Chưa có quảng cáo nào được thêm
                  </div>
                )}

                {!isDisabled && (
                  <button
                    type="button"
                    onClick={() => setShowAdsPopup(true)}
                    className="mt-3 w-full py-1 px-3 border border-dashed border-gray-500 rounded bg-gray-650 text-gray-300 hover:bg-gray-600 flex items-center justify-center"
                  >
                    <FaPlus className="mr-2" />
                    Thêm quảng cáo
                  </button>
                )}
              </div>
            </div>
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
            <label
              htmlFor="showLabel"
              className="ml-2 block text-sm text-gray-200"
            >
              Hiển thị nhãn chương trình
            </label>
          </div>
          {/* Khi bật hiển thị label, cho xem trước */}
          {showLabel && (
            <div className="mt-2 p-2 bg-gray-700 rounded">
              <div className="text-sm text-gray-300 mb-1">
                Label sẽ được tạo:
              </div>
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
          <div className="flex justify-end space-x-3 pt-5 mt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors flex items-center"
            >
              {isDisabled ? "Đóng" : "Hủy"}
            </button>

            {!isDisabled && (
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors flex items-center"
              >
                {isEditing ? (
                  <>
                    <FaCheck className="mr-2" /> Cập nhật
                  </>
                ) : (
                  <>
                    <FaPlus className="mr-2" />
                    Thêm
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Sử dụng component ContentLibraryModal */}
      <ContentLibraryModal
        isOpen={showContentLibraryPopup}
        onClose={() => setShowContentLibraryPopup(false)}
        contentLibrary={contentLibrary}
        loadingContent={loadingContent}
        selectedContent={selectedContent}
        handleSelectContent={handleSelectContent}
      />

      {/* Sử dụng component AdsSelectionModal */}
      <AdsSelectionModal
        isOpen={showAdsPopup}
        onClose={() => setShowAdsPopup(false)}
        adsList={adsList}
        loadingAds={loadingAds}
        currentAd={currentAd}
        handleAddAd={handleAddAd}
        adStartTime={adStartTime}
        setAdStartTime={setAdStartTime}
        adEndTime={adEndTime}
        setAdEndTime={setAdEndTime}
        adErrors={adErrors}
        confirmAddAd={confirmAddAd}
      />
    </div>
  );
}

export default ScheduleFormModal;
