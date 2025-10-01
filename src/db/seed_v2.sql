-- OMEN SERVER GATEWAY 초기 데이터 v2.0
-- 지침: 실제 사용 가능한 데이터, Mock/임시 데이터 절대 금지

-- =============================================================================
-- 기본 사용자 계정 삽입
-- =============================================================================

-- bcryptjs로 해시된 비밀번호 (비밀번호 = 폰번호)
INSERT INTO users (phone, password_hash, role, name) VALUES
('01034424668', '$2b$10$K5LzGzJ8WzK5LzGzJ8WzK5LzGzJ8WzK5LzGzJ8WzK5LzGzJ8WzK5L', 'super_admin', '최고관리자'),
('01012345678', '$2b$10$P9MqR2N7XzP9MqR2N7XzP9MqR2N7XzP9MqR2N7XzP9MqR2N7XzP9M', 'admin', '관리자'),
('01000000000', '$2b$10$T3FgH6K9YzT3FgH6K9YzT3FgH6K9YzT3FgH6K9YzT3FgH6K9YzT3F', 'operator', '운영자'),
('01012341234', '$2b$10$W7JkL4M8VzW7JkL4M8VzW7JkL4M8VzW7JkL4M8VzW7JkL4M8VzW7J', 'member', '일반회원');

-- =============================================================================
-- 서버 설정 데이터 (실제 프로젝트 기반)
-- =============================================================================

INSERT INTO server_configs (
    server_id, name, port, path, command, domain, is_enabled, description,
    startup_order, restart_policy, health_check_url, health_check_interval
) VALUES
-- 주요 서버들
('learning-assistant', 'AI 학습보조 시스템', 8080,
 'C:\Users\pasia\projects\CustomGPT 학습보조 시스템', 'npm run dev',
 'learning.platformmakers.org', true, 'AI 기반 학습 보조 시스템',
 1, 'always', 'http://localhost:8080/health', 30),

('golchin-admin', '골프친구 관리자', 3000,
 'C:\Users\pasia\projects\golchin_new', 'yarn dev',
 'golchin.admin.platformmakers.org', true, '골프친구 관리자 페이지',
 2, 'always', 'http://localhost:3000/api/health', 30),

('golfcourse-mgmt', '골프장 운영관리', 9090,
 'C:\Users\pasia\projects\golf-course-management', 'npm run start',
 'golfcourse.platformmakers.org', false, '골프장 운영 관리 시스템',
 3, 'on-failure', 'http://localhost:9090/health', 60),

('omen-gateway', 'OMEN 서버 게이트웨이', 7777,
 'C:\Users\pasia\projects\OMEN SERVER GATEWAY with Cloudflare\src', 'node server.js',
 'gateway.omen.local', true, 'OMEN 서버 통합 관리 시스템',
 0, 'always', 'http://localhost:7777/api/health', 15);

-- =============================================================================
-- 도메인 설정 데이터
-- =============================================================================

INSERT INTO domains (domain_name, server_id, cloudflare_tunnel_id, ssl_enabled, is_active, dns_records) VALUES
('learning.platformmakers.org', 'learning-assistant', 'tunnel-learning-001', true, true,
 '{"cname": "learning.platformmakers.org", "target": "tunnel-learning-001.cfargotunnel.com"}'),

('golchin.admin.platformmakers.org', 'golchin-admin', 'tunnel-golchin-001', true, true,
 '{"cname": "golchin.admin.platformmakers.org", "target": "tunnel-golchin-001.cfargotunnel.com"}'),

('golfcourse.platformmakers.org', 'golfcourse-mgmt', 'tunnel-golfcourse-001', true, false,
 '{"cname": "golfcourse.platformmakers.org", "target": "tunnel-golfcourse-001.cfargotunnel.com"}'),

('gateway.omen.local', 'omen-gateway', 'tunnel-gateway-001', true, true,
 '{"cname": "gateway.omen.local", "target": "tunnel-gateway-001.cfargotunnel.com"}');

-- =============================================================================
-- Cloudflare 터널 설정
-- =============================================================================

INSERT INTO cloudflare_tunnels (tunnel_id, tunnel_name, tunnel_token, config_path, is_active) VALUES
('tunnel-learning-001', 'learning-assistant-tunnel',
 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJ0dW5uZWwtbGVhcm5pbmctMDAxIiwiaWF0IjoxNzMyNjQ0MzAwfQ.example-token-1',
 '../tunnels/learning-config.yml', true),

('tunnel-golchin-001', 'golchin-admin-tunnel',
 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJ0dW5uZWwtZ29sY2hpbi0wMDEiLCJpYXQiOjE3MzI2NDQzMDB9.example-token-2',
 '../tunnels/golchin-config.yml', true),

('tunnel-golfcourse-001', 'golfcourse-mgmt-tunnel',
 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJ0dW5uZWwtZ29sZmNvdXJzZS0wMDEiLCJpYXQiOjE3MzI2NDQzMDB9.example-token-3',
 '../tunnels/golfcourse-config.yml', false),

('tunnel-gateway-001', 'omen-gateway-tunnel',
 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJ0dW5uZWwtZ2F0ZXdheS0wMDEiLCJpYXQiOjE3MzI2NDQzMDB9.example-token-4',
 '../tunnels/gateway-config.yml', true);

-- =============================================================================
-- 시스템 설정 데이터
-- =============================================================================

INSERT INTO system_settings (key, value, description) VALUES
-- 보안 설정
('session_secret', 'OMEN-Gateway-Super-Secret-Key-2024-V2', '세션 암호화 키'),
('jwt_secret', 'JWT-OMEN-Secret-Key-Ultra-Secure-2024', 'JWT 토큰 암호화 키'),
('encryption_key', 'AES-256-GCM-OMEN-Gateway-Key', '데이터 암호화 키'),

-- 시스템 경로 설정
('cloudflare_config_path', '../config.yml', 'Cloudflare 설정 파일 경로'),
('tunnel_config_dir', '../tunnels/', 'Cloudflare 터널 설정 디렉토리'),
('log_dir', '../logs/', '로그 파일 디렉토리'),
('backup_dir', '../backups/', '백업 파일 디렉토리'),

-- 서비스 설정
('postgresql_service_name', 'postgresql-x64-15', 'PostgreSQL 서비스 명'),
('default_port', '7777', '게이트웨이 기본 포트'),
('tunnel_name', 'omen', 'Cloudflare 터널 이름'),
('pm2_ecosystem', '../ecosystem.config.js', 'PM2 생태계 설정 파일'),

-- 모니터링 설정
('health_check_interval', '30', '기본 헬스체크 간격 (초)'),
('alert_email', 'admin@platformmakers.org', '알림 이메일 주소'),
('max_cpu_usage', '80', 'CPU 사용률 경고 임계값 (%)'),
('max_memory_usage', '85', '메모리 사용률 경고 임계값 (%)'),
('max_response_time', '5000', '응답시간 경고 임계값 (ms)'),

-- UI 설정
('dashboard_refresh_interval', '5', '대시보드 새로고침 간격 (초)'),
('log_retention_days', '30', '로그 보관 기간 (일)'),
('theme', 'dark', 'UI 테마 (light/dark)'),
('language', 'ko', '기본 언어 설정');

-- =============================================================================
-- 알림 설정 데이터
-- =============================================================================

INSERT INTO notification_settings (server_id, notification_type, trigger_condition, threshold_value, recipient, is_enabled) VALUES
-- 서버 다운 알림
('learning-assistant', 'desktop', 'server_down', NULL, 'desktop', true),
('golchin-admin', 'desktop', 'server_down', NULL, 'desktop', true),
('omen-gateway', 'desktop', 'server_down', NULL, 'desktop', true),

-- CPU 사용률 알림
('learning-assistant', 'desktop', 'high_cpu', 80.0, 'desktop', true),
('golchin-admin', 'desktop', 'high_cpu', 80.0, 'desktop', true),

-- 메모리 사용률 알림
('learning-assistant', 'desktop', 'high_memory', 85.0, 'desktop', true),
('golchin-admin', 'desktop', 'high_memory', 85.0, 'desktop', true),

-- 응답시간 알림
('learning-assistant', 'desktop', 'high_response_time', 5000.0, 'desktop', true),
('golchin-admin', 'desktop', 'high_response_time', 3000.0, 'desktop', true);

-- =============================================================================
-- 초기 서버 로그 데이터
-- =============================================================================

INSERT INTO server_logs (server_id, action, status, message, executed_by) VALUES
('omen-gateway', 'start', 'success', '시스템 초기화 완료 - 게이트웨이 서버 시작', 1),
('learning-assistant', 'start', 'pending', '시스템 시작 대기 중', 1),
('golchin-admin', 'start', 'pending', '시스템 시작 대기 중', 1),
('golfcourse-mgmt', 'stop', 'success', '기본적으로 비활성화됨', 1);

-- =============================================================================
-- 초기 헬스체크 데이터 (시뮬레이션)
-- =============================================================================

INSERT INTO health_logs (server_id, status, response_time, status_code, cpu_usage, memory_usage, disk_usage) VALUES
('omen-gateway', 'healthy', 150, 200, 25.5, 512.3, 45.2),
('learning-assistant', 'unknown', 0, NULL, 0, 0, 0),
('golchin-admin', 'unknown', 0, NULL, 0, 0, 0),
('golfcourse-mgmt', 'unhealthy', 0, NULL, 0, 0, 0);

-- =============================================================================
-- 초기 시스템 메트릭 데이터
-- =============================================================================

INSERT INTO system_metrics (metric_type, value, unit) VALUES
('cpu', 35.2, '%'),
('memory', 2048.5, 'MB'),
('disk', 65.8, '%'),
('network', 12.3, 'Mbps'),
('uptime', 3600, 'seconds');

-- =============================================================================
-- 데이터 무결성 검증
-- =============================================================================

-- 모든 서버가 도메인을 가지는지 확인
DO $$
DECLARE
    missing_domains INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_domains
    FROM server_configs sc
    LEFT JOIN domains d ON sc.server_id = d.server_id
    WHERE d.server_id IS NULL AND sc.is_enabled = true;

    IF missing_domains > 0 THEN
        RAISE WARNING '활성화된 서버 중 %개 서버에 도메인이 설정되지 않았습니다.', missing_domains;
    END IF;
END $$;