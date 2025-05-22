import React from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

function ContentLibraryModal({ 
  isOpen, 
  onClose, 
  contentLibrary, 
  loadingContent, 
  selectedContent, 
  handleSelectContent 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-30" onClick={onClose}></div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl z-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Chọn nội dung từ kho</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="max-h-96 overflow-y-auto border border-gray-700 rounded">
          {loadingContent ? (
            <div className="text-center py-8 text-gray-300">
              <div className="animate-spin inline-block w-8 h-8 border-2 border-current border-t-transparent rounded-full mb-2"></div>
              <p>Đang tải danh sách nội dung...</p>
            </div>
          ) : contentLibrary.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
              {contentLibrary.map((content) => (
                <div 
                  key={content.id}
                  onClick={() => handleSelectContent(content)}
                  className={`p-3 border ${
                    selectedContent && selectedContent.id === content.id
                      ? "border-green-500 bg-gray-650"
                      : "border-gray-600 hover:bg-gray-650"
                  } rounded cursor-pointer transition`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-white">{content.title}</h4>
                      <p className="text-xs text-gray-400">ID: {content.id}</p>
                    </div>
                    {selectedContent && selectedContent.id === content.id && (
                      <FaCheck className="text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-300">
              Không có nội dung nào trong kho
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
            className={`px-4 py-2 ${selectedContent ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-600 cursor-not-allowed"} text-white rounded`}
            onClick={() => selectedContent && handleSelectContent(selectedContent)}
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
