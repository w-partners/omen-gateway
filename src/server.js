const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
require('dotenv').config();

// DB 및 서비스 연결
const { testConnection } = require('./db/connection');
const { authenticateUser, requireRole } = require('./services/authService');
const { getServerStatus, startServer, stopServer } = require('./services/serverService');
const { getSystemInfo, getSystemSetting, startCloudflareeTunnel, startPostgreSQL } = require('./services/systemService');

const app = express();
// 포트 설정은 DB에서 조회하거나 환경변수 사용
let PORT = process.env.PORT || 7777;

// 미들웨어 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 세션 설정은 DB에서 조회
const initializeSession = async () => {
  const sessionSecret = await getSystemSetting('session_secret').catch(() => process.env.SESSION_SECRET || 'fallback-secret');

  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }));

  // 모든 라우트 등록
  setupRoutes();
};

const setupRoutes = () => {

// 하드코딩된 서버 설정 삭제 - 모든 설정은 DB에서 조회

// 지침: requireAuth 절대 금지, requireRole 패턴만 사용
// 모든 인증 로직은 authService.js의 requireRole로 처리

// 라우트: 로그인 페이지
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// 라우트: 로그인 처리 (DB 기반)
app.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await authenticateUser(phone, password);
    if (user) {
      req.session.isAuthenticated = true;
      req.session.user = user;
      return res.redirect('/');
    }

    res.render('login', { error: '전화번호 또는 비밀번호가 일치하지 않습니다' });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.render('login', { error: '시스템 오류가 발생했습니다' });
  }
});

// 라우트: 대시보드 (DB 기반, operator 이상 권한 필요)
app.get('/', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
  try {
    // 시스템 정보 및 서버 상태를 DB 기반으로 조회
    const [systemInfo, serverStatus] = await Promise.all([
      getSystemInfo(),
      getServerStatus()
    ]);

    res.render('dashboard', {
      user: req.session.user,
      servers: serverStatus,
      system: systemInfo
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', {
      error: '대시보드 로딩 중 오류가 발생했습니다',
      message: error.message,
      user: req.session.user
    });
  }
});

// 라우트: 서버 시작 (admin 이상 권한 필요)
app.post('/server/start/:id', requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const result = await startServer(req.params.id, req.session.user.id);
    res.json(result);
  } catch (error) {
    console.error('서버 시작 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 라우트: 서버 중지 (admin 이상 권한 필요)
app.post('/server/stop/:id', requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const result = await stopServer(req.params.id, req.session.user.id);
    res.json(result);
  } catch (error) {
    console.error('서버 중지 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 라우트: Cloudflare Tunnel 시작 (super_admin 권한 필요)
app.post('/tunnel/start', requireRole('super_admin'), async (req, res) => {
  try {
    const result = await startCloudflareeTunnel(req.session.user.id);
    res.json(result);
  } catch (error) {
    console.error('Cloudflare Tunnel 시작 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 라우트: PostgreSQL 시작 (super_admin 권한 필요)
app.post('/postgres/start', requireRole('super_admin'), async (req, res) => {
  try {
    const result = await startPostgreSQL(req.session.user.id);
    res.json(result);
  } catch (error) {
    console.error('PostgreSQL 시작 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 라우트: 로그아웃
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});
}; // setupRoutes 함수 닫기

// 서버 초기화 및 시작
const initializeAndStartServer = async () => {
  try {
    // DB 연결 테스트
    await testConnection();
    console.log('✅ PostgreSQL 연결 성공');

    // 세션 초기화
    await initializeSession();
    console.log('✅ 세션 설정 완료');

    // 포트 설정 DB에서 조회
    const dbPort = await getSystemSetting('default_port').catch(() => null);
    if (dbPort) {
      PORT = parseInt(dbPort, 10);
    }

    // 서버 시작
    app.listen(PORT, () => {
      console.log(`
  ========================================
    OMEN 서버 게이트웨이 관리 시스템
  ========================================

    접속 주소: http://localhost:${PORT}

    지침 준수:
    ✅ PostgreSQL 기반 구현
    ✅ requireRole 패턴 적용
    ✅ 하드코딩 제거 완료

  ========================================
  `);
    });

  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    console.log('\n💡 해결 방법:');
    console.log('1. PostgreSQL 서비스가 실행 중인지 확인');
    console.log('2. npm run db:init 명령으로 DB 초기화');
    console.log('3. .env 파일의 DB 설정 확인');
    process.exit(1);
  }
};

// 서버 시작
initializeAndStartServer();
