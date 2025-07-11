import React, { useState, useEffect } from "react";
import { FaCheck, FaTimes, FaFilter } from "react-icons/fa";
import ThumbnailImage from "./ThumbnailImage";

function ContentLibraryModal({
  isOpen,
  onClose,
  contentLibrary,
  loadingContent,
  selectedContent,
  handleSelectContent,
  categories = [],
}) {
  const [filterCategory, setFilterCategory] = useState("all");
  // Filter content based on category
  const filteredContent = contentLibrary.filter((content) => {
    return filterCategory === "all" || content.categoryId === parseInt(filterCategory);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black opacity-30"
        onClick={onClose}
      ></div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl z-10">        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Chọn nội dung từ kho</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded"
            title="Đóng"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Category Filter */}
        <div className="mb-4">
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
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

        <div className="max-h-96 overflow-y-auto border border-gray-700 rounded">
          {loadingContent ? (
            <div className="text-center py-8 text-gray-300">
              <div className="animate-spin inline-block w-8 h-8 border-2 border-current border-t-transparent rounded-full mb-2"></div>
              <p>Đang tải danh sách nội dung...</p>
            </div>          ) : filteredContent.length > 0 ? (            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
              {filteredContent.map((content) => (
                <div
                  key={content.id}
                  onClick={() => handleSelectContent(content)}
                  className={`p-3 border ${
                    selectedContent && selectedContent.id === content.id
                      ? "border-green-500 bg-gray-650"
                      : "border-gray-600 hover:bg-gray-650"
                  } rounded cursor-pointer transition`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Thumbnail */}
                    <div className="w-16 h-12 bg-gray-600 rounded overflow-hidden flex-shrink-0">
                      <ThumbnailImage 
                        videoUrl={content.inputUrl || content.url} 
                        thumbnailUrl={content.thumbnail}
                        alt={content.title}
                        className="w-full h-full object-cover"
                      />
                    </div>                    {/* Content info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white line-clamp-2 leading-relaxed">
                        {content.title}
                      </h4>
                      {content.description && (
                        <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                          {content.description}
                        </p>
                      )}
                      {content.duration && (
                        <p className="text-gray-500 text-xs mt-1">
                          Thời lượng: {Math.floor(content.duration / 60)}:{(content.duration % 60).toString().padStart(2, '0')}
                        </p>
                      )}
                    </div>
                    
                    {/* Selection indicator */}
                    {selectedContent && selectedContent.id === content.id && (
                      <FaCheck className="text-green-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}            </div>
          ) : (
            <div className="text-center py-8 text-gray-300">
              {filterCategory === "all" 
                ? "Không có nội dung nào trong kho"
                : "Không có nội dung nào trong danh mục này"
              }
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 mr-3"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            className={`px-4 py-2 ${
              selectedContent
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-gray-600 cursor-not-allowed"
            } text-white rounded`}
            onClick={() =>
              selectedContent && handleSelectContent(selectedContent)
            }
            disabled={!selectedContent}
          >
            Chọn
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContentLibraryModal;
