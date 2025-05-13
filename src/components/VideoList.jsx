import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function VideoList() {
  const [videos, setVideos] = useState([]);
  const navigate = useNavigate();

  // Định nghĩa 3 kênh live với URL HLS cố định
  const liveChannels = [
    { id: "hls", title: "Kênh Live 1", hlsUrl: "http://localhost:8080/hls/master.m3u8" },
    // { id: "channel2", title: "Kênh Live 2", hlsUrl: "http://localhost:8088/hls/stream.m3u8" },
    // { id: "channel3", title: "Kênh Live 3", hlsUrl: "http://localhost:8088/hls/stream.m3u8" },
  ];

  useEffect(() => {
    // Lấy danh sách VOD từ API
    axios
      .get("http://localhost:8080/api/v1/videos")
      .then((response) => setVideos(response.data))
      .catch((error) => console.error("Error fetching videos:", error));
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-center">Danh sách kênh và video</h1>
        <button
          onClick={() => navigate("/upload")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer"
        >
          Upload Video
        </button>
      </div>

      {/* Phần Kênh Live (Cố Định) */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Live Channels</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {liveChannels.map((channel) => (
            <Link
              key={channel.id}
              to={`/live/${channel.id}`} // Điều hướng đến một route mới cho live
              className="bg-white rounded-lg shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow"
            >
              <h2 className="text-xl font-semibold">{channel.title}</h2>
              <p className="text-gray-600">Live Stream</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Phần Video (VOD) */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Videos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {videos.map((video) => (
            <Link
              key={video.id}
              to={`/video/${video.id}`} // Giữ nguyên route cho VOD
              className="bg-white rounded-lg shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow"
            >
              <h2 className="text-xl font-semibold">{video.title || `Video ${video.id}`}</h2>
              <p className="text-gray-600">Click để xem</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VideoList;