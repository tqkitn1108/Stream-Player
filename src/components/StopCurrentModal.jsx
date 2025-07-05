import React from "react";
import { FaTimes, FaStop } from "react-icons/fa";
import dayjs from "dayjs";

function StopCurrentModal({ isOpen, onClose, onConfirm, currentItem, loading }) {
  const handleConfirm = () => {
    onConfirm();
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
            <div className="mt-3 text-sm text-red-400 bg-red-900 bg-opacity-30 px-3 py-2 rounded">
              ⚠️ Bạn có chắc chắn muốn dừng chương trình này không? Hành động này không thể hoàn tác.
            </div>
          </div>
        )}        <div className="flex space-x-3">
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
