# src/server/CLAUDE.md

## 🖥️ Server 계층 규칙

### 계층 목적
- **HTTP 라우팅 및 미들웨어 처리**
- **비즈니스 로직 구현**
- **데이터베이스 접근 및 트랜잭션 관리**
- **API 엔드포인트 제공**

### 폴더 구조
```
server/
├── routes/         # HTTP 라우터
├── services/       # 비즈니스 로직
├── db/            # DB 연결/쿼리
├── middleware/    # 미들웨어
└── utils/         # 서버 유틸리티
```

### 라우터 규칙 (routes/)

#### 필수 미들웨어 패턴
```javascript
// ✅ 올바른 패턴 - requireRole 사용
const { requireRole } = require('../middleware/auth');

router.post('/servers',
  requireRole('operator', 'admin', 'super_admin'),
  async (req, res) => {
    // 구현
  }
);

// ❌ 절대 금지 패턴
router.post('/servers', requireAuth, async (req, res) => {}); // requireAuth 정의되지 않음
router.post('/servers', requireOperator, async (req, res) => {}); // requireOperator 정의되지 않음
router.post('/servers', checkRole('admin'), async (req, res) => {}); // checkRole 정의되지 않음
```

#### 에러 처리 패턴
```javascript
// ✅ 표준 에러 응답
app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message
    }
  });
});

// ✅ 컨트롤러 에러 처리
router.get('/servers/:id', async (req, res) => {
  try {
    const server = await serverService.getById(req.params.id);
    res.json({ success: true, data: server });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: { code: 'SERVER_NOT_FOUND', message: error.message }
    });
  }
});
```

### 서비스 규칙 (services/)

#### 비즈니스 로직 구현
- **단일 책임**: 하나의 도메인만 담당
- **트랜잭션 관리**: DB 작업은 트랜잭션 단위로
- **에러 처리**: 명확한 에러 메시지와 코드

```javascript
// ✅ 올바른 서비스 구현
class ServerService {
  async createServer(data) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        'INSERT INTO servers (name, port, description) VALUES ($1, $2, $3) RETURNING *',
        [data.name, data.port, data.description]
      );

      await client.query('COMMIT');
      return dbToServerConfig(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to create server: ${error.message}`);
    } finally {
      client.release();
    }
  }
}
```

### 데이터베이스 규칙 (db/)

#### PostgreSQL 연결 관리
```javascript
// ✅ 연결 풀 사용
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// ✅ 안전한 쿼리 실행
async function executeQuery(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}
```

#### 쿼리 작성 규칙
- **Prepared Statement**: SQL 인젝션 방지
- **트랜잭션**: 데이터 일관성 보장
- **에러 처리**: DB 에러 적절히 변환

### 미들웨어 규칙 (middleware/)

#### 인증/인가 미들웨어
```javascript
// ✅ requireRole 패턴 (유일한 허용 패턴)
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Login required' }
      });
    }

    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      });
    }

    next();
  };
}

module.exports = { requireRole };
```

### 절대 금지 사항
- ❌ **Mock 데이터**: 하드코딩된 더미 데이터 사용
- ❌ **SQLite 사용**: PostgreSQL만 허용
- ❌ **직접 DOM 접근**: 서버에서 클라이언트 DOM 조작
- ❌ **requireAuth, requireOperator**: 정의되지 않은 미들웨어
- ❌ **console.log**: 로깅 라이브러리 사용

### 권장 사항
- ✅ **실제 PostgreSQL 연결**: .env 환경 변수 사용
- ✅ **requireRole 패턴**: 유일한 인증 미들웨어
- ✅ **트랜잭션 관리**: 데이터 일관성 보장
- ✅ **에러 처리**: 표준화된 에러 응답
- ✅ **환경 변수**: 하드코딩 방지

### 성능 최적화
- **연결 풀 사용**: 데이터베이스 연결 재사용
- **인덱스 활용**: 쿼리 성능 최적화
- **캐싱 전략**: 자주 사용되는 데이터 캐싱
- **페이지네이션**: 대용량 데이터 처리

### 보안 규칙
- **SQL 인젝션 방지**: Prepared Statement 사용
- **XSS 방지**: 입력값 검증 및 이스케이프
- **CSRF 방지**: CSRF 토큰 검증
- **세션 관리**: 안전한 세션 설정

---
*최종 업데이트: 2024-09-27*
*상위 규칙: 프로젝트 루트 CLAUDE.md*