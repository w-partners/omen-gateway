@echo off
title OMEN Gateway - 전체 시작
color 0A

echo.
echo ================================================================
echo           OMEN GATEWAY - 전체 서비스 시작
echo ================================================================
echo.

cd /d "C:\Users\pasia\projects\OMEN SERVER GATEWAY with Cloudflare"

echo [1/3] OMEN Gateway v2.0 서버 시작 중...
start "OMEN Gateway v2.0" /min cmd /c "node src/server_v2.js"
timeout /t 3 /nobreak >nul
echo      ✅ 서버 시작됨 (포트 7777)

echo.
echo [2/3] Cloudflare 터널 시작 중...
start "Cloudflare Tunnel" /min cmd /c ""C:\Program Files\cloudflared\cloudflared.exe" tunnel --config config.yml run omen"
timeout /t 3 /nobreak >nul
echo      ✅ Cloudflare 터널 시작됨

echo.
echo [3/3] 연결 확인 중...
timeout /t 5 /nobreak >nul

curl -s http://localhost:7777/api/health >nul 2>&1
if %errorlevel%==0 (
    echo      ✅ 서버 정상 작동
) else (
    echo      ⚠️ 서버 응답 없음 - 몇 초 더 기다려주세요
)

echo.
echo ================================================================
echo                    시작 완료!
echo ================================================================
echo.
echo 📱 접속 주소:
echo    로컬:    http://localhost:7777
echo    외부:    https://platformmakers.org
echo    관리:    https://gateway.platformmakers.org
echo    Admin:   https://admin.platformmakers.org
echo.
echo 💡 계정 정보:
echo    최고관리자: 01034424668 / 01034424668
echo    관리자:     01012345678 / 01012345678
echo    운영자:     01000000000 / 01000000000
echo.
echo ✅ 이 창을 닫아도 서버는 계속 실행됩니다.
echo.
pause
