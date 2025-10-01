@echo off
title OMEN Gateway v2.0 바탕화면 바로가기 생성
echo ========================================
echo   OMEN Gateway v2.0 바탕화면 바로가기 생성
echo ========================================
echo.

set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT_NAME=OMEN Gateway v2.0 시작.lnk"
set "TARGET_PATH=%~dp0start_omen_gateway.bat"
set "ICON_PATH=%~dp0omen-gateway.ico"

echo 🔗 바로가기 생성 중...
echo 📂 바탕화면 경로: %DESKTOP%
echo 📄 바로가기 이름: %SHORTCUT_NAME%
echo 🎯 대상 파일: %TARGET_PATH%
echo 🎨 아이콘 파일: %ICON_PATH%
echo.

REM PowerShell을 사용하여 바로가기 생성
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\%SHORTCUT_NAME%'); $Shortcut.TargetPath = '%TARGET_PATH%'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Description = 'OMEN Gateway v2.0 서버 시작'; if (Test-Path '%ICON_PATH%') { $Shortcut.IconLocation = '%ICON_PATH%' }; $Shortcut.Save()"

if exist "%DESKTOP%\%SHORTCUT_NAME%" (
    echo ✅ 바탕화면 바로가기가 성공적으로 생성되었습니다!
    echo 📍 위치: %DESKTOP%\%SHORTCUT_NAME%
) else (
    echo ❌ 바로가기 생성에 실패했습니다.
)

echo.
echo 🚀 이제 바탕화면의 "OMEN Gateway v2.0 시작" 아이콘을 더블클릭하여
echo    서버를 쉽게 시작할 수 있습니다!
echo.
pause