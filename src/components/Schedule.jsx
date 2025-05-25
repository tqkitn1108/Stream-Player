import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import axios from "axios";
import {
  FaEdit,
  FaTrashAlt,
  FaPlus,
  FaCalendarAlt,
  FaClock,
  FaCheck,
  FaEye,
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ScheduleFormModal from "./ScheduleFormModal";
import dayjs from "dayjs";
import "dayjs/locale/vi";

// Cấu hình dayjs
dayjs.locale("vi");

function Schedule() {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedule, setSchedule] = useState([]);
  const [originalSchedule, setOriginalSchedule] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newScheduleItems, setNewScheduleItems] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    startTime: "",
    endTime: "",
    title: "",
    videoPath: "",
  });

  // Mock data cho channels - thay bằng API call trong thực tế
  const channels = [
    { id: 1, name: "Kênh Live 1" },
    { id: 2, name: "Kênh Live 2" },
    // { id: 3, name: "Kênh Live 3" },
  ];

  useEffect(() => {
    // Chọn kênh đầu tiên mặc định
    if (channels.length > 0 && !selectedChannel) {
      handleChannelSelect(channels[0].id);
    }
  }, []);
  // Khi thay đổi kênh hoặc ngày
  useEffect(() => {
    if (selectedChannel && selectedDate) {
      fetchScheduleForChannel(selectedChannel, selectedDate);
    }
  }, [selectedChannel, selectedDate]);

  // Thêm useEffect để cập nhật trạng thái "Đang chiếu" mỗi 10 giây
  useEffect(() => {
    // Chỉ thiết lập polling nếu đang xem lịch của ngày hiện tại
    if (dayjs(selectedDate).isSame(dayjs(), "day") && schedule.length > 0) {
      const intervalId = setInterval(() => {
        // Chỉ cập nhật UI, không gọi API
        setSchedule((currentSchedule) => {
          // Kiểm tra xem có cần cập nhật UI hay không
          const shouldUpdateUI = currentSchedule.some((item) => {
            const wasCurrent = isItemCurrent(item);
            const isCurrent = checkItemIsCurrent(item);
            return wasCurrent !== isCurrent;
          });

          if (shouldUpdateUI) {
            // Tạo bản sao mới để kích hoạt re-render
            return [...currentSchedule];
          }
          return currentSchedule;
        });
      }, 10000); // Cập nhật mỗi 10 giây

      return () => clearInterval(intervalId); // Dọn dẹp khi unmount
    }
  }, [selectedDate, schedule]);
  const handleChannelSelect = (channelId) => {
    if (
      hasChanges &&
      !window.confirm(
        "Bạn có thay đổi chưa lưu. Tiếp tục sẽ mất các thay đổi này. Bạn có muốn tiếp tục không?"
      )
    ) {
      return;
    }

    setSelectedChannel(channelId);
    setHasChanges(false);
    setNewScheduleItems([]); // Reset danh sách lịch mới khi đổi kênh
  };

  const formatDateForAPI = (date, isEndOfDay = false) => {
    // Sử dụng dayjs để định dạng thời gian
    const d = dayjs(date);

    if (isEndOfDay) {
      return d.format("YYYY-MM-DDT23:59:59");
    }
    return d.format("YYYY-MM-DDT00:00:00");
  };
  const fetchScheduleForChannel = async (channelId, date) => {
    setLoading(true);
    setError(null);
    // Reset the schedule immediately to avoid showing stale data
    setSchedule([]);
    setOriginalSchedule([]);

    try {
      const startTime = formatDateForAPI(date); // 00:00:00
      const endTime = formatDateForAPI(date, true); // 23:59:59

      const response = await axios.get(
        `https://fast-api-gstv.onrender.com/api/v1/schedule`,
        {
          params: {
            channelId: channelId,
            startTime: startTime,
            endTime: endTime,
            page: 0,
            size: 100, // Lấy nhiều dữ liệu hơn để hiển thị đầy đủ lịch trong ngày
          },
        }
      );
      if (response.data.code === 200) {
        setSchedule(response.data.data || []);
        setOriginalSchedule(
          JSON.parse(JSON.stringify(response.data.data || []))
        );
        setNewScheduleItems([]); // Reset danh sách lịch mới khi tải lại dữ liệu
        setHasChanges(false);
      } else {
        setError(
          response.data.message || "Không thể tải dữ liệu lịch phát sóng"
        );
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
      setError(
        "Lỗi khi lấy dữ liệu từ server: " + (error.message || "Không xác định")
      );
    } finally {
      setLoading(false);
    }
  };
  const openAddModal = () => {
    // Find the latest schedule item that's not in the past
    const sortedSchedule = [...schedule]
      .filter((item) => !isItemInPast(item))
      .sort((a, b) => dayjs(b.endTime).valueOf() - dayjs(a.endTime).valueOf());

    let startDateTime;

    if (sortedSchedule.length > 0) {
      // Use the end time of the latest schedule item as the start time for the new item
      startDateTime = dayjs(sortedSchedule[0].endTime);
    } else {
      // If no items or all items are in the past, use current hour + 1
      startDateTime = dayjs(selectedDate)
        .hour(dayjs().hour() + 1)
        .minute(0)
        .second(0);
    }

    const endDateTime = startDateTime.add(30, "minute");

    setIsEditing(false);
    setFormData({
      startTime: startDateTime.format("YYYY-MM-DDTHH:mm:ss"),
      endTime: endDateTime.format("YYYY-MM-DDTHH:mm:ss"),
      title: "",
      videoPath: "", // Để hỗ trợ nhập URL
      labels: [], // Mảng labels trống
      ads: [], // Mảng quảng cáo trống
    });
    setIsModalOpen(true);
  };
  const openEditModal = (item) => {
    setIsEditing(true);
    setCurrentItem(item);

    // Format datetime với dayjs
    const startTime = dayjs(item.startTime).format("YYYY-MM-DDTHH:mm:ss");
    const endTime = dayjs(item.endTime).format("YYYY-MM-DDTHH:mm:ss");

    // Xác định loại nội dung: từ kho (videoId) hay từ URL
    const formData = {
      startTime,
      endTime,
      title: item.title || "",
      labels: item.labels || [],
      ads: item.ads || [],
    };

    if (item.videoId) {
      // Nội dung từ kho
      formData.videoId = item.videoId;
    } else {
      // Nội dung từ URL
      formData.videoPath = item.video || item.videoPath || "";
    }

    setFormData(formData);
    setIsModalOpen(true);
  };
  const handleFormSubmit = (data) => {
    if (isEditing && currentItem) {
      // Update existing item locally
      const updatedSchedule = schedule.map((item) =>
        item.id === currentItem.id ? { ...item, ...data } : item
      );
      setSchedule(updatedSchedule);
    } else {
      // Create new item locally
      const newItem = {
        id: Date.now(), // Temporary ID for local state
        ...data,
        position: 0,
        status: 1,
        isNewItem: true, // Đánh dấu đây là item mới
        // Sử dụng labels từ data, nếu không có thì dùng mảng rỗng
        labels: data.labels || [],
      };

      // Thêm vào danh sách lịch chung
      setSchedule([...schedule, newItem]);

      // Thêm vào danh sách lịch mới
      setNewScheduleItems([...newScheduleItems, newItem]);
    }

    setIsModalOpen(false);
    setHasChanges(true);
  };
  const handleDelete = (itemId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa mục này không?")) {
      // Cập nhật danh sách lịch chung
      const updatedSchedule = schedule.filter((item) => item.id !== itemId);
      setSchedule(updatedSchedule);

      // Cập nhật danh sách lịch mới (nếu đó là lịch mới thêm)
      const updatedNewItems = newScheduleItems.filter(
        (item) => item.id !== itemId
      );
      setNewScheduleItems(updatedNewItems);

      setHasChanges(true);
    }
  };
  const handleComplete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn lưu tất cả thay đổi không?")) {
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Chỉ sử dụng những lịch mới thêm vào để gửi lên server
      const itemsToSync =
        newScheduleItems.length > 0
          ? // Nếu có lịch mới, chỉ gửi lịch mới
            newScheduleItems.filter((item) => !isItemInPast(item))
          : // Nếu không có lịch mới (trường hợp chỉnh sửa), gửi tất cả lịch chưa phát
            schedule.filter((item) => !isItemInPast(item));

      const scheduleList = itemsToSync.map((item) => {
        // Tạo object cơ bản
        const scheduleItem = {
          title: item.title || "",
          startTime: item.startTime,
          endTime: item.endTime,
          labels: item.labels || [], // Sử dụng labels đúng từ item
          ads: item.ads || [], // Thêm danh sách quảng cáo
        };

        // Xử lý video/videoId
        if (item.videoId) {
          scheduleItem.videoId = item.videoId;
        } else {
          scheduleItem.video = item.video || item.videoPath || "";
        }

        return scheduleItem;
      });

      console.log("Gửi đến server:", scheduleList); // Thêm log để debug

      // Gọi API sync
      const result = await axios.post(
        `http://localhost:8080/api/v1/schedule/sync`,
        {
          channelId: selectedChannel,
          scheduleList: scheduleList,
        }
      );
      if (result.data.code === 200) {
        alert("Lưu lịch phát sóng thành công!");
        // Reset danh sách lịch mới sau khi lưu thành công
        setNewScheduleItems([]);
        // Refresh schedule from server
        fetchScheduleForChannel(selectedChannel, selectedDate);
      } else {
        setError(result.data.message || "Không thể lưu thay đổi");
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      setError("Lỗi khi lưu thay đổi: " + (error.message || "Không xác định"));
    } finally {
      setLoading(false);
    }
  };
  const isItemInPast = (item) => {
    const now = dayjs();
    const itemEndTime = dayjs(item.endTime);
    return itemEndTime.isBefore(now);
  };

  // Đổi tên hàm cũ để tránh xung đột
  const checkItemIsCurrent = (item) => {
    const now = dayjs();
    const startTime = dayjs(item.startTime);
    const endTime = dayjs(item.endTime);
    return now.isAfter(startTime) && now.isBefore(endTime);
  };

  // Sử dụng hàm mới, nhưng giữ tên hàm cũ để code khác không bị ảnh hưởng
  const isItemCurrent = checkItemIsCurrent;
  const handleDateChange = (date) => {
    if (
      hasChanges &&
      !window.confirm(
        "Bạn có thay đổi chưa lưu. Tiếp tục sẽ mất các thay đổi này. Bạn có muốn tiếp tục không?"
      )
    ) {
      return;
    }
    setSelectedDate(date);
    setHasChanges(false);
    setNewScheduleItems([]); // Reset danh sách lịch mới khi đổi ngày
  };

  return (
    <div className="bg-gray-900 min-h-screen">
      <Navbar />
      <div className="container mx-auto p-4 pt-24">
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
            <FaCalendarAlt className="mr-3 text-indigo-400" />
            Quản lý lịch phát sóng
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-xl text-white mb-4">Chọn kênh</h2>
              <div className="flex flex-wrap gap-3">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => handleChannelSelect(channel.id)}
                    className={`px-4 py-2 rounded-md ${
                      selectedChannel === channel.id
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                    } transition`}
                  >
                    {channel.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl text-white mb-4">Chọn ngày</h2>
              <div className="datepicker-container">
                <DatePicker
                  selected={selectedDate}
                  onChange={handleDateChange}
                  dateFormat="dd/MM/yyyy"
                  className="px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl text-white">
              Lịch phát sóng - {dayjs(selectedDate).format("DD/MM/YYYY")}
            </h2>
            {!dayjs(selectedDate).isBefore(dayjs().startOf("day")) && (
              <div className="flex space-x-3">
                <button
                  onClick={openAddModal}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  <FaPlus className="mr-2" />
                  Thêm mới
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!hasChanges || loading}
                  className={`flex items-center px-4 py-2 ${
                    hasChanges && !loading
                      ? "bg-indigo-600 hover:bg-indigo-700"
                      : "bg-gray-600 cursor-not-allowed"
                  } text-white rounded transition`}
                >
                  <FaCheck className="mr-2" />
                  {loading ? "Đang xử lý..." : "Hoàn tất"}
                </button>
              </div>
            )}
          </div>
          {/* Bảng lịch */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-600">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FaClock className="mr-2" />
                      Thời gian
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                    Chương trình
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                    Nguồn nội dung
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-200 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {loading ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-4 text-center text-gray-300"
                    >
                      <div className="flex justify-center items-center">
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
                    </td>
                  </tr>
                ) : schedule.length > 0 ? (
                  schedule
                    .sort(
                      (a, b) =>
                        dayjs(a.startTime).valueOf() -
                        dayjs(b.startTime).valueOf()
                    )
                    .map((item, index) => {
                      const isPast = isItemInPast(item);
                      const isCurrent = isItemCurrent(item);

                      return (
                        <tr
                          key={item.id}
                          className={`
                            ${isPast ? "opacity-70" : "hover:bg-gray-650"} 
                            ${
                              checkItemIsCurrent(item)
                                ? "bg-indigo-800 border-l-4 border-indigo-500"
                                : ""
                            } 
                            transition
                          `}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            <div>
                              {dayjs(item.startTime).format("HH:mm:ss")} -{" "}
                              {dayjs(item.endTime).format("HH:mm:ss")}
                              {checkItemIsCurrent(item) && (
                                <span className="ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded">
                                  Đang chiếu
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                            {item.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200 truncate max-w-xs">
                            {item.videoId ? (
                              <span className="px-2 py-1 bg-green-900 bg-opacity-50 text-green-300 rounded">
                                ID: {item.videoId}
                              </span>
                            ) : item.video || item.videoPath ? (
                              <span className="text-gray-300">
                                {item.video || item.videoPath}
                              </span>
                            ) : (
                              <span className="text-gray-500 italic">
                                Chưa có nguồn
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {isPast ? (
                              // Chỉ cho phép xem với lịch đã phát
                              <button
                                onClick={() => openEditModal(item)}
                                className="text-gray-400 hover:text-gray-300"
                                title="Chỉ xem (lịch đã phát)"
                              >
                                <FaEye />
                              </button>
                            ) : (
                              // Cho phép sửa và xóa với lịch chưa phát
                              <>
                                <button
                                  onClick={() => openEditModal(item)}
                                  className="text-indigo-400 hover:text-indigo-300 mr-4"
                                  title="Chỉnh sửa"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="text-red-400 hover:text-red-300"
                                  title="Xóa"
                                >
                                  <FaTrashAlt />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-4 text-center text-gray-300"
                    >
                      Không có dữ liệu lịch phát sóng
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {hasChanges && (
            <div className="mt-4 p-3 bg-amber-800 bg-opacity-50 text-amber-100 rounded-lg">
              Lưu ý: Bạn có thay đổi chưa được lưu. Nhấn "Hoàn tất" để lưu thay
              đổi.
            </div>
          )}
        </div>
      </div>

      {/* Sử dụng component ScheduleFormModal */}
      <ScheduleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        formData={formData}
        setFormData={setFormData}
        isEditing={isEditing}
        currentItem={currentItem}
        isItemInPast={isItemInPast}
      />
    </div>
  );
}

export default Schedule;
