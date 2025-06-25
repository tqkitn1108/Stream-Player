import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlay, FaFilm } from 'react-icons/fa';
import Navbar from './Navbar';
import Footer from './Footer';
import axios from 'axios';
import vod from '../assets/vod.png';

function Videos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredVideos, setFilteredVideos] = useState([]);

  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/v1` || "http://34.126.102.97:8080/api/v1";

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    // Hiển thị tất cả videos (không filter)
    setFilteredVideos(videos);
  }, [videos]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/vods/get-all`);
      if (response.data.code === 200) {
        const vodsData = response.data.data || [];
        // Map VOD data to expected UI format
        const mappedVideos = vodsData.map((vod) => ({
          id: vod.id,
          title: vod.title || vod.name || `VOD ${vod.id}`,
          thumbnail: vod.thumbnail || vod.thumbnailUrl || vod,
          description: vod.description || `Video ${vod.title || vod.name || vod.id}`,
          duration: vod.duration || Math.floor(Math.random() * 7200) + 300, // Random duration if not provided
          views: Math.floor(Math.random() * 100000) + 100, // Random views for demo
          createdAt: vod.createdAt || new Date().toISOString(),
          uploader: 'FAST360'
        }));
        setVideos(mappedVideos);
        setError(null);
      } else {
        console.error("Error fetching VODs:", response.data.message);
        setError('Không thể tải danh sách video. Vui lòng thử lại sau.');
        setVideos([]);
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Không thể tải danh sách video. Vui lòng thử lại sau.');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      
      {/* Hero Section */}
      <div className="pt-20 pb-12 bg-gradient-to-b from-gray-800 to-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <FaFilm className="text-4xl text-indigo-500 mr-3" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-transparent bg-clip-text">
                Thư viện Video
              </h1>
            </div>
            <p className="text-xl text-gray-300 mb-8">
              Khám phá hàng ngàn video chất lượng cao
            </p>
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="container mx-auto px-6 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Đang tải danh sách video...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchVideos}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">
                {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
              </h2>
            </div>

            {filteredVideos.length === 0 ? (
              <div className="text-center py-12">
                <FaFilm className="text-6xl text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                  Không tìm thấy video nào
                </h3>
                <p className="text-gray-500">
                  Hiện tại chưa có video nào
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVideos.map((video) => (
                  <div key={video.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <div className="relative">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-40 object-cover"
                        onError={(e) => {
                          e.target.src = vod;
                        }}
                      />
                      
                      {/* Duration - ẩn tạm thời */}
                      {/* <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white px-2 py-1 rounded text-xs font-semibold">
                        {formatDuration(video.duration)}
                      </div> */}
                      
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <FaPlay className="text-white text-3xl" />
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-sm font-semibold line-clamp-2 mb-4 hover:text-indigo-400 transition-colors">
                        {video.title}
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 truncate flex-1">
                          {video.uploader}
                        </span>
                        
                        <Link
                          to={`/video/${video.id}`}
                          className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs transition-colors ml-2"
                        >
                          <FaPlay className="text-xs" />
                          <span>Xem</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      <Footer />
    </div>
  );
}

export default Videos;
