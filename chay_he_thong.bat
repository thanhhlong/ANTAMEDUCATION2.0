@echo off
title He Thong Dieu Hanh An Tam Education - Chay Offline
cls
echo =======================================================================
echo          HE THONG DIEU HANH QUAN LY DAO TAO AN TAM EDUCATION
echo                     PHIEN BAN CHAY OFFLINE LOCALLY
echo =======================================================================
echo.

:: Check Node.js installation
echo [1/3] Dang kiem tra moi truong Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [LOI CRITICAL] Node.js chua duoc cai dat tren may tinh cua ban!
    echo De chay duoc he thong, vui long tai va cai dat Node.js tu trang chu:
    echo.
    echo        👉 https://nodejs.org/ (Chon phien ban LTS khuyen dung)
    echo.
    echo Sau khi cai dat Node.js xong, hay mo lai file "chay_he_thong.bat" nay.
    echo =======================================================================
    pause
    exit
)

echo [OK] Da tim thay Node.js phien ban:
node -v
echo.

:: Install dependencies
echo [2/3] Dang kiem tra va cai dat cac thu vien (npm install)...
echo Thao tac nay chi can thuc hien trong lan dau tien khoi chay.
echo Vui long cho trong giay lat...
echo.
call npm install --no-audit --no-fund

:: Check for .env file
if not exist .env (
    echo [OK] Sao chep va khoi tao file cau hinh .env...
    copy .env.example .env >nul
)

:: Build web application assets if not built
echo.
echo [3/3] Dang dong goi giao dien ung dung (npm run build)...
call npm run build

:: Clear screen and launch server
cls
echo =======================================================================
echo          HE THONG DIEU HANH QUAN LY DAO TAO AN TAM EDUCATION
echo =======================================================================
echo.
echo [OK] Tat ca da san sang!
echo.
echo 👉 HE THONG DANG DUOC KHOI CHAY TAI: http://localhost:3000
echo.
echo * Luu y: Giu cua so Command Prompt nay luon mo trong suot qua trinh lam viec.
echo          Khi muon tat he thong, ban co the dong cua so nay.
echo =======================================================================
echo.

:: Automatically open web browser
start http://localhost:3000

:: Start express server
call npm start

pause
