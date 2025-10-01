-- OMEN SERVER GATEWAY PostgreSQL Schema
-- 지침: Mock 데이터, 임시 데이터, 하드코딩 절대 금지

-- 사용자 테이블 (역할 기반 인증)
CREATE TABLE users (
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

-- 서버 설정 테이블
CREATE TABLE server_configs (
    id SERIAL PRIMARY KEY,
    server_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    port INTEGER NOT NULL,
    path TEXT NOT NULL,
    command TEXT NOT NULL,
    domain VARCHAR(255),
    is_enabled BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_port CHECK (port > 0 AND port < 65536)
);

-- 시스템 설정 테이블
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 서버 실행 로그 테이블
CREATE TABLE server_logs (
    id SERIAL PRIMARY KEY,
    server_id VARCHAR(50) REFERENCES server_configs(server_id),
    action VARCHAR(20) NOT NULL, -- start, stop, restart, error
    status VARCHAR(20) NOT NULL, -- success, failed, pending
    message TEXT,
    executed_by INTEGER REFERENCES users(id),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_action CHECK (action IN ('start', 'stop', 'restart', 'error')),
    CONSTRAINT valid_status CHECK (status IN ('success', 'failed', 'pending'))
);

-- 인덱스 생성
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_server_configs_server_id ON server_configs(server_id);
CREATE INDEX idx_server_configs_enabled ON server_configs(is_enabled);
CREATE INDEX idx_server_logs_server_id ON server_logs(server_id);
CREATE INDEX idx_server_logs_executed_at ON server_logs(executed_at);
CREATE INDEX idx_system_settings_key ON system_settings(key);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 적용
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_server_configs_updated_at BEFORE UPDATE ON server_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();