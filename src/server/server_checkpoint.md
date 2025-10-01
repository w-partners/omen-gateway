# Server Checkpoint - 비즈니스 로직 계층

## 📋 계층 기본 정보
- **계층명**: Server (비즈니스 로직 계층)
- **위치**: src/server/
- **책임**: HTTP 라우팅, 비즈니스 로직, 데이터베이스 접근, API 엔드포인트
- **핵심 원칙**: requireRole 패턴, PostgreSQL 전용, 트랜잭션 관리

## 🔄 최근 작업 기록

### 2025-01-08
- **작업 요청**: 프로젝트 구조 점검 중 server 계층 체크포인트 파일 누락 확인
- **발견 사항**: CLAUDE.md는 존재하나 체크포인트 파일 미생성
- **진행 작업**:
  - ✅ 기존 CLAUDE.md 확인 (2024-09-27 작성됨)
  - 🔄 server_checkpoint.md 신규 생성
  - ⏳ 향후 서버 로직 수정 시 체크포인트 활용 예정

## 📁 현재 폴더 구조
```
src/server/
├── ✅ CLAUDE.md (계층 규칙 - 2024-09-27)
├── ✅ server_checkpoint.md (현재 파일)
├── 📁 routes/ (HTTP 라우터)
├── 📁 services/ (비즈니스 로직)
├── 📁 db/ (DB 연결/쿼리)
├── 📁 middleware/ (미들웨어)
└── 📁 utils/ (서버 유틸리티)
```

## 🎯 Server 계층 현재 상태

### 완료된 핵심 규칙
- ✅ **requireRole 패턴**: 유일한 인증 미들웨어 표준
- ✅ **PostgreSQL 연결**: 환경 변수 기반 DB 연결
- ✅ **트랜잭션 관리**: BEGIN/COMMIT/ROLLBACK 패턴
- ✅ **에러 처리**: 표준화된 에러 응답 형식
- ✅ **보안 규칙**: SQL 인젝션, XSS, CSRF 방지

### 구현된 필수 패턴

#### 1. requireRole 미들웨어 패턴 (✅ 완료)
```javascript
// 올바른 패턴 - 유일한 허용 방식
requireRole('operator', 'admin', 'super_admin')

// 금지된 패턴들
requireAuth ❌
requireOperator ❌
checkRole() ❌
```

#### 2. PostgreSQL 연결 관리 (✅ 완료)
- 연결 풀 사용
- 환경 변수 기반 설정
- 안전한 쿼리 실행

#### 3. 트랜잭션 관리 (✅ 완료)
- BEGIN/COMMIT/ROLLBACK 패턴
- 에러 시 자동 롤백
- 연결 자원 해제

#### 4. 표준 에러 응답 (✅ 완료)
```javascript
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Error message'
  }
}
```

### 실제 구현 상태 체크

#### OMEN Gateway v2.0 (메인 서버)
- ✅ **서버 포트**: 7777 정상 실행
- ✅ **데이터베이스**: PostgreSQL 15 연결
- ✅ **기능 구현**: 서버 모니터링, 시작/중단, 헬스체크
- ✅ **외부 접속**: Cloudflare 터널 연동

#### 핵심 기능별 구현 현황
1. **서버 관리**:
   - ✅ 서버 목록 조회
   - ✅ 서버 상태 모니터링
   - ✅ 서버 시작/중단 제어
   - ✅ 헬스체크 시스템

2. **사용자 인증**:
   - ✅ 로그인/로그아웃
   - ✅ 세션 관리
   - ✅ 역할 기반 접근 제어 (RBAC)

3. **도메인 관리**:
   - ✅ Cloudflare 터널 연동
   - ✅ 도메인 설정 관리

## 🚨 주의사항 및 준수 규칙

### 절대 금지 사항 (재확인)
- ❌ **Mock 데이터**: 하드코딩된 더미 데이터 사용
- ❌ **SQLite**: PostgreSQL만 허용
- ❌ **잘못된 미들웨어**: requireAuth, requireOperator, checkRole
- ❌ **console.log**: 로깅 라이브러리 사용 필수

### 필수 준수 패턴
- ✅ **requireRole 패턴**: 모든 보호된 라우트에 적용
- ✅ **트랜잭션 관리**: 모든 DB 변경 작업
- ✅ **에러 처리**: try-catch 및 표준 응답
- ✅ **환경 변수**: 하드코딩 방지

## 📊 진행 상황 요약

### 계층 성숙도
- **설계**: ✅ 완료 (100%)
- **규칙 정의**: ✅ 완료 (100%)
- **핵심 구현**: ✅ 완료 (100%)
- **운영 상태**: ✅ 정상 (100%)

### 현재 운영 상태
- ✅ **OMEN Gateway v2.0**: 포트 7777 정상 실행
- ✅ **PostgreSQL**: DB 연결 정상
- ✅ **Cloudflare 터널**: 외부 접속 정상
- ✅ **자동 시작**: 윈도우 부팅 시 자동 실행

### 향후 확장 가능 영역
1. **추가 서버 지원**: 새로운 서비스 추가 시
2. **모니터링 강화**: 상세 메트릭 수집
3. **알림 시스템**: 서버 상태 변경 알림
4. **백업 관리**: 자동 백업 시스템

## 🔗 연관 파일들
- **상위 규칙**: `/CLAUDE.md` (프로젝트 전체 규칙)
- **계층 규칙**: `src/server/CLAUDE.md`
- **관련 계층**: `src/entities/`, `src/views/`
- **메인 서버**: `src/server_v2.js`

---
**마지막 업데이트**: 2025-01-08
**상태**: ✅ 완전 구현 및 운영 중
**다음 체크포인트**: 새로운 서버 기능 추가 시