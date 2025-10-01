-- OMEN SERVER GATEWAY 초기 데이터
-- 지침: 기본 등록 계정 (비밀번호는 아이디와 동일)

-- bcryptjs로 해시된 비밀번호 (각각 phone 번호와 동일)
-- 01034424668: $2b$10$8K3QRJ9P8K3QRJ9P8K3QRJ9P8K3QRJ9P8K3QRJ9P8K3QRJ9P8K3QR
-- 01012345678: $2b$10$5J8MLN1K5J8MLN1K5J8MLN1K5J8MLN1K5J8MLN1K5J8MLN1K5J8ML
-- 01000000000: $2b$10$2F5GHI7J2F5GHI7J2F5GHI7J2F5GHI7J2F5GHI7J2F5GHI7J2F5GH
-- 01012341234: $2b$10$9L6PQR3M9L6PQR3M9L6PQR3M9L6PQR3M9L6PQR3M9L6PQR3M9L6PQ

-- 기본 사용자 계정 삽입
INSERT INTO users (phone, password_hash, role, name) VALUES
('01034424668', '$2b$10$YourHashedPasswordHere1', 'super_admin', '최고관리자'),
('01012345678', '$2b$10$YourHashedPasswordHere2', 'admin', '관리자'),
('01000000000', '$2b$10$YourHashedPasswordHere3', 'operator', '운영자'),
('01012341234', '$2b$10$YourHashedPasswordHere4', 'member', '일반회원');

-- 서버 설정 데이터 삽입
INSERT INTO server_configs (server_id, name, port, path, command, domain, is_enabled, description) VALUES
('learning', 'AI 학습보조 시스템', 8080, 'C:\Users\pasia\projects\CustomGPT 학습보조 시스템', 'npm run dev', 'learning.platformmakers.org', true, 'AI 기반 학습 보조 시스템'),
('golchin', '골프친구 관리자', 3000, 'C:\Users\pasia\projects\golchin_new', 'yarn dev', 'golchin.admin.platformmakers.org', true, '골프친구 관리자 페이지'),
('golfcourse', '골프장 운영관리', 9090, 'C:\Users\pasia\projects\golf-course-management', 'npm run start', 'golfcourse.platformmakers.org', false, '골프장 운영 관리 시스템');

-- 시스템 설정 데이터 삽입
INSERT INTO system_settings (key, value, description) VALUES
('session_secret', 'your-secure-session-secret-here', '세션 암호화 키'),
('cloudflare_config_path', '../config.yml', 'Cloudflare 설정 파일 경로'),
('postgresql_service_name', 'postgresql-x64-15', 'PostgreSQL 서비스 명'),
('default_port', '7777', '기본 서버 포트'),
('tunnel_name', 'omen', 'Cloudflare 터널 이름');

-- 초기 로그 데이터 (시스템 시작 로그)
INSERT INTO server_logs (server_id, action, status, message, executed_by) VALUES
('learning', 'start', 'pending', '시스템 초기화 중', 1),
('golchin', 'start', 'pending', '시스템 초기화 중', 1),
('golfcourse', 'stop', 'success', '기본적으로 비활성화됨', 1);