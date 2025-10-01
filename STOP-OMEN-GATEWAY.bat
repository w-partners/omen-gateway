@echo off
title OMEN Gateway v2.0 - Stop All
color 0C

echo.
echo ================================================================
echo              OMEN GATEWAY v2.0 STOP ALL
echo ================================================================
echo.

echo Step 1: Stopping Node.js server...
taskkill /f /im node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo SUCCESS: Node.js processes stopped
) else (
    echo INFO: No Node.js processes running
)

echo Step 2: Stopping Cloudflare tunnel...
taskkill /f /im cloudflared.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo SUCCESS: Cloudflare tunnel stopped
) else (
    echo INFO: No Cloudflare tunnel running
)

echo Step 3: Checking port 7777...
netstat -ano | findstr ":7777" >nul 2>&1
if %errorlevel% equ 0 (
    echo WARNING: Port 7777 still in use
) else (
    echo SUCCESS: Port 7777 freed
)

echo.
echo ================================================================
echo                    SHUTDOWN COMPLETE
echo ================================================================
echo.
echo Status:
echo    - OMEN Gateway v2.0: STOPPED
echo    - Cloudflare tunnel: STOPPED
echo    - Port 7777: FREED
echo.
echo To restart: START-OMEN-GATEWAY.bat
echo.
pause