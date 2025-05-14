import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "videojs-contrib-quality-levels";
import "jb-videojs-hls-quality-selector";
import axios from "axios";
import Navbar from "./Navbar";

function VideoPlayer() {
  const { videoId, channelId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  
  // Dữ liệu lịch phát từ 0h đến 24h
  const [schedule, setSchedule] = useState([
    { "time": "00:00", "program": "Phim đêm khuya" },
    { "time": "02:00", "program": "Thời sự đêm" },
    { "time": "04:00", "program": "Phim tài liệu" },
    { "time": "06:00", "program": "Chào buổi sáng" },
    { "time": "08:00", "program": "Tin tức sáng" },
    { "time": "10:00", "program": "Phim truyền hình" },
    { "time": "12:00", "program": "Thời sự trưa" },
    { "time": "14:00", "program": "Phim giải trí" },
    { "time": "16:00", "program": "Show giải trí" },
    { "time": "18:00", "program": "Thời sự tối" },
    { "time": "20:00", "program": "Phim giờ vàng" },
    { "time": "22:00", "program": "Thể thao đêm" }
  ]);

  const isLive = !!channelId;
  const hlsUrl = isLive
    ? `http://167.172.78.132:8080/${channelId}/master.m3u8`
    : videoId ? `http://167.172.78.132:8080/vod/${videoId}.m3u8` : "";

  useEffect(() => {
    // Fetch schedule for live channel
    if (isLive) {
      axios
        .get(`http://localhost:8081/api/v1/schedule/${channelId}`)
        .then((response) => setSchedule(response.data))
        .catch((error) => console.error("Error fetching schedule:", error));
    }
  }, [channelId, isLive]);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (videoElement && !playerRef.current) {
      const player = (playerRef.current = videojs(videoElement, {
        autoplay: true,
        controls: true,
        responsive: true,
        fluid: false, // Thay đổi từ true thành false
        aspectRatio: '16:9', // Thêm tỷ lệ khung hình
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

  // Highlight chương trình hiện tại dựa trên giờ hiện tại
  const getCurrentProgram = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    return currentTime;
  };

  const currentTime = getCurrentProgram();

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
              <h2 className="text-2xl font-bold text-white mb-4">Lịch phát sóng</h2>
              <div className="overflow-y-auto" style={{ maxHeight: "405px" }}>
                <ul className="space-y-3">
                  {schedule.map((item, index) => (
                    <li 
                      key={index} 
                      className={`p-3 rounded ${currentTime >= item.time && (index === schedule.length - 1 || currentTime < schedule[index + 1]?.time) 
                        ? 'bg-indigo-800 border-l-4 border-indigo-500' 
                        : 'bg-gray-700'}`}
                    >
                      <span className="font-semibold text-white">{item.time}</span>: {item.program}
                      {currentTime >= item.time && (index === schedule.length - 1 || currentTime < schedule[index + 1]?.time) && (
                        <span className="ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded">Đang chiếu</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;