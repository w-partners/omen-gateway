@echo off
title OMEN Gateway v2.0 - Auto Start
color 0A

echo.
echo ================================================================
echo              OMEN GATEWAY v2.0 AUTO START
echo ================================================================
echo.

cd /d "C:\Users\pasia\projects\OMEN SERVER GATEWAY with Cloudflare"

echo Step 1: Stopping existing processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im cloudflared.exe >nul 2>&1
timeout /t 3 /nobreak >nul

echo Step 2: Starting OMEN Gateway v2.0 server...
start "OMEN Gateway v2.0" /min cmd /c "npm start"
echo Waiting for server initialization... (10 seconds)
timeout /t 10 /nobreak >nul

echo Step 3: Starting Cloudflare tunnel with correct config...
start "Cloudflare Tunnel" /min cmd /c "cloudflared tunnel --config config.yml run omen"
echo Waiting for tunnel connection... (15 seconds)
timeout /t 15 /nobreak >nul

echo Step 4: Testing connections...
echo.
echo Local server test:
curl -s -I http://localhost:7777 | findstr "HTTP Location" || echo "ERROR: Local server not responding"

echo.
echo External domain test:
curl -s -I https://platformmakers.org | findstr "HTTP Location" || echo "ERROR: External connection failed"

echo.
echo ================================================================
echo                    OMEN GATEWAY STARTED
echo ================================================================
echo.
echo Access Information:
echo    - Local: http://localhost:7777
echo    - External: https://platformmakers.org
echo    - Admin: https://gateway.platformmakers.org
echo.
echo Admin Accounts:
echo    - Super Admin: 01034424668 / 01034424668
echo    - Admin: 01012345678 / 01012345678
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul
start https://platformmakers.org

echo Done! You can close this window. Services will continue running.
pause