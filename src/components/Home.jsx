import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import fc1 from "../assets/fc1.png";
import vod from "../assets/vod.png";

function VideoList() {
  const [videos, setVideos] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/v1` || "http://34.126.102.97:8080/api/v1";

  // Sửa phần bannerSlides trong VideoList.jsx
  const bannerSlides = [
    {
      id: 1,
      image: fc1, // Sử dụng ảnh local đã import
      title: "Khám phá bộ sưu tập phim hành động mới nhất",
    },
    {
      id: 2,
      image: "https://picsum.photos/1920/1080?random=1", // Thay thế bằng ảnh từ picsum
      title: "Những câu chuyện cảm động nhất",
    },
    {
      id: 3,
      image: "https://picsum.photos/1920/1080?random=2", // Thay thế bằng ảnh từ picsum
      title: "Giải trí cho mọi lứa tuổi",
    },  ];

  useEffect(() => {
    // Lấy danh sách VOD từ API
    axios
      .get("http://167.172.78.132:8080/api/v1/videos")
      .then((response) => setVideos(response.data))
      .catch((error) => console.error("Error fetching videos:", error));

    // Lấy danh sách channels từ API
    fetchChannels();
  }, []);
  const fetchChannels = async () => {
    setLoadingChannels(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/channels`);
      if (response.data.code === 200) {
        const channelsData = response.data.data || [];
        // Map channels data với thumbnail từ API và HLS URL
        const mappedChannels = channelsData.map((channel) => ({
          id: channel.id,
          title: channel.channelName,
          hlsUrl: `${import.meta.env.VITE_BACKEND_URL}/${channel.id}/master.m3u8`,
          thumbnail: channel.thumbnail || fc1, // Fallback về fc1 nếu không có thumbnail
        }));
        setChannels(mappedChannels);
      } else {
        console.error("Error fetching channels:", response.data.message);
        setChannels([]); // Set empty array nếu API fail
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
      setChannels([]); // Set empty array nếu có lỗi
    } finally {
      setLoadingChannels(false);
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Main Content - điều chỉnh padding-top để phù hợp với navbar */}
      <div className="pt-16 flex-grow">
        {/* Banner with Slider - Full Width */}
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={0}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000 }}
          className="w-full mb-8"
        >
          {bannerSlides.map((slide) => (
            <SwiperSlide key={slide.id}>
              <div className="relative">
                <img
                  src={slide.image}
                  alt="Banner"
                  className="w-full h-96 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = fc1; // Fallback nếu ảnh không load được
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">
                      FAST360
                    </h1>
                    <p className="text-xl text-white">{slide.title}</p>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Main Content */}
        <div className="container mx-auto px-6">
          {/* Header - Loại bỏ nút Upload */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Khám phá nội dung</h1>
          </div>          {/* Live Channels Section */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Kênh Live
            </h2>            {loadingChannels ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : channels.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {channels.map((channel) => (
                  <Link
                    key={channel.id}
                    to={`/live/${channel.id}`}
                    className="bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow transform hover:-translate-y-1 hover:scale-105 duration-300"
                  >
                    <img
                      src={channel.thumbnail}
                      alt={channel.title}
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = fc1; // Fallback nếu thumbnail không load được
                      }}
                    />
                    <div className="p-4">
                      <h3 className="text-xl font-semibold text-white">
                        {channel.title}
                      </h3>
                      <div className="flex items-center mt-2">
                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                        <p className="text-gray-300">Live Stream</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-400">Không có kênh live nào</p>
              </div>
            )}
          </div>

          {/* Videos Section */}
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-white mb-6">Videos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {videos.map((video) => (
                <Link
                  key={video.id}
                  to={`/video/${video.id}`}
                  className="bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow transform hover:-translate-y-1 hover:scale-105 duration-300"
                >
                  <img
                    src={video.thumbnail || vod} // Sử dụng ảnh local nếu không có thumbnail
                    alt={video.title || `Video ${video.id}`}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-xl font-semibold text-white">
                      {video.title || `Video ${video.id}`}
                    </h3>
                    <p className="text-gray-300 mt-2">Click để xem</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default VideoList;
