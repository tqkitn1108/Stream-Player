import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { FaUpload, FaEdit, FaTrashAlt, FaCheck, FaTimes, FaFilter, FaPlus, FaSearch } from "react-icons/fa";
import AdUploadModal from "./AdUploadModal";
import AdEditModal from "./AdEditModal";
import axios from "axios";
import adBanner from "../assets/ad.png";

// We'll fetch categories and ads from the API
// API URL constants
const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/v1` || "http://localhost:8080/api/v1";
const CATEGORIES_API_URL = `${API_BASE_URL}/ads/category`;
const ADS_API_URL = `${API_BASE_URL}/ads`;

// Status mapping for clarity
const AD_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2
};

function AdManagement() {
  const [ads, setAds] = useState([]);
  const [filteredAds, setFilteredAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedAd, setSelectedAd] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: "all",
    status: "all",
    search: "",
  });
  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(CATEGORIES_API_URL);
        // Handle API response format: { code, message, data }
        if (response.data && response.data.code === 200 && Array.isArray(response.data.data)) {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);
  // Fetch ads from API
  useEffect(() => {
    const fetchAds = async () => {
      setLoading(true);
      try {
        const response = await axios.get(ADS_API_URL);
        // Handle API response format: { code, message, data }
        if (response.data && response.data.code === 200 && Array.isArray(response.data.data)) {
          const formattedAds = response.data.data.map(ad => ({
            ...ad,
            status: getStatusString(ad.status)
          }));
          setAds(formattedAds);
          setFilteredAds(formattedAds);
        }
      } catch (error) {
        console.error("Error fetching ads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  // Helper function to convert numeric status to string
  const getStatusString = (statusCode) => {
    switch (statusCode) {
      case AD_STATUS.APPROVED:
        return "approved";
      case AD_STATUS.PENDING:
        return "pending";
      case AD_STATUS.REJECTED:
        return "rejected";
      default:
        return "pending";
    }
  };

  // Helper function to convert string status to numeric
  const getStatusCode = (statusString) => {
    switch (statusString) {
      case "approved":
        return AD_STATUS.APPROVED;
      case "pending":
        return AD_STATUS.PENDING;
      case "rejected":
        return AD_STATUS.REJECTED;
      default:
        return AD_STATUS.PENDING;
    }
  };

  // Apply filters when filters state changes
  useEffect(() => {
    filterAds();
  }, [filters, ads]);

  const filterAds = () => {
    let filtered = [...ads];

    // Filter by category
    if (filters.category !== "all") {
      filtered = filtered.filter(
        (ad) => ad.categoryId === parseInt(filters.category)
      );
    }

    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter((ad) => ad.status === filters.status);
    }

    // Filter by search term
    if (filters.search.trim() !== "") {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (ad) =>
          ad.title.toLowerCase().includes(searchTerm) ||
          ad.description.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredAds(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value });
  };  const handleAddAd = async (newAd) => {
    try {
      // The ad is already uploaded and returned from the backend
      // Just add it to the state with the proper status string
      const addedAd = {
        ...newAd,
        status: getStatusString(newAd.status)
      };
      
      setAds([...ads, addedAd]);
      setIsUploadModalOpen(false);
    } catch (error) {
      console.error("Error adding ad:", error);
      alert("Failed to add ad. Please try again.");
    }
  };  const handleUpdateAd = async (updatedAd) => {
    try {
      // If updating with new video, the data already comes from the backend
      // Just ensure the status is correctly formatted
      const updatedAdWithStatus = {
        ...updatedAd,
        status: typeof updatedAd.status === 'number' ? getStatusString(updatedAd.status) : updatedAd.status
      };
      
      const updatedAds = ads.map((ad) =>
        ad.id === updatedAdWithStatus.id ? updatedAdWithStatus : ad
      );
      
      setAds(updatedAds);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating ad:", error);
      alert("Failed to update ad. Please try again.");
    }
  };
  const handleDeleteAd = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa quảng cáo này không?")) {
      try {
        await axios.delete(`${ADS_API_URL}/${id}`);
        setAds(ads.filter((ad) => ad.id !== id));
      } catch (error) {
        console.error("Error deleting ad:", error);
        alert("Failed to delete ad. Please try again.");
      }
    }
  };  const handleApproveAd = async (id) => {
    try {
      // Find the current ad
      const adToUpdate = ads.find(ad => ad.id === id);
      if (!adToUpdate) return;
      
      // Update status to approved
      const response = await axios.put(`${ADS_API_URL}/${id}/status`, {
        status: AD_STATUS.APPROVED
      });
      
      // Handle API response format: { code, message, data }
      if (response.data && response.data.code === 200 && response.data.data) {
        const updatedAds = ads.map((ad) =>
          ad.id === id
            ? {
                ...ad,
                status: "approved",
                updatedAt: response.data.data.updatedAt || new Date().toISOString(),
              }
            : ad
        );
        setAds(updatedAds);
      }
    } catch (error) {
      console.error("Error approving ad:", error);
      alert("Failed to approve ad. Please try again.");
    }
  };  const handleRejectAd = async (id) => {
    const reason = window.prompt("Nhập lý do từ chối quảng cáo:");
    if (reason !== null) {
      try {
        // Find the current ad
        const adToUpdate = ads.find(ad => ad.id === id);
        if (!adToUpdate) return;
        
        // Update status to rejected with reason
        const response = await axios.put(`${ADS_API_URL}/${id}/status`, {
          status: AD_STATUS.REJECTED,
          rejectionReason: reason
        });
        
        // Handle API response format: { code, message, data }
        if (response.data && response.data.code === 200 && response.data.data) {
          const updatedAds = ads.map((ad) =>
            ad.id === id
              ? {
                  ...ad,
                  status: "rejected",
                  rejectionReason: reason,
                  updatedAt: response.data.data.updatedAt || new Date().toISOString(),
                }
              : ad
          );
          setAds(updatedAds);
        }
      } catch (error) {
        console.error("Error rejecting ad:", error);
        alert("Failed to reject ad. Please try again.");
      }
    }
  };
  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Không xác định";
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Đã duyệt
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Chờ duyệt
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Từ chối
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            Không xác định
          </span>
        );
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col">
      <Navbar />
      <div className="pt-20 pb-10 px-6 container mx-auto flex-grow">
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Quản lý quảng cáo</h1>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
            >
              <FaPlus className="mr-2" />
              Thêm quảng cáo mới
            </button>
          </div>

          {/* Filter controls */}
          <div className="mb-6 bg-gray-700 p-4 rounded-lg">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Thể loại
                </label>
                <div className="relative">
                  <select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}                    className="block w-full px-4 py-2 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                  >
                    <option value="all">Tất cả thể loại</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <FaFilter />
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Trạng thái
                </label>
                <div className="relative">
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="block w-full px-4 py-2 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="rejected">Từ chối</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <FaFilter />
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={handleSearchChange}
                    placeholder="Tìm kiếm theo tên, mô tả..."
                    className="block w-full px-4 py-2 bg-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-10"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <FaSearch />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ad list */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                <span className="ml-3 text-white">Đang tải...</span>
              </div>
            ) : filteredAds.length > 0 ? (
              <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-600">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                      Quảng cáo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                      Thông tin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-200 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {filteredAds.map((ad) => (
                    <tr key={ad.id} className="hover:bg-gray-650 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-20 w-32 relative">
                            <img
                              className="h-20 w-32 object-cover rounded"
                              src={ad.thumbnail || adBanner}
                              alt={ad.title}
                            />
                            <div className="absolute bottom-0 right-0 bg-black bg-opacity-75 px-1 text-xs text-white rounded">
                              {ad.duration}s
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">
                          {ad.title}
                        </div>
                        <div className="text-sm text-gray-300 line-clamp-2 max-w-xs">
                          {ad.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Thể loại: {getCategoryName(ad.categoryId)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>{getStatusLabel(ad.status)}</div>
                        {ad.status === "rejected" && (
                          <div className="text-xs text-red-400 mt-1 max-w-xs">
                            Lý do: {ad.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div>
                          Tạo: {new Date(ad.createdAt).toLocaleDateString("vi-VN")}
                        </div>
                        <div>
                          Cập nhật: {new Date(ad.updatedAt).toLocaleDateString("vi-VN")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedAd(ad);
                              setIsEditModalOpen(true);
                            }}
                            className="text-indigo-400 hover:text-indigo-300"
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteAd(ad.id)}
                            className="text-red-400 hover:text-red-300"
                            title="Xóa"
                          >
                            <FaTrashAlt />
                          </button>
                          {ad.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApproveAd(ad.id)}
                                className="text-green-400 hover:text-green-300"
                                title="Duyệt"
                              >
                                <FaCheck />
                              </button>
                              <button
                                onClick={() => handleRejectAd(ad.id)}
                                className="text-yellow-400 hover:text-yellow-300"
                                title="Từ chối"
                              >
                                <FaTimes />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-10 text-gray-400">
                Không tìm thấy quảng cáo nào
              </div>
            )}
          </div>
        </div>
      </div>      {/* Upload Modal */}
      {isUploadModalOpen && (
        <AdUploadModal
          onClose={() => setIsUploadModalOpen(false)}
          onSave={handleAddAd}
          categories={categories} 
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedAd && (
        <AdEditModal
          ad={selectedAd}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleUpdateAd}
          categories={categories}
        />
      )}

      <Footer />
    </div>
  );
}

export default AdManagement;
