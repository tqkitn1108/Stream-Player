import React, { useState } from "react";
import { FaTimes, FaStop, FaAd, FaPlay } from "react-icons/fa";
import dayjs from "dayjs";

function StopCurrentModal({ isOpen, onClose, onConfirm, currentItem, loading }) {
  const [playAds, setPlayAds] = useState(true); // Mặc định chọn phát quảng cáo

  const handleConfirm = () => {
    onConfirm(playAds);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <FaStop className="mr-2 text-red-500" />
            Dừng chương trình hiện tại
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <FaTimes />
          </button>
        </div>        {currentItem && (
          <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-white font-medium mb-2">Chương trình đang phát:</h3>
            <p className="text-gray-300 font-medium">{currentItem.title}</p>
            <p className="text-gray-400 text-sm">
              {dayjs(currentItem.startTime).format("HH:mm:ss")} - {dayjs(currentItem.endTime).format("HH:mm:ss")}
            </p>
            <div className="mt-2 text-xs text-red-400 bg-red-900 bg-opacity-30 px-2 py-1 rounded">
              ⚠️ Hành động này sẽ dừng ngay lập tức chương trình đang phát
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-white font-medium mb-4">Chọn nội dung thay thế:</h3>
          
          <div className="space-y-3">
            <label className="flex items-center p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition">
              <input
                type="radio"
                name="replacement"
                value="ads"
                checked={playAds === true}
                onChange={() => setPlayAds(true)}
                className="mr-3 text-indigo-600"
              />
              <FaAd className="mr-2 text-yellow-500" />
              <div>
                <div className="text-white font-medium">Phát quảng cáo</div>
                <div className="text-gray-400 text-sm">Chuyển sang phát các quảng cáo đã cài đặt</div>
              </div>
            </label>

            <label className="flex items-center p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition">
              <input
                type="radio"
                name="replacement"
                value="default"
                checked={playAds === false}
                onChange={() => setPlayAds(false)}
                className="mr-3 text-indigo-600"
              />
              <FaPlay className="mr-2 text-blue-500" />
              <div>
                <div className="text-white font-medium">Nội dung mặc định</div>
                <div className="text-gray-400 text-sm">Chuyển sang phát nội dung mặc định của kênh</div>
              </div>
            </label>
          </div>
        </div>        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className={`flex-1 px-4 py-2 ${
              loading ? "bg-gray-500 cursor-not-allowed" : "bg-gray-600 hover:bg-gray-700"
            } text-white rounded transition`}
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 ${
              loading 
                ? "bg-gray-500 cursor-not-allowed" 
                : "bg-red-600 hover:bg-red-700"
            } text-white rounded transition flex items-center justify-center`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </>
            ) : (
              <>
                <FaStop className="mr-2" />
                Xác nhận dừng
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StopCurrentModal;
