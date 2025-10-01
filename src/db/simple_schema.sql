-- 간단한 테스트 스키마
-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 서버 설정 테이블
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
    process_id INTEGER,
    startup_order INTEGER DEFAULT 0,
    restart_policy VARCHAR(20) DEFAULT 'on-failure',
    health_check_url TEXT,
    health_check_interval INTEGER DEFAULT 30,
    current_status VARCHAR(20) DEFAULT 'unknown',
    latest_response_time INTEGER DEFAULT 0,
    current_cpu_usage DECIMAL(5,2) DEFAULT 0,
    current_memory_usage DECIMAL(10,2) DEFAULT 0,
    last_checked_at TIMESTAMP,
    last_action VARCHAR(50),
    last_action_status VARCHAR(20),
    last_action_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기본 사용자 데이터 삽입
INSERT INTO users (phone, password_hash, role, name) VALUES
('01034424668', '$2b$10$dummy.hash.for.super_admin', 'super_admin', '최고관리자'),
('01012345678', '$2b$10$dummy.hash.for.admin', 'admin', '관리자'),
('01000000000', '$2b$10$dummy.hash.for.operator', 'operator', '운영자')
ON CONFLICT (phone) DO NOTHING;

-- 기본 서버 설정 데이터 삽입
INSERT INTO server_configs (server_id, name, port, path, command, domain, description) VALUES
('learning-assistant', 'AI 학습보조 시스템', 8080, 'C:\Users\pasia\projects\CustomGPT 학습보조 시스템', 'npm start', 'learning.platformmakers.org', 'AI 기반 학습 보조 시스템'),
('golf-course', '골프장 운영관리 시스템', 9090, 'C:\Users\pasia\projects\admin-golf', 'npm start', 'golfcourse.platformmakers.org', '골프장 운영 관리 시스템'),
('golchin-admin', '골프친구 관리자', 3000, 'C:\Users\pasia\projects\golchin_new', 'npm start', 'golchin.admin.platformmakers.org', '골프친구 관리자 패널')
ON CONFLICT (server_id) DO NOTHING;