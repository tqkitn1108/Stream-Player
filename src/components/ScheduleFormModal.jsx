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
  FaBroadcastTower,
  FaTimes,
} from "react-icons/fa";
import { useForm } from "react-hook-form";
import axios from "axios";
import dayjs from "dayjs";
import ContentLibraryModal from "./ContentLibraryModal";
import AdsSelectionModal from "./AdsSelectionModal";

const API_BASE_URL =
  `${import.meta.env.VITE_BACKEND_URL}/api/v1` ||
  "http://34.126.102.97:8080/api/v1";

function ScheduleFormModal({
  isOpen,
  onClose,
  onSubmit,
  formData: initialFormData,
  currentItem,
  mode = "add", // mode: "add", "edit", "view"
}) {
  if (!isOpen) return null;
  const [showLabel, setShowLabel] = useState(
    initialFormData.labels && initialFormData.labels.length > 0 ? true : true
  );
  const [customLabel, setCustomLabel] = useState(
    initialFormData.labels && initialFormData.labels.length > 0
      ? initialFormData.labels[0].name
      : initialFormData.title || ""
  ); // Thêm state cho content selection
  const [contentSelectionType, setContentSelectionType] = useState("url"); // "url", "library","live"
  const [contentLibrary, setContentLibrary] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [showContentLibraryPopup, setShowContentLibraryPopup] = useState(false);
  const [adsList, setAdsList] = useState([]);
  const [adsCategories, setAdsCategories] = useState([]);
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

  // Auto-sync custom label with title when title changes
  useEffect(() => {
    if (selectedContent != null && currentTitle) {
      setCustomLabel(currentTitle);
    }
  }, [currentTitle]);

  // Tự động detect content type khi form data thay đổi
  useEffect(() => {
    if (initialFormData.videoId) {
      setContentSelectionType("library");
      // Set selected content nếu có videoId
      setSelectedContent({
        id: initialFormData.videoId,
        title: initialFormData.title || "Nội dung từ kho",
      });
    } else if (initialFormData.sourceLive) {
      setContentSelectionType("live");
    } else if (initialFormData.videoPath || initialFormData.video) {
      setContentSelectionType("url");
    }
  }, [initialFormData]); // Fetch quảng cáo theo scheduleId khi edit hoặc view
  useEffect(() => {
    // Gọi API khi có currentItem và currentItem.id (bao gồm cả trường hợp view và edit)
    if (currentItem && currentItem.id) {
      fetchAdsByScheduleId(currentItem.id);
    }
  }, [currentItem]);
  // Fetch nội dung từ kho khi mở popup thư viện
  useEffect(() => {
    if (showContentLibraryPopup) {
      fetchContentLibrary();
      fetchCategories();
    }
  }, [showContentLibraryPopup]);
  // Fetch danh sách quảng cáo khi mở popup quảng cáo
  useEffect(() => {
    if (showAdsPopup) {
      fetchAdsList();
      fetchAdsCategories();
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

  const fetchAdsCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ads/category`);
      if (response.data.code === 200) {
        setAdsCategories(response.data.data || []);
      } else {
        console.error("Error fetching ads categories:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching ads categories:", error);
    }
  }; // Fetch quảng cáo theo scheduleId
  const fetchAdsByScheduleId = async (scheduleId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ads/by-schedule`, {
        params: { scheduleId },
      });
      if (response.data.code === 200) {
        const adsData = response.data.data || [];
        // Transform API data to match current scheduleAds format
        const transformedAds = adsData.map((ad) => ({
          adId: ad.adId,
          title: ad.title,
          startTime: ad.startTime,
          endTime: ad.endTime,
          adScheduleId: ad.adScheduleId, // Lưu thêm adScheduleId để có thể xử lý sau này nếu cần
        }));
        setScheduleAds(transformedAds);
      } else {
        console.error("Error fetching ads by schedule:", response.data.message);
      }
    } catch (error) {
      console.error("Failed to fetch ads by schedule:", error);
    }
  };
  // Xử lý khi chọn nội dung từ thư viện
  const handleSelectContent = (content) => {
    setSelectedContent(content);
    setValue("videoId", content.id);
    setValue("title", content.title);

    // Auto-set end time based on video duration
    const currentStartTime = watch("startTime");
    if (currentStartTime && content.duration) {
      const startTime = dayjs(currentStartTime);
      const endTime = startTime.add(content.duration, "second");
      setValue("endTime", endTime.format("YYYY-MM-DDTHH:mm:ss"));
    }

    setShowContentLibraryPopup(false);
  };

  // Xử lý thêm nhiều quảng cáo cùng lúc
  const handleAddMultipleAds = (adsToAdd, totalAdsDuration = 0) => {
    const validAds = [];
    const errors = [];

    adsToAdd.forEach((adData, index) => {
      const { ad, startTime, endTime } = adData;

      // Kiểm tra không chồng lấn với quảng cáo đã có
      const overlapping = [...scheduleAds, ...validAds].some((existingAd) => {
        const existingStart = dayjs(existingAd.startTime);
        const existingEnd = dayjs(existingAd.endTime);
        const newStart = dayjs(startTime);
        const newEnd = dayjs(endTime);

        return (
          (newStart.isAfter(existingStart) && newStart.isBefore(existingEnd)) ||
          (newEnd.isAfter(existingStart) && newEnd.isBefore(existingEnd)) ||
          (newStart.isBefore(existingStart) && newEnd.isAfter(existingEnd)) ||
          newStart.isSame(existingStart) ||
          newEnd.isSame(existingEnd)
        );
      });

      if (!overlapping) {
        validAds.push({
          adId: ad.id,
          title: ad.title,
          startTime,
          endTime,
        });
      } else {
        errors.push(`Quảng cáo "${ad.title}" chồng lấn thời gian`);
      }
    });

    // Thêm quảng cáo hợp lệ
    setScheduleAds([...scheduleAds, ...validAds]);

    // Tự động gia hạn thời gian kết thúc chương trình
    if (validAds.length > 0 && totalAdsDuration > 0) {
      const currentEndTime = watch("endTime");
      if (currentEndTime) {
        const newEndTime = dayjs(currentEndTime).add(
          totalAdsDuration,
          "second"
        );
        setValue("endTime", newEndTime.format("YYYY-MM-DDTHH:mm:ss"));
      }
    }
  };

  // Xóa quảng cáo
  const removeAd = (index) => {
    const newAds = [...scheduleAds];
    newAds.splice(index, 1);
    setScheduleAds(newAds);
  }; // Xử lý submit form với việc thêm/xóa label và quảng cáo
  const onFormSubmit = (formData) => {
    // Validation cho content selection
    if (contentSelectionType === "library" && !selectedContent) {
      alert("Vui lòng chọn nội dung từ kho");
      return;
    }

    if (contentSelectionType === "url" && !formData.videoPath) {
      alert("Vui lòng nhập URL video");
      return;
    }

    if (contentSelectionType === "live" && !formData.sourceLive) {
      alert("Vui lòng nhập link RTMP");
      return;
    }

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
    } else if (contentSelectionType === "live") {
      data.sourceLive = formData.sourceLive || ""; // Gán RTMP link vào trường sourceLive
    } // Xử lý labels
    if (showLabel) {
      // Nếu bật label, tạo label tự động từ custom label hoặc title
      data.labels = [
        {
          name: customLabel || data.title,
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
    })); // Gọi onSubmit từ component cha với data đã được cập nhật
    onSubmit(data);
  }; // Xác định mode đơn giản dựa trên prop mode
  const modalTitle =
    mode === "add" ? "Thêm mới" : mode === "edit" ? "Chỉnh sửa" : "Xem";
  const isDisabled = mode === "view";
  const isViewMode = mode === "view";
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">
            {modalTitle} lịch phát sóng
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded"
            title="Đóng"
          >
            <FaTimes size={18} />
          </button>
        </div>
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
              {" "}
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
                <button
                  type="button"
                  onClick={() => {
                    setContentSelectionType("live");
                    setSelectedContent(null);
                  }}
                  className={`flex-1 py-2 px-3 flex items-center justify-center ${
                    contentSelectionType === "live"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-300"
                  } transition-colors`}
                  disabled={isDisabled}
                >
                  <FaBroadcastTower className="mr-2" />
                  Trực tiếp
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
                  />{" "}
                </div>
              )}
              {/* Live Stream Input */}
              {contentSelectionType === "live" && (
                <div className="flex items-center overflow-hidden border border-gray-600 rounded bg-gray-700 focus-within:ring-2 focus-within:ring-indigo-500">
                  <span className="pl-3 text-gray-400">
                    <FaBroadcastTower />
                  </span>
                  <input
                    type="text"
                    {...register("sourceLive", {
                      required:
                        contentSelectionType === "live"
                          ? "Link RTMP là bắt buộc"
                          : false,
                    })}
                    className="w-full px-3 py-3 bg-gray-700 text-white focus:outline-none border-none"
                    placeholder="rtmp://example.com/live/stream_key"
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
              )}{" "}
              {errors.videoPath && contentSelectionType === "url" && (
                <span className="text-red-400 text-sm">
                  {errors.videoPath.message}
                </span>
              )}
              {errors.sourceLive && contentSelectionType === "live" && (
                <span className="text-red-400 text-sm">
                  {errors.sourceLive.message}
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
                {" "}
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
                            {dayjs(ad.startTime).format("HH:mm:ss")} -{" "}
                            {dayjs(ad.endTime).format("HH:mm:ss")}
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
                    {isViewMode
                      ? "Không có quảng cáo nào"
                      : "Chưa có quảng cáo nào được thêm"}
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
          <input type="hidden" {...register("labels")} />{" "}
          {/* Checkbox hiển thị label */}
          <div className="space-y-3">
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

            {showLabel && (
              <div>
                <label className="block text-gray-200 mb-2 text-sm">
                  Nội dung nhãn
                </label>
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="Nhập nội dung nhãn"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isDisabled}
                />
                <div className="text-xs text-gray-400 mt-1">
                  Hiển thị xuyên suốt chương trình
                </div>
              </div>
            )}
          </div>{" "}
          <div className="flex justify-end space-x-3 pt-5 mt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors flex items-center"
            >
              {isViewMode ? "Đóng" : "Hủy"}
            </button>{" "}
            {!isViewMode && (
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors flex items-center"
              >
                {mode === "edit" ? (
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
      <ContentLibraryModal
        isOpen={showContentLibraryPopup}
        onClose={() => setShowContentLibraryPopup(false)}
        contentLibrary={contentLibrary}
        loadingContent={loadingContent}
        selectedContent={selectedContent}
        handleSelectContent={handleSelectContent}
        categories={categories}
      />
      <AdsSelectionModal
        isOpen={showAdsPopup}
        onClose={() => setShowAdsPopup(false)}
        adsList={adsList}
        loadingAds={loadingAds}
        handleAddMultipleAds={handleAddMultipleAds}
        programStartTime={watch("startTime")}
        programEndTime={watch("endTime")}
        existingAds={scheduleAds}
        categories={adsCategories}
      />
    </div>
  );
}

export default ScheduleFormModal;
