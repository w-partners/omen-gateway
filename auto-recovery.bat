@echo off
title OMEN Gateway 자동 복구 시스템
color 0A

echo.
echo ================================================================
echo               🔄 OMEN GATEWAY 자동 복구 시스템
echo ================================================================
echo.

echo ✅ 1단계: 로컬 서버 상태 확인...
curl -s http://localhost:7777 > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 로컬 서버 오프라인 - 서버 시작 중...
    cd "C:\Users\pasia\projects\OMEN SERVER GATEWAY with Cloudflare"
    start "OMEN Server v2.0" cmd /c "npm start"
    echo ⏳ 서버 시작 대기 중... (10초)
    timeout /t 10 /nobreak > nul
) else (
    echo ✅ 로컬 서버 온라인 (포트 7777)
)

echo.
echo ✅ 2단계: Cloudflare 터널 상태 확인...
cloudflared tunnel info omen | findstr "CONNECTOR" > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 터널 오프라인 - 터널 시작 중...
    taskkill /f /im cloudflared.exe > nul 2>&1
    timeout /t 3 /nobreak > nul
    start "Cloudflare Tunnel" cmd /c "cloudflared tunnel run omen"
    echo ⏳ 터널 연결 대기 중... (15초)
    timeout /t 15 /nobreak > nul
) else (
    echo ✅ Cloudflare 터널 온라인
)

echo.
echo ✅ 3단계: 외부 도메인 연결 테스트...
curl -I https://platformmakers.org 2>&1 | findstr "200\|302" > nul
if %errorlevel% neq 0 (
    echo ❌ 외부 연결 실패 - 포트 설정 확인 필요
    echo.
    echo 🚨 수동 해결 필요:
    echo    1. https://one.dash.cloudflare.com 접속
    echo    2. Tunnels → omen → Public hostname
    echo    3. platformmakers.org → Service: http://localhost:7777
    echo    4. 포트가 7778이면 7777로 변경
    echo.
    pause
) else (
    echo ✅ 외부 도메인 연결 성공
)

echo.
echo ================================================================
echo                    🎉 복구 작업 완료
echo ================================================================
echo.
echo 📊 현재 상태:
echo    - 로컬 서버: http://localhost:7777
echo    - 외부 접속: https://platformmakers.org
echo    - 관리 페이지: https://gateway.platformmakers.org
echo.
echo 📋 문제 해결 가이드: CLOUDFLARE_TROUBLESHOOTING.md
echo.
pause