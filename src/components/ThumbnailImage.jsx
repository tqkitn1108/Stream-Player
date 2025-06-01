import React, { useState, useEffect, useRef } from "react";
import { getCachedVideoThumbnail, isVideoUrl } from "../utils/videoThumbnail";
import adBanner from "../assets/ad.png";

/**
 * Component hiển thị thumbnail với lazy loading
 * Tự động generate thumbnail từ video URL
 */
const ThumbnailImage = ({
  videoUrl,
  alt,
  className = "",
  fallbackSrc = adBanner,
  timeOffset = 1,
  lazy = true,
}) => {
  const [imageSrc, setImageSrc] = useState(fallbackSrc);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef();
  const observerRef = useRef();

  // Intersection Observer để lazy load
  useEffect(() => {
    if (!lazy || isInView) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [lazy, isInView]); // Load thumbnail logic
  useEffect(() => {
    if (!isInView) return;

    console.log("🖼️ ThumbnailImage - Loading thumbnail from video:", {
      videoUrl,
      alt,
      isVideoUrl: videoUrl ? isVideoUrl(videoUrl) : false,
    });

    const loadThumbnail = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        if (videoUrl && isVideoUrl(videoUrl)) {
          console.log("🎥 Generating thumbnail from video:", videoUrl);
          // Generate từ video
          await tryGenerateFromVideo();
        } else {
          console.log("🚫 No valid video URL, using fallback");
          // Không có video URL hợp lệ, dùng fallback
          setImageSrc(fallbackSrc);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("❌ Error loading thumbnail:", error);
        setImageSrc(fallbackSrc);
        setHasError(true);
        setIsLoading(false);
      }
    };

    const tryGenerateFromVideo = async () => {
      try {
        if (!videoUrl || !isVideoUrl(videoUrl)) {
          throw new Error("Invalid video URL");
        }

        console.log(
          "🎬 Generating thumbnail from video:",
          videoUrl,
          "at time:",
          timeOffset
        );
        const generatedThumbnail = await getCachedVideoThumbnail(
          videoUrl,
          timeOffset
        );
        console.log(
          "✅ Thumbnail generated successfully:",
          generatedThumbnail.substring(0, 100) + "..."
        );
        setImageSrc(generatedThumbnail);
        setIsLoading(false);
      } catch (error) {
        console.error("❌ Failed to generate thumbnail from video:", error);
        setImageSrc(fallbackSrc);
        setHasError(true);
        setIsLoading(false);
      }
    };
    loadThumbnail();
  }, [videoUrl, fallbackSrc, timeOffset, isInView]);

  const handleImageError = () => {
    if (!hasError && videoUrl && isVideoUrl(videoUrl)) {
      // Retry với video nếu chưa thử
      setHasError(true);
      setIsLoading(true);
      getCachedVideoThumbnail(videoUrl, timeOffset)
        .then((thumbnail) => {
          setImageSrc(thumbnail);
          setIsLoading(false);
        })
        .catch(() => {
          setImageSrc(fallbackSrc);
          setIsLoading(false);
        });
    } else {
      setImageSrc(fallbackSrc);
      setIsLoading(false);
    }
  };

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-700 rounded">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
        </div>
      )}

      <img
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover rounded ${
          isLoading ? "opacity-50" : ""
        }`}
        onError={handleImageError}
        loading={lazy ? "lazy" : "eager"}
      />

      {hasError && (
        <div className="absolute top-1 right-1 text-yellow-400 text-xs bg-black bg-opacity-50 px-1 rounded">
          ⚠️
        </div>
      )}
    </div>
  );
};

export default ThumbnailImage;
