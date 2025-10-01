@echo off
echo Creating OMEN Gateway desktop shortcuts...

set DESKTOP=%USERPROFILE%\Desktop

echo Creating START shortcut...
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\OMEN Gateway START.lnk'); $Shortcut.TargetPath = '%~dp0START-OMEN-GATEWAY.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.IconLocation = '%~dp0omen-gateway.ico'; $Shortcut.Description = 'Start OMEN Gateway v2.0'; $Shortcut.Save()}"

echo Creating STOP shortcut...
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\OMEN Gateway STOP.lnk'); $Shortcut.TargetPath = '%~dp0STOP-OMEN-GATEWAY.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.IconLocation = '%~dp0omen-gateway.ico'; $Shortcut.Description = 'Stop OMEN Gateway v2.0'; $Shortcut.Save()}"

echo Creating WEBSITE shortcut...
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\OMEN Gateway WEBSITE.lnk'); $Shortcut.TargetPath = 'https://platformmakers.org'; $Shortcut.IconLocation = '%~dp0omen-gateway.ico'; $Shortcut.Description = 'Access OMEN Gateway Website'; $Shortcut.Save()}"

echo.
echo SUCCESS: Desktop shortcuts created:
echo    - OMEN Gateway START.lnk
echo    - OMEN Gateway STOP.lnk
echo    - OMEN Gateway WEBSITE.lnk
echo.
pause