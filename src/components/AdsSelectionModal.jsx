import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaClock, FaPlus, FaFilter } from 'react-icons/fa';
import dayjs from 'dayjs';

function AdsSelectionModal({ 
  isOpen, 
  onClose, 
  adsList, 
  loadingAds, 
  handleAddMultipleAds,
  programStartTime,
  programEndTime,
  existingAds = [],
  categories = []
}) {
  const [selectedAds, setSelectedAds] = useState([]);
  const [adStartTime, setAdStartTime] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Auto-suggest start time when modal opens
  useEffect(() => {
    if (isOpen && programStartTime) {
      const suggestedStartTime = findNextAvailableSlot();
      setAdStartTime(suggestedStartTime);
    }
  }, [isOpen, programStartTime, existingAds]);
  // Find next available time slot for ads
  const findNextAvailableSlot = () => {
    if (!programStartTime) return "";
    
    const start = dayjs(programStartTime);
    const end = dayjs(programEndTime);
    
    // Sort existing ads by start time
    const sortedExistingAds = [...existingAds].sort((a, b) => 
      dayjs(a.startTime).isBefore(dayjs(b.startTime)) ? -1 : 1
    );
    
    // If no existing ads, start 30 seconds after program start
    if (sortedExistingAds.length === 0) {
      const suggestedTime = start.add(30, 'second');
      return suggestedTime.isBefore(end) ? suggestedTime.format("YYYY-MM-DDTHH:mm:ss") : "";
    }
    
    // Find the latest ad end time and add 30 seconds gap
    const latestAdEnd = sortedExistingAds.reduce((latest, ad) => {
      const adEnd = dayjs(ad.endTime);
      return adEnd.isAfter(latest) ? adEnd : latest;
    }, dayjs(sortedExistingAds[0].endTime));
    
    const suggestedTime = latestAdEnd.add(30, 'second');
    
    // Ensure it's before program end (leave some buffer)
    if (suggestedTime.isAfter(end.subtract(30, 'second'))) {
      return "";
    }
    
    return suggestedTime.format("YYYY-MM-DDTHH:mm:ss");
  };
  const handleAdSelection = (ad) => {
    setSelectedAds(prev => {
      const isSelected = prev.find(selectedAd => selectedAd.id === ad.id);
      if (isSelected) {
        return prev.filter(selectedAd => selectedAd.id !== ad.id);
      } else {
        return [...prev, ad];
      }
    });
  };

  // Filter ads based on category
  const filteredAds = adsList.filter((ad) => {
    return filterCategory === "all" || ad.categoryId === parseInt(filterCategory);
  });  const confirmAddAds = () => {
    if (selectedAds.length === 0) return;
    
    let currentStartTime = dayjs(adStartTime || programStartTime);
    const programEnd = dayjs(programEndTime);
    
    // Validate that ads start time is within program time range
    if (currentStartTime.isBefore(dayjs(programStartTime))) {
      alert("Thời gian bắt đầu quảng cáo phải sau thời gian bắt đầu chương trình");
      return;
    }
    
    // Calculate total duration of selected ads
    const totalSelectedAdsDuration = selectedAds.reduce((total, ad) => total + (ad.duration || 30), 0);
    const adsEndTime = currentStartTime.add(totalSelectedAdsDuration, 'second');
    
    // Validate that all ads will end before program ends
    if (adsEndTime.isAfter(programEnd)) {
      alert("Tổng thời lượng quảng cáo vượt quá thời gian kết thúc chương trình. Vui lòng chọn ít quảng cáo hơn hoặc điều chỉnh thời gian bắt đầu.");
      return;
    }
    
    const adsToAdd = selectedAds.map((ad, index) => {
      const duration = ad.duration || 30;
      const adEndTime = currentStartTime.add(duration, 'second');
      
      const adData = {
        ad,
        startTime: currentStartTime.format("YYYY-MM-DDTHH:mm:ss"),
        endTime: adEndTime.format("YYYY-MM-DDTHH:mm:ss")
      };
      
      // Cập nhật thời gian bắt đầu cho quảng cáo tiếp theo (liên tiếp, không có khoảng cách)
      currentStartTime = adEndTime;
      
      return adData;
    });
    
    // Calculate total ads duration for extending program time
    const totalAdsDuration = adsToAdd.reduce((total, adData) => {
      const duration = dayjs(adData.endTime).diff(dayjs(adData.startTime), 'second');
      return total + duration;
    }, 0);
    
    handleAddMultipleAds(adsToAdd, totalAdsDuration);
    setSelectedAds([]);
    setAdStartTime("");
    setFilterCategory("all");
    onClose();
  };
  const closeModal = () => {
    setSelectedAds([]);
    setAdStartTime("");
    setFilterCategory("all");
    onClose();
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-30" onClick={closeModal}></div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-4xl z-10 max-h-[90vh] overflow-y-auto">        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Chọn quảng cáo</h3>
          <button 
            onClick={closeModal}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded"
            title="Đóng"
          >
            <FaTimes size={18} />
          </button>
        </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ads Selection */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-gray-200">Chọn quảng cáo</label>
              
              {/* Category Filter */}
              <div className="relative w-48">
                <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none text-sm"
                >
                  <option value="all">Tất cả danh mục</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="max-h-80 overflow-y-auto border border-gray-700 rounded p-3">
              {loadingAds ? (
                <div className="text-center py-8 text-gray-300">
                  <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mb-2"></div>
                  <p>Đang tải danh sách quảng cáo...</p>
                </div>
              ) : filteredAds.length > 0 ? (                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredAds.map((ad) => {
                    const isSelected = selectedAds.find(selectedAd => selectedAd.id === ad.id);
                    return (
                      <div 
                        key={ad.id}
                        onClick={() => handleAdSelection(ad)}
                        className={`p-2 border ${
                          isSelected
                            ? "border-green-500 bg-gray-650"
                            : "border-gray-600 hover:bg-gray-650"
                        } rounded cursor-pointer transition`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white text-sm line-clamp-2 leading-relaxed">
                              {ad.title}
                            </h4>
                            <p className="text-xs text-gray-400 mt-1">
                              Thời lượng: {ad.duration || 30}s
                            </p>
                          </div>
                          {isSelected && (
                            <FaCheck className="text-green-500 ml-2 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-300">
                  {filterCategory === "all" 
                    ? "Không có quảng cáo nào"
                    : "Không có quảng cáo nào trong danh mục này"
                  }
                </div>
              )}
            </div>
          </div>
            {/* Selected Ads and Time Settings */}
          <div>            <div className="mb-4">
              <label className="block text-gray-200 mb-2">Thời gian bắt đầu quảng cáo đầu tiên</label>
              <input
                type="datetime-local"
                value={adStartTime}
                onChange={(e) => setAdStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                step="1"
                min={programStartTime ? dayjs(programStartTime).format("YYYY-MM-DDTHH:mm:ss") : ""}
                max={programEndTime ? dayjs(programEndTime).format("YYYY-MM-DDTHH:mm:ss") : ""}
              />
              <p className="text-xs text-gray-400 mt-1">
                Các quảng cáo sẽ được phát liên tiếp
              </p>
            </div>
            
            {selectedAds.length > 0 && (
              <div>
                <label className="block text-gray-200 mb-2">Quảng cáo đã chọn ({selectedAds.length})</label>
                <div className="max-h-48 overflow-y-auto border border-gray-700 rounded p-2 bg-gray-750">
                  {selectedAds.map((ad, index) => (
                    <div key={ad.id} className="flex justify-between items-center py-2 border-b border-gray-600 last:border-b-0">
                      <div>
                        <p className="text-white text-sm">{index + 1}. {ad.title}</p>
                        <p className="text-xs text-gray-400">{ad.duration || 30}s</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdSelection(ad);
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 mr-3"
            onClick={closeModal}
          >
            Hủy
          </button>
          <button
            className={`px-4 py-2 ${
              selectedAds.length > 0
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-gray-600 cursor-not-allowed"
            } text-white rounded flex items-center`}
            onClick={confirmAddAds}
            disabled={selectedAds.length === 0}
          >
            <FaPlus className="mr-2" />
            Thêm {selectedAds.length} quảng cáo
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdsSelectionModal;
