import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "videojs-contrib-quality-levels"; // Plugin quản lý chất lượng
import { Select } from "antd";
import axios from "axios";

function VideoPlayer() {
  const { videoId, channelId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [qualityLevels, setQualityLevels] = useState([
    { value: "auto", label: "Auto" },
  ]);
  const [selectedQuality, setSelectedQuality] = useState("auto");

  const isLive = !!channelId;
  const hlsUrl = isLive
    ? `http://167.172.78.132:8080/${channelId}/master.m3u8`
    : video?.playlistUrl;

  useEffect(() => {
    const videoElement = videoRef.current;

    if (videoElement && !playerRef.current) {
      console.log("Initializing player with URL:", hlsUrl);
      const player = (playerRef.current = videojs(videoElement, {
        autoplay: true,
        controls: true,
        responsive: true,
        fluid: true,
        liveui: true, // Bật giao diện livestream với thanh tua lại
        sources: [{ src: hlsUrl, type: "application/x-mpegURL" }],
        controlBar: {
          liveDisplay: true, // Hiển thị nhãn "LIVE"
          seekToLive: true, // Nút nhảy về thời điểm trực tiếp
          progressControl: {
            seekBar: true, // Bật thanh tua lại
          },
        },
      }));

      player.on("error", () => {
        console.error("Video.js error:", player.error());
      });

      player.on("loadedmetadata", () => {
        console.log("Metadata:", player.videoWidth(), player.videoHeight());
        const seekable = player.seekable();
        console.log(
          "Is live?",
          player.liveTracker.isLive(),
          "Seekable range:",
          seekable.length > 0
            ? `${seekable.start(0)} to ${seekable.end(0)}`
            : "No seekable range"
        );
      });

      player.ready(() => {
        const levels = player.qualityLevels();
        const qualityList = [{ value: "auto", label: "Auto" }];

        levels.on("change", () => {
          qualityList.length = 1;
          for (let i = 0; i < levels.length; i++) {
            qualityList.push({
              value: i,
              label: levels[i].height ? `${levels[i].height}p` : "Unknown",
            });
          }
          setQualityLevels([...qualityList]);
        });

        if (isLive) {
          player.liveTracker.on("liveedgechange", () => {
            const seekable = player.seekable();
            console.log(
              "DVR window:",
              seekable.length > 0
                ? `${seekable.start(0)} to ${seekable.end(0)}`
                : "No DVR window"
            );
          });
        }
      });
    }

    return () => {
      console.log("Cleanup called");
      if (playerRef.current && !document.contains(videoElement)) {
        console.log("Disposing player on real unmount");
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [hlsUrl, isLive]);

  const handleQualityChange = (value) => {
    setSelectedQuality(value);
    const player = playerRef.current;
    if (!player) return;

    const levels = player.qualityLevels();
    const levelsArray = Array.from(
      { length: levels.length },
      (_, i) => levels[i]
    );
    if (value === "auto") {
      levelsArray.forEach((level) => (level.enabled = true));
    } else {
      levelsArray.forEach((level, i) => (level.enabled = i === value));
    }
  };

  return (
    <div className="container mx-auto p-4">
      <button
        onClick={() => navigate("/")}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Quay lại
      </button>

      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-4">
          <Select
            value={selectedQuality}
            onChange={handleQualityChange}
            options={qualityLevels}
            style={{ width: 120 }}
          />
        </div>
        <div data-vjs-player>
          <video
            ref={videoRef}
            className="video-js vjs-default-skin vjs-big-play-centered"
            style={{ width: "100%", minHeight: "400px" }}
          />
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;