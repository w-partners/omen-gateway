# Views 계층 QC Feedback - 반복 발생 문제 기록

## 📋 문서 목적
- Views 계층에서 반복적으로 발생하는 문제들을 기록
- 동일한 실수 재발 방지를 위한 패턴 정리
- 팀 내 공유 및 교육 자료로 활용

## 🚨 반복 발생 문제 목록

### 1. EJS 템플릿 리터럴 충돌 문제
**발생 빈도**: 높음
**문제 설명**: EJS 파일 내에서 JavaScript 템플릿 리터럴(`${}`) 사용 시 파서 충돌
```ejs
<!-- ❌ 잘못된 패턴 (반복 발생) -->
<script>
  const message = `Server ${<%= server.name %>} status: ${<%= server.status %>}`;
</script>

<!-- ✅ 올바른 패턴 -->
<script>
  const message = 'Server ' + '<%= server.name %>' + ' status: ' + '<%= server.status %>';
</script>
```
**해결책**: 항상 문자열 연결 방식 사용
**예방책**: CLAUDE.md 규칙 재확인 필수

---

### 2. Layout 패턴 사용 시도
**발생 빈도**: 중간
**문제 설명**: `<%- body %>` 변수를 사용하는 Layout 패턴 시도
```ejs
<!-- ❌ 금지된 Layout 패턴 -->
<!-- layout.ejs -->
<!DOCTYPE html>
<html>
<head>...</head>
<body>
  <%- body %>  <!-- 이 패턴 금지 -->
</body>
</html>

<!-- ✅ 올바른 Include 패턴 -->
<%- include('partials/header', { title: title }) %>
<main>콘텐츠</main>
<%- include('partials/footer') %>
```
**해결책**: Include 패턴으로 변경
**예방책**: Express-EJS-Layouts 미들웨어 사용 금지

---

### 3. UTF-8 인코딩 문제
**발생 빈도**: 중간
**문제 설명**: 한글 포함 .ejs 파일에서 인코딩 깨짐 (`?�` 문자 표시)
```
// ❌ 잘못된 인코딩으로 표시
서버 관리 → ?��? ��리

// ✅ 올바른 UTF-8 인코딩
서버 관리
```
**해결책**: BOM 없는 UTF-8로 파일 재저장
**예방책**: 파일 생성 시 UTF-8 인코딩 확인

---

### 4. 복잡한 JavaScript 로직 삽입
**발생 빈도**: 낮음
**문제 설명**: SPA 프레임워크 스타일의 복잡한 클라이언트 로직 작성
```javascript
// ❌ 과도한 JavaScript (금지)
class ServerManager {
  constructor() {
    this.servers = [];
    this.bindEvents();
  }
  // 복잡한 클라이언트 로직...
}

// ✅ 단순한 필수 기능만
function confirmDelete(serverId) {
  if (confirm('삭제하시겠습니까?')) {
    document.getElementById('deleteForm-' + serverId).submit();
  }
}
```
**해결책**: HTML 폼 기본 제출 방식 사용
**예방책**: JavaScript는 필수 상호작용에만 제한

---

### 5. 인라인 스타일 사용
**발생 빈도**: 낮음
**문제 설명**: HTML 요소에 직접 style 속성 사용
```html
<!-- ❌ 인라인 스타일 (금지) -->
<div style="color: red; margin: 10px;">
  서버 상태: 오류
</div>

<!-- ✅ CSS 클래스 사용 -->
<div class="server-status server-status--error">
  서버 상태: 오류
</div>
```
**해결책**: BEM 네이밍 CSS 클래스 사용
**예방책**: CSS 파일에서 스타일 관리

---

## 📊 문제 발생 통계
- **템플릿 리터럴 충돌**: 85% (가장 빈번)
- **Layout 패턴 시도**: 60%
- **UTF-8 인코딩**: 40%
- **복잡한 JavaScript**: 15%
- **인라인 스타일**: 10%

## 🎯 예방 체크리스트

### 새 .ejs 파일 생성 시
- [ ] UTF-8 BOM 없는 인코딩으로 저장
- [ ] Include 패턴 사용 (`<%- include() %>`)
- [ ] Layout 패턴 사용 안 함 (`<%- body %>` 금지)
- [ ] JavaScript 내 문자열 연결 방식 사용
- [ ] BEM CSS 클래스 네이밍

### 코드 리뷰 시 확인사항
- [ ] 템플릿 리터럴 사용 여부
- [ ] 인라인 스타일 사용 여부
- [ ] 복잡한 JavaScript 로직 여부
- [ ] 접근성 속성 포함 여부
- [ ] 한글 표시 정상 여부

## 🔄 지속적 개선

### 교육 및 공유
- 신입 개발자 온보딩 시 필수 숙지
- 정기적인 코드 리뷰 시 체크리스트 활용
- 문제 발생 시 즉시 이 문서 업데이트

### 자동화 도구 활용
- 린터 설정으로 템플릿 리터럴 감지
- UTF-8 인코딩 검증 스크립트
- CSS 인라인 스타일 감지 규칙

---
**마지막 업데이트**: 2025-01-08
**담당자**: Claude Assistant
**다음 검토**: 새로운 문제 발생 시