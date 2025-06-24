import { authenticatedApi, publicApi } from './apiClient';

/**
 * Service example cho Video API
 * Demonstrates cách sử dụng authenticated và public API calls
 */

/**
 * Public API calls - không cần authentication
 */
export const videoPublicService = {
  // Get public videos (không cần đăng nhập)
  getPublicVideos: async () => {
    try {
      const response = await publicApi.get('/videos/public');
      return response.data;
    } catch (error) {
      console.error('Error fetching public videos:', error);
      throw error;
    }
  },

  // Get video by ID (public)
  getVideoById: async (videoId) => {
    try {
      const response = await publicApi.get(`/videos/${videoId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching video ${videoId}:`, error);
      throw error;
    }
  },
};

/**
 * Authenticated API calls - cần đăng nhập
 */
export const videoAuthService = {
  // Upload video (cần authentication)
  uploadVideo: async (videoData, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(videoData));

      const response = await authenticatedApi.post('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  },

  // Update video (cần authentication)
  updateVideo: async (videoId, videoData) => {
    try {
      const response = await authenticatedApi.put(`/videos/${videoId}`, videoData);
      return response.data;
    } catch (error) {
      console.error(`Error updating video ${videoId}:`, error);
      throw error;
    }
  },

  // Delete video (cần authentication)
  deleteVideo: async (videoId) => {
    try {
      const response = await authenticatedApi.delete(`/videos/${videoId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting video ${videoId}:`, error);
      throw error;
    }
  },

  // Get user's videos (cần authentication)
  getUserVideos: async () => {
    try {
      const response = await authenticatedApi.get('/videos/my-videos');
      return response.data;
    } catch (error) {
      console.error('Error fetching user videos:', error);
      throw error;
    }
  },

  // Create video schedule (cần authentication)
  createSchedule: async (scheduleData) => {
    try {
      const response = await authenticatedApi.post('/schedule', scheduleData);
      return response.data;
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  },

  // Update video schedule (cần authentication)
  updateSchedule: async (scheduleId, scheduleData) => {
    try {
      const response = await authenticatedApi.patch(`/schedule/${scheduleId}`, scheduleData);
      return response.data;
    } catch (error) {
      console.error(`Error updating schedule ${scheduleId}:`, error);
      throw error;
    }
  },
};

/**
 * Ad Management Service (cần authentication với role ADMIN hoặc MODERATOR)
 */
export const adAuthService = {
  // Get all ads (admin only)
  getAllAds: async () => {
    try {
      const response = await authenticatedApi.get('/ads');
      return response.data;
    } catch (error) {
      console.error('Error fetching ads:', error);
      throw error;
    }
  },

  // Create new ad (admin/moderator only)
  createAd: async (adData, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(adData));

      const response = await authenticatedApi.post('/ads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating ad:', error);
      throw error;
    }
  },

  // Update ad (admin/moderator only)
  updateAd: async (adId, adData) => {
    try {
      const response = await authenticatedApi.put(`/ads/${adId}`, adData);
      return response.data;
    } catch (error) {
      console.error(`Error updating ad ${adId}:`, error);
      throw error;
    }
  },

  // Delete ad (admin only)
  deleteAd: async (adId) => {
    try {
      const response = await authenticatedApi.delete(`/ads/${adId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting ad ${adId}:`, error);
      throw error;
    }
  },
};
