# 🚨 Cloudflare 터널 연결 문제 해결 가이드

## 🔄 **반복되는 문제: https://platformmakers.org 연결 실패**

### **문제 증상**
- ✅ 터널 연결 성공 (icn01, icn05, icn06)
- ✅ 로컬 서버 정상 실행 (localhost:7777)
- ❌ 외부 도메인 접속 시 502 Bad Gateway

### **근본 원인**
**Cloudflare Zero Trust 대시보드 설정**과 **로컬 config.yml** 간의 **포트 설정 불일치**

---

## 🔧 **즉시 해결 방법**

### **1단계: 터널 상태 확인**
```bash
cloudflared tunnel info omen
cloudflared tunnel list
```

### **2단계: 로컬 서버 확인**
```bash
curl -I http://localhost:7777
# 응답: HTTP/1.1 302 Found (로그인 리다이렉트)
```

### **3단계: config.yml 검증**
```yaml
# C:\Users\pasia\projects\OMEN SERVER GATEWAY with Cloudflare\config.yml
ingress:
  - hostname: platformmakers.org
    service: http://localhost:7777  # ← 반드시 7777 포트
```

### **4단계: Cloudflare 대시보드 확인**
1. https://one.dash.cloudflare.com → **Tunnels**
2. **omen** 터널 → **Public hostname**
3. **platformmakers.org** → Service: `http://localhost:7777`
4. **⚠️ 포트가 7778이면 7777로 변경 필수**

### **5단계: 터널 재시작**
```bash
# 기존 터널 중지 (Ctrl+C)
cloudflared tunnel run omen
```

---

## 🛡️ **예방 조치**

### **자동 복구 스크립트**
```batch
@echo off
echo 🔄 OMEN Gateway 자동 복구 시작...

echo ✅ 1. 로컬 서버 상태 확인
curl -s http://localhost:7777 > nul
if %errorlevel% neq 0 (
    echo ❌ 로컬 서버 오프라인 - npm start 필요
    cd "C:\Users\pasia\projects\OMEN SERVER GATEWAY with Cloudflare"
    start npm start
    timeout /t 10
)

echo ✅ 2. 터널 연결 테스트
curl -I https://platformmakers.org | findstr "200\|302"
if %errorlevel% neq 0 (
    echo ❌ 터널 연결 실패 - 재시작 필요
    taskkill /f /im cloudflared.exe 2>nul
    timeout /t 5
    start cloudflared tunnel run omen
    timeout /t 15
)

echo ✅ 3. 최종 연결 테스트
curl -I https://platformmakers.org
echo 🎉 복구 완료
```

### **윈도우 시작프로그램 검증**
```
%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\
- ✅ OMEN Gateway v2.0.lnk (서버 자동시작)
- ✅ Cloudflare Tunnel.lnk (터널 자동시작)
```

---

## 📋 **체크리스트 (매번 확인)**

### **문제 발생 시 순서대로 확인**
- [ ] 1. 로컬 서버 실행 상태: `http://localhost:7777`
- [ ] 2. 터널 연결 상태: `cloudflared tunnel info omen`
- [ ] 3. config.yml 포트 설정: `7777` 확인
- [ ] 4. Cloudflare 대시보드 포트 설정 확인
- [ ] 5. 터널 재시작 후 15초 대기
- [ ] 6. 외부 도메인 접속 테스트

### **절대 하지 말 것**
- ❌ 터널 삭제/재생성 (DNS 전파 시간 필요)
- ❌ config.yml에서 포트 변경 (7777 고정)
- ❌ 여러 터널 동시 실행

---

## 🔍 **고급 디버깅**

### **터널 로그 실시간 모니터링**
```bash
cloudflared tunnel run omen --loglevel debug 2>&1 | findstr ERROR
```

### **Cloudflare 메트릭스 확인**
```bash
curl http://127.0.0.1:20241/metrics | findstr tunnel
```

### **DNS 전파 확인**
```bash
nslookup platformmakers.org
# 결과: 198.41.192.* (Cloudflare IP)
```

---

## 📊 **성공 기준**

### **정상 상태 확인**
```bash
# 1. 로컬 접속
curl -I http://localhost:7777
# 응답: HTTP/1.1 302 Found

# 2. 외부 접속
curl -I https://platformmakers.org
# 응답: HTTP/1.1 302 Found (로그인 페이지로 리다이렉트)
```

### **실패 상태**
```bash
# 502 Bad Gateway = 포트 설정 불일치
# 520/521 Error = 로컬 서버 오프라인
# 연결 거부 = 터널 오프라인
```

---

## 📝 **변경 이력**
- **2025-09-27**: 초기 문서 작성
- **문제**: 포트 7778/7777 불일치로 인한 502 오류
- **해결**: Cloudflare 대시보드 포트 설정 수정 필요

---

## 🆘 **긴급 연락처**
- **Cloudflare 지원**: https://support.cloudflare.com
- **터널 문서**: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/
- **Zero Trust 대시보드**: https://one.dash.cloudflare.com