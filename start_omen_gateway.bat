@echo off
title OMEN Gateway v2.0 서버 시작
echo ========================================
echo   OMEN 서버 게이트웨이 v2.0 시작 중...
echo ========================================
echo.

cd /d "C:\Users\pasia\projects\OMEN SERVER GATEWAY with Cloudflare"

echo 🚀 서버 시작 중...
echo 📂 작업 폴더: %CD%
echo ⏰ 시작 시간: %date% %time%
echo.

REM 기존 Node.js 프로세스 중 OMEN Gateway 서버 종료 (충돌 방지)
echo 🔄 기존 서버 프로세스 확인 중...
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv ^| findstr "node.exe"') do (
    echo 기존 Node.js 프로세스 발견: %%i
)

echo.
echo ✅ OMEN Gateway v2.0 서버 실행...
node src/server_v2.js

echo.
echo ❌ 서버가 종료되었습니다.
echo 📋 문제 해결 방법:
echo    1. PostgreSQL 서비스가 실행 중인지 확인
echo    2. 포트 7777이 사용 중인지 확인
echo    3. 네트워크 연결 상태 확인
echo.
pause