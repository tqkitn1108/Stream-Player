import React from 'react';
import { FaCheck, FaTimes, FaClock } from 'react-icons/fa';
import dayjs from 'dayjs';

function AdsSelectionModal({ 
  isOpen, 
  onClose, 
  adsList, 
  loadingAds, 
  currentAd, 
  handleAddAd,
  adStartTime,
  setAdStartTime,
  adEndTime,
  setAdEndTime,
  adErrors,
  confirmAddAd
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-30" onClick={onClose}></div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl z-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Thêm quảng cáo</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-200 mb-2">Chọn quảng cáo</label>
            <div className="max-h-60 overflow-y-auto border border-gray-700 rounded p-2">
              {loadingAds ? (
                <div className="text-center py-4 text-gray-300">
                  <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mb-2"></div>
                  <p>Đang tải danh sách quảng cáo...</p>
                </div>
              ) : adsList.length > 0 ? (
                <div className="space-y-2">
                  {adsList.map((ad) => (
                    <div 
                      key={ad.id}
                      onClick={() => handleAddAd(ad)}
                      className={`p-2 border ${
                        currentAd && currentAd.id === ad.id
                          ? "border-green-500 bg-gray-650"
                          : "border-gray-600 hover:bg-gray-650"
                      } rounded cursor-pointer transition`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-white">{ad.title}</h4>
                          <p className="text-xs text-gray-400">Thời lượng: {ad.duration || 30}s</p>
                        </div>
                        {currentAd && currentAd.id === ad.id && (
                          <FaCheck className="text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-300">
                  Không có quảng cáo nào
                </div>
              )}
            </div>
            {adErrors.ad && (
              <span className="text-red-400 text-sm">{adErrors.ad}</span>
            )}
          </div>
          
          <div>
            <div className="mb-3">
              <label className="block text-gray-200 mb-2">Thời gian bắt đầu</label>
              <input
                type="datetime-local"
                value={adStartTime}
                onChange={(e) => setAdStartTime(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                step="1"
              />
              {adErrors.startTime && (
                <span className="text-red-400 text-sm">{adErrors.startTime}</span>
              )}
            </div>
            
            <div>
              <label className="block text-gray-200 mb-2">Thời gian kết thúc</label>
              <input
                type="datetime-local"
                value={adEndTime}
                onChange={(e) => setAdEndTime(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                step="1"
              />
              {adErrors.endTime && (
                <span className="text-red-400 text-sm">{adErrors.endTime}</span>
              )}
            </div>
            
            {adErrors.overlap && (
              <div className="mt-2 p-2 bg-red-900 bg-opacity-30 rounded text-red-300 text-sm">
                {adErrors.overlap}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 mr-3"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
            onClick={confirmAddAd}
          >
            Thêm quảng cáo
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdsSelectionModal;
