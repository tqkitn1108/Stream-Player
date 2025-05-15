import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import axios from 'axios';
import { FaEdit, FaTrashAlt, FaPlus, FaCalendarAlt, FaClock, FaSave, FaCheck, FaEye } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function Schedule() {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedule, setSchedule] = useState([]);
  const [originalSchedule, setOriginalSchedule] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Mock data cho channels
  const channels = [
    { id: 'hls', name: 'Kênh Live 1' },
    { id: 'channel2', name: 'Kênh Live 2' },
    { id: 'channel3', name: 'Kênh Live 3' }
  ];

  // Form state
  const [formData, setFormData] = useState({
    time: '',
    program: '',
    videoUrl: '',
    description: ''
  });

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

  const handleChannelSelect = (channelId) => {
    if (hasChanges && !window.confirm("Bạn có thay đổi chưa lưu. Tiếp tục sẽ mất các thay đổi này. Bạn có muốn tiếp tục không?")) {
      return;
    }
    
    setSelectedChannel(channelId);
    setHasChanges(false);
  };

  const formatDateForAPI = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const fetchScheduleForChannel = (channelId, date) => {
    // API call trong thực tế
    // const dateStr = formatDateForAPI(date);
    // axios.get(`http://localhost:8081/api/v1/schedule/${channelId}?date=${dateStr}`)
    //   .then(response => {
    //     setSchedule(response.data);
    //     setOriginalSchedule(JSON.parse(JSON.stringify(response.data)));
    //   })
    //   .catch(error => console.error("Error fetching schedule:", error));

    // Sử dụng dữ liệu mock cho demo
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDateCopy = new Date(date);
    selectedDateCopy.setHours(0, 0, 0, 0);
    
    const isToday = selectedDateCopy.getTime() === today.getTime();
    const isPast = selectedDateCopy < today;
    
    // Định dạng ngày tháng cho mock data
    const dateStr = formatDateForAPI(date);
    
    const mockScheduleData = [
      { id: 1, date: dateStr, time: "00:00", program: "Phim đêm khuya", videoUrl: "http://example.com/video1.mp4", description: "Phim kinh dị dành cho người xem trên 18 tuổi" },
      { id: 2, date: dateStr, time: "02:00", program: "Thời sự đêm", videoUrl: "http://example.com/video2.mp4", description: "Bản tin cuối ngày tổng hợp" },
      { id: 3, date: dateStr, time: "04:00", program: "Phim tài liệu", videoUrl: "http://example.com/video3.mp4", description: "Khám phá thế giới động vật" },
      { id: 4, date: dateStr, time: "06:00", program: "Chào buổi sáng", videoUrl: "http://example.com/video4.mp4", description: "Chương trình dành cho buổi sáng với nhiều thông tin bổ ích" },
      { id: 5, date: dateStr, time: "08:00", program: "Tin tức sáng", videoUrl: "http://example.com/video5.mp4", description: "Các tin tức nóng hổi trong nước và quốc tế" },
      { id: 6, date: dateStr, time: "10:00", program: "Phim truyền hình", videoUrl: "http://example.com/video6.mp4", description: "Tập mới nhất của bộ phim đang hot" },
      { id: 7, date: dateStr, time: "12:00", program: "Thời sự trưa", videoUrl: "http://example.com/video7.mp4", description: "Tổng hợp tin tức buổi trưa" },
      { id: 8, date: dateStr, time: "14:00", program: "Phim giải trí", videoUrl: "http://example.com/video8.mp4", description: "Chương trình giải trí phổ biến" }
    ];

    setSchedule(mockScheduleData);
    setOriginalSchedule(JSON.parse(JSON.stringify(mockScheduleData)));
    setHasChanges(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({
      time: '',
      program: '',
      videoUrl: '',
      description: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setIsEditing(true);
    setCurrentItem(item);
    setFormData({
      time: item.time,
      program: item.program,
      videoUrl: item.videoUrl || '',
      description: item.description || ''
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    if (isEditing && currentItem) {
      // Update existing item (local only until Complete is clicked)
      const updatedSchedule = schedule.map(item => 
        item.id === currentItem.id ? { ...item, ...formData } : item
      );
      setSchedule(updatedSchedule);
    } else {
      // Create new item (local only until Complete is clicked)
      const newItem = {
        id: Date.now(), // For mock purposes
        date: formatDateForAPI(selectedDate),
        ...formData
      };
      setSchedule([...schedule, newItem]);
    }
    
    setIsModalOpen(false);
    setHasChanges(true);
  };

  const handleDelete = (itemId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa mục này không?")) {
      // Delete item (local only until Complete is clicked)
      const updatedSchedule = schedule.filter(item => item.id !== itemId);
      setSchedule(updatedSchedule);
      setHasChanges(true);
    }
  };

  const handleComplete = () => {
    if (window.confirm("Bạn có chắc chắn muốn lưu tất cả thay đổi không?")) {
      // API call để lưu thay đổi
      // axios.put(`http://localhost:8081/api/v1/schedule/${selectedChannel}/${formatDateForAPI(selectedDate)}`, schedule)
      //   .then(response => {
      //     alert("Lưu lịch phát sóng thành công!");
      //     setOriginalSchedule(JSON.parse(JSON.stringify(schedule)));
      //     setHasChanges(false);
      //   })
      //   .catch(error => console.error("Error saving schedule:", error));
      
      // Mock success
      alert("Lưu lịch phát sóng thành công!");
      setOriginalSchedule(JSON.parse(JSON.stringify(schedule)));
      setHasChanges(false);
    }
  };

  const isItemInPast = (item) => {
    const today = new Date();
    const itemDate = new Date(selectedDate);
    const [hours, minutes] = item.time.split(':').map(Number);
    itemDate.setHours(hours, minutes, 0, 0);
    return itemDate < today;
  };

  const isItemCurrent = (item, index) => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDateCopy = new Date(selectedDate);
    selectedDateCopy.setHours(0, 0, 0, 0);
    
    // Chỉ kiểm tra cho ngày hiện tại
    if (selectedDateCopy.getTime() !== today.getTime()) {
      return false;
    }
    
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeStr = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;
    
    return currentTimeStr >= item.time && (index === schedule.length - 1 || currentTimeStr < schedule[index + 1]?.time);
  };

  const handleDateChange = (date) => {
    if (hasChanges && !window.confirm("Bạn có thay đổi chưa lưu. Tiếp tục sẽ mất các thay đổi này. Bạn có muốn tiếp tục không?")) {
      return;
    }
    setSelectedDate(date);
    setHasChanges(false);
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
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
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
            <h2 className="text-2xl text-white">Lịch phát sóng - {selectedDate.toLocaleDateString('vi-VN')}</h2>
            <div className="flex space-x-3">
              <button
                onClick={openAddModal}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                disabled={new Date(selectedDate) < new Date().setHours(0, 0, 0, 0)}
              >
                <FaPlus className="mr-2" />
                Thêm mới
              </button>
              <button
                onClick={handleComplete}
                disabled={!hasChanges}
                className={`flex items-center px-4 py-2 ${
                  hasChanges ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-600 cursor-not-allowed'
                } text-white rounded transition`}
              >
                <FaCheck className="mr-2" />
                Hoàn tất
              </button>
            </div>
          </div>

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
                    Video URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-200 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {schedule.length > 0 ? (
                  schedule
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((item, index) => {
                      const isPast = isItemInPast(item);
                      const isCurrent = isItemCurrent(item, index);

                      return (
                        <tr 
                          key={item.id} 
                          className={`
                            ${isPast ? 'opacity-70' : 'hover:bg-gray-650'} 
                            ${isCurrent ? 'bg-indigo-800 border-l-4 border-indigo-500' : ''} 
                            transition
                          `}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {item.time}
                            {isCurrent && (
                              <span className="ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded">
                                Đang chiếu
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                            {item.program}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200 truncate max-w-xs">
                            {item.videoUrl}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                            {item.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {isPast ? (
                              // Chỉ cho phép xem với lịch đã phát
                              <button
                                onClick={() => openEditModal(item)}
                                className="text-gray-400 hover:text-gray-300 cursor-default"
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
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-300">
                      Không có dữ liệu lịch phát sóng
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {hasChanges && (
            <div className="mt-4 p-3 bg-amber-800 bg-opacity-50 text-amber-100 rounded-lg">
              Lưu ý: Bạn có thay đổi chưa được lưu. Nhấn "Hoàn tất" để lưu thay đổi.
            </div>
          )}
        </div>
      </div>

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">
              {isEditing ? (isItemInPast(currentItem) ? "Xem" : "Chỉnh sửa") : "Thêm mới"} lịch phát sóng
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-200 mb-2">Thời gian</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={isEditing && isItemInPast(currentItem)}
                />
              </div>
              
              <div>
                <label className="block text-gray-200 mb-2">Chương trình</label>
                <input
                  type="text"
                  name="program"
                  value={formData.program}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  disabled={isEditing && isItemInPast(currentItem)}
                />
              </div>
              
              <div>
                <label className="block text-gray-200 mb-2">Video URL</label>
                <input
                  type="text"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="http://example.com/video.mp4"
                  disabled={isEditing && isItemInPast(currentItem)}
                />
              </div>
              
              <div>
                <label className="block text-gray-200 mb-2">Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                  disabled={isEditing && isItemInPast(currentItem)}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition"
                >
                  {isEditing && isItemInPast(currentItem) ? "Đóng" : "Hủy"}
                </button>
                
                {(!isEditing || !isItemInPast(currentItem)) && (
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
      )}
    </div>
  );
}

export default Schedule;