# src/views/components/CL_QC_FEEDBACK.md

## 🔄 컴포넌트 기능 반복 발생 문제 기록

### 목적
- 컴포넌트 개발 시 반복되는 문제 방지
- EJS 템플릿 관련 이슈 해결 패턴 기록
- 컴포넌트 재사용성 문제 해결

### 반복 문제 기록

#### 1. EJS 템플릿 리터럴 충돌
**문제**: JavaScript 내에서 `${}` 템플릿 리터럴 사용으로 EJS 파서 오류
**발생 빈도**: 높음
**해결책**:
```ejs
<!-- ✅ 올바른 방식 -->
<script>
const message = 'Server ' + '<%= server.name %>' + ' status: ' + '<%= server.status %>';
</script>

<!-- ❌ 문제가 되는 방식 -->
<script>
// const message = `Server ${<%= server.name %>} status: ${<%= server.status %>}`; // 파서 충돌
</script>
```

#### 2. 컴포넌트 파라미터 전달 실패
**문제**: include 시 파라미터가 undefined로 전달
**발생 빈도**: 보통
**해결책**:
```ejs
<!-- ✅ 안전한 파라미터 전달 -->
<%- include('components/server_card', {
  server: server || {},
  showActions: typeof showActions !== 'undefined' ? showActions : false
}) %>

<!-- 컴포넌트 내부에서 안전한 접근 -->
<%
const serverData = server || {};
const serverName = serverData.name || 'Unknown';
%>
```

#### 3. CSS 클래스 동적 생성 오류
**문제**: 동적 CSS 클래스 생성 시 undefined 값으로 인한 오류
**발생 빈도**: 보통
**해결책**:
```ejs
<%
const status = server && server.status ? server.status : 'unknown';
const cardClass = 'server-card server-card--' + status;
%>
<div class="<%= cardClass %>">
```

#### 4. 중첩 include 시 변수 스코프 문제
**문제**: 중첩된 include에서 변수 접근 불가
**발생 빈도**: 낮음
**해결책**: 필요한 변수를 명시적으로 전달
```ejs
<%- include('components/nested_component', {
  parentData: server,
  currentUser: user,
  permissions: permissions
}) %>
```

### 예방 체크리스트

#### 컴포넌트 작성 시
- [ ] 모든 파라미터에 기본값 설정
- [ ] JavaScript 내에서 문자열 연결 방식 사용
- [ ] CSS 클래스 동적 생성 시 null 체크
- [ ] include 파라미터 명시적 전달

#### 테스트 케이스
- [ ] 파라미터 없이 include 시 정상 작동
- [ ] null/undefined 데이터로 테스트
- [ ] 다양한 상태값으로 테스트
- [ ] 중첩 include 상황 테스트

### 권장 패턴

#### 안전한 데이터 접근
```ejs
<%
// 기본값 설정
const server = locals.server || {};
const user = locals.user || {};
const config = locals.config || {};

// 안전한 프로퍼티 접근
const serverName = server.name || 'Unknown Server';
const serverStatus = server.status || 'unknown';
const userRole = user.role || 'guest';
%>
```

#### 조건부 렌더링
```ejs
<% if (server && server.id) { %>
  <div class="server-card">
    <h3><%= server.name %></h3>
    <!-- 서버 정보 표시 -->
  </div>
<% } else { %>
  <div class="server-card server-card--empty">
    <p>서버 정보를 불러올 수 없습니다.</p>
  </div>
<% } %>
```

---
*최종 업데이트: 2024-09-27*
*다음 업데이트: 문제 발생 시 즉시*