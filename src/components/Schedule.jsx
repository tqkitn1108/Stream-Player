import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import axios from 'axios';
import { FaEdit, FaTrashAlt, FaPlus, FaCalendarAlt, FaClock } from 'react-icons/fa';

function Schedule() {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleChannelSelect = (channelId) => {
    setSelectedChannel(channelId);
    fetchScheduleForChannel(channelId);
  };

  const fetchScheduleForChannel = (channelId) => {
    // Mock API call - trong thực tế gọi API thực
    // axios.get(`http://localhost:8081/api/v1/schedule/${channelId}`)
    //   .then(response => setSchedule(response.data))
    //   .catch(error => console.error("Error fetching schedule:", error));

    // Sử dụng dữ liệu mock cho demo
    const mockScheduleData = [
      { id: 1, time: "00:00", program: "Phim đêm khuya", videoUrl: "http://example.com/video1.mp4", description: "Phim kinh dị dành cho người xem trên 18 tuổi" },
      { id: 2, time: "02:00", program: "Thời sự đêm", videoUrl: "http://example.com/video2.mp4", description: "Bản tin cuối ngày tổng hợp" },
      { id: 3, time: "04:00", program: "Phim tài liệu", videoUrl: "http://example.com/video3.mp4", description: "Khám phá thế giới động vật" },
      { id: 4, time: "06:00", program: "Chào buổi sáng", videoUrl: "http://example.com/video4.mp4", description: "Chương trình dành cho buổi sáng với nhiều thông tin bổ ích" },
      { id: 5, time: "08:00", program: "Tin tức sáng", videoUrl: "http://example.com/video5.mp4", description: "Các tin tức nóng hổi trong nước và quốc tế" },
      { id: 6, time: "10:00", program: "Phim truyền hình", videoUrl: "http://example.com/video6.mp4", description: "Tập mới nhất của bộ phim đang hot" },
      { id: 7, time: "12:00", program: "Thời sự trưa", videoUrl: "http://example.com/video7.mp4", description: "Tổng hợp tin tức buổi trưa" },
      { id: 8, time: "14:00", program: "Phim giải trí", videoUrl: "http://example.com/video8.mp4", description: "Chương trình giải trí phổ biến" }
    ];

    setSchedule(mockScheduleData);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isEditing && currentItem) {
      // Update existing item
      // axios.put(`http://localhost:8081/api/v1/schedule/${selectedChannel}/${currentItem.id}`, formData)
      //   .then(() => {
      //     fetchScheduleForChannel(selectedChannel);
      //     setIsModalOpen(false);
      //   })
      //   .catch(error => console.error("Error updating schedule item:", error));
      
      // Mock update
      const updatedSchedule = schedule.map(item => 
        item.id === currentItem.id ? { ...item, ...formData } : item
      );
      setSchedule(updatedSchedule);
      setIsModalOpen(false);
    } else {
      // Create new item
      // axios.post(`http://localhost:8081/api/v1/schedule/${selectedChannel}`, formData)
      //   .then(() => {
      //     fetchScheduleForChannel(selectedChannel);
      //     setIsModalOpen(false);
      //   })
      //   .catch(error => console.error("Error creating schedule item:", error));
      
      // Mock create
      const newItem = {
        id: Date.now(), // For mock purposes
        ...formData
      };
      setSchedule([...schedule, newItem]);
      setIsModalOpen(false);
    }
  };

  const handleDelete = (itemId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa mục này không?")) {
      // axios.delete(`http://localhost:8081/api/v1/schedule/${selectedChannel}/${itemId}`)
      //   .then(() => {
      //     fetchScheduleForChannel(selectedChannel);
      //   })
      //   .catch(error => console.error("Error deleting schedule item:", error));
      
      // Mock delete
      const updatedSchedule = schedule.filter(item => item.id !== itemId);
      setSchedule(updatedSchedule);
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

          <div className="mb-8">
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

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl text-white">Lịch phát sóng</h2>
            <button
              onClick={openAddModal}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              <FaPlus className="mr-2" />
              Thêm mới
            </button>
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
                  schedule.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-650 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {item.time}
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
                        <button
                          onClick={() => openEditModal(item)}
                          className="text-indigo-400 hover:text-indigo-300 mr-4"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <FaTrashAlt />
                        </button>
                      </td>
                    </tr>
                  ))
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
        </div>
      </div>

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">
              {isEditing ? "Chỉnh sửa" : "Thêm mới"} lịch phát sóng
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-200 mb-2">Thời gian</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
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
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                >
                  {isEditing ? "Cập nhật" : "Thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Schedule;