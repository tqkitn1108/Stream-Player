import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "videojs-contrib-quality-levels";
import "jb-videojs-hls-quality-selector";
import axios from "axios";
import Navbar from "./Navbar";
import dayjs from "dayjs";
import 'dayjs/locale/vi';

// Cấu hình dayjs
dayjs.locale('vi');

function VideoPlayer() {
  const { videoId, channelId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  
  // State cho lịch phát sóng
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isLive = !!channelId;
  const hlsUrl = isLive
    ? `http://167.172.78.132:8080/${channelId}/master.m3u8`
    : videoId ? `http://167.172.78.132:8080/vod/${videoId}.m3u8` : "";

  useEffect(() => {
    // Fetch schedule for live channel
    if (isLive) {
      fetchChannelSchedule(channelId);
    }
  }, [channelId, isLive]);

  const fetchChannelSchedule = async (channelId) => {
    setLoading(true);
    setError(null);
    
    try {
      // Lấy lịch từ đầu ngày hiện tại đến cuối ngày
      const today = dayjs().startOf('day');
      const startTime = today.format('YYYY-MM-DDT00:00:00');
      const endTime = today.format('YYYY-MM-DDT23:59:59');
      
      const response = await axios.get(`http://localhost:8080/api/v1/schedule`, {
        params: {
          channelId: 1,
          startTime: startTime,
          endTime: endTime,
          page: 0,
          size: 100
        }
      });

      if (response.data.code === 200) {
        // Sắp xếp lịch theo thời gian bắt đầu
        const sortedSchedule = (response.data.data || []).sort(
          (a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf()
        );
        setSchedule(sortedSchedule);
      } else {
        setError("Không thể tải dữ liệu lịch phát sóng");
        console.error("API Error:", response.data);
      }
    } catch (error) {
      setError("Lỗi khi lấy lịch phát sóng");
      console.error("Error fetching schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const videoElement = videoRef.current;

    if (videoElement && !playerRef.current) {
      const player = (playerRef.current = videojs(videoElement, {
        autoplay: true,
        controls: true,
        responsive: true,
        fluid: false,
        aspectRatio: '16:9',
        liveui: true,
        sources: [{ src: hlsUrl, type: "application/x-mpegURL" }],
        controlBar: {
          liveDisplay: true,
          seekToLive: true,
          progressControl: {
            seekBar: true,
          },
        },
      }));

      try {
        player.hlsQualitySelector({
          displayCurrentQuality: true,
          vjsIconClass: "vjs-icon-cog",
        });
      } catch (error) {
        console.error("Failed to initialize HLS quality selector:", error);
      }

      player.on("error", () => {
        console.error("Video.js error:", player.error());
      });
    }

    return () => {
      if (playerRef.current && !document.contains(videoElement)) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [hlsUrl, isLive]);

  // Kiểm tra chương trình hiện tại đang phát sóng
  const isItemCurrent = (item) => {
    const now = dayjs();
    const startTime = dayjs(item.startTime);
    const endTime = dayjs(item.endTime);
    return now.isAfter(startTime) && now.isBefore(endTime);
  };

  // Format thời gian hiển thị
  const formatTime = (dateTimeString) => {
    return dayjs(dateTimeString).format('HH:mm:ss');
  };

  return (
    <div className="bg-gray-900 min-h-screen">
      <Navbar />
      <div className="container mx-auto p-4 pt-24">
        <button
          onClick={() => navigate("/")}
          className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Quay lại
        </button>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Video Player */}
          <div className="lg:w-2/3">
            <div data-vjs-player className="rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="video-js vjs-default-skin vjs-big-play-centered"
              />
            </div>
            
            {!isLive && videoId && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <h2 className="text-2xl font-bold text-white mb-2">Thông tin video</h2>
                <p className="text-gray-300">Video ID: {videoId}</p>
              </div>
            )}
          </div>

          {/* Schedule Section - Hiển thị bên phải khi là kênh live */}
          {isLive && (
            <div className="lg:w-1/3 bg-gray-800 p-4 rounded-lg self-start">
              <h2 className="text-2xl font-bold text-white mb-4">Lịch phát sóng hôm nay</h2>
              
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : error ? (
                <div className="p-4 bg-red-900 bg-opacity-50 text-red-100 rounded">
                  {error}
                </div>
              ) : (
                <div className="overflow-y-auto" style={{ maxHeight: "500px" }}>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-700 text-left text-gray-200">
                        <th className="py-2 px-3 w-1/4">Thời gian</th>
                        <th className="py-2 px-3">Chương trình</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                      {schedule.length > 0 ? (
                        schedule.map((item) => {
                          const isCurrent = isItemCurrent(item);
                          
                          return (
                            <tr 
                              key={item.id} 
                              className={`${
                                isCurrent 
                                  ? 'bg-indigo-800 border-l-4 border-indigo-500' 
                                  : 'hover:bg-gray-650'
                              }`}
                            >
                              <td className="py-3 px-3 font-medium text-gray-200">
                                {formatTime(item.startTime)}
                                {isCurrent && (
                                  <span className="block mt-1 text-xs bg-red-500 text-white px-1 py-0.5 rounded text-center">
                                    Đang chiếu
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-gray-200">
                                {item.title}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="2" className="py-4 px-3 text-center text-gray-300">
                            Không có lịch phát sóng hôm nay
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;