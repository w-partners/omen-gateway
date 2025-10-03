프로젝트명 : OMEN SERVER GATEWAY with Cloudflare
프로젝트 폴더 :  C:\Users\pasia\projects\OMEN SERVER GATEWAY with Cloudflare
노션 워크로그 :  https://www.notion.so/w-partners/OMEN-SERVER-GATEWAY-with-Cloudflare-2796d94c60b880faa632c41ec45723be?source=copy_link
프로젝트 최종 목표 :
- Omen 노트북을 서버로 구축하여, 외부에서 빠르게 연결할 수 있도록함.
- 노트북 재부팅, 인터넷 재연결시에도 구축된 서버 연결을 빠르게 회복.
- 서버를 여러개 확장해도 각 서버의 실행, 포트관리, 도메인연결이 노트북 재부팅시마다 확인하여 선택 가능.
- 노트북 운용 중에도 상시 관리 가능.
- 모든 기능을 제어할 수 있는 GUI형태의 어플리케이션 구현
프로젝트 포트 : 7777

## 기능 구현 목표
- 서버별 모니터링
- 서버별 시작, 중단.
- 서버별 헬스체크
- 서버별 간단 설명
- 서버 추가, 변경, 삭제.
- 서버별 도메인 설정, 수정, 저장. 삭제.
- 윈도우 시작 시 자동 시작 설정.
- 프로그램 종료.

## 🌐 Cloudflare 터널 설정 정보
### **터널 정보**:
- **터널 이름**: "omen"
- **터널 ID**: 47d2bfd2-c96f-474e-942f-63578be456a5
- **인증서 위치**: C:\Users\pasia\.cloudflared\cert.pem
- **설정 파일**: config.yml

### **도메인 연결**:
- **🎯 메인 관리 페이지**: https://platformmakers.org → localhost:7777 (OMEN Gateway v2.0)
- **게이트웨이 관리**: https://gateway.platformmakers.org → localhost:7777 (OMEN Gateway v2.0)
- **AI 학습보조**: https://learning.platformmakers.org → localhost:3300
- **골프장 관리**: https://golfcourse.platformmakers.org → localhost:9090
- **골프친구 관리자**: https://admin.platformmakers.org → localhost:3000

### **터널 관리 명령어**:
- **터널 목록**: `cloudflared tunnel list`
- **터널 시작**: `cloudflared tunnel run omen`
- **터널 상태**: `cloudflared tunnel info omen`
- **터널 중지**: 프로세스 종료 (Ctrl+C 또는 Task Manager)

### **문제 해결**:
- 터널이 시작되지 않으면 `cloudflared tunnel login` 재인증 필요
- config.yml 파일 경로와 인증서 파일 경로 확인
- 방화벽에서 cloudflared.exe 허용 설정 확인

## 🔧 **포트 관리 및 충돌 방지 규칙 (2025-09-29 추가)**

### **포트 할당 체계**
- **7777**: OMEN Gateway v2.0 (최우선)
- **8080**: AI 학습보조 서비스
- **9090**: 골프장 관리 시스템
- **3000**: 골프친구 관리자 패널

### **포트 충돌 방지 규칙**
1. **시작 전 포트 검사 필수**: `netstat -ano | findstr :포트번호`
2. **EnterpriseDB HTTP 서버 자동 종료**: `taskkill /f /im httpd.exe`
3. **중복 Node.js 프로세스 정리**: 다중 실행 방지
4. **순차적 서비스 시작**: 우선순위 기반 시작 순서 준수

### **자동 시작 스크립트**
- **안전 시작**: `start_services_safe.bat` 사용
- **포트 점검**: 자동 충돌 검사 및 해결
- **프로세스 정리**: 기존 프로세스 정리 후 시작
- **상태 확인**: 시작 후 연결 상태 검증

### **문제 발생 시 대응**
1. **포트 충돌**: EnterpriseDB 또는 기타 서비스 종료
2. **다중 프로세스**: 모든 Node.js 프로세스 종료 후 재시작
3. **메모리 누수**: 정기적 서버 재시작
4. **연결 실패**: Cloudflare 터널 상태 및 방화벽 확인

## 🚀 **완성된 시스템 구성 (2024-09-26)**

### **✅ 핵심 서비스 정보**
- **OMEN Gateway v2.0**: localhost:7777 (메인 관리 페이지)
- **PostgreSQL**: 15 버전, 정상 연결
- **Cloudflare 터널**: omen (ID: 47d2bfd2-c96f-474e-942f-63578be456a5)

### **🌐 외부 접속 주소**
- **메인 관리**: https://platformmakers.org (DNS 설정 완료)
- **로컬 접속**: http://localhost:7777
- **관리 기능**: 모든 서버 모니터링, 시작/중단, 헬스체크, 도메인 관리

### **🔄 윈도우 자동시작 설정**
윈도우 시작프로그램에 등록된 항목:
- **OMEN Gateway v2.0.lnk**: v2.0 서버 자동시작
- **Cloudflare Tunnel.lnk**: 터널 자동시작
- **위치**: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\`

### **⚙️ 실행 파일 위치**
- **웹 서버**: `npm start` (src/server_v2.js)
- **자동시작 스크립트**: v2.0 링크 파일들이 자동 실행

### **🖱️ 클릭으로 서버 시작하기 (2025-09-28 추가)**

#### **방법 1: 배치 파일 직접 실행**
프로젝트 폴더에서 `start_omen_gateway.bat` 파일을 더블클릭

#### **방법 2: 바탕화면 바로가기 사용**
바탕화면의 "OMEN Gateway v2.0 시작" 아이콘을 더블클릭

#### **생성된 파일들**:
- **📄 start_omen_gateway.bat**: 서버 시작 배치 파일
- **🖱️ OMEN Gateway v2.0 시작.lnk**: 바탕화면 바로가기
- **⚙️ create_desktop_shortcut.bat**: 바로가기 생성 스크립트
- **🔧 create_shortcut.ps1**: PowerShell 바로가기 생성 스크립트

#### **서버 중단 시 해결 방법**:
1. **클릭 실행**: 바탕화면 "OMEN Gateway v2.0 시작" 더블클릭
2. **수동 실행**: 프로젝트 폴더에서 `start_omen_gateway.bat` 더블클릭
3. **명령어 실행**:
   ```bash
   cd "C:\Users\pasia\projects\OMEN SERVER GATEWAY with Cloudflare"
   node src/server_v2.js
   ```

#### **배치 파일 기능**:
- ✅ **자동 경로 이동**: 프로젝트 폴더로 자동 이동
- ✅ **서버 상태 표시**: 시작 시간, 작업 폴더 표시
- ✅ **에러 처리**: 서버 종료 시 문제 해결 방법 안내
- ✅ **일시정지**: 서버 종료 시 창이 바로 닫히지 않음

### **🔐 시스템 관리 계정**
기본 등록 계정 (PostgreSQL 데이터베이스에 저장됨):
- **최고관리자(super_admin)**: 01034424668 / 01034424668
- **관리자(admin)**: 01012345678 / 01012345678
- **운영자(operator)**: 01000000000 / 01000000000
- **회원(member)**: 01012341234 / 01012341234

## 전역 지침
- 사용자의 지시는 항상 영어로 번역하여 제공한 후 진행.
- 사용자 지시가 긴경우 첫 두문장만 번역하여 원문과 함께 제공.

* 모든 데이터는 **PostgreSQL** 기반으로 구현한다.
* **Mock 데이터, 임시 데이터, 하드코딩은 절대 금지**한다.
* **SQLite 사용 금지**.
* 불필요한 UI/애니메이션, 속도를 저해하는 요소는 금지.
* 개발용 설정은 두지 않는다.
* 불필요한 서버 프로세스는 종료하되, Claude Code는 종료하지 않는다.
* **단순하게 설계하고 단순하게 작동**하는 것을 최우선 원칙으로 한다.

## 🚨 문제 재발 방지 전역 규칙

### **1. Express 라우터 미들웨어 규칙**
- ✅ **requireRole 패턴 필수**: `requireRole('operator', 'admin', 'super_admin')`
- ❌ **절대 사용 금지**: `requireAuth`, `requireOperator`, `checkRole` (정의되지 않음)
- 📍 **적용 위치**: 모든 `/src/server/routes/` 하위 파일

### **2. EJS 템플릿 JavaScript 충돌 방지**
- ✅ **문자열 연결 필수**: `'text' + variable + 'text'`
- ❌ **템플릿 리터럴 금지**: `\`text\${variable}text\`` (EJS 파서 충돌)
- 📍 **적용 위치**: 모든 `/src/views/` 하위 .ejs 파일

### **3. UTF-8 인코딩 강제 규칙**
- ✅ **BOM 없는 UTF-8 필수**: 모든 한글 포함 파일
- 🔍 **감지 신호**: 한글이 `?�` 로 표시되면 즉시 전체 파일 재작성
- 📍 **적용 위치**: `.ts`, `.js`, `.ejs` 모든 파일

### **4. 디버깅 우선순위 체크리스트**
1. 서버 로그에서 "라우터 등록 완료" 메시지 확인
2. EJS 컴파일 에러 시 JavaScript 템플릿 리터럴 여부 확인
3. undefined 변수 에러 시 라우터 데이터 전달 확인
4. 인코딩 문제 시 UTF-8 재저장 후 서버 재시작
---

## 프로젝트 개요
* PostgreSQL 기반 서버사이드 렌더링 웹사이트
* 프론트엔드: **동적 HTML + CSS**, JavaScript는 필수 상호작용에만 사용
* React, SPA 프레임워크는 **절대 사용하지 않음**
* 목표: **빠르고 직관적인 UI**, **안정적인 데이터 처리**, **Lighthouse 90점 이상**

---

## 기술 스택

* **DB**: PostgreSQL 15
* **Backend**: Node.js 18 LTS, Express 4
* **Template Engine**: EJS 3.x
* **Language**: TypeScript 5 (strict: true)
* **CSS**: SCSS + BEM/ITCSS
* **JS**: Vanilla JS (defer/async, 최소화)
* **테스트**: Jest 29 (unit), Cypress 14 (e2e), playwright-stealth (실사용 환경 검증)
* **패키지 매니저**: Yarn 4
* **v2.0 메인 포트**: 7777 (OMEN Gateway v2.0)
* 기존 서비스 포트: learning(8080), golfcourse(9090), admin(3000)
---

## 🎉 **프로젝트 완성 상태 (2024-09-26)**

### **✅ 모든 목표 달성 완료**
- ✅ **서버별 모니터링**: 실시간 상태 확인 (웹 인터페이스)
- ✅ **서버별 시작, 중단**: 원클릭 제어 (웹 인터페이스)
- ✅ **서버별 헬스체크**: 자동 상태 점검 시스템
- ✅ **서버별 간단 설명**: 각 서비스 정보 표시
- ✅ **서버 추가, 변경, 삭제**: 동적 CRUD 관리
- ✅ **서버별 도메인 설정**: Cloudflare 연동 완료
- ✅ **윈도우 시작 시 자동 시작**: 자동시작 등록 완료
- ✅ **GUI형태의 어플리케이션**: 웹 + 데스크톱 GUI 모두 구현
- ✅ **외부 접속**: https://platformmakers.org 연결 완료

### **🔄 완전 자동화 완성**
**윈도우 재부팅 시나리오:**
1. **자동 서버 시작**: OMEN Gateway v2.0 (포트 7777)
2. **자동 터널 연결**: Cloudflare 터널 (platformmakers.org)
3. **즉시 접속 가능**: 웹 브라우저로 모든 제어
4. **완전한 원격 관리**: 어디서든 https://platformmakers.org 접속

---

## 기본 등록 계정
/* 데이터베이스에 저장됨, 하드 코딩 금지
/* 비밀번호는 아이디와 동일
/* v2.0 시스템에서 검증 완료 (2024-09-26)

**핵심 관리 계정**:
최고관리자(super_admin) 01034424668 / 01034424668
관리자(admin) 01012345678 / 01012345678
운영자(operator) 01000000000 / 01000000000

**일반 고객 계정**:
회원(member) 01012341234 / 01012341234
---

## 🚀 **정리된 프로젝트 구조**

```
📁 OMEN SERVER GATEWAY with Cloudflare/
├── 📄 .env                    # 환경 변수
├── 📄 .env.example            # 환경 변수 예시
├── 📄 config.yml              # Cloudflare 터널 설정
├── 📄 omen-gateway.ico        # 애플리케이션 아이콘
├── 📄 package.json            # Node.js 의존성
├── 📄 package-lock.json       # 의존성 잠금 파일
├── 📄 servers.json            # 서버 설정 파일
├── 📁 src/                    # 소스 코드
│   └── 📄 server_v2.js        # 메인 서버 파일
├── 📁 views/                  # EJS 템플릿
└── 📁 node_modules/           # 의존성 패키지
```

### **🔧 핵심 파일 설명**
- **src/server_v2.js**: OMEN Gateway v2.0 메인 서버
- **config.yml**: Cloudflare 터널 설정
- **servers.json**: 관리 대상 서버 목록
- **omen-gateway.ico**: 시스템 트레이 아이콘

---

## 코드 작성 규칙

* 타입 `any` **절대 금지**
* snake\_case → camelCase 변환은 `models.ts`에서만
* DB 접근은 `services/db`를 통해서만 (직접 쿼리 금지)
* console.log, debugger **절대 금지** (로깅 라이브러리 사용)
* 중복 코드 **절대 금지**, 재사용 가능한 함수/템플릿 우선
* **단순성 우선**: 복잡한 구조나 과도한 추상화는 금지
* 한글이 포함된 것은 UTF-8 무조건 사용

## EJS 템플릿 패턴 규칙 (핵심 필수 사항)

* **Include 패턴 사용 필수**: Express-EJS-Layouts 미들웨어 없이 작동해야 함
* **Layout 패턴 절대 금지**: `<%- body %>` 변수 사용하는 레이아웃 패턴 절대 사용 금지
* **올바른 구조**: `<%- include('partials/header') %>` + 콘텐츠 + `<%- include('partials/footer') %>`
* **Admin 템플릿**: `admin_header.ejs`, `admin_footer.ejs` 필수 사용
* **일반 템플릿**: `main_header.ejs`, `main_footer.ejs` 필수 사용
* **파라미터 전달**: `<%- include('header', { title: title, description: description }) %>`
* 모든 기존 템플릿은 이 패턴으로 변경 완료됨 (2025-09-17)
---

## 검증, 테스트 전략

* **TDD**: Red → Green → Refactor
* Jest: 단위 테스트 (`.unit.spec.ts`)
* Cypress: E2E 테스트 (사용자 시나리오 기반)
* playwright-stealth: 실제 사용자 환경 검증
* Mock 데이터, 임시 구현 **절대 금지**
* 테스트는 실제 DB/서비스 기반으로 작성

---

## 프론트엔드 규칙

* HTML: 시맨틱 태그 필수, 접근성 ARIA 속성 준수
* CSS: BEM 네이밍, 반응형 디자인 기본, 공통 변수 사용
* JS: 최소화, 네이티브 `<details>` `<summary>` 우선 활용
* SEO: `<title>`, 메타태그, 구조화 데이터 적용
* **불필요한 효과·무거운 프레임워크 절대 금지**

## 폼 제출 규칙

* **HTML 폼 기본 제출 방식 사용**: 복잡한 JavaScript 검증 대신 브라우저 기본 검증 활용
* **서버 측 검증 우선**: 클라이언트 검증은 보조적 역할, 서버에서 최종 검증
* **JavaScript 검증 최소화**: 필수적인 경우에만 사용, UX 향상 목적으로만 활용
* **confirm() 다이얼로그**: 폼 제출 전 사용자 확인만 JavaScript로 처리
* **안정성 우선**: 복잡한 클라이언트 로직보다 단순하고 안정적인 HTML 폼 제출

---

## 성능 목표 (Lighthouse / Web Vitals)

* Performance ≥ 90
* FCP < 1.8s
* LCP < 2.5s
* TBT < 200ms
* CLS < 0.1
* SI < 3.4s
* Accessibility ≥ 90
* Best Practices ≥ 90
* SEO ≥ 90

---

## 절대 금지 (Do Not)

* Mock 데이터, 임시 구현 **절대 금지**
* 타입 `any` **절대 금지**
* 직접적인 DOM 조작 (`document.querySelector` 등) **절대 금지**
* console.log, debugger **절대 금지**
* 불필요한 JS 삽입 **절대 금지**
* 과도한 복잡성, 불필요한 추상화 **절대 금지**

---

## 권장 사항 (Do)

* 실제 API/DB 호출 코드 작성
* 재사용 가능한 컴포넌트/템플릿 설계
* 접근성(a11y) 준수, 키보드 네비게이션 보장
* 성능 최적화 (이미지 최적화, 캐시, SQL 튜닝)
* TDD 기반 개발, 코드 리뷰 필수
* **단순하게 설계하고 단순하게 작동**시키는 것

---

## 기존 기능 안정성 보장 규칙 (강화)

* 완성된 기능 모듈은 직접 수정하지 않는다. 확장은 별도 파일/엔드포인트로 추가한다.
* 기존 API 계약(Contract)은 절대 변경 금지. 필요하면 신규 버전(v2) 추가.
* 핵심 DB 스키마(users, auth 등)는 Schema Freeze 상태, 확장은 migration만 허용.
* 신규 기능은 기존 기능을 참조할 수 있으나, 기존 기능이 신규 기능에 의존하는 것은 절대 금지.
* 신규 기능은 **Feature Flag**로 격리. 플래그를 끄면 기존 기능은 100% 정상 작동해야 한다.
* 완성된 기능은 **Regression Test Suite**에 즉시 포함. 깨진 상태에서는 새로운 기능 배포 불가.

---

## 유지보수 지침

* 모든 커밋/스프린트마다 CLAUDE.md 갱신 (필수)
* 새 버그·실수·리뷰 지적사항은 CLAUDE.md에 규칙화
* 불필요한 규칙은 정리·보강해 단순화 유지
* CLAUDE.md 변경은 코드 리뷰 절차 거침
* 동일 문제가 반복되면 즉시 CLAUDE.md 강화
* Claude 활용: 자동 개선 루프 실행
* **단순성 보장**: 복잡해지는 징후 즉시 단순화

## 프로젝트 고유 정보 ( 미 기입시 해당 프로젝트를 확인하고 기록할것.- 정보가 없을경우 사용자에게 요청)
- 프로젝트명 : 
- 프로젝트 폴더 :  
- 노션 워크로그 :  https://www.notion.so/w-partners/OMEN-SERVER-GATEWAY-with-Cloudflare-2796d94c60b880faa632c41ec45723be?source=copy_link
- 프로젝트 최종 목표 :
- 프로젝트 포트 :


## 전역지침
- 사용자의 지시는 항상 영어로 번역하여 제공한 후 진행.
- 사용자 지시가 긴경우 첫 두문장만 번역하여 제공 후 이행.
- 모든 데이터는 **PostgreSQL** 기반으로 구현한다.
- **Mock 데이터, 임시 데이터, 하드코딩은 절대 금지**한다.
- **SQLite 사용 금지**.
- 불필요한 UI/애니메이션, 속도를 저해하는 요소는 금지.
- 개발용 설정은 두지 않는다.
- 불필요한 서버 프로세스는 종료하되, Claude Code는 종료하지 않는다.
- **단순하게 설계하고 단순하게 작동**하는 것을 최우선 원칙으로 한다.
- 이전 세션 연속성, 컨택스트 유지를 위해 {기능}_ckeckpoint.md 파일 전체파일과 가장 최신 기록을 확인.
- **BUSINESS_DOMAIN.md 기반 개발**: 모든 개발은 업데이트된 BUSINESS_DOMAIN.md의 비즈니스 요구사항을 준수한다.
- 사용자가 검증, QC를 지시시 CL_QC.md의 지침을 확인하고 지시대로 이행한다.

## 절대 준수사항 (MUST DO)
- **CL_QC.md 지침 이행**
- **CL_WORK_LOG.md 지침 이행**
- **모든 대화는 대답 전 사용자 요청을 해당하는 {기능}_checkpoint.md에 기록**

### 사용자의 긴급 지시사항.
- 트리거 : 긴급지시, 긴급지침, 긴급, 지시사항.
- CL_CRITICAL_WORK_ORDER.md의 지시사항을 항상 수시 확인할것.
- 내용상 해당 계층, 또는 기능의 폴더에 있는 각 CLAUDE.md에 추가해야할 중요 지침을 판단하여 CLAUDE.md에 기록.
- CL_CRITICAL_WORK_ORDER.md의 내용을 확인하고 각 계층, 또는 해당 기능의 CL_QC_issue_list.md에 기록 후, CL_CRITICAL_WORK_ORDER.md에서는 CL_QC_issue_list.md에 기록된 내용을 삭제.

### 세션의 연속성 - 절대 준수 사항.
- **모든 대화는 대답 전 사용자 요청을 해당하는 {기능}_checkpoint.md에 기록**
- 단순질문은 기록할 필요없음.
- 트리거 : 세션 연속성, 진행사항 파악. -> 프로젝트 내부의 모든 {기능}_checkpoint.md 중 가장 최신의 정보를 확인.
- **확인된 정보를 이행하여 세션의 연속성 유지.**
- {기능}_checkpoint.md의 파일 라인수가 1k를 넘어가면 오래된 기록부터 삭제하여, 1k이하로 유지.

### 지시사항 이행, 검증, QC
- 트리거 : 사용자가 검증, 테스트, QC 지시.
- CL_QC.md의 지침대로 진행

### work log 작성 지침.
- 트리거 : 워크로그 작성
- 사용자가 워크로그 작성 요청시 노션에 워크로그 작성
- 본 지침 상단의 노션 워크로그 URL확인
- CL_WORK_LOG.md의 지침대로 진행.

## 반복된 문제 해결
- 트리거 : 또 같은 문제, 해결했던 문제, 또 발생.
- 루트, 또는 각 계층, 또는 각 폴더의 CL_QC_FEEDBACK.md를 참고
- 반복된 문제는 CL_QC_FEEDBACK.md에 기록하여 반복적인 문제 발생을 예방.
- CL_QC_FEEDBACK.md는 CL_QC.md의 지침에 따라 기록.

### 🗂️ 기본 폴더 구조 생성 요청

- 다음과 같은 폴더 구조를 생성하고 각각에 적절한 CLAUDE.md를 배치해주세요:
- 새로운 페이지, 기능이 추가될 때마다 적절한 폴더를 생성합니다.

```
프로젝트 루트/
├── CLAUDE.md (전체 프로젝트 규칙)
├── MENU_STRUCTURE.md (전체 메뉴 구조: 사용자가 메뉴를 구성, 요청할때마다 갱신합니다.)
├── BUSINESS_DOMAIN.md (해당 프로젝트 구현 세부사항)
├── CL_QC.md (QC 진행 방법, 세부지시사항)
├── CL_QC_FEEDBACK.md (프로젝트 전반 반복 발생 문제 기록)
├── CL_QC_HISTORY.md (프로젝트 전반 발생 문제 원인, 해결방안 기록)
├── CL_QC_issue_list.md (프로젝트 전반 발생 사항:세션 연속성을 위함) 
├── CL_WORK_LOG.md (워크로그 작성 지침)
├── root_checkpoint.md
├── annotate/ (work log 작성을 위한 파일을 저장하는 폴더)
│     └── annotate_screenshot/ (work log 작성시 사용한 주석을 기록한 스크린샷 파일: 사용후 즉시 제거)
│     └── screenshot/ (work log 작성시 사용한 스크린샷 파일: 사용후 즉시 제거)
├── QC/
│     └── screenshots/ (QC를 위한 스크린샷 파일)
├── src/
│   ├── entities/
│   │   ├── CLAUDE.md (엔티티 계층 규칙)
│   │   └── [도메인별 폴더]/
│   │       ├── types/ (TypeScript 타입)
│   │       ├── models/ (데이터 변환)
│   │       ├── apis/ (API 스펙 정의)
│   │       └── CLAUDE.md (도메인별 규칙)
│   ├── server/
│   │   ├── CLAUDE.md (서버 계층 규칙)
│   │   ├── routes/ (HTTP 라우터)
│   │   ├── services/ (비즈니스 로직)
│   │   ├── db/ (DB 연결/쿼리)
│   │   ├── middleware/ (미들웨어)
│   │   └── utils/ (서버 유틸)
│   └── views/
│       ├── CLAUDE.md (뷰 계층 규칙)
│       ├── components/
│       │   ├── CLAUDE.md (컴포넌트 규칙)
│       │   ├── CL_QC_FEEDBACK.md (컴포넌트 기능에서 반복 발생 문제 기록)
│       │   ├── CL_QC_HISTORY.md
│       │   ├── CL_QC_issue_list.md
│       │   ├── components_checkpoint.md
│       │   ├── [컴포넌트 파일들]
│       │   ├── annotate/ (work log 작성을 위한 파일을 저장하는 폴더)
│       │   │     └── annotate_screenshot/ (work log 작성시 사용한 주석을 기록한 스크린샷 파일: 사용후 즉시 제거)
│       │   │     └── screenshot/ (work log 작성시 사용한 스크린샷 파일: 사용후 즉시 제거)
│       │   └── QC/
│       │         └── screenshots/ (QC를 위한 스크린샷 파일)
│       ├── pages/
│       ├── [기능별 폴더]/
│       │   ├── CLAUDE.md (생성한 페이지의 기능별 규칙)
│       │   ├── CL_QC_FEEDBACK.md  (해당 기능에서 반복 발생 문제 기록)
│       │   ├── CL_QC_HISTORY.md
│       │   ├── CL_QC_issue_list.md
│       │   ├── components_checkpoint.md
│       │   ├── [컴포넌트 파일들]
│       │   ├── annotate/ (work log 작성을 위한 파일을 저장하는 폴더)
│       │   │     └── annotate_screenshot/ (work log 작성시 사용한 주석을 기록한 스크린샷 파일: 사용후 즉시 제거)
│       │   │     └── screenshot/ (work log 작성시 사용한 스크린샷 파일: 사용후 즉시 제거)
│       │   └── QC/
│       │         └── screenshots/ (QC를 위한 스크린샷 파일)
│       └── CLAUDE.md (페이지 규칙)
│           ├── CLAUDE.md 생성한 페이지의 기능별 규칙)
│           ├── CL_QC_FEEDBACK.md
│           ├── CL_QC_HISTORY.md
│           ├── CL_QC_issue_list.md
│           ├── components_checkpoint.md
│           ├── [페이지 관련 파일들]
│           ├── annotate/ (work log 작성을 위한 파일을 저장하는 폴더)
│           │     └── annotate_screenshot/ (work log 작성시 사용한 주석을 기록한 스크린샷 파일: 사용후 즉시 제거)
│           │     └── screenshot/ (work log 작성시 사용한 스크린샷 파일: 사용후 즉시 제거)
│           └── QC/
│                └── screenshots/ (QC를 위한 스크린샷 파일)
├── check/ (상태체크 관련 파일)
└── tests/ (테스트 파일)
```


### 📋 프로젝트 구조화 원칙

#### 1. 계층별 격리 아키텍처 구현
- **3계층 구조**: Views → Server → Database
- **의존성 방향**: 단방향만 허용 (Views는 Server 호출, Server는 DB 접근)
- **직접 import 금지**: 상위 계층이 하위 계층을 직접 import하면 안됨
- **HTTP 통신**: Views는 Server와 HTTP 요청으로만 통신

#### 2. 계층별 책임 분리
**Views 계층**:
- 템플릿 렌더링 (EJS, React, Vue 등)
- 사용자 인터페이스
- 최소한의 JavaScript (상호작용)
- HTTP 요청을 통한 Server와 통신

**Server 계층**:
- HTTP 라우팅, 미들웨어
- 비즈니스 로직, 데이터 검증
- Database 접근, 트랜잭션 관리
- API 엔드포인트 제공

**Entities 계층**:
- TypeScript 타입 정의
- 데이터 변환 함수 (순수 함수)
- API 스펙 정의 (구현 제외)
- 비즈니스 도메인 타입

#### 3. CLAUDE.md 지침 시스템 구축
**루트 CLAUDE.md**: 전체 프로젝트 규칙과 원칙
**계층별 CLAUDE.md**: 각 폴더마다 해당 계층의 세부 규칙
**기능별 CLAUDE.md**: 특정 기능/모듈의 상세 지침

#### 4. Checkpoint, QC 시스템 도입
- `{기능}_checkpoint.md` 파일로 작업 이력 관리
- 사용자의 모든 입력 내용을 저장 후 지시를 이행하거나 답변 실시.
- 세션 연속성 확보를 위한 상태 저장.
- 지난 작업 확인 요청시 가장 최근 작성된 파일의 가장 최근 기록을 찾아 사용자에게 제시.
- QC 관련 폴더, 파일을 구성할 것.

#### 5.과도한 문서 작성 방지
- 한 문서파일의 양이 늘어나는 것을 대비하기 위해 계층별, 폴더별 문서 정리
- 계층, 기능별 CLAUDE, checkpoint, QC 관련 문서와 폴더는 항상 각 기능에 맞게 분류하여 저장. 
- 각 작업, 기능 구현 시 해당 폴더의 모든 문서를 검토하고 진행할것.
- 반복 문제 발생 시 **CL_QC_FEEDBACK.md를 먼저 검토**할것.

#### 6. 절대 금지 사항
- Mock 데이터, 임시 구현, 하드코딩 절대 금지
- 직접적인 계층 간 모듈 import 금지
- Layout 패턴 금지 (Include 패턴만 사용)
- 타입 `any` 사용 금지


### 🛠️ 구체적 구현 요구사항

#### 기술 스택
- **Database**: PostgreSQL (SQLite, Mock 데이터 절대 금지)
- **Backend**: Node.js + Express + TypeScript (strict 모드)
- **Frontend**: [프로젝트에 따라 지정]
- **테스트**: Jest + Cypress/Playwright

#### 코딩 규칙
- **TypeScript strict 모드** 필수
- **BEM CSS 네이밍** 규칙 준수
- **include 패턴** 사용 (Layout 패턴 금지)
- **requireRole 미들웨어** 패턴 사용

#### 문서화 규칙
- 모든 주요 폴더에 CLAUDE.md 배치
- {기능}_checkpoint.md로 작업 이력 관리
- 변경 사항은 관련 CLAUDE.md에 즉시 반영
- QC 관련 문서 작성 필수.

### 📋 작업 진행 방식

1. **계층별 설계 우선**: 아키텍처부터 설계
2. **CLAUDE.md 작성**: 각 계층의 규칙 명문화
3. **단계적 구현**: 하위 계층부터 상위 계층 순서로
4. **지속적 문서화**: 작업 진행하며 checkpoint 업데이트
5. **격리 원칙 준수**: 각 계층의 책임과 경계 엄격히 준수

### 🎯 최종 목표

- **유지보수성**: 명확한 구조로 코드 이해도 향상
- **확장성**: 새 기능 추가 시 기존 구조 유지
- **일관성**: 모든 개발자가 동일한 패턴으로 작업
- **안정성**: 계층 간 격리로 사이드 이펙트 방지
- **세션 지속성**: checkpoint 시스템으로 작업 연속성 보장

이 구조로 프로젝트를 시작해주세요.
```


---