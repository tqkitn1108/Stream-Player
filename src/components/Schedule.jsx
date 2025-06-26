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
  FaStop,
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ScheduleFormModal from "./ScheduleFormModal";
import StopCurrentModal from "./StopCurrentModal";
import keycloak from "../services/keycloak";
import dayjs from "dayjs";

// Cấu hình dayjs
dayjs.locale("vi");

// API URL constants
const API_BASE_URL =
  `${import.meta.env.VITE_BACKEND_URL}/api/v1` ||
  "http://localhost:8080/api/v1";

function Schedule() {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedule, setSchedule] = useState([]);
  const [originalSchedule, setOriginalSchedule] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // Thêm state cho mode: "add", "edit", "view"
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newScheduleItems, setNewScheduleItems] = useState([]);
  const [updatedScheduleItems, setUpdatedScheduleItems] = useState([]); // Theo dõi các lịch đã được cập nhật
  const [deletedIds, setDeletedIds] = useState([]); // Theo dõi các ID đã bị xóa
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [currentPlayingItem, setCurrentPlayingItem] = useState(null);
  const [currentTime, setCurrentTime] = useState(dayjs()); // Theo dõi thời gian hiện tại
  const [selectedVodSchedules, setSelectedVodSchedules] = useState(new Set()); // Theo dõi lịch được chọn để cắt VOD
  const [vodMapping, setVodMapping] = useState(new Map()); // Mapping giữa scheduleId và vodId
  const [existingVods, setExistingVods] = useState([]); // Danh sách VOD đã có từ server
  const [channels, setChannels] = useState([]); // Danh sách kênh từ API
  const [selectedSchedulesToDelete, setSelectedSchedulesToDelete] = useState(new Set()); // Theo dõi các lịch được chọn để xóa

  // Form state
  const [formData, setFormData] = useState({
    startTime: "",
    endTime: "",
    title: "",
    videoPath: "",
  });
  // Fetch channels từ API
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/channels`);
        if (response.data.code === 200) {
          const channelsData = response.data.data || [];
          // Map channels data với format phù hợp cho Schedule
          const mappedChannels = channelsData.map((channel) => ({
            id: channel.id,
            name: channel.channelName,
          }));
          setChannels(mappedChannels);
        } else {
          console.error("Error fetching channels:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching channels:", error);
      }
    };

    fetchChannels();
  }, []);
  useEffect(() => {
    // Chọn kênh đầu tiên mặc định
    if (channels.length > 0 && !selectedChannel) {
      setSelectedChannel(channels[0].id);
    }
  }, [channels, selectedChannel]); // Thêm selectedChannel để tránh loop
  // Khi thay đổi kênh hoặc ngày
  useEffect(() => {
    if (selectedChannel && selectedDate) {
      fetchScheduleForChannel(selectedChannel, selectedDate);
    }
  }, [selectedChannel, selectedDate]); // Thêm useEffect để cập nhật trạng thái "Đang chiếu" mỗi 10 giây
  useEffect(() => {
    // Chỉ thiết lập polling nếu đang xem lịch của ngày hiện tại
    if (dayjs(selectedDate).isSame(dayjs(), "day")) {
      const intervalId = setInterval(() => {
        // Cập nhật thời gian hiện tại để kích hoạt re-render
        setCurrentTime(dayjs());
      }, 10000); // Cập nhật mỗi 10 giây

      return () => clearInterval(intervalId); // Dọn dẹp khi unmount
    }
  }, [selectedDate]);
  const handleChannelSelect = (channelId) => {
    if (
      (newScheduleItems.length > 0 || updatedScheduleItems.length > 0 || deletedIds.length > 0) &&
      !window.confirm(
        "Bạn có thay đổi chưa lưu. Tiếp tục sẽ mất các thay đổi này. Bạn có muốn tiếp tục không?"
      )
    ) {
      return;
    }
    setSelectedChannel(channelId);
    setHasChanges(false);
    setNewScheduleItems([]); // Reset danh sách lịch mới khi đổi kênh
    setUpdatedScheduleItems([]); // Reset danh sách lịch đã cập nhật khi đổi kênh
    setDeletedIds([]); // Reset danh sách ID đã xóa khi đổi kênh
    setSelectedVodSchedules(new Set()); // Reset danh sách VOD được chọn
    setVodMapping(new Map()); // Reset mapping VOD
    setExistingVods([]); // Reset danh sách VOD đã có
    setSelectedSchedulesToDelete(new Set()); // Reset danh sách lịch được chọn để xóa
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
    setSelectedVodSchedules(new Set()); // Reset danh sách VOD được chọn
    setVodMapping(new Map()); // Reset mapping VOD
    setExistingVods([]); // Reset danh sách VOD đã có
    setSelectedSchedulesToDelete(new Set()); // Reset danh sách lịch được chọn để xóa

    try {
      const startTime = formatDateForAPI(date); // 00:00:00
      const endTime = formatDateForAPI(date, true); // 23:59:59

      const response = await axios.get(`${API_BASE_URL}/schedule`, {
        params: {
          channelId: channelId,
          startTime: startTime,
          endTime: endTime,
          page: 0,
          size: 100, // Lấy nhiều dữ liệu hơn để hiển thị đầy đủ lịch trong ngày
        },
      });

      if (response.data.code === 200) {
        const scheduleData = response.data.data || [];
        setSchedule(scheduleData);
        setOriginalSchedule(JSON.parse(JSON.stringify(scheduleData)));

        // Lấy danh sách VOD đã có cho các schedule này
        if (scheduleData.length > 0) {
          await fetchExistingVods(scheduleData.map((item) => item.id));
        }

        setNewScheduleItems([]); // Reset danh sách lịch mới khi tải lại dữ liệu
        setUpdatedScheduleItems([]); // Reset danh sách lịch đã cập nhật khi tải lại dữ liệu
        setDeletedIds([]); // Reset danh sách ID đã xóa khi tải lại dữ liệu
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

    setModalMode("add");
    setCurrentItem(null);
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
    // Kiểm tra xem lịch đã phát hoặc đang phát
    const isPast = isItemInPast(item);
    const isCurrent = isItemCurrent(item);

    // Xác định mode dựa trên trạng thái của item
    if (isPast || isCurrent) {
      setModalMode("view");
    } else {
      setModalMode("edit");
    }

    setCurrentItem(item);
    setIsEditing(!(isPast || isCurrent));

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
    // Nếu đang ở chế độ chỉ xem (lịch đã phát hoặc đang phát), không xử lý submit
    if (
      currentItem &&
      (isItemInPast(currentItem) || isItemCurrent(currentItem))
    ) {
      setIsModalOpen(false);
      return;
    }

    if (isEditing && currentItem) {
      // Khi chỉnh sửa: thêm vào danh sách cập nhật
      // Thêm ID của item cũ vào danh sách đã xóa (nếu có ID thật từ server)
      if (currentItem.id && !currentItem.isNewItem) {
        setDeletedIds(prev => [...prev, currentItem.id]);
      }

      // Xóa item cũ khỏi schedule
      const updatedSchedule = schedule.filter(
        (item) => item.id !== currentItem.id
      );

      // Tạo item mới với dữ liệu đã chỉnh sửa
      const newItem = {
        id: Date.now(), // Temporary ID for local state
        ...data,
        position: 0,
        status: 1,
        isNewItem: true, // Đánh dấu đây là item mới (được tạo từ việc cập nhật)
        labels: data.labels || [],
        ads: data.ads || [],
      };

      // Thêm item mới vào schedule
      setSchedule([...updatedSchedule, newItem]);

      // Nếu item gốc là item mới thì thêm vào newScheduleItems, ngược lại thêm vào updatedScheduleItems
      if (currentItem.isNewItem) {
        // Item gốc là item mới, cập nhật trong newScheduleItems
        setNewScheduleItems(prev => prev.filter(item => item.id !== currentItem.id).concat(newItem));
      } else {
        // Item gốc từ server, thêm vào danh sách cập nhật
        setNewScheduleItems(prev => [...prev, newItem]);
      }
    } else {
      // Create new item locally
      const newItem = {
        id: Date.now(), // Temporary ID for local state
        ...data,
        position: 0,
        status: 1,
        isNewItem: true, // Đánh dấu đây là item mới
        labels: data.labels || [],
        ads: data.ads || [],
      };

      // Thêm vào danh sách lịch chung
      setSchedule([...schedule, newItem]);

      // Thêm vào danh sách lịch mới
      setNewScheduleItems([...newScheduleItems, newItem]);
    }
    setIsModalOpen(false);
  };
  const handleDelete = (itemId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa mục này không?")) {
      // Tìm item cần xóa
      const itemToDelete = schedule.find((item) => item.id === itemId);

      // Nếu item có ID thật từ server (không phải item mới), thêm vào deletedIds
      if (itemToDelete && !itemToDelete.isNewItem) {
        setDeletedIds(prev => [...prev, itemId]);
      }

      // Cập nhật danh sách lịch chung
      const updatedSchedule = schedule.filter((item) => item.id !== itemId);
      setSchedule(updatedSchedule);

      // Cập nhật danh sách lịch mới (nếu đó là lịch mới thêm)
      const updatedNewItems = newScheduleItems.filter(
        (item) => item.id !== itemId
      );
      setNewScheduleItems(updatedNewItems);

      // Cập nhật danh sách lịch đã cập nhật (nếu đó là lịch đã cập nhật)
      const updatedUpdatedItems = updatedScheduleItems.filter(
        (item) => item.id !== itemId
      );
      setUpdatedScheduleItems(updatedUpdatedItems);
    }
  };

  // Hàm xử lý chọn/bỏ chọn lịch để xóa
  const handleScheduleSelectionChange = (scheduleId, isChecked) => {
    setSelectedSchedulesToDelete(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(scheduleId);
      } else {
        newSet.delete(scheduleId);
      }
      return newSet;
    });
  };

  // Hàm chọn/bỏ chọn tất cả lịch sắp tới
  const handleSelectAllUpcoming = (isChecked) => {
    const upcomingSchedules = schedule.filter(item => 
      !isItemInPast(item) && !isItemCurrent(item)
    );
    
    if (isChecked) {
      const upcomingIds = upcomingSchedules.map(item => item.id);
      setSelectedSchedulesToDelete(new Set(upcomingIds));
    } else {
      setSelectedSchedulesToDelete(new Set());
    }
  };

  // Hàm xóa các lịch đã chọn
  const handleDeleteSelectedSchedules = () => {
    if (selectedSchedulesToDelete.size === 0) {
      alert("Vui lòng chọn ít nhất một lịch để xóa!");
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedSchedulesToDelete.size} lịch đã chọn không? Hành động này không thể hoàn tác!`)) {
      return;
    }

    // Lọc ra các lịch được chọn để xóa
    const schedulesToDelete = schedule.filter(item => selectedSchedulesToDelete.has(item.id));

    // Thêm ID của các lịch từ server vào deletedIds
    const serverScheduleIds = schedulesToDelete
      .filter(item => !item.isNewItem)
      .map(item => item.id);
    
    setDeletedIds(prev => [...prev, ...serverScheduleIds]);

    // Xóa các lịch đã chọn khỏi schedule
    const remainingSchedules = schedule.filter(item => !selectedSchedulesToDelete.has(item.id));
    setSchedule(remainingSchedules);

    // Cập nhật danh sách lịch mới (loại bỏ các lịch mới đã chọn để xóa)
    const updatedNewItems = newScheduleItems.filter(item => !selectedSchedulesToDelete.has(item.id));
    setNewScheduleItems(updatedNewItems);

    // Cập nhật danh sách lịch đã cập nhật (loại bỏ các lịch đã cập nhật được chọn để xóa)
    const updatedUpdatedItems = updatedScheduleItems.filter(item => !selectedSchedulesToDelete.has(item.id));
    setUpdatedScheduleItems(updatedUpdatedItems);

    // Reset danh sách lịch được chọn
    setSelectedSchedulesToDelete(new Set());

    alert(`Đã đánh dấu xóa ${schedulesToDelete.length} lịch. Nhấn "Hoàn tất" để lưu thay đổi.`);
  };
  const handleComplete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn lưu tất cả thay đổi không?")) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Chỉ gửi những lịch mới được thêm vào (không bao gồm lịch không thay đổi)
      const itemsToSync = newScheduleItems.filter(
        (item) => !isItemInPast(item)
      );

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

      console.log("Data being sent to server:", {
        channelId: selectedChannel,
        scheduleList: scheduleList,
        deletedIds: deletedIds,
      });
      const result = await axios.post(`${API_BASE_URL}/schedule/sync`, {
        channelId: selectedChannel,
        scheduleList: scheduleList,
        deletedIds: deletedIds, // Thêm trường deletedIds
      });
      if (result.data.code === 200) {
        alert("Lưu lịch phát sóng thành công!");
        // Reset tất cả danh sách theo dõi thay đổi sau khi lưu thành công
        setNewScheduleItems([]);
        setUpdatedScheduleItems([]);
        setDeletedIds([]);
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

  // Kiểm tra user có role ADMIN không
  const isAdmin = () => {
    try {
      return (
        keycloak.hasRealmRole("ADMIN") || keycloak.hasResourceRole("ADMIN")
      );
    } catch (error) {
      console.error("Error checking admin role:", error);
      return false;
    }
  }; // Hàm mở modal dừng lịch hiện tại
  const openStopCurrentModal = (item) => {
    // Kiểm tra quyền ADMIN
    if (!isAdmin()) {
      alert("Chỉ có ADMIN mới được phép dừng chương trình hiện tại!");
      return;
    }

    if (item && isItemCurrent(item)) {
      setCurrentPlayingItem(item);
      setIsStopModalOpen(true);
    } else {
      alert("Không có chương trình nào đang phát!");
    }
  };
  // Hàm xử lý dừng lịch hiện tại
  const handleStopCurrent = async (playAds) => {
    if (!currentPlayingItem) return;

    setLoading(true);
    setError(null);
    try {
      console.log("Stopping current schedule:", {
        channelId: selectedChannel,
        scheduleId: currentPlayingItem.id,
        playAds: playAds,
      });
      const result = await axios.post(`${API_BASE_URL}/schedule/stop-current`, {
        channelId: selectedChannel,
        scheduleId: currentPlayingItem.id,
        playAds: playAds,
      });

      if (result.data.code === 200) {
        const replacementText = playAds ? "quảng cáo" : "nội dung mặc định";
        alert(
          `Đã dừng chương trình "${currentPlayingItem.title}" và chuyển sang phát ${replacementText}!`
        );

        // Reset state
        setCurrentPlayingItem(null);
        setIsStopModalOpen(false);

        // Refresh schedule from server
        fetchScheduleForChannel(selectedChannel, selectedDate);
      } else {
        setError(result.data.message || "Không thể dừng chương trình");
      }
    } catch (error) {
      console.error("Error stopping current schedule:", error);
      setError(
        "Lỗi khi dừng chương trình: " + (error.message || "Không xác định")
      );
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
    const now = currentTime;
    const startTime = dayjs(item.startTime);
    const endTime = dayjs(item.endTime);
    return now.isAfter(startTime) && now.isBefore(endTime);
  };

  // Sử dụng hàm mới, nhưng giữ tên hàm cũ để code khác không bị ảnh hưởng
  const isItemCurrent = checkItemIsCurrent;
  const handleDateChange = (date) => {
    if (
      (newScheduleItems.length > 0 || updatedScheduleItems.length > 0 || deletedIds.length > 0) &&
      !window.confirm(
        "Bạn có thay đổi chưa lưu. Tiếp tục sẽ mất các thay đổi này. Bạn có muốn tiếp tục không?"
      )
    ) {
      return;
    }
    setSelectedDate(date);
    setHasChanges(false);
    setNewScheduleItems([]); // Reset danh sách lịch mới khi đổi ngày
    setUpdatedScheduleItems([]); // Reset danh sách lịch đã cập nhật khi đổi ngày
    setDeletedIds([]); // Reset danh sách ID đã xóa khi đổi ngày
    setSelectedVodSchedules(new Set()); // Reset danh sách VOD được chọn
    setVodMapping(new Map()); // Reset mapping VOD
    setExistingVods([]); // Reset danh sách VOD đã có
    setSelectedSchedulesToDelete(new Set()); // Reset danh sách lịch được chọn để xóa
  };

  // Hàm lấy danh sách VOD đã có từ server
  const fetchExistingVods = async (scheduleIds) => {
    if (!scheduleIds || scheduleIds.length === 0) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/vods`, {
        params: {
          scheduleIds: scheduleIds.join(","),
        },
      });

      if (response.data.code === 200) {
        const vods = response.data.data || [];
        setExistingVods(vods);

        // Cập nhật selectedVodSchedules và vodMapping dựa trên dữ liệu từ server
        const newSelectedVodSchedules = new Set();
        const newVodMapping = new Map();

        vods.forEach((vod) => {
          if (vod.scheduleId) {
            newSelectedVodSchedules.add(vod.scheduleId);
            newVodMapping.set(vod.scheduleId, vod.id);
          }
        });

        setSelectedVodSchedules(newSelectedVodSchedules);
        setVodMapping(newVodMapping);
      }
    } catch (error) {
      console.error("Error fetching existing VODs:", error);
      // Không hiển thị lỗi để không làm phiền user, chỉ log
    }
  };
  // Hàm xử lý tạo VOD từ lịch
  const handleCreateVod = async (scheduleId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/vods`, {
        scheduleId: scheduleId,
      });

      if (response.data.code === 200) {
        const vodData = response.data.data; // Lấy dữ liệu VOD từ response
        const vodId = vodData.id; // Giả sử API trả về VOD object với ID

        // Thêm schedule ID vào danh sách được chọn và lưu mapping
        setSelectedVodSchedules((prev) => new Set(prev.add(scheduleId)));
        setVodMapping((prev) => new Map(prev.set(scheduleId, vodId)));

        // Cập nhật existingVods
        setExistingVods((prev) => [...prev, { ...vodData, scheduleId }]);
      }
    } catch (error) {
      console.error("Error creating VOD:", error);
      setError(
        "Lỗi khi tạo VOD: " +
          (error.response?.data?.message || error.message || "Không xác định")
      );
    }
  }; // Hàm xử lý hủy VOD
  const handleCancelVod = async (scheduleId) => {
    const vodId = vodMapping.get(scheduleId);
    if (!vodId) {
      setError("Không tìm thấy VOD ID để hủy");
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/vods/${vodId}`);

      // Xóa schedule ID khỏi danh sách được chọn và mapping
      setSelectedVodSchedules((prev) => {
        const newSet = new Set(prev);
        newSet.delete(scheduleId);
        return newSet;
      });
      setVodMapping((prev) => {
        const newMap = new Map(prev);
        newMap.delete(scheduleId);
        return newMap;
      });
      // Cập nhật existingVods
      setExistingVods((prev) =>
        prev.filter((vod) => vod.scheduleId !== scheduleId)
      );
    } catch (error) {
      console.error("Error canceling VOD:", error);
      setError(
        "Lỗi khi hủy VOD: " +
          (error.response?.data?.message || error.message || "Không xác định")
      );
    }
  }; // Hàm xử lý khi checkbox VOD được thay đổi
  const handleVodCheckboxChange = async (schedule, isChecked) => {
    // Chỉ cho phép thay đổi với lịch chưa phát và không đang phát
    const isPast = isItemInPast(schedule);
    const isCurrent = isItemCurrent(schedule);

    if (isPast || isCurrent) {
      // Không cho phép thay đổi với lịch đã phát hoặc đang phát
      return;
    }

    if (isChecked) {
      await handleCreateVod(schedule.id);
    } else {
      await handleCancelVod(schedule.id);
    }
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
                  onClick={handleDeleteSelectedSchedules}
                  disabled={selectedSchedulesToDelete.size === 0}
                  className={`flex items-center px-4 py-2 ${
                    selectedSchedulesToDelete.size > 0
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-gray-600 cursor-not-allowed"
                  } text-white rounded transition`}
                  title="Xóa các lịch đã chọn"
                >
                  <FaTrashAlt className="mr-2" />
                  Xóa các lịch đã chọn ({selectedSchedulesToDelete.size})
                </button>
                <button
                  onClick={handleComplete}
                  disabled={
                    (!newScheduleItems.length && !updatedScheduleItems.length && !deletedIds.length) || loading
                  }
                  className={`flex items-center px-4 py-2 ${
                    (newScheduleItems.length || updatedScheduleItems.length || deletedIds.length) && !loading
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-200 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={
                        schedule.filter(item => !isItemInPast(item) && !isItemCurrent(item)).length > 0 &&
                        schedule.filter(item => !isItemInPast(item) && !isItemCurrent(item))
                          .every(item => selectedSchedulesToDelete.has(item.id))
                      }
                      onChange={(e) => handleSelectAllUpcoming(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 focus:ring-2"
                      title="Chọn tất cả lịch sắp tới"
                    />
                  </th>
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-200 uppercase tracking-wider">
                    Cắt VOD
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-200 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {" "}
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
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
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {!isPast && !isCurrent ? (
                              <input
                                type="checkbox"
                                checked={selectedSchedulesToDelete.has(item.id)}
                                onChange={(e) => handleScheduleSelectionChange(item.id, e.target.checked)}
                                className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 focus:ring-2"
                                title="Chọn lịch này để xóa"
                              />
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            <div>
                              {dayjs(item.startTime).format("HH:mm:ss")} -{" "}
                              {dayjs(item.endTime).format("HH:mm:ss")}
                              {checkItemIsCurrent(item) && (
                                <div className="flex items-center mt-1">
                                  <span className="text-xs bg-red-500 text-white px-2 py-1 rounded animate-pulse">
                                    🔴 Đang chiếu
                                  </span>
                                </div>
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
                          </td>{" "}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {/* Checkbox cho chức năng cắt VOD - hiển thị cho tất cả lịch */}
                            {!item.isNewItem ? (
                              <input
                                type="checkbox"
                                checked={selectedVodSchedules.has(item.id)}
                                onChange={(e) =>
                                  handleVodCheckboxChange(
                                    item,
                                    e.target.checked
                                  )
                                }
                                disabled={loading || isPast || isCurrent}
                                className={`w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 focus:ring-2 ${
                                  isPast || isCurrent
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                                title={
                                  isPast
                                    ? "Lịch đã phát - không thể thay đổi"
                                    : isCurrent
                                    ? "Lịch đang phát - không thể thay đổi"
                                    : "Cắt VOD từ lịch này"
                                }
                              />
                            ) : (
                              <span className="text-gray-500 text-sm">
                                Lịch mới
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end items-center space-x-2">
                              {isCurrent ? (
                                // Nút dừng cho lịch đang phát
                                <>
                                  <button
                                    onClick={() => openEditModal(item)}
                                    className="text-gray-400 hover:text-gray-300"
                                    title="Chỉ xem (đang phát)"
                                  >
                                    <FaEye />
                                  </button>
                                  {isAdmin() ? (
                                    <button
                                      onClick={() => openStopCurrentModal(item)}
                                      className="text-red-400 hover:text-red-300"
                                      title="Dừng chương trình đang phát"
                                    >
                                      <FaStop />
                                    </button>
                                  ) : (
                                    <div className="relative group">
                                      <button
                                        disabled
                                        className="text-gray-500 cursor-not-allowed"
                                        title="Chỉ ADMIN mới có thể dừng chương trình"
                                      >
                                        <FaStop />
                                      </button>
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                        Chỉ ADMIN mới có thể dừng
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : isPast ? (
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
                                    className="text-indigo-400 hover:text-indigo-300"
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
                            </div>
                          </td>
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-gray-300"
                    >
                      Không có dữ liệu lịch phát sóng
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>{" "}
          {(newScheduleItems.length > 0 || updatedScheduleItems.length > 0 || deletedIds.length > 0) && (
            <div className="mt-4 p-3 bg-amber-800 bg-opacity-50 text-amber-100 rounded-lg">
              Lưu ý: Bạn có thay đổi chưa được lưu. Nhấn "Hoàn tất" để lưu thay
              đổi.
              {(newScheduleItems.length > 0 || updatedScheduleItems.length > 0 || deletedIds.length > 0) && (
                <div className="mt-2 text-sm">
                  {newScheduleItems.length > 0 && <div>• Lịch mới: {newScheduleItems.length}</div>}
                  {updatedScheduleItems.length > 0 && <div>• Lịch đã cập nhật: {updatedScheduleItems.length}</div>}
                  {deletedIds.length > 0 && <div>• Lịch đã xóa: {deletedIds.length}</div>}
                </div>
              )}
            </div>
          )}
          {/* Hiển thị thông báo lỗi nếu có */}
          {error && (
            <div className="mt-4 p-4 bg-red-900 bg-opacity-50 text-red-100 rounded-lg border border-red-800">
              <p className="font-medium">Lỗi:</p>
              <p>{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Sử dụng component ScheduleFormModal */}{" "}
      <ScheduleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        formData={formData}
        setFormData={setFormData}
        isEditing={isEditing}
        currentItem={currentItem}
        isItemInPast={isItemInPast}
        mode={modalMode}
      />
      {/* Modal dừng lịch hiện tại */}
      <StopCurrentModal
        isOpen={isStopModalOpen}
        onClose={() => setIsStopModalOpen(false)}
        onConfirm={handleStopCurrent}
        currentItem={currentPlayingItem}
        loading={loading}
      />
    </div>
  );
}

export default Schedule;
