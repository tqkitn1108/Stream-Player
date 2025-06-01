/**
 * Utility để tạo thumbnail từ video URL
 */

/**
 * Tạo thumbnail từ video URL
 * @param {string} videoUrl - URL của video
 * @param {number} timeOffset - Thời gian (giây) để capture thumbnail, mặc định 1 giây
 * @returns {Promise<string>} - Promise resolve với data URL của thumbnail
 */
export const generateVideoThumbnail = (videoUrl, timeOffset = 1) => {
  console.log('🎬 Starting thumbnail generation for:', videoUrl, 'at time:', timeOffset);
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Sử dụng proxy để tránh CORS
    const proxyUrl = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}/proxy-video?url=${encodeURIComponent(videoUrl)}`;
    console.log('🔄 Using proxy URL:', proxyUrl);
    
    video.crossOrigin = 'anonymous';
    video.muted = true; // Tránh autoplay policy issues
      let metadataLoaded = false;
    let hasGenerated = false;
    let hasSeeked = false; // Flag để tránh seek nhiều lần
    
    video.onloadedmetadata = () => {
      console.log('📊 Video metadata loaded:', {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration
      });
      
      metadataLoaded = true;
      
      // Đặt kích thước canvas theo tỷ lệ video
      const aspectRatio = video.videoWidth / video.videoHeight;
      const maxWidth = 320;
      const maxHeight = 180;
      
      let width, height;
      if (aspectRatio > maxWidth / maxHeight) {
        width = maxWidth;
        height = maxWidth / aspectRatio;
      } else {
        height = maxHeight;
        width = maxHeight * aspectRatio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      console.log('🖼️ Canvas dimensions set:', { width, height });
    };
    
    // Đợi video có thể play được trước khi seek
    video.oncanplay = () => {
      if (hasSeeked) return; // Tránh seek nhiều lần
      
      console.log('🎥 Video can play, now seeking...');
      hasSeeked = true;
      
      // Đảm bảo timeOffset không vượt quá duration
      const safeTimeOffset = Math.min(timeOffset, video.duration - 0.1);
      console.log('⏰ Setting video time to:', safeTimeOffset, 'from duration:', video.duration);
      
      // Set currentTime sau khi video có thể play
      video.currentTime = safeTimeOffset;
    };    video.onseeked = () => {
      if (hasGenerated) return; // Tránh generate nhiều lần
      
      console.log('⏭️ Video seeked to time:', video.currentTime);
      
      // Kiểm tra xem có thực sự seek đến đúng thời gian không
      const actualTime = video.currentTime;
      const targetTime = Math.min(timeOffset, video.duration - 0.1);
      
      console.log('🕐 Time check:', { actualTime, targetTime, difference: Math.abs(actualTime - targetTime) });
      
      // Nếu actualTime vẫn là 0 và target > 0.5, thử seek lại một lần
      if (actualTime === 0 && targetTime > 0.5 && !video.hasTriedReseek) {
        console.log('🔄 Retrying seek as current time is still 0');
        video.hasTriedReseek = true;
        
        // Thử với timeOffset nhỏ hơn nếu video không support seek tốt
        const retryTime = Math.min(0.5, video.duration - 0.1);
        setTimeout(() => {
          video.currentTime = retryTime;
        }, 100);
        return;
      }
      
      try {
        hasGenerated = true;
        
        // Vẽ frame hiện tại lên canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Chuyển canvas thành data URL
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        console.log('✅ Thumbnail generated successfully at time:', actualTime, 'size:', thumbnailDataUrl.length, 'bytes');
        resolve(thumbnailDataUrl);
      } catch (error) {
        console.error('❌ Error drawing to canvas:', error);
        reject(error);
      }
    };video.onerror = (error) => {
      console.error('❌ Video load error:', error);
      reject(new Error('Không thể load video để tạo thumbnail'));
    };
      // Timeout để tránh treo khi video không load được
    const timeout = setTimeout(() => {
      if (!hasGenerated) {
        console.warn('⏰ Timeout generating thumbnail, trying to capture current frame...');
        
        // Thử capture frame hiện tại nếu timeout
        try {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            hasGenerated = true;
            
            // Set canvas size nếu chưa set
            if (canvas.width === 0) {
              const aspectRatio = video.videoWidth / video.videoHeight;
              const maxWidth = 320;
              const maxHeight = 180;
              
              let width, height;
              if (aspectRatio > maxWidth / maxHeight) {
                width = maxWidth;
                height = maxWidth / aspectRatio;
              } else {
                height = maxHeight;
                width = maxHeight * aspectRatio;
              }
              
              canvas.width = width;
              canvas.height = height;
            }
            
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            console.log('✅ Fallback thumbnail generated at time:', video.currentTime);
            resolve(thumbnailDataUrl);
          } else {
            reject(new Error('Timeout khi tạo thumbnail'));
          }
        } catch (error) {
          reject(new Error('Timeout khi tạo thumbnail'));
        }
      }
    }, 8000); // 8 seconds timeout
    
    // Cleanup timeout khi thành công
    const originalResolve = resolve;
    resolve = (value) => {
      clearTimeout(timeout);
      originalResolve(value);
    };
    
    const originalReject = reject;
    reject = (error) => {
      clearTimeout(timeout);
      originalReject(error);
    };
    
    // Bắt đầu load video thông qua proxy
    console.log('📹 Loading video via proxy:', proxyUrl);
    video.src = proxyUrl;
    video.load();
  });
};

/**
 * Cache cho thumbnails đã tạo
 */
const thumbnailCache = new Map();

/**
 * Tạo thumbnail với cache
 * @param {string} videoUrl - URL của video
 * @param {number} timeOffset - Thời gian để capture
 * @returns {Promise<string>} - Promise resolve với data URL của thumbnail
 */
export const getCachedVideoThumbnail = async (videoUrl, timeOffset = 1) => {
  // Sử dụng original URL cho cache key để tránh duplicate cache entries
  const cacheKey = `${videoUrl}_${timeOffset}`;
  
  console.log('🗂️ Checking cache for:', cacheKey);
  
  // Kiểm tra cache trước
  if (thumbnailCache.has(cacheKey)) {
    console.log('💾 Found in cache!');
    return thumbnailCache.get(cacheKey);
  }
  
  console.log('🆕 Not in cache, generating new thumbnail via proxy');
  
  try {
    const thumbnail = await generateVideoThumbnail(videoUrl, timeOffset);
    thumbnailCache.set(cacheKey, thumbnail);
    console.log('💾 Thumbnail cached for future use');
    return thumbnail;
  } catch (error) {
    console.error('❌ Error generating thumbnail:', error);
    throw error;
  }
};

/**
 * Clear cache (để quản lý memory)
 */
export const clearThumbnailCache = () => {
  thumbnailCache.clear();
};

/**
 * Kiểm tra xem URL có phải là video không
 * @param {string} url - URL cần kiểm tra
 * @returns {boolean} - true nếu là video URL
 */
export const isVideoUrl = (url) => {
  if (!url) {
    console.log('🔍 isVideoUrl: No URL provided');
    return false;
  }
  
  // Kiểm tra extension
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv'];
  const urlLower = url.toLowerCase();
  
  const isVideo = videoExtensions.some(ext => urlLower.includes(ext)) || 
         urlLower.includes('video') ||
         urlLower.includes('.m3u8'); // HLS stream
  
  console.log('🔍 isVideoUrl check:', {
    url: url.substring(0, 100) + (url.length > 100 ? '...' : ''),
    isVideo,
    extensions: videoExtensions.filter(ext => urlLower.includes(ext))
  });
  
  return isVideo;
};