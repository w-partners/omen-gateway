@echo off
echo 바탕화면에 OMEN Gateway 바로가기를 생성합니다...

:: 바탕화면 경로 설정
set DESKTOP=%USERPROFILE%\Desktop

:: START 바로가기 생성
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\🚀 OMEN Gateway 시작.lnk'); $Shortcut.TargetPath = '%~dp0START-OMEN-GATEWAY.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.IconLocation = '%~dp0omen-gateway.ico'; $Shortcut.Description = 'OMEN Gateway v2.0 시작'; $Shortcut.Save()}"

:: STOP 바로가기 생성
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\⛔ OMEN Gateway 종료.lnk'); $Shortcut.TargetPath = '%~dp0STOP-OMEN-GATEWAY.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.IconLocation = '%~dp0omen-gateway.ico'; $Shortcut.Description = 'OMEN Gateway v2.0 종료'; $Shortcut.Save()}"

:: 웹사이트 바로가기 생성
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\🌐 OMEN Gateway 접속.lnk'); $Shortcut.TargetPath = 'https://platformmakers.org'; $Shortcut.IconLocation = '%~dp0omen-gateway.ico'; $Shortcut.Description = '외부에서 OMEN Gateway 접속'; $Shortcut.Save()}"

echo.
echo ✅ 바탕화면에 바로가기가 생성되었습니다:
echo    - 🚀 OMEN Gateway 시작
echo    - ⛔ OMEN Gateway 종료
echo    - 🌐 OMEN Gateway 접속
echo.
pause