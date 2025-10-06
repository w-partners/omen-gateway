# PowerShell script to create desktop shortcut for START-ALL.bat
$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = "$Desktop\OMEN 전체 시작.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "C:\Users\pasia\projects\OMEN SERVER GATEWAY with Cloudflare\START-ALL.bat"
$Shortcut.WorkingDirectory = "C:\Users\pasia\projects\OMEN SERVER GATEWAY with Cloudflare"
$Shortcut.Description = "OMEN Gateway 전체 서비스 시작 (서버 + Cloudflare 터널)"
$Shortcut.Save()

Write-Host "바탕화면에 'OMEN 전체 시작' 바로가기가 생성되었습니다!" -ForegroundColor Green
Write-Host ""
Write-Host "이제 바탕화면에서 'OMEN 전체 시작' 아이콘을 더블클릭하면" -ForegroundColor Cyan
Write-Host "OMEN Gateway 서버와 Cloudflare 터널이 모두 실행됩니다." -ForegroundColor Cyan
