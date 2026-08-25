# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG AN TÂM EDUCATION TRÊN VIETTEL WEB HOSTING

Tài liệu này hướng dẫn chi tiết cách đưa hệ thống AN TÂM EDUCATION lên môi trường **Viettel Web Hosting** với cấu trúc kiến trúc chuẩn:

```text
Domain của bạn (Ví dụ: antameducation.vn)
      │
      ▼
Viettel Web Hosting (cPanel / DirectAdmin / Linux)
      │
      ├── Node.js 22 (hoặc Node.js 20 LTS)
      │
      ├── Express (app.js)
      │     │
      │     ├── /api/gemini/insights  (Báo cáo CFO & tài chính chiến lược)
      │     ├── /api/gemini/quiz      (Tạo câu hỏi trắc nghiệm tự động)
      │     └── /api/gemini/tutor     (Trợ lý gia sư giải đáp học tập)
      │
      └── dist/ (Giao diện ứng dụng)
            │
            └── React / Vite
                    │
                    ├── Firebase Firestore (Đồng bộ thời gian thực đám mây)
                    │
                    └── LocalStorage (Bộ nhớ đệm Offline-First)

Google Gemini API (gemini-3.7-flash)
        ▲
        │
GEMINI_API_KEY (Cấu hình qua file .env trên Server)
        │
   Node.js Server (app.js)
```

---

## 📌 BƯỚC 1: ĐÓNG GÓI MÃ NGUỒN TRƯỚC KHI TẢI LÊN

Tại thư mục máy tính của bạn:
1. Mở Terminal / Command Prompt và chạy lệnh đóng gói:
   ```bash
   npm install
   npm run build
   ```
2. Sau khi chạy xong, thư mục **`dist/`** sẽ được tạo chứa toàn bộ mã giao diện React đã tối ưu.
3. Nén toàn bộ thư mục dự án thành file `.zip` (Lưu ý: Không cần nén thư mục `node_modules` để file tải lên nhẹ nhất).

---

## 📌 BƯỚC 2: TẢI LÊN VÀ CÀI ĐẶT TRÊN VIETTEL WEB HOSTING

1. Đăng nhập vào bảng điều khiển **Viettel Web Hosting** (cPanel hoặc DirectAdmin).
2. Vào **File Manager** (Trình quản lý tệp tin) -> Mở thư mục gốc của domain (thường là `public_html` hoặc `subdomain_dir`).
3. Tải file `.zip` lên và nhấn **Extract** (Giải nén).

---

## 📌 BƯỚC 3: CẤU HÌNH NODE.JS TRÊN VIETTEL HOSTING

1. Trong cPanel của Viettel Hosting, tìm mục **"Setup Node.js App"** (hoặc *Node.js Selector*).
2. Nhấn nút **"Create Application"**:
   - **Node.js version:** Chọn `22.x` (hoặc `20.x`).
   - **Application mode:** Chọn `Production`.
   - **Application root:** Đường dẫn thư mục bạn vừa giải nén (ví dụ: `public_html` hoặc `antam-app`).
   - **Application URL:** Chọn domain/subdomain của bạn.
   - **Application startup file:** Nhập `app.js`.
3. Trong mục **Environment variables** (Biến môi trường), thêm các biến sau:
   - `GEMINI_API_KEY`: *(Dán mã API Key Gemini của bạn từ Google AI Studio)*
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
4. Nhấn nút **"CREATE"** hoặc **"SAVE"**.
5. Nhấn nút **"Run NPM Install"** trên giao diện để hosting tự động tải và cài đặt các thư viện cần thiết.
6. Nhấn **"START APPLICATION"** (hoặc *RESTART*).

---

## 📌 BƯỚC 4: TRỎ TÊN MIỀN VỀ VIETTEL HOSTING

1. Đăng nhập trang quản lý DNS của Tên miền.
2. Trỏ bản ghi **A** về địa chỉ IP của gói Viettel Web Hosting:
   - Host: `@` -> IP Viettel Hosting
   - Host: `www` -> IP Viettel Hosting
3. Cài đặt chứng chỉ **SSL Miễn phí (Let's Encrypt)** trong cPanel để kích hoạt giao thức bảo mật `https://`.

---

## 📌 BƯỚC 5: KIỂM TRA HỆ THỐNG SAU KHI HOÀN TẤT

- **Truy cập website:** Mở `https://domain-cua-ban.com` để trải nghiệm giao diện quản trị AN TÂM EDUCATION.
- **Kiểm tra API Server:** Truy cập `https://domain-cua-ban.com/api/health` sẽ thấy phản hồi JSON xác nhận Node.js và Gemini API đã sẵn sàng:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-08-25T...",
    "system": "AN TAM EDUCATION Management System",
    "geminiConfigured": true
  }
  ```
- **Dữ liệu hoạt động:** Hệ thống tự động lưu trữ tại LocalStorage trên thiết bị người dùng và đồng bộ hai chiều với Firebase Firestore.
