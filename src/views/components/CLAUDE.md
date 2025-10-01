# src/views/components/CLAUDE.md

## 🧩 Components 폴더 규칙

### 목적
- **재사용 가능한 EJS 컴포넌트 관리**
- **일관된 UI 패턴 유지**
- **Include 패턴 기반 컴포넌트 시스템**

### 컴포넌트 분류

#### 레이아웃 컴포넌트
- `admin_header.ejs`: 관리자 페이지 헤더
- `admin_footer.ejs`: 관리자 페이지 푸터
- `main_header.ejs`: 일반 페이지 헤더
- `main_footer.ejs`: 일반 페이지 푸터

#### UI 컴포넌트
- `navigation.ejs`: 네비게이션 메뉴
- `server_card.ejs`: 서버 정보 카드
- `status_badge.ejs`: 상태 표시 배지
- `form_input.ejs`: 폼 입력 필드

### 컴포넌트 작성 규칙

#### 파라미터 전달
```ejs
<!-- ✅ 올바른 파라미터 전달 -->
<%- include('components/server_card', {
  server: {
    id: server.id,
    name: server.name,
    status: server.status,
    port: server.port
  },
  showActions: true
}) %>
```

#### 기본값 처리
```ejs
<!-- components/server_card.ejs -->
<%
const serverData = server || {};
const showActions = typeof showActions !== 'undefined' ? showActions : false;
const cardClass = 'server-card server-card--' + (serverData.status || 'unknown');
%>

<div class="<%= cardClass %>">
  <h3 class="server-card__title"><%= serverData.name || 'Unknown' %></h3>
  <p class="server-card__port">Port: <%= serverData.port || 'N/A' %></p>

  <% if (showActions) { %>
    <div class="server-card__actions">
      <button onclick="toggleServer('<%= serverData.id %>')">Toggle</button>
    </div>
  <% } %>
</div>
```

### JavaScript 처리 규칙
```ejs
<!-- ✅ 문자열 연결 방식 -->
<script>
function updateServerStatus(serverId, status) {
  const card = document.getElementById('server-' + serverId);
  card.className = 'server-card server-card--' + status;
}
</script>

<!-- ❌ 템플릿 리터럴 금지 -->
<script>
// function updateServerStatus(serverId, status) {
//   const card = document.getElementById(`server-${serverId}`); // 금지
//   card.className = `server-card server-card--${status}`; // 금지
// }
</script>
```

### CSS 클래스 규칙
```css
/* ✅ BEM 네이밍 컨벤션 */
.server-card {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 16px;
  margin: 8px 0;
}

.server-card--running {
  border-color: #28a745;
  background-color: #f8fff9;
}

.server-card--stopped {
  border-color: #dc3545;
  background-color: #fff8f8;
}

.server-card__title {
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 8px 0;
}

.server-card__actions {
  margin-top: 12px;
  text-align: right;
}
```

### 컴포넌트 재사용성
- **독립성**: 외부 의존성 최소화
- **유연성**: 파라미터로 동작 제어
- **일관성**: 동일한 네이밍 패턴 유지
- **테스트 가능**: 다양한 상황에서 테스트

### 에러 처리
```ejs
<!-- 안전한 데이터 접근 -->
<%
try {
  const serverName = server && server.name ? server.name : 'Unknown Server';
  const serverStatus = server && server.status ? server.status : 'unknown';
} catch (error) {
  // 에러 발생 시 기본값 사용
  const serverName = 'Error Loading Server';
  const serverStatus = 'error';
}
%>
```

---
*최종 업데이트: 2024-09-27*
*상위 규칙: src/views/CLAUDE.md*