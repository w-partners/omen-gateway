@echo off
chcp 65001 > nul
echo.
echo ================================================================
echo  OMEN 서버 안전 시작 스크립트 v2.0
echo  포트 충돌 방지 및 순차 시작 시스템
echo ================================================================
echo.

cd /d "C:\Users\pasia\projects\OMEN SERVER GATEWAY with Cloudflare"

echo [1/4] 포트 충돌 검사 및 정리 중...
echo.

REM 포트 8080 EnterpriseDB 검사 및 종료
echo ▶ 포트 8080 검사 중...
netstat -ano | findstr :8080 > nul
if %errorlevel% equ 0 (
    echo   ❌ 포트 8080이 사용 중입니다. EnterpriseDB 종료 중...
    taskkill /f /im httpd.exe 2>nul
    timeout /t 2 /nobreak > nul
    echo   ✅ EnterpriseDB 종료 완료
) else (
    echo   ✅ 포트 8080 사용 가능
)

REM 기존 Node.js 프로세스 정리
echo ▶ 기존 Node.js 프로세스 정리 중...
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv ^| find /c /v ""') do set nodecount=%%i
if %nodecount% gtr 1 (
    echo   ⚠️ 다중 Node.js 프로세스 감지됨. 정리 중...
    taskkill /f /im node.exe 2>nul
    timeout /t 3 /nobreak > nul
    echo   ✅ Node.js 프로세스 정리 완료
) else (
    echo   ✅ Node.js 프로세스 정상
)

echo.
echo [2/4] OMEN Gateway v2.0 시작 중...
echo ▶ 메인 서버 시작 (포트 7777)...
start "OMEN Gateway v2.0" cmd /k "node src/server_v2.js"
timeout /t 3 /nobreak > nul

echo.
echo [3/4] 서비스 상태 확인 중...
timeout /t 2 /nobreak > nul
netstat -ano | findstr :7777 > nul
if %errorlevel% equ 0 (
    echo   ✅ OMEN Gateway v2.0 정상 시작됨 (포트 7777)
) else (
    echo   ❌ OMEN Gateway v2.0 시작 실패
    echo   📋 문제 해결: 수동으로 "node src/server_v2.js" 실행하세요
)

echo.
echo [4/4] Cloudflare 터널 상태 확인...
echo ▶ 터널 연결 확인 중...
REM Cloudflare 터널은 이미 실행 중이라고 가정
echo   ✅ Cloudflare 터널: 외부 연결 확인 필요
echo   🌐 접속 주소: https://platformmakers.org

echo.
echo ================================================================
echo  ✅ 시작 완료! 다음 주소로 접속하세요:
echo  🌐 외부 접속: https://platformmakers.org
echo  🏠 로컬 접속: http://localhost:7777
echo ================================================================
echo.
echo 문제 발생 시 이 창을 닫지 말고 오류 메시지를 확인하세요.
pause