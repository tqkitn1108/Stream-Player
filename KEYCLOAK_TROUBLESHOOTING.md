# Hướng dẫn khắc phục vấn đề Authentication với Keycloak

## Vấn đề
Khi chạy ứng dụng trên `localhost:5173` hoặc triển khai trên Vercel, sau khi đăng nhập và reload trang, authentication state bị mất (hiển thị `authenticated: false`).

## Nguyên nhân
1. **CORS Issues**: Keycloak có thể từ chối silent check SSO trên localhost
2. **Domain Mismatch**: Cấu hình Keycloak client không bao gồm tất cả các domain
3. **Storage Issues**: Token không được lưu trữ/khôi phục đúng cách

## Giải pháp đã triển khai

### 1. Cấu hình môi trường động (`src/utils/envConfig.js`)
- Tự động phát hiện môi trường (localhost, IP, Vercel)
- Áp dụng cấu hình phù hợp cho từng môi trường
- Tắt silent check SSO cho localhost và Vercel

### 2. Cải thiện Keycloak initialization (`src/services/keycloak.js`)
- Sử dụng cấu hình môi trường động
- Xử lý tốt hơn việc refresh token
- Logging chi tiết để debug

### 3. Custom hook cho Authentication (`src/hooks/useKeycloakAuth.js`)
- Quản lý authentication state tốt hơn
- Listen for Keycloak events
- Xử lý reload page

### 4. Debug utilities (`src/utils/keycloakDebug.js`)
- Công cụ debug toàn diện
- Kiểm tra token, storage, cấu hình
- Sử dụng: `window.keycloakDebug.debugKeycloak()`

## Cách sử dụng

### Debug thông tin
Mở Browser Developer Tools và chạy:
```javascript
window.keycloakDebug.debugKeycloak()
```

### Kiểm tra cấu hình Keycloak Client
Đảm bảo trong Keycloak Admin Console, client `stream-app` có:

**Valid Redirect URIs:**
```
http://localhost:5173/*
http://169.254.96.79:5173/*
https://stream-player-kappa.vercel.app/*
```

**Valid Post Logout Redirect URIs:**
```
http://localhost:5173
http://169.254.96.79:5173
https://stream-player-kappa.vercel.app
```

**Web Origins:**
```
http://localhost:5173
http://169.254.96.79:5173
https://stream-player-kappa.vercel.app
```

### Environment Variables
Đảm bảo các file `.env` có cấu hình đúng:

**.env.development:**
```
VITE_BACKEND_URL=http://localhost:8080
VITE_KEYCLOAK_URL=https://vqm.tivi360.vn/auth
VITE_DEBUG_KEYCLOAK=true
```

**.env.production:**
```
VITE_KEYCLOAK_URL=https://vqm.tivi360.vn/auth
VITE_BACKEND_URL=https://fast-api-gstv.onrender.com
VITE_DEBUG_KEYCLOAK=false
```

## Troubleshooting

### 1. Nếu vẫn gặp vấn đề trên localhost:
- Thử sử dụng IP thay vì localhost: `http://169.254.96.79:5173`
- Kiểm tra Keycloak client configuration
- Clear browser cache và cookies

### 2. Nếu vấn đề trên Vercel:
- Kiểm tra environment variables trên Vercel dashboard
- Đảm bảo domain Vercel được thêm vào Keycloak client
- Kiểm tra Network tab để xem lỗi CORS

### 3. Debug steps:
1. Mở DevTools → Console
2. Chạy `window.keycloakDebug.debugKeycloak()`
3. Kiểm tra token expiry và storage
4. Kiểm tra Network tab cho Keycloak requests

## Ghi chú quan trọng
- Silent Check SSO được tắt cho localhost và Vercel do CORS issues
- IP address vẫn sử dụng Silent Check SSO và hoạt động tốt
- Tất cả thay đổi đều backward compatible
- Debug mode tự động bật trong development
