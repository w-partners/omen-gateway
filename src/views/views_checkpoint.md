# Views Checkpoint - 사용자 인터페이스 계층

## 📋 계층 기본 정보
- **계층명**: Views (사용자 인터페이스 계층)
- **위치**: src/views/
- **책임**: EJS 템플릿 렌더링, 사용자 인터페이스, 최소한의 JavaScript 상호작용
- **핵심 원칙**: Include 패턴 필수, Layout 패턴 금지, HTML 폼 기본 제출

## 🔄 최근 작업 기록

### 2025-01-08
- **작업 요청**: 프로젝트 구조 점검 중 views 계층 QC 관련 파일들 누락 확인
- **발견 사항**: CLAUDE.md는 존재하나 체크포인트 및 QC 파일들 미생성
- **진행 작업**:
  - ✅ 기존 CLAUDE.md 확인 (2024-09-27 작성됨)
  - 🔄 views_checkpoint.md 신규 생성
  - 🔄 QC 관련 파일들 생성 예정

## 📁 현재 폴더 구조
```
src/views/
├── ✅ CLAUDE.md (계층 규칙 - 2024-09-27)
├── ✅ views_checkpoint.md (현재 파일)
├── 🔄 CL_QC_FEEDBACK.md (생성 예정)
├── 🔄 CL_QC_HISTORY.md (생성 예정)
├── 🔄 CL_QC_issue_list.md (생성 예정)
├── 📁 components/ (컴포넌트)
│   ├── 🔄 CLAUDE.md (생성 예정)
│   ├── 🔄 QC 관련 파일들 (생성 예정)
│   └── 📁 annotate/ (워크로그용)
├── 📁 pages/ (페이지별 템플릿)
└── 📁 [기능별]/ (특정 기능별 뷰)
```

## 🎯 Views 계층 현재 상태

### 완료된 핵심 규칙
- ✅ **Include 패턴**: `<%- include('partials/header') %>` 방식 채택
- ✅ **Layout 패턴 금지**: `<%- body %>` 변수 사용 금지
- ✅ **JavaScript 템플릿 처리**: 문자열 연결 방식, 템플릿 리터럴 금지
- ✅ **HTML 폼 기본 제출**: JavaScript 대신 기본 폼 제출 방식
- ✅ **BEM CSS 네이밍**: 일관된 CSS 네이밍 컨벤션

### 구현된 필수 패턴

#### 1. EJS Include 패턴 (✅ 완료)
```ejs
<!-- 올바른 패턴 -->
<%- include('partials/admin_header', { title: title, description: description }) %>
<main class="content">
  <!-- 페이지 내용 -->
</main>
<%- include('partials/admin_footer') %>

<!-- 금지된 Layout 패턴 -->
<%- body %> ❌
```

#### 2. JavaScript 템플릿 처리 (✅ 완료)
```ejs
<!-- 올바른 문자열 연결 -->
<script>
  const message = 'Server ' + '<%= server.name %>' + ' is ' + '<%= server.status %>';
</script>

<!-- 금지된 템플릿 리터럴 -->
const message = `Server ${<%= server.name %>}`; ❌
```

#### 3. HTML 폼 기본 제출 (✅ 완료)
- 브라우저 기본 검증 활용
- 서버 측 검증 우선
- confirm() 다이얼로그로 사용자 확인

### 실제 구현 상태 체크

#### OMEN Gateway v2.0 UI
- ✅ **관리자 인터페이스**: 서버 관리, 도메인 설정
- ✅ **반응형 디자인**: 모바일/데스크톱 대응
- ✅ **접근성**: ARIA 속성, 키보드 네비게이션
- ✅ **성능**: Lighthouse 90점 이상 목표

#### 핵심 페이지별 구현 현황
1. **대시보드**:
   - ✅ 서버 목록 표시
   - ✅ 실시간 상태 업데이트
   - ✅ 원클릭 서버 제어

2. **서버 관리**:
   - ✅ 서버 추가/수정/삭제
   - ✅ 포트 관리
   - ✅ 헬스체크 표시

3. **도메인 관리**:
   - ✅ Cloudflare 도메인 설정
   - ✅ 터널 상태 확인

## 🚨 주의사항 및 준수 규칙

### 절대 금지 사항 (재확인)
- ❌ **Layout 패턴**: `<%- body %>` 변수 사용
- ❌ **템플릿 리터럴**: EJS 내부에서 `${}` 사용
- ❌ **직접 DOM 조작**: `document.querySelector` 남용
- ❌ **복잡한 JavaScript**: SPA 프레임워크 패턴
- ❌ **인라인 스타일**: style 속성 사용

### 필수 준수 패턴
- ✅ **Include 패턴**: 모든 템플릿에서 header/footer include
- ✅ **문자열 연결**: JavaScript에서 EJS 변수 사용 시
- ✅ **HTML 폼 제출**: 기본 폼 제출 방식 우선
- ✅ **BEM 네이밍**: CSS 클래스 네이밍
- ✅ **접근성**: ARIA 속성 및 시맨틱 HTML

### UTF-8 인코딩 규칙
- ✅ **BOM 없는 UTF-8**: 모든 .ejs 파일
- 🔍 **감지 신호**: 한글이 `?�`로 표시되면 즉시 전체 파일 재작성
- 📍 **적용 위치**: 모든 .ejs 파일

## 📊 진행 상황 요약

### 계층 성숙도
- **설계**: ✅ 완료 (100%)
- **규칙 정의**: ✅ 완료 (100%)
- **핵심 구현**: ✅ 완료 (100%)
- **QC 시스템**: 🔄 구축 중 (30%)

### 현재 운영 상태
- ✅ **OMEN Gateway v2.0**: 웹 인터페이스 정상 작동
- ✅ **관리 기능**: 모든 서버 관리 기능 구현
- ✅ **외부 접속**: https://platformmakers.org 정상
- ✅ **반응형**: 모바일/데스크톱 모두 지원

### 누락된 QC 시스템
1. **CL_QC_FEEDBACK.md**: 반복 발생 문제 기록
2. **CL_QC_HISTORY.md**: 문제 해결 이력
3. **CL_QC_issue_list.md**: 현재 이슈 목록
4. **components/ 하위 QC 파일들**: 컴포넌트별 QC 시스템

## 🔗 연관 파일들
- **상위 규칙**: `/CLAUDE.md` (프로젝트 전체 규칙)
- **계층 규칙**: `src/views/CLAUDE.md`
- **관련 계층**: `src/server/`, `src/entities/`
- **실제 뷰 파일들**: `views/` 폴더 (프로젝트 루트)

---
**마지막 업데이트**: 2025-01-08
**상태**: ✅ 핵심 구현 완료, QC 시스템 구축 필요
**다음 체크포인트**: QC 관련 파일 생성 완료 후