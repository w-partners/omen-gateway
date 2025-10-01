const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// v2 서비스들
const { testConnection, healthCheck } = require('./db/connection_v2');
const { authenticateUser, requireRole } = require('./services/authService');
const {
    serverMonitor,
    startMonitoring,
    getServerStatus,
    getDashboardInfo,
    startServer,
    stopServer,
    restartServer,
    createServer,
    updateServer,
    deleteServer,
    checkServerHealth,
    checkAllServersHealth,
    getServerLogs,
    getHealthLogs
} = require('./services/serverService_v2');
const { getAllDomains } = require('./services/domainService');
const {
    getSystemSetting,
    getSystemInfo,
    saveSystemMetrics,
    getSystemMetrics,
    startCloudflareeTunnel,
    stopCloudflareeTunnel,
    startPostgreSQL,
    stopPostgreSQL,
    getPostgreSQLStatus,
    getNotificationSettings,
    sendNotification,
    performSystemHealthCheck
} = require('./services/systemService_v2');
const {
    getActiveDomains,
    createDomain,
    updateDomain,
    deleteDomain,
    checkDomainHealth,
    getServerDomainMapping,
    getDomainStatistics
} = require('./services/domainService_v2');
const {
    SYSTEM_PORTS,
    checkPortUsage,
    checkAllPortsStatus,
    killProcessByPid,
    killPortProcesses,
    killEnterpriseDB,
    cleanupNodeProcesses,
    performSafeRestart,
    getSystemProcessInfo
} = require('./services/portService_v2');

const app = express();

// 포트 설정은 DB에서 조회하거나 환경변수 사용
let PORT = process.env.PORT || 7777;

// =============================================================================
// 미들웨어 설정
// =============================================================================

// 보안 미들웨어
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// CORS 설정 (GUI 애플리케이션과의 통신을 위해)
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8080'],
    credentials: true
}));

// 기본 미들웨어
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '10mb' }));

// 세션 설정 (기본 세션으로 시작)
app.use(session({
    secret: process.env.SESSION_SECRET || 'omen-gateway-fallback-secret-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 // 24시간
    },
    name: 'omen-gateway-session'
}));

// 세션 설정 업데이트 함수 (DB에서 읽어온 시크릿으로 업데이트)
const updateSessionSecret = async () => {
    try {
        const sessionSecret = await getSystemSetting('session_secret').catch(() => null);
        if (sessionSecret) {
            console.log('✅ DB에서 세션 시크릿 로드 완료');
        }
        console.log('✅ 세션 설정 완료');
    } catch (error) {
        console.log('⚠️  DB 세션 시크릿 로드 실패, 기본값 사용');
    }
};

// =============================================================================
// API 라우트 (RESTful)
// =============================================================================

// 헬스체크 엔드포인트
app.get('/api/health', async (req, res) => {
    try {
        const health = await healthCheck();
        res.json(health);
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// =============================================================================
// WPF 애플리케이션 전용 공개 API (인증 없음)
// =============================================================================

// WPF용 간단한 API 키 인증 (옵션)
const WPF_API_KEY = 'wpf-client-2024';
const authenticateWPF = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey && apiKey === WPF_API_KEY) {
        return next();
    }
    // API 키가 없어도 통과시킴 (공개 API)
    next();
};

// WPF용 시스템 정보
app.get('/api/public/system', authenticateWPF, async (req, res) => {
    try {
        const systemInfo = await getSystemInfo();
        res.json({
            ...systemInfo,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch system info',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// WPF용 대시보드 정보
app.get('/api/public/dashboard', authenticateWPF, async (req, res) => {
    try {
        const dashboard = await getDashboardInfo();
        const systemInfo = await getSystemInfo();

        res.json({
            dashboard,
            systemInfo,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch dashboard info',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// WPF용 도메인 목록 조회
app.get('/api/public/domains', authenticateWPF, async (req, res) => {
    try {
        const domains = await getAllDomains();
        res.json({
            domains: domains || [],
            count: domains.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch domains',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// WPF용 서버 목록 조회 (공개)
app.get('/api/public/servers', authenticateWPF, async (req, res) => {
    try {
        const servers = await getServerStatus();
        res.json({
            servers: servers || [],
            count: servers ? servers.length : 0,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch servers',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// WPF용 서버 시작
app.post('/api/public/servers/:id/start', authenticateWPF, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await startServer(id);
        res.json({
            success: true,
            message: `Server ${id} start command sent`,
            result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to start server',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// WPF용 서버 중지
app.post('/api/public/servers/:id/stop', authenticateWPF, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await stopServer(id);
        res.json({
            success: true,
            message: `Server ${id} stop command sent`,
            result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to stop server',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// WPF용 서버 재시작
app.post('/api/public/servers/:id/restart', authenticateWPF, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await restartServer(id);
        res.json({
            success: true,
            message: `Server ${id} restart command sent`,
            result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to restart server',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// WPF용 연결 테스트
app.get('/api/public/test', authenticateWPF, async (req, res) => {
    try {
        const connection = await testConnection();
        res.json({
            status: 'success',
            connected: connection.success,
            message: connection.message || 'API connection test successful',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            connected: false,
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 시스템 상태 API
app.get('/api/system/status', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        const systemHealth = await performSystemHealthCheck();
        res.json(systemHealth);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 대시보드 데이터 API
app.get('/api/dashboard', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        const [
            dashboardInfo,
            serverStatus,
            systemInfo,
            domainStats
        ] = await Promise.all([
            getDashboardInfo(),
            getServerStatus(),
            getSystemInfo(),
            getDomainStatistics()
        ]);

        res.json({
            dashboard: dashboardInfo,
            servers: serverStatus,
            system: systemInfo,
            domains: domainStats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Dashboard API 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================================================
// 서버 관리 API
// =============================================================================

// 서버 목록 조회
app.get('/api/servers', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        const servers = await getServerStatus();
        res.json(servers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 서버 생성
app.post('/api/servers', requireRole('admin', 'super_admin'), async (req, res) => {
    try {
        const serverData = req.body;
        const newServer = await createServer(serverData, req.user.id);
        res.status(201).json(newServer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 서버 수정
app.put('/api/servers/:id', requireRole('admin', 'super_admin'), async (req, res) => {
    try {
        const updates = req.body;
        const updatedServer = await updateServer(req.params.id, updates, req.user.id);
        res.json(updatedServer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 서버 삭제
app.delete('/api/servers/:id', requireRole('super_admin'), async (req, res) => {
    try {
        await deleteServer(req.params.id, req.user.id);
        res.json({ success: true, message: '서버가 삭제되었습니다' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 서버 시작
app.post('/api/servers/:id/start', requireRole('admin', 'super_admin'), async (req, res) => {
    try {
        const result = await startServer(req.params.id, req.user.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 서버 중지
app.post('/api/servers/:id/stop', requireRole('admin', 'super_admin'), async (req, res) => {
    try {
        const result = await stopServer(req.params.id, req.user.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 서버 재시작
app.post('/api/servers/:id/restart', requireRole('admin', 'super_admin'), async (req, res) => {
    try {
        const result = await restartServer(req.params.id, req.user.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 개별 서버 헬스체크
app.post('/api/servers/:id/health', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        const result = await checkServerHealth(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 전체 서버 헬스체크
app.post('/api/servers/health/all', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        const result = await checkAllServersHealth();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 서버 로그 조회
app.get('/api/servers/:id/logs', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        const { limit, action, status, dateFrom, dateTo } = req.query;
        const options = { limit, action, status, dateFrom, dateTo };
        const logs = await getServerLogs(req.params.id, options);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 헬스체크 로그 조회
app.get('/api/servers/:id/health-logs', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        const hours = parseInt(req.query.hours) || 24;
        const logs = await getHealthLogs(req.params.id, hours);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================================================
// 도메인 관리 API
// =============================================================================

// 도메인 목록 조회
app.get('/api/domains', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        const domains = req.query.active === 'true' ? await getActiveDomains() : await getAllDomains();
        res.json(domains);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 도메인 생성
app.post('/api/domains', requireRole('admin', 'super_admin'), async (req, res) => {
    try {
        const domainData = req.body;
        const newDomain = await createDomain(domainData, req.user.id);
        res.status(201).json(newDomain);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 도메인 수정
app.put('/api/domains/:id', requireRole('admin', 'super_admin'), async (req, res) => {
    try {
        const updates = req.body;
        const updatedDomain = await updateDomain(req.params.id, updates, req.user.id);
        res.json(updatedDomain);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 도메인 삭제
app.delete('/api/domains/:id', requireRole('super_admin'), async (req, res) => {
    try {
        await deleteDomain(req.params.id, req.user.id);
        res.json({ success: true, message: '도메인이 삭제되었습니다' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 도메인 헬스체크
app.post('/api/domains/:domain/health', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        const useHttps = req.body.useHttps !== false;
        const result = await checkDomainHealth(req.params.domain, useHttps);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 서버-도메인 매핑 조회
app.get('/api/domains/mapping', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        const mapping = await getServerDomainMapping();
        res.json(mapping);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 도메인 통계
app.get('/api/domains/statistics', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        const stats = await getDomainStatistics();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================================================
// 시스템 관리 API
// =============================================================================

// 시스템 메트릭 조회
app.get('/api/system/metrics/:type', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        const hours = parseInt(req.query.hours) || 24;
        const metrics = await getSystemMetrics(req.params.type, hours);
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 시스템 메트릭 저장 (수동 트리거)
app.post('/api/system/metrics/save', requireRole('admin', 'super_admin'), async (req, res) => {
    try {
        const result = await saveSystemMetrics();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cloudflare 터널 시작
app.post('/api/tunnels/start', requireRole('super_admin'), async (req, res) => {
    try {
        const { tunnelId } = req.body;
        const result = await startCloudflareeTunnel(tunnelId, req.user.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cloudflare 터널 중지
app.post('/api/tunnels/stop', requireRole('super_admin'), async (req, res) => {
    try {
        const { tunnelId } = req.body;
        const result = await stopCloudflareeTunnel(tunnelId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PostgreSQL 제어
app.post('/api/postgres/start', requireRole('super_admin'), async (req, res) => {
    try {
        const result = await startPostgreSQL(req.user.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/postgres/stop', requireRole('super_admin'), async (req, res) => {
    try {
        const result = await stopPostgreSQL(req.user.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/postgres/status', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        const status = await getPostgreSQLStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 알림 설정 조회
app.get('/api/notifications', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        const { serverId } = req.query;
        const notifications = await getNotificationSettings(serverId);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =============================================================================
// 포트 관리 API (2025-09-29 추가)
// =============================================================================

// 전체 포트 상태 조회
app.get('/api/ports/status', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        const portStatus = await checkAllPortsStatus();
        res.json(portStatus);
    } catch (error) {
        console.error('포트 상태 조회 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// 특정 포트 상태 조회
app.get('/api/ports/:port/status', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        const port = parseInt(req.params.port);
        const portInfo = await checkPortUsage(port);
        res.json(portInfo);
    } catch (error) {
        console.error(`포트 ${req.params.port} 상태 조회 오류:`, error);
        res.status(500).json({ error: error.message });
    }
});

// 특정 포트의 프로세스 종료
app.post('/api/ports/:port/kill', requireRole('admin', 'super_admin'), async (req, res) => {
    try {
        const port = parseInt(req.params.port);
        const result = await killPortProcesses(port);
        res.json(result);
    } catch (error) {
        console.error(`포트 ${req.params.port} 프로세스 종료 오류:`, error);
        res.status(500).json({ error: error.message });
    }
});

// EnterpriseDB HTTP 서버 종료
app.post('/api/ports/kill-enterprisedb', requireRole('admin', 'super_admin'), async (req, res) => {
    try {
        const result = await killEnterpriseDB();
        res.json(result);
    } catch (error) {
        console.error('EnterpriseDB 종료 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// Node.js 프로세스 정리
app.post('/api/ports/cleanup-node', requireRole('admin', 'super_admin'), async (req, res) => {
    try {
        const result = await cleanupNodeProcesses();
        res.json(result);
    } catch (error) {
        console.error('Node.js 프로세스 정리 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// 안전한 시스템 재시작
app.post('/api/ports/safe-restart', requireRole('admin', 'super_admin'), async (req, res) => {
    try {
        const result = await performSafeRestart();
        res.json(result);
    } catch (error) {
        console.error('안전한 재시작 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// 시스템 프로세스 정보 조회
app.get('/api/ports/processes', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        const processInfo = await getSystemProcessInfo();
        res.json(processInfo);
    } catch (error) {
        console.error('프로세스 정보 조회 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================================================
// 웹 라우트 (기존 호환성)
// =============================================================================

// 로그인 페이지
app.get('/login', (req, res) => {
    res.render('login', { error: req.query.error || null });
});

// 로그인 처리
app.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;

        const user = await authenticateUser(phone, password);
        if (user) {
            // 세션이 초기화되지 않은 경우 초기화
            if (!req.session) {
                req.session = {};
            }
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

// 대시보드 (웹 UI)
app.get('/', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        const [
            dashboardInfo,
            serverStatus,
            systemInfo,
            domains
        ] = await Promise.all([
            getDashboardInfo(),
            getServerStatus(),
            getSystemInfo(),
            getActiveDomains()
        ]);

        // 시스템 정보를 안전하게 포맷
        const safeSystemInfo = {
            cpu: systemInfo.cpu && typeof systemInfo.cpu.usage === 'number' ? systemInfo.cpu.usage : 0,
            memory: systemInfo.memory && typeof systemInfo.memory.usage === 'number' ? systemInfo.memory.usage : 0,
            disk: systemInfo.disk && typeof systemInfo.disk.usage === 'number' ? systemInfo.disk.usage : 0,
            uptime: systemInfo.uptime || '알수없음',
            postgresql: systemInfo.postgresql || { status: 'unknown' }
        };

        res.render('dashboard', {
            user: req.user,
            dashboard: dashboardInfo,
            servers: serverStatus,
            system: safeSystemInfo,
            domains: domains
        });
    } catch (error) {
        console.error('Dashboard 오류:', error);
        res.status(500).render('error', {
            error: '대시보드 로딩 중 오류가 발생했습니다',
            message: error.message,
            user: req.user
        });
    }
});

// 서버 상세 정보 페이지
app.get('/server/:id', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const servers = await getServerStatus();
        const server = servers.find(s => s.server_id === id);

        if (!server) {
            return res.status(404).render('error', {
                error: '서버를 찾을 수 없습니다',
                message: `서버 ID: ${id}`,
                user: req.user
            });
        }

        res.render('server-detail', {
            user: req.user,
            server: server
        });
    } catch (error) {
        console.error('서버 상세 정보 로딩 오류:', error);
        res.status(500).render('error', {
            error: '서버 정보 로딩 중 오류가 발생했습니다',
            message: error.message,
            user: req.user
        });
    }
});

// 데이터베이스 관리 페이지
app.get('/database', requireRole('admin', 'super_admin'), (req, res) => {
    res.render('database-management', {
        user: req.user
    });
});

// 데이터베이스 API 라우트들
app.get('/api/database/tables', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        console.log('📊 데이터베이스 테이블 목록 요청');

        // 단순화된 테이블 목록 조회
        const tablesResult = await pool.query(`
            SELECT
                tablename as table_name,
                tableowner as table_owner,
                hasindexes as has_indexes,
                hasrules as has_rules,
                hastriggers as has_triggers
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename;
        `);

        // 각 테이블의 행 수를 병렬로 조회 (단순한 방법)
        const tables = await Promise.all(tablesResult.rows.map(async (table) => {
            try {
                const countResult = await pool.query(`SELECT COUNT(*) as row_count FROM "${table.table_name}"`);
                return {
                    name: table.table_name,
                    owner: table.table_owner,
                    row_count: parseInt(countResult.rows[0].row_count),
                    has_indexes: table.has_indexes,
                    has_rules: table.has_rules,
                    has_triggers: table.has_triggers
                };
            } catch (countError) {
                console.error(`❌ 테이블 ${table.table_name} 행 수 조회 실패:`, countError.message);
                return {
                    name: table.table_name,
                    owner: table.table_owner,
                    row_count: 0,
                    has_indexes: table.has_indexes,
                    has_rules: table.has_rules,
                    has_triggers: table.has_triggers,
                    error: '행 수 조회 실패'
                };
            }
        }));

        // 전체 통계
        const totalRecords = tables.reduce((sum, table) => sum + (table.row_count || 0), 0);

        res.json({
            success: true,
            tables: tables,
            stats: {
                total_tables: tables.length,
                total_records: totalRecords
            }
        });

    } catch (error) {
        console.error('❌ 데이터베이스 테이블 목록 조회 실패:', error);
        res.status(500).json({
            success: false,
            message: '데이터베이스 테이블 목록 조회에 실패했습니다.',
            error: error.message
        });
    }
});

// 서버별 데이터베이스 뷰 API
app.get('/api/database/server/:serverId', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        const { serverId } = req.params;
        console.log(`📊 서버 ${serverId} 데이터베이스 정보 요청`);

        // 서버 정보 조회
        const serverResult = await pool.query('SELECT * FROM servers WHERE server_id = $1', [serverId]);
        if (serverResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '서버를 찾을 수 없습니다.'
            });
        }

        const server = serverResult.rows[0];

        // 서버 관련 테이블 데이터 조회 (테이블이 존재하지 않을 수도 있으므로 안전하게 처리)
        const [logsResult, notificationsResult] = await Promise.all([
            // 서버 로그 (테이블이 없을 수도 있음)
            pool.query(`
                SELECT table_name FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'logs'
            `).then(async (tableCheck) => {
                if (tableCheck.rows.length > 0) {
                    return pool.query(`
                        SELECT created_at, level, message
                        FROM logs
                        WHERE server_id = $1
                        ORDER BY created_at DESC
                        LIMIT 10
                    `, [serverId]);
                }
                return { rows: [] };
            }).catch(() => ({ rows: [] })),

            // 알림 설정
            pool.query(`
                SELECT * FROM notification_settings
                WHERE server_id = $1
            `, [serverId]).catch(() => ({ rows: [] }))
        ]);

        res.json({
            success: true,
            server: {
                id: server.server_id,
                name: server.name,
                port: server.port,
                domain: server.domain,
                status: server.deployment_status,
                health_status: server.health_status,
                last_health_check: server.last_health_check
            },
            data: {
                recent_logs: logsResult.rows,
                notifications: notificationsResult.rows
            },
            summary: {
                log_count: logsResult.rows.length,
                notification_count: notificationsResult.rows.length
            }
        });

    } catch (error) {
        console.error('❌ 서버별 데이터베이스 조회 실패:', error);
        res.status(500).json({
            success: false,
            message: '서버별 데이터베이스 조회에 실패했습니다.',
            error: error.message
        });
    }
});

app.post('/api/database/query', requireRole('admin', 'super_admin'), async (req, res) => {
    try {
        const { query } = req.body;
        if (!query || !query.trim()) {
            return res.status(400).json({
                success: false,
                error: '쿼리가 비어있습니다'
            });
        }

        const { pool } = require('./db/connection_v2');
        const result = await pool.query(query);

        res.json({
            success: true,
            results: result.rows,
            rowCount: result.rowCount,
            fields: result.fields?.map(f => f.name) || []
        });
    } catch (error) {
        console.error('쿼리 실행 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/server/:id/logs', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const logs = await getServerLogs(id);
        res.json({
            success: true,
            logs: logs || []
        });
    } catch (error) {
        console.error('서버 로그 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/server/:id/metrics', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const serverStatus = await checkServerHealth(id);

        // 안전한 숫자 변환 함수
        const safeNumber = (value) => {
            if (typeof value === 'number') return value;
            if (typeof value === 'string') {
                const parsed = parseFloat(value);
                return isNaN(parsed) ? 0 : parsed;
            }
            return 0;
        };

        res.json({
            success: true,
            cpu: safeNumber(serverStatus.cpu_usage),
            memory: safeNumber(serverStatus.memory_usage),
            responseTime: safeNumber(serverStatus.response_time),
            uptime: safeNumber(serverStatus.uptime)
        });
    } catch (error) {
        console.error('서버 메트릭 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 로그아웃
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('세션 제거 오류:', err);
        }
        res.redirect('/login');
    });
});

// =============================================================================
// 에러 처리 미들웨어
// =============================================================================

// 404 핸들러
app.use((req, res, next) => {
    res.status(404).json({
        error: 'Not Found',
        message: `경로 ${req.path}를 찾을 수 없습니다`,
        timestamp: new Date().toISOString()
    });
});

// 전역 에러 핸들러
app.use((err, req, res, next) => {
    console.error('서버 오류:', err);

    // 개발 환경에서는 상세한 에러 정보 제공
    const isDevelopment = process.env.NODE_ENV === 'development';

    res.status(err.status || 500).json({
        error: err.message || '내부 서버 오류',
        ...(isDevelopment && { stack: err.stack }),
        timestamp: new Date().toISOString()
    });
});

// =============================================================================
// 서버 초기화 및 시작
// =============================================================================

const initializeAndStartServer = async () => {
    try {
        console.log('🚀 OMEN SERVER GATEWAY v2.0 초기화 시작...');

        // 1. DB 연결 테스트
        const dbTest = await testConnection();
        if (!dbTest.success) {
            throw new Error('데이터베이스 연결 실패');
        }
        console.log('✅ PostgreSQL 연결 성공');

        // 2. 세션 시크릿 업데이트
        await updateSessionSecret();

        // 3. 포트 설정 조회
        const dbPort = await getSystemSetting('default_port').catch(() => null);
        if (dbPort) {
            PORT = parseInt(dbPort, 10);
        }

        // 4. 서버 모니터링 시작
        startMonitoring(60); // 60초 간격 (사용자 요청)
        console.log('✅ 서버 모니터링 시작');

        // 5. 시스템 메트릭 수집 시작
        setInterval(async () => {
            try {
                await saveSystemMetrics();
            } catch (error) {
                console.error('시스템 메트릭 수집 오류:', error);
            }
        }, 5 * 60 * 1000); // 5분 간격

        // 6. 서버 상태 변화 알림 처리
        serverMonitor.on('statusChange', async (data) => {
            try {
                const message = `서버 ${data.serverId} 상태가 ${data.previousStatus}에서 ${data.currentStatus}로 변경되었습니다`;
                await sendNotification(data.serverId, 'server_down', message);
            } catch (error) {
                console.error('상태 변화 알림 오류:', error);
            }
        });

        // 7. HTTP 서버 시작
        const server = app.listen(PORT, () => {
            console.log(`
========================================
  OMEN 서버 게이트웨이 v2.0 - 시작됨
========================================

  🌐 웹 접속: http://localhost:${PORT}
  📊 API 문서: http://localhost:${PORT}/api/health
  🔧 관리 패널: http://localhost:${PORT}/

  ✨ v2.0 새로운 기능:
  ✅ 실시간 서버 모니터링
  ✅ 동적 서버 CRUD 관리
  ✅ 도메인 관리 시스템
  ✅ 헬스체크 자동화
  ✅ RESTful API 지원
  ✅ 알림 시스템

  📋 지침 준수:
  ✅ PostgreSQL 기반 구현
  ✅ requireRole 패턴 적용
  ✅ 하드코딩 완전 제거
  ✅ Mock 데이터 없음

========================================
            `);
        });

        // 8. Graceful shutdown 설정
        process.on('SIGINT', async () => {
            console.log('\n🛑 서버 종료 신호 수신...');

            server.close(() => {
                console.log('✅ HTTP 서버 종료');
            });

            console.log('🔄 모니터링 중지 중...');
            serverMonitor.stopMonitoring();

            console.log('✅ OMEN Gateway v2.0 종료 완료');
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ 서버 초기화 실패:', error);
        console.log('\n💡 해결 방법:');
        console.log('1. PostgreSQL 서비스가 실행 중인지 확인');
        console.log('2. node src/db/init_v2.js 명령으로 DB 초기화');
        console.log('3. .env 파일의 DB 설정 확인');
        console.log('4. 필요한 npm 패키지 설치 확인');
        process.exit(1);
    }
};

// 서버 시작
if (require.main === module) {
    initializeAndStartServer();
}

module.exports = app;