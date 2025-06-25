import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlay, FaStream } from 'react-icons/fa';
import Navbar from './Navbar';
import Footer from './Footer';
import axios from 'axios';
import fc1 from '../assets/fc1.png';

function Live() {
  const [liveChannels, setLiveChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredChannels, setFilteredChannels] = useState([]);

  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/v1` || "http://34.126.102.97:8080/api/v1";

  useEffect(() => {
    fetchLiveChannels();
  }, []);

  useEffect(() => {
    // Set all channels as filtered channels (no search functionality)
    setFilteredChannels(liveChannels);
  }, [liveChannels]);

  const fetchLiveChannels = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/channels`);
      if (response.data.code === 200) {
        const channelsData = response.data.data || [];
        // Map channels data với thumbnail từ API và HLS URL
        const mappedChannels = channelsData.map((channel) => ({
          id: channel.id,
          title: channel.channelName,
          description: `Kênh ${channel.channelName} đang phát trực tiếp`,
          hlsUrl: `${import.meta.env.VITE_BACKEND_URL}/${channel.id}/master.m3u8`,
          thumbnail: channel.thumbnail || fc1,
          viewers: Math.floor(Math.random() * 5000) + 100, // Random viewers for demo
          isLive: true,
          startTime: new Date(Date.now() - Math.random() * 7200000).toISOString(), // Random start time within 2 hours
        }));
        setLiveChannels(mappedChannels);
        setError(null);
      } else {
        console.error("Error fetching channels:", response.data.message);
        setError('Không thể tải danh sách kênh live. Vui lòng thử lại sau.');
        setLiveChannels([]);
      }
    } catch (err) {
      console.error('Error fetching live channels:', err);
      setError('Không thể tải danh sách kênh live. Vui lòng thử lại sau.');
      setLiveChannels([]);
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
              <FaStream className="text-4xl text-red-500 mr-3" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-500 to-pink-600 text-transparent bg-clip-text">
                Kênh Live
              </h1>
            </div>
            <p className="text-xl text-gray-300 mb-8">
              Theo dõi các kênh trực tiếp hàng đầu
            </p>
          </div>
        </div>
      </div>

      {/* Live Channels Grid */}
      <div className="container mx-auto px-6 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Đang tải danh sách kênh...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchLiveChannels}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">
                Đang phát trực tiếp ({filteredChannels.length} kênh)
              </h2>
            </div>

            {filteredChannels.length === 0 ? (
              <div className="text-center py-12">
                <FaStream className="text-6xl text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                  Hiện tại không có kênh nào đang phát
                </h3>
                <p className="text-gray-500">
                  Vui lòng quay lại sau
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredChannels.map((channel) => (
                  <div key={channel.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <div className="relative">
                      <img
                        src={channel.thumbnail}
                        alt={channel.title}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.target.src = '/api/placeholder/400/225';
                        }}
                      />
                      
                      {/* Live Badge */}
                      <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                        LIVE
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold line-clamp-2 flex-1">
                          {channel.title}
                        </h3>
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {channel.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <Link
                          to={`/live/${channel.id}`}
                          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          <FaPlay className="text-sm" />
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

export default Live;
