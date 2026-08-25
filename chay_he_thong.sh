#!/bin/bash

# Clear screen and display banner
clear
echo "======================================================================="
echo "         HỆ THỐNG ĐIỀU HÀNH QUẢN LÝ ĐÀO TẠO AN TÂM EDUCATION"
echo "                    PHIÊN BẢN CHẠY OFFLINE LOCALLY"
echo "======================================================================="
echo ""

# Check Node.js
echo "[1/3] Đang kiểm tra môi trường Node.js..."
if ! command -v node &> /dev/null
then
    echo ""
    echo "[LỖI CRITICAL] Node.js chưa được cài đặt trên máy tính của bạn!"
    echo "Để chạy được hệ thống, vui lòng tải và cài đặt Node.js từ trang chủ:"
    echo ""
    echo "       👉 https://nodejs.org/ (Chọn phiên bản LTS khuyên dùng)"
    echo ""
    echo "Sau khi cài đặt xong, hãy mở lại file này trong Terminal."
    echo "======================================================================="
    exit 1
fi

echo "[OK] Đã tìm thấy Node.js phiên bản: $(node -v)"
echo ""

# Install dependencies
echo "[2/3] Đang kiểm tra và cài đặt các thư viện phụ thuộc (npm install)..."
echo "Thao tác này chỉ cần thực hiện trong lần đầu tiên khởi chạy."
echo "Vui lòng chờ trong giây lát..."
echo ""
npm install --no-audit --no-fund

# Check for .env file
if [ ! -f .env ]; then
    echo "[OK] Sao chép và khởi tạo file cấu hình .env..."
    cp .env.example .env
fi

# Build web application
echo ""
echo "[3/3] Đang đóng gói giao diện ứng dụng (npm run build)..."
npm run build

# Clear screen and launch
clear
echo "======================================================================="
echo "         HỆ THỐNG ĐIỀU HÀNH QUẢN LÝ ĐÀO TẠO AN TÂM EDUCATION"
echo "======================================================================="
echo ""
echo "[OK] Tất cả đã sẵn sàng!"
echo ""
echo "👉 HỆ THỐNG ĐANG ĐƯỢC KHỞI CHẠY TẠI: http://localhost:3000"
echo ""
echo "* Lưu ý: Giữ cửa sổ Terminal này luôn mở trong suốt quá trình làm việc."
echo "         Khi muốn tắt hệ thống, bạn có thể đóng cửa sổ Terminal này."
echo "======================================================================="
echo ""

# Automatically open web browser
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
elif command -v open &> /dev/null; then
    open http://localhost:3000
fi

# Start express server
npm start
