# src/entities/CLAUDE.md

## 📋 Entities 계층 규칙

### 계층 목적
- **순수 비즈니스 도메인 타입 정의**
- **데이터 변환 함수 (순수 함수)**
- **API 스펙 정의 (구현 제외)**
- **계층 간 데이터 계약 정의**

### 폴더 구조
```
entities/
├── types/          # TypeScript 타입 정의
├── models/         # 데이터 변환 모델
├── apis/          # API 스펙 정의
└── [도메인별]/     # 특정 도메인 타입
```

### 코딩 규칙

#### TypeScript 타입 정의
- **strict 모드 필수**: `any` 타입 절대 금지
- **명시적 타입**: 모든 프로퍼티 타입 명시
- **Nullable 처리**: `| null | undefined` 명시적 정의
- **Enum 활용**: 상수값은 enum으로 정의

```typescript
// ✅ 올바른 예시
interface ServerConfig {
  id: number;
  name: string;
  port: number;
  status: ServerStatus;
  description: string | null;
}

enum ServerStatus {
  RUNNING = 'running',
  STOPPED = 'stopped',
  ERROR = 'error'
}

// ❌ 금지 패턴
interface BadConfig {
  data: any;  // any 타입 금지
  status;     // 타입 누락 금지
}
```

#### 데이터 변환 모델
- **순수 함수만 허용**: 사이드 이펙트 없는 함수
- **snake_case → camelCase**: DB 데이터 변환
- **타입 안전성**: 입출력 타입 명시

```typescript
// ✅ 올바른 순수 함수
export function dbToServerConfig(dbRow: any): ServerConfig {
  return {
    id: dbRow.id,
    name: dbRow.server_name,
    port: dbRow.port_number,
    status: dbRow.status as ServerStatus,
    description: dbRow.description || null
  };
}

// ❌ 금지: 사이드 이펙트 포함
export function badTransform(data: any): any {
  console.log(data); // 로깅 금지
  database.save(data); // DB 접근 금지
  return data;
}
```

### API 스펙 정의
- **Request/Response 타입**: 모든 API 엔드포인트
- **에러 응답 타입**: 표준화된 에러 형식
- **상태 코드**: HTTP 상태 코드와 매핑

```typescript
// API 요청/응답 타입
export interface CreateServerRequest {
  name: string;
  port: number;
  description?: string;
}

export interface CreateServerResponse {
  success: boolean;
  data: ServerConfig;
  message: string;
}

// 표준 에러 응답
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### 절대 금지 사항
- ❌ **Database 직접 접근**: DB 쿼리나 연결 코드
- ❌ **HTTP 요청**: axios, fetch 등 네트워크 호출
- ❌ **파일 시스템 접근**: fs 모듈 사용
- ❌ **외부 라이브러리 의존성**: 최소한으로 제한
- ❌ **사이드 이펙트**: console.log, 전역 변수 수정

### 권장 사항
- ✅ **순수 함수 우선**: 예측 가능한 입출력
- ✅ **타입 안전성**: 컴파일 타임 에러 검출
- ✅ **재사용성**: 다른 계층에서 사용 가능
- ✅ **단순성**: 복잡한 로직 배제
- ✅ **문서화**: JSDoc 주석 활용

### 도메인별 규칙
각 도메인별 폴더는 독립적으로 관리하며, 다음 구조를 따름:
- `types.ts`: 해당 도메인 타입 정의
- `models.ts`: 데이터 변환 함수
- `api.ts`: API 스펙 정의

### 계층 간 의존성
- **허용**: 다른 entities 모듈 import
- **금지**: server, views 계층 import
- **예외**: Node.js 기본 타입만 허용

---
*최종 업데이트: 2024-09-27*
*상위 규칙: 프로젝트 루트 CLAUDE.md*