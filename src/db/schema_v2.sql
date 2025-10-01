-- OMEN SERVER GATEWAY PostgreSQL Schema v2.0
-- 목표: 동적 서버 관리, 실시간 모니터링, 헬스체크 시스템
-- 지침: Mock 데이터, 임시 데이터, 하드코딩 절대 금지

-- =============================================================================
-- 기존 테이블 유지 (users, server_configs, system_settings, server_logs)
-- =============================================================================

-- 사용자 테이블 (역할 기반 인증)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_role CHECK (role IN ('super_admin', 'admin', 'operator', 'member'))
);

-- 서버 설정 테이블 (향상된 버전)
CREATE TABLE IF NOT EXISTS server_configs (
    id SERIAL PRIMARY KEY,
    server_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    port INTEGER NOT NULL,
    path TEXT NOT NULL,
    command TEXT NOT NULL,
    domain VARCHAR(255),
    is_enabled BOOLEAN DEFAULT true,
    description TEXT,
    process_id INTEGER, -- PM2 또는 Node.js 프로세스 ID
    startup_order INTEGER DEFAULT 0, -- 시작 순서
    restart_policy VARCHAR(20) DEFAULT 'on-failure', -- always, on-failure, never
    health_check_url TEXT, -- 헬스체크 URL
    health_check_interval INTEGER DEFAULT 30, -- 초 단위
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_port CHECK (port > 0 AND port < 65536),
    CONSTRAINT valid_restart_policy CHECK (restart_policy IN ('always', 'on-failure', 'never'))
);

-- 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 서버 실행 로그 테이블 (향상된 버전)
CREATE TABLE IF NOT EXISTS server_logs (
    id SERIAL PRIMARY KEY,
    server_id VARCHAR(50) REFERENCES server_configs(server_id),
    action VARCHAR(20) NOT NULL, -- start, stop, restart, error, health_check
    status VARCHAR(20) NOT NULL, -- success, failed, pending, running, stopped
    message TEXT,
    response_time INTEGER, -- 밀리초 단위
    cpu_usage DECIMAL(5,2), -- CPU 사용률 (%)
    memory_usage DECIMAL(10,2), -- 메모리 사용량 (MB)
    executed_by INTEGER REFERENCES users(id),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_action CHECK (action IN ('start', 'stop', 'restart', 'error', 'health_check')),
    CONSTRAINT valid_status CHECK (status IN ('success', 'failed', 'pending', 'running', 'stopped'))
);

-- =============================================================================
-- 새로운 테이블들 (v2.0 추가 기능)
-- =============================================================================

-- 도메인 관리 테이블
CREATE TABLE domains (
    id SERIAL PRIMARY KEY,
    domain_name VARCHAR(255) UNIQUE NOT NULL,
    server_id VARCHAR(50) REFERENCES server_configs(server_id),
    cloudflare_tunnel_id VARCHAR(100),
    ssl_enabled BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    dns_records JSONB, -- DNS 레코드 정보 저장
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 헬스체크 로그 테이블 (실시간 모니터링)
CREATE TABLE health_logs (
    id SERIAL PRIMARY KEY,
    server_id VARCHAR(50) REFERENCES server_configs(server_id),
    status VARCHAR(20) NOT NULL, -- healthy, unhealthy, unknown
    response_time INTEGER, -- 밀리초
    status_code INTEGER, -- HTTP 상태 코드
    error_message TEXT,
    cpu_usage DECIMAL(5,2), -- CPU 사용률 %
    memory_usage DECIMAL(10,2), -- 메모리 사용량 MB
    disk_usage DECIMAL(5,2), -- 디스크 사용률 %
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_health_status CHECK (status IN ('healthy', 'unhealthy', 'unknown'))
);

-- Cloudflare 터널 설정 테이블
CREATE TABLE cloudflare_tunnels (
    id SERIAL PRIMARY KEY,
    tunnel_id VARCHAR(100) UNIQUE NOT NULL,
    tunnel_name VARCHAR(100) NOT NULL,
    tunnel_token TEXT NOT NULL,
    config_path TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 시스템 성능 모니터링 테이블
CREATE TABLE system_metrics (
    id SERIAL PRIMARY KEY,
    metric_type VARCHAR(50) NOT NULL, -- cpu, memory, disk, network
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20), -- %, MB, GB, etc.
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_metric_type CHECK (metric_type IN ('cpu', 'memory', 'disk', 'network', 'uptime'))
);

-- 알림 설정 테이블
CREATE TABLE notification_settings (
    id SERIAL PRIMARY KEY,
    server_id VARCHAR(50) REFERENCES server_configs(server_id),
    notification_type VARCHAR(30) NOT NULL, -- email, webhook, desktop
    trigger_condition VARCHAR(50) NOT NULL, -- server_down, high_cpu, high_memory
    threshold_value DECIMAL(10,2),
    recipient TEXT NOT NULL, -- 이메일 또는 웹훅 URL
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_notification_type CHECK (notification_type IN ('email', 'webhook', 'desktop')),
    CONSTRAINT valid_trigger_condition CHECK (trigger_condition IN ('server_down', 'server_up', 'high_cpu', 'high_memory', 'high_response_time'))
);

-- =============================================================================
-- 인덱스 생성 (성능 최적화)
-- =============================================================================

-- 기존 인덱스
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_server_configs_server_id ON server_configs(server_id);
CREATE INDEX IF NOT EXISTS idx_server_configs_enabled ON server_configs(is_enabled);
CREATE INDEX IF NOT EXISTS idx_server_logs_server_id ON server_logs(server_id);
CREATE INDEX IF NOT EXISTS idx_server_logs_executed_at ON server_logs(executed_at);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- 새로운 인덱스들
CREATE INDEX idx_domains_server_id ON domains(server_id);
CREATE INDEX idx_domains_active ON domains(is_active);
CREATE INDEX idx_health_logs_server_id ON health_logs(server_id);
CREATE INDEX idx_health_logs_checked_at ON health_logs(checked_at);
CREATE INDEX idx_health_logs_status ON health_logs(status);
CREATE INDEX idx_cloudflare_tunnels_active ON cloudflare_tunnels(is_active);
CREATE INDEX idx_system_metrics_type_time ON system_metrics(metric_type, timestamp);
CREATE INDEX idx_notification_settings_server ON notification_settings(server_id);
CREATE INDEX idx_notification_settings_enabled ON notification_settings(is_enabled);

-- =============================================================================
-- 트리거 함수 및 트리거 (자동 업데이트)
-- =============================================================================

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 적용
CREATE TRIGGER IF NOT EXISTS update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_server_configs_updated_at BEFORE UPDATE ON server_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_domains_updated_at BEFORE UPDATE ON domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_cloudflare_tunnels_updated_at BEFORE UPDATE ON cloudflare_tunnels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 뷰 생성 (복합 데이터 조회 최적화)
-- =============================================================================

-- 서버 상태 종합 뷰
CREATE OR REPLACE VIEW server_status_view AS
SELECT
    sc.server_id,
    sc.name,
    sc.port,
    sc.domain,
    sc.is_enabled,
    sc.health_check_url,
    COALESCE(latest_health.status, 'unknown') as current_status,
    COALESCE(latest_health.response_time, 0) as latest_response_time,
    COALESCE(latest_health.cpu_usage, 0) as current_cpu_usage,
    COALESCE(latest_health.memory_usage, 0) as current_memory_usage,
    COALESCE(latest_health.checked_at, sc.updated_at) as last_checked_at,
    COALESCE(latest_log.action, 'unknown') as last_action,
    COALESCE(latest_log.status, 'unknown') as last_action_status,
    COALESCE(latest_log.executed_at, sc.updated_at) as last_action_at
FROM server_configs sc
LEFT JOIN (
    SELECT DISTINCT ON (server_id)
        server_id, status, response_time, cpu_usage, memory_usage, checked_at
    FROM health_logs
    ORDER BY server_id, checked_at DESC
) latest_health ON sc.server_id = latest_health.server_id
LEFT JOIN (
    SELECT DISTINCT ON (server_id)
        server_id, action, status, executed_at
    FROM server_logs
    ORDER BY server_id, executed_at DESC
) latest_log ON sc.server_id = latest_log.server_id;

-- 시스템 대시보드 뷰
CREATE OR REPLACE VIEW system_dashboard_view AS
SELECT
    (SELECT COUNT(*) FROM server_configs WHERE is_enabled = true) as enabled_servers,
    (SELECT COUNT(*) FROM server_status_view WHERE current_status = 'healthy') as healthy_servers,
    (SELECT COUNT(*) FROM server_status_view WHERE current_status = 'unhealthy') as unhealthy_servers,
    (SELECT COUNT(*) FROM domains WHERE is_active = true) as active_domains,
    (SELECT AVG(response_time) FROM health_logs WHERE checked_at > CURRENT_TIMESTAMP - INTERVAL '5 minutes') as avg_response_time,
    (SELECT MAX(timestamp) FROM system_metrics) as last_metric_update;

-- =============================================================================
-- 데이터 정리 함수 (성능 관리)
-- =============================================================================

-- 오래된 헬스체크 로그 정리 함수 (30일 이전 데이터 삭제)
CREATE OR REPLACE FUNCTION cleanup_old_health_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM health_logs
    WHERE checked_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    INSERT INTO server_logs (server_id, action, status, message, executed_by)
    VALUES ('system', 'cleanup', 'success',
            'Cleaned up ' || deleted_count || ' old health log records', 1);

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 권한 설정 (보안)
-- =============================================================================

-- 애플리케이션 전용 사용자 생성 (실제 배포시 사용)
-- CREATE USER omen_app WITH PASSWORD 'your-secure-password-here';
-- GRANT CONNECT ON DATABASE omen_gateway TO omen_app;
-- GRANT USAGE ON SCHEMA public TO omen_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO omen_app;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO omen_app;