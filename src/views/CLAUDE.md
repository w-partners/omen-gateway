# src/views/CLAUDE.md

## 🎨 Views 계층 규칙

### 계층 목적
- **템플릿 렌더링 (EJS)**
- **사용자 인터페이스 구현**
- **최소한의 JavaScript 상호작용**
- **HTTP 요청을 통한 Server와 통신**

### 폴더 구조
```
views/
├── components/     # 재사용 가능한 컴포넌트
├── pages/         # 페이지별 템플릿
└── [기능별]/       # 특정 기능별 뷰
```

### EJS 템플릿 규칙

#### Include 패턴 (필수)
```ejs
<!-- ✅ 올바른 Include 패턴 -->
<%- include('partials/admin_header', {
  title: 'Server Management',
  description: 'OMEN Gateway Server Control Panel'
}) %>

<main class="content">
  <!-- 페이지 내용 -->
</main>

<%- include('partials/admin_footer') %>

<!-- ❌ Layout 패턴 절대 금지 -->
<!-- <%- body %> 변수 사용하는 레이아웃 패턴 사용 금지 -->
```

#### JavaScript 템플릿 처리
```ejs
<!-- ✅ 올바른 문자열 연결 방식 -->
<script>
  const message = 'Server ' + '<%= server.name %>' + ' is ' + '<%= server.status %>';
  const url = '/api/servers/' + '<%= server.id %>';
</script>

<!-- ❌ 템플릿 리터럴 절대 금지 (EJS 파서 충돌) -->
<script>
  // const message = `Server ${<%= server.name %>} is ${<%= server.status %>}`; // 금지
  // const url = `/api/servers/${<%= server.id %>}`; // 금지
</script>
```

### 컴포넌트 구조 (components/)

#### Header/Footer 컴포넌트
```ejs
<!-- partials/admin_header.ejs -->
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title %></title>
  <meta name="description" content="<%= description %>">
  <link rel="stylesheet" href="/css/admin.css">
</head>
<body>
  <header class="admin-header">
    <h1><%= title %></h1>
  </header>
```

#### Navigation 컴포넌트
```ejs
<!-- partials/navigation.ejs -->
<nav class="admin-nav">
  <ul class="nav-list">
    <li class="nav-item">
      <a href="/admin/servers" class="nav-link">서버 관리</a>
    </li>
    <li class="nav-item">
      <a href="/admin/domains" class="nav-link">도메인 관리</a>
    </li>
  </ul>
</nav>
```

### 폼 처리 규칙

#### HTML 폼 기본 제출
```ejs
<!-- ✅ 기본 HTML 폼 제출 (권장) -->
<form action="/admin/servers" method="POST" class="server-form">
  <div class="form-group">
    <label for="serverName" class="form-label">서버 이름</label>
    <input type="text" id="serverName" name="name" required class="form-input">
  </div>

  <div class="form-group">
    <label for="serverPort" class="form-label">포트</label>
    <input type="number" id="serverPort" name="port" min="1000" max="65535" required class="form-input">
  </div>

  <button type="submit" class="btn btn-primary" onclick="return confirm('서버를 생성하시겠습니까?')">
    서버 생성
  </button>
</form>
```

#### 최소한의 JavaScript
```ejs
<script>
// ✅ 필수적인 상호작용만 JavaScript로 처리
function confirmDelete(serverId, serverName) {
  if (confirm('서버 ' + serverName + '을(를) 삭제하시겠습니까?')) {
    document.getElementById('deleteForm-' + serverId).submit();
  }
}

function toggleServerStatus(serverId) {
  if (confirm('서버 상태를 변경하시겠습니까?')) {
    fetch('/api/servers/' + serverId + '/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        location.reload();
      } else {
        alert('오류: ' + data.error.message);
      }
    });
  }
}
</script>
```

### CSS 규칙

#### BEM 네이밍 컨벤션
```css
/* ✅ BEM 네이밍 */
.server-list { }
.server-list__item { }
.server-list__item--active { }
.server-list__status { }
.server-list__status--running { }
.server-list__status--stopped { }

/* 반응형 디자인 */
@media (max-width: 768px) {
  .server-list__item {
    flex-direction: column;
  }
}
```

### 접근성 (a11y) 규칙
```ejs
<!-- ✅ 접근성 준수 -->
<button type="button"
        aria-label="서버 <%= server.name %> 시작"
        onclick="startServer('<%= server.id %>')">
  <span aria-hidden="true">▶</span>
  시작
</button>

<table class="server-table" role="table" aria-label="서버 목록">
  <thead>
    <tr role="row">
      <th scope="col">이름</th>
      <th scope="col">상태</th>
      <th scope="col">포트</th>
    </tr>
  </thead>
</table>
```

### 절대 금지 사항
- ❌ **Layout 패턴**: `<%- body %>` 변수 사용
- ❌ **템플릿 리터럴**: EJS 내부에서 `${}` 사용
- ❌ **직접 DOM 조작**: `document.querySelector` 남용
- ❌ **복잡한 JavaScript**: SPA 프레임워크 패턴
- ❌ **인라인 스타일**: style 속성 사용

### 권장 사항
- ✅ **Include 패턴**: 재사용 가능한 템플릿 구조
- ✅ **HTML 폼 제출**: JavaScript 대신 기본 폼 사용
- ✅ **시맨틱 HTML**: 의미있는 HTML 태그 사용
- ✅ **BEM CSS**: 일관된 CSS 네이밍
- ✅ **접근성**: ARIA 속성 및 키보드 네비게이션

### 성능 최적화
- **CSS 압축**: 프로덕션에서 CSS 최소화
- **이미지 최적화**: WebP 포맷 사용
- **JavaScript 지연 로딩**: defer, async 속성 활용
- **캐싱**: 정적 리소스 캐싱 헤더 설정

### 브라우저 호환성
- **최신 브라우저**: Chrome, Firefox, Safari, Edge 최신 버전
- **점진적 향상**: 기본 기능은 모든 브라우저에서 작동
- **폴리필**: 필요한 경우 최소한의 폴리필 사용

---
*최종 업데이트: 2024-09-27*
*상위 규칙: 프로젝트 루트 CLAUDE.md*