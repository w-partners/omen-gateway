# QC (Quality Control) – Final Instruction (3단계 기록 체계 + 예시 포함)

---

## 1. QC 목적

* 단순 코드 검토가 아니라 **실사용자 환경 검증** + **문제 기록 → 분석 → 해결 루프**까지 관리
* 문제 관리 파일은 **CL_QC_issue_list.md → CL_QC_HISTORY.md → CL_QC_FEEDBACK.md** 순서로 흐른다
* 격기된 계층된 구조의 폴더에 CL_QC_issue_list.md, CL_QC_HISTORY.md,CL_QC_FEEDBACK.md 파일이 없으면 폴더와, 파일을 생성한다
---

## 2. QC 실행 항목

### A. 코드 검증

* CLAUDE.md 규칙 준수 확인
* `{기능}_checkpoint.md` 업데이트 여부 검증
* Mock/하드코딩 데이터 없는지 확인
* any 타입, console.log, debugger, 불필요한 JS, 금지된 Express/EJS 패턴 점검
* DB 접근은 services/db 경유만 허용
* 레거시 코드 → 삭제 or legacy/ 이동, 사유를 이슈리스트인  CL_QC_issue_list.md에 기록

### B. 사용자 시뮬레이션 (Playwright-Stealth)

* 페이지 접속 → 스크린샷 → 버튼/입력박스 직접 클릭/타이핑
* 화면에 짤림/숨김 발생 시 스크롤 후 동작
* 실행 전후 스크린샷 `QC/{기능}_QC/screenshots/` 폴더에 저장
* 동작 불가/오류 시 → 즉시 CL_QC_issue_list.md 기록

### C. 테스트 및 성능 검증

* Jest 단위 테스트, Cypress E2E, playwright-stealth 실행
* Regression Suite 확인 (로그인/CRUD/CSV 등)
* Lighthouse ≥90 및 성능/보안 기준 통과 여부 확인

---

## 3. 문제 발생 시 기록 체계

### 1단계 이슈리스트 정리 : CL_QC_issue_list.md
* CL_QC_issue_list.md에 기록된 모든 내용은 이행하고 진행. 
* 사용자의 모든 지시사항을 무조건 즉시 기록
* 사용자 지적/테스트 실패가 발견되면 무조건 즉시 기록
* **문서의 line수가 3k를 넘어가면 가장 오래된 기록부터 순차적으로 삭제**
* 기록 항목:

  * 문제 ID
  * 발생 위치 (파일/기능/경로)
  * 발견 경위 (사용자 보고/테스트 실패)
  * 스크린샷 링크
  * 상태: `신규`

**작성 예시**
# CL_QC_issue_list.md

## 문제 ID: UI-2025-09-27-001
- 📂 위치: /src/views/user/login.ejs
- 📝 문제 유형: 버튼 UI 깨짐
- 🔍 발견 경위: 사용자 보고 (“로그인 버튼이 화면에 잘려 보임”)
- 📸 스크린샷: ./user_QC/screenshots/2025-09-27_login_before.png
- 🗂 상태: 신규 (또는 CL_CRITICAL_WORK_ORDER.md 이전)
- 📅 기록일: 2025-09-27

---

### 2단계: CL_QC_HISTORY.md

* QC 분석 후 CL_QC_issue_list.md의 항목을 참조하여 원인/결과 기록
* **문서의 line수가 3k를 넘어가면 가장 오래된 기록부터 순차적으로 삭제**
* 기록 항목:

  * 문제 ID
  * 원인 분석 (코드/환경/UI/테스트 실패 등)
  * 영향 범위 (해당 기능/다른 기능 포함 여부)
  * 재발 가능성 평가
  * 상태: `분석 완료`

**작성 예시**
# CL_QC_HISTORY.md

## 문제 ID: Legacy-2025-09-27-001
- 📂 위치: /src/server/services/oldUserService.ts
- 📝 문제 유형: 사용하지 않는 레거시 코드
- 🔍 발견 경위: QC 중 코드 참조 로그에 해당 모듈 호출 없음 확인 (depcheck 결과 포함)
- ⚠️ 영향 범위: user CRUD API v2로 대체됨, 기존 호출 없음
- 📌 분석 결과:
  - 원인: v2 API 도입으로 기존 코드 미사용
  - 결과: 유지 시 코드 혼란/중복 가능 → 삭제 또는 격리 필요
- 🗂 상태: 분석 완료
- 📅 기록일: 2025-09-27

---

### 3단계: CL_QC_FEEDBACK.md

* **문서의 line수가 3k를 넘어가면 가장 오래된 기록 해결된 문제부터 순차적으로 삭제**
* 해결 방안 및 개선책 정리
* 기록 항목:

  * 문제 ID
  * 적용된 해결 방법
  * 재발 방지책 (규칙 강화, 코드 패턴 금지 등)
  * 최종 상태: `해결` / `보류`
* 사용자에게 “해결되었습니까?” 확인 → ✅ 해결 / ⏸ 보류 기록

**작성 예시**
# CL_QC_FEEDBACK.md

## 문제 ID: Legacy-2025-09-27-001
- 📂 위치: /src/server/services/oldUserService.ts
- ✅ 해결 방법:
  1. oldUserService.ts → /legacy/server/services/ 로 이동
  2. 파일 상단 주석 추가:
     ```ts
     // DEPRECATED: 2025-09-27
     // 원인: user CRUD API v2 적용
     // CLAUDE.md 참조
     ```
  3. Regression Suite 실행 → 로그인/회원 CRUD 정상 통과 확인
  4. Git 브랜치 `legacy-2025-09-27`에 백업 후 main에서 삭제
- 🔄 재발 방지책:
  - CLAUDE.md 강화: “기존 기능은 수정 금지, 확장은 신규 버전으로 추가”
  - QC 프로세스에 **depcheck 실행 단계** 추가
- 📌 최종 상태: 해결
- 📅 확인일: 2025-09-27
- 👤 사용자 확인: ✅ “해결”

---

## 4. 반복 문제 처리

* 사용자가 지적한 내용이 CL_QC_issue_list.md에 기록된 동일/유사 문제인지 체크
* 동일/유사 문제 발견 시 → CL_QC_HISTORY.md에서 과거 분석 확인
* 해결책은 CL_QC_FEEDBACK.md에서 재활용
* 2회 이상 재발 시:

  * CLAUDE.md 규칙 강화
  * CL_QC_FEEDBACK.md에 새로운 해결책 추가

---

## 5. 유지보수 및 개선

* 스프린트/커밋 시점마다 3개 파일 업데이트

  * CL_QC_issue_list.md → 신규 문제
  * CL_QC_HISTORY.md → 분석 결과
  * CL_QC_FEEDBACK.md → 해결책
* 레거시 코드 처리 내역도 동일하게 기록
* 해결되지 않은 문제는 **반드시 재확인 루프** 실행

---

## 6. QC 완료 조건

* [ ] CL_QC_issue_list.md → 모든 문제 기록 완료
* [ ] CL_QC_HISTORY.md → 원인 분석/결과 정리 완료
* [ ] CL_QC_FEEDBACK.md → 해결책 기록 및 사용자 확인 완료
* [ ] CLAUDE.md → 강화된 규칙 반영
* [ ] Regression Suite 및 Lighthouse ≥90 유지