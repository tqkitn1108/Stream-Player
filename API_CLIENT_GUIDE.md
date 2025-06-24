# API Client Documentation

## Tổng quan

Hệ thống API client được thiết kế để tự động thêm Keycloak token vào các request cần authentication và xử lý các lỗi một cách thông minh.

## Các tính năng chính

### 1. Auto Token Injection
- Tự động thêm JWT token vào header `Authorization` cho các request cần authentication
- Ưu tiên các HTTP methods: `POST`, `PUT`, `PATCH`, `DELETE`
- Thêm token cho `GET` requests nếu user đã đăng nhập

### 2. Smart Authentication Detection
- Whitelist các public endpoints không cần token
- Tự động detect các request cần authentication
- Báo lỗi nếu cần authentication nhưng user chưa đăng nhập

### 3. Automatic Token Refresh
- Tự động refresh token khi nhận lỗi 401
- Retry request với token mới
- Logout user nếu refresh thất bại

### 4. Error Handling
- Xử lý các lỗi HTTP phổ biến (401, 403, 422, 500+)
- Network error handling
- User-friendly error messages

## Cách sử dụng

### Option 1: Sử dụng Global Axios (Recommended)

Axios global đã được setup với interceptors, chỉ cần import và sử dụng:

```javascript
import axios from 'axios';

// POST request sẽ tự động có token nếu user đã đăng nhập
const createVideo = async (videoData) => {
  try {
    const response = await axios.post('/api/videos', videoData);
    return response.data;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
};

// GET request công khai
const getPublicVideos = async () => {
  const response = await axios.get('/api/videos/public');
  return response.data;
};
```

### Option 2: Sử dụng API Client Helpers

Import từ `apiClient.js` để có type safety và consistency:

```javascript
import { authenticatedApi, publicApi } from '../services/apiClient';

// Authenticated requests
const videoService = {
  create: (data) => authenticatedApi.post('/videos', data),
  update: (id, data) => authenticatedApi.put(`/videos/${id}`, data),
  delete: (id) => authenticatedApi.delete(`/videos/${id}`),
  getMyVideos: () => authenticatedApi.get('/videos/my-videos'),
};

// Public requests
const publicVideoService = {
  getAll: () => publicApi.get('/videos/public'),
  getById: (id) => publicApi.get(`/videos/${id}`),
};
```

### Option 3: Sử dụng Service Layer (Best Practice)

Import service đã được tạo sẵn:

```javascript
import { videoAuthService, videoPublicService } from '../services/videoService';

// Trong component
const handleUpload = async (file, metadata) => {
  try {
    const result = await videoAuthService.uploadVideo(metadata, file);
    console.log('Upload success:', result);
  } catch (error) {
    console.error('Upload failed:', error.message);
  }
};
```

## Cấu hình

### Public Endpoints

Các endpoint sau sẽ KHÔNG tự động thêm token:

```javascript
const PUBLIC_ENDPOINTS = [
  '/auth',
  '/login', 
  '/register',
  '/public',
  '/health',
  '/status'
];
```

### Methods Requiring Auth

Các HTTP method sau sẽ LUÔN yêu cầu authentication:

```javascript
const METHODS_REQUIRING_AUTH = ['POST', 'PUT', 'PATCH', 'DELETE'];
```

## Error Handling

### Automatic Token Refresh

Khi nhận lỗi 401:
1. Hệ thống tự động gọi `refreshToken()`
2. Nếu thành công, retry request với token mới
3. Nếu thất bại, logout user và redirect

### Error Types

```javascript
// 401 - Token expired/invalid
// → Auto refresh và retry

// 403 - Access denied  
// → "Access denied. You do not have permission..."

// 422 - Validation error
// → Return original error with validation details

// 500+ - Server error
// → "Server error. Please try again later."

// Network error
// → "Network error. Please check your connection."
```

## Debugging

### Development Logging

Trong development mode, hệ thống sẽ log chi tiết:

```
📤 🔐 POST /api/videos     // Request với token
📤 🔓 GET /api/videos/public  // Request không token
📥 ✅ 201 POST /api/videos    // Response thành công
❌ 401 POST /api/videos      // Response lỗi
🔄 401 Unauthorized: Attempting to refresh token
✅ Token refreshed successfully, retrying request
```

### Production

Trong production, chỉ log các lỗi quan trọng để tránh spam console.

## Best Practices

1. **Sử dụng Service Layer**: Tạo service functions thay vì gọi axios trực tiếp
2. **Error Handling**: Luôn wrap API calls trong try-catch
3. **Loading States**: Sử dụng loading states cho UX tốt hơn
4. **Type Safety**: Sử dụng TypeScript nếu có thể

```javascript
// ✅ Good
const handleSubmit = async () => {
  setLoading(true);
  try {
    await videoAuthService.create(formData);
    setSuccess(true);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};

// ❌ Bad  
const handleSubmit = () => {
  axios.post('/videos', formData); // No error handling
};
```

## Troubleshooting

### Common Issues

1. **"Authentication required" error**
   - Đảm bảo user đã đăng nhập trước khi gọi API
   - Kiểm tra endpoint có trong PUBLIC_ENDPOINTS không

2. **Token không được thêm**
   - Kiểm tra `isAuthenticated()` return true
   - Kiểm tra `getToken()` return valid token

3. **Infinite refresh loop**
   - Kiểm tra Keycloak configuration
   - Verify refresh token còn valid

### Debug Commands

```javascript
// Check authentication state
console.log('Authenticated:', isAuthenticated());
console.log('Token:', getToken());

// Check axios interceptors
console.log('Request interceptors:', axios.interceptors.request.handlers);
console.log('Response interceptors:', axios.interceptors.response.handlers);
```
