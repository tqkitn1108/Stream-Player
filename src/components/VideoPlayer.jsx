import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "videojs-contrib-quality-levels";
import "jb-videojs-hls-quality-selector";
import axios from "axios";
import Navbar from "./Navbar";
import dayjs from "dayjs";
import "dayjs/locale/vi";

const API_BASE_URL =
  `${import.meta.env.VITE_BACKEND_URL}/api/v1` ||
  "http://34.126.102.97:8080/api/v1";
// Cấu hình dayjs
dayjs.locale("vi");

function VideoPlayer() {
  const { videoId, channelId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const scheduleRef = useRef(null); // Thêm ref cho schedule container
  // State cho lịch phát sóng
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(dayjs()); // Theo dõi thời gian hiện tại
  const [channelName, setChannelName] = useState(""); // Thêm state cho tên kênh
  const [videoHeight, setVideoHeight] = useState(0); // State để lưu chiều cao video  // State cho VOD
  const [vodData, setVodData] = useState(null);
  const [vodLoading, setVodLoading] = useState(false);
  // State cho channels
  const [channels, setChannels] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(false);

  const isLive = !!channelId;

  // Xử lý URL cho VOD và Live
  const getStreamUrl = () => {
    if (isLive) {
      return `${import.meta.env.VITE_BACKEND_URL}/hls/${channelId}/master.m3u8`;
    } else if (vodData && vodData.playlistUrl) {
      // Thay đổi domain của playlistUrl về VITE_BACKEND_URL
      const url = new URL(vodData.playlistUrl);
      return `${import.meta.env.VITE_BACKEND_URL}${url.pathname}`;
    }
    return "";
  };

  const hlsUrl = getStreamUrl();
  useEffect(() => {
    // Fetch schedule for live channel
    if (isLive) {
      fetchChannelSchedule(channelId);
      fetchChannelInfo(channelId); // Lấy thông tin kênh từ API
    } else if (videoId) {
      // Fetch VOD data for video
      fetchVodData(videoId);
      // Fetch channels list for VOD sidebar
      fetchChannels();
    }
  }, [channelId, videoId, isLive]);
  // Thêm function để fetch VOD data
  const fetchVodData = async (vodId) => {
    setVodLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/vods/${vodId}`);
      if (response.data.code === 200) {
        setVodData(response.data.data);
      } else {
        console.error("Error fetching VOD:", response.data.message);
        setError("Không thể tải thông tin video");
      }
    } catch (error) {
      console.error("Error fetching VOD data:", error);
      setError("Lỗi khi tải thông tin video");
    } finally {
      setVodLoading(false);
    }
  };

  // Thêm function để fetch channels
  const fetchChannels = async () => {
    setChannelsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/channels`);
      if (response.data.code === 200) {
        const channelsData = response.data.data || [];
        const mappedChannels = channelsData.map((channel) => ({
          id: channel.id,
          title: channel.channelName,
          thumbnail: channel.thumbnail,
        }));
        setChannels(mappedChannels);
      } else {
        console.error("Error fetching channels:", response.data.message);
        setChannels([]);
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
      setChannels([]);
    } finally {
      setChannelsLoading(false);
    }
  };

  // Thêm useEffect để cập nhật trạng thái "Đang chiếu" mỗi 10 giây cho VideoPlayer
  useEffect(() => {
    if (isLive) {
      const intervalId = setInterval(() => {
        // Cập nhật thời gian hiện tại để kích hoạt re-render
        setCurrentTime(dayjs());
      }, 10000); // Cập nhật mỗi 10 giây

      return () => clearInterval(intervalId); // Dọn dẹp khi unmount
    }
  }, [isLive]);
  const fetchChannelInfo = async (channelId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/channels/${channelId}`);
      if (response.data.code === 200) {
        const channel = response.data.data;
        if (channel) {
          setChannelName(channel.channelName);
        } else {
          setChannelName(`Kênh ${channelId}`); // Fallback
        }
      } else {
        setChannelName(`Kênh ${channelId}`); // Fallback
      }
    } catch (error) {
      console.error("Error fetching channel info:", error);
      setChannelName(`Kênh ${channelId}`); // Fallback
    }
  };

  const fetchChannelSchedule = async (channelId) => {
    setLoading(true);
    setError(null);

    try {
      // Lấy lịch từ đầu ngày hiện tại đến cuối ngày
      const today = dayjs().startOf("day");
      const startTime = today.format("YYYY-MM-DDT00:00:00");
      const endTime = today.format("YYYY-MM-DDT23:59:59");

      const response = await axios.get(`${API_BASE_URL}/schedule`, {
        params: {
          channelId: channelId,
          startTime: startTime,
          endTime: endTime,
          page: 0,
          size: 100,
        },
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

    if (videoElement && !playerRef.current && hlsUrl) {
      const player = (playerRef.current = videojs(videoElement, {
        autoplay: true,
        controls: true,
        responsive: true,
        fluid: false,
        aspectRatio: "16:9",
        liveui: isLive,
        sources: [{ src: hlsUrl, type: "application/x-mpegURL" }],
        controlBar: {
          liveDisplay: isLive,
          seekToLive: isLive,
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
    const now = currentTime;
    const startTime = dayjs(item.startTime);
    const endTime = dayjs(item.endTime);
    return now.isAfter(startTime) && now.isBefore(endTime);
  };

  // Format thời gian hiển thị
  const formatTime = (dateTimeString) => {
    return dayjs(dateTimeString).format("HH:mm:ss");
  };
  // Thêm useEffect để đồng bộ chiều cao
  useEffect(() => {
    const updateScheduleHeight = () => {
      const videoContainer = document.querySelector("[data-vjs-player]");
      if (videoContainer && scheduleRef.current && isLive) {
        const videoContainerHeight = videoContainer.offsetHeight;
        setVideoHeight(videoContainerHeight);
      }
    };

    // Cập nhật chiều cao khi component mount và khi resize
    updateScheduleHeight();
    window.addEventListener("resize", updateScheduleHeight);

    // Thêm observer để theo dõi thay đổi kích thước video
    const videoContainer = document.querySelector("[data-vjs-player]");
    if (videoContainer) {
      const resizeObserver = new ResizeObserver(updateScheduleHeight);
      resizeObserver.observe(videoContainer);

      return () => {
        window.removeEventListener("resize", updateScheduleHeight);
        resizeObserver.disconnect();
      };
    }

    return () => {
      window.removeEventListener("resize", updateScheduleHeight);
    };
  }, [isLive, playerRef.current]);
  useEffect(() => {
    const videoElement = videoRef.current;

    if (videoElement && playerRef.current && hlsUrl) {
      const player = playerRef.current;

      // Cập nhật lại nguồn phát và tự động phát
      player.src({ src: hlsUrl, type: "application/x-mpegURL" });

      // Sử dụng player.ready() với callback thay vì Promise
      player.ready(() => {
        if (isLive || (!isLive && vodData)) {
          player.play().catch((error) => {
            console.error("Error while trying to play the video:", error);
          });
        }
      });
    }
  }, [hlsUrl, isLive, vodData]);

  return (
    <div className="bg-gray-900 min-h-screen">
      <Navbar />
      <div className="container mx-auto p-4 pt-24">
        {/* Hiển thị tên kênh thay vì nút quay lại */}
        {isLive && (
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-white">{channelName}</h1>
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Video Player */}
          <div className="lg:w-2/3">
            {/* Hiển thị loading cho VOD */}
            {!isLive && vodLoading && (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            )}
            {/* Hiển thị error */}
            {error && (
              <div className="p-4 bg-red-900 bg-opacity-50 text-red-100 rounded mb-4">
                {error}
              </div>
            )}
            {/* Video Player */}
            {(isLive || (!isLive && vodData && !vodLoading)) && (
              <div data-vjs-player className="rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="video-js vjs-default-skin vjs-big-play-centered"
                />
              </div>
            )}{" "}
            {!isLive && vodData && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {vodData.title || `VOD ${vodData.id}`}
                </h2>
                {vodData.description && (
                  <p className="text-gray-300 mb-2">{vodData.description}</p>
                )}
              </div>
            )}
          </div>{" "}
          {/* Schedule Section - Hiển thị bên phải khi là kênh live */}
          {isLive && (
            <div
              ref={scheduleRef}
              className="lg:w-1/3 bg-gray-800 p-4 rounded-lg"
              style={{ height: videoHeight > 0 ? `${videoHeight}px` : "auto" }}
            >
              <h2 className="text-2xl font-bold text-white mb-4 text-center">
                Lịch phát sóng hôm nay
              </h2>

              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : error ? (
                <div className="p-4 bg-red-900 bg-opacity-50 text-red-100 rounded">
                  {error}
                </div>
              ) : (
                <div
                  className="overflow-y-auto"
                  style={{
                    height:
                      videoHeight > 0
                        ? `${videoHeight - 80}px`
                        : "calc(100% - 60px)",
                  }}
                >
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gray-700">
                      <tr className="text-left text-gray-200">
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
                                  ? "bg-indigo-800 border-l-4 border-indigo-500"
                                  : "hover:bg-gray-650"
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
                          <td
                            colSpan="2"
                            className="py-4 px-3 text-center text-gray-300"
                          >
                            Không có lịch phát sóng hôm nay
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}{" "}
          {/* FAST Channels Section - Hiển thị bên phải khi là VOD */}
          {!isLive && (
            <div className="lg:w-1/3">
              {channelsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {channels.length > 0 ? (
                    channels.map((channel) => (
                      <Link
                        key={channel.id}
                        to={`/live/${channel.id}`}
                        className="flex bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors duration-200"
                      >
                        <div className="flex-shrink-0">
                          <img
                            src={channel.thumbnail}
                            alt={channel.title}
                            className="w-40 h-24 object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='96' viewBox='0 0 160 96'%3E%3Crect width='160' height='96' fill='%23374151'/%3E%3Ctext x='80' y='52' font-family='Arial' font-size='14' fill='white' text-anchor='middle'%3E" +
                                channel.title.substring(0, 2).toUpperCase() +
                                "%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        </div>
                        <div className="flex-1 p-3 min-w-0">
                          <h3 className="text-white font-medium text-sm line-clamp-2 mb-1">
                            {channel.title}
                          </h3>
                          <div className="flex items-center text-xs text-gray-400">
                            <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse"></span>
                            <span>Live</span>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-400 text-sm">Không có kênh nào</p>
                    </div>
                  )}
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
