$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\OMEN Gateway v2.0 시작.lnk")
$Shortcut.TargetPath = "C:\Users\pasia\projects\OMEN SERVER GATEWAY with Cloudflare\start_omen_gateway.bat"
$Shortcut.WorkingDirectory = "C:\Users\pasia\projects\OMEN SERVER GATEWAY with Cloudflare"
$Shortcut.Description = "OMEN Gateway v2.0 서버 시작"

# 아이콘 파일이 있는지 확인하고 설정
$IconPath = "C:\Users\pasia\projects\OMEN SERVER GATEWAY with Cloudflare\omen-gateway.ico"
if (Test-Path $IconPath) {
    $Shortcut.IconLocation = $IconPath
    Write-Host "✅ 아이콘 설정 완료: $IconPath"
} else {
    Write-Host "⚠️ 아이콘 파일을 찾을 수 없습니다: $IconPath"
}

$Shortcut.Save()
Write-Host "✅ 바탕화면 바로가기가 성공적으로 생성되었습니다!"
Write-Host "📍 위치: $env:USERPROFILE\Desktop\OMEN Gateway v2.0 시작.lnk"