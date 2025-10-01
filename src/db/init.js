const fs = require('fs');
const path = require('path');
const { query, testConnection } = require('./connection');
const bcrypt = require('bcryptjs');

// 데이터베이스 초기화 함수
const initializeDatabase = async () => {
  try {
    console.log('데이터베이스 초기화 시작...');

    // 연결 테스트
    await testConnection();

    // 스키마 파일 읽기 및 실행
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('스키마 생성 중...');
    await query(schemaSQL);
    console.log('스키마 생성 완료');

    // 기본 사용자 계정 생성 (해시된 비밀번호)
    const users = [
      { phone: '01034424668', password: '01034424668', role: 'super_admin', name: '최고관리자' },
      { phone: '01012345678', password: '01012345678', role: 'admin', name: '관리자' },
      { phone: '01000000000', password: '01000000000', role: 'operator', name: '운영자' },
      { phone: '01012341234', password: '01012341234', role: 'member', name: '일반회원' }
    ];

    console.log('기본 사용자 계정 생성 중...');
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await query(
        'INSERT INTO users (phone, password_hash, role, name) VALUES ($1, $2, $3, $4) ON CONFLICT (phone) DO NOTHING',
        [user.phone, hashedPassword, user.role, user.name]
      );
    }
    console.log('기본 사용자 계정 생성 완료');

    // 서버 설정 데이터 삽입
    const serverConfigs = [
      {
        server_id: 'learning',
        name: 'AI 학습보조 시스템',
        port: 8080,
        path: 'C:\\Users\\pasia\\projects\\CustomGPT 학습보조 시스템',
        command: 'npm run dev',
        domain: 'learning.platformmakers.org',
        is_enabled: true,
        description: 'AI 기반 학습 보조 시스템'
      },
      {
        server_id: 'golchin',
        name: '골프친구 관리자',
        port: 3000,
        path: 'C:\\Users\\pasia\\projects\\golchin_new',
        command: 'yarn dev',
        domain: 'golchin.admin.platformmakers.org',
        is_enabled: true,
        description: '골프친구 관리자 페이지'
      },
      {
        server_id: 'golfcourse',
        name: '골프장 운영관리',
        port: 9090,
        path: 'C:\\Users\\pasia\\projects\\golf-course-management',
        command: 'npm run start',
        domain: 'golfcourse.platformmakers.org',
        is_enabled: false,
        description: '골프장 운영 관리 시스템'
      }
    ];

    console.log('서버 설정 데이터 삽입 중...');
    for (const config of serverConfigs) {
      await query(
        'INSERT INTO server_configs (server_id, name, port, path, command, domain, is_enabled, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (server_id) DO UPDATE SET name=$2, port=$3, path=$4, command=$5, domain=$6, is_enabled=$7, description=$8',
        [config.server_id, config.name, config.port, config.path, config.command, config.domain, config.is_enabled, config.description]
      );
    }
    console.log('서버 설정 데이터 삽입 완료');

    // 시스템 설정 데이터 삽입
    const systemSettings = [
      { key: 'session_secret', value: process.env.SESSION_SECRET || 'your-secure-session-secret-here', description: '세션 암호화 키' },
      { key: 'cloudflare_config_path', value: '../config.yml', description: 'Cloudflare 설정 파일 경로' },
      { key: 'postgresql_service_name', value: 'postgresql-x64-17', description: 'PostgreSQL 서비스 명' },
      { key: 'default_port', value: '7777', description: '기본 서버 포트' },
      { key: 'tunnel_name', value: 'omen', description: 'Cloudflare 터널 이름' }
    ];

    console.log('시스템 설정 데이터 삽입 중...');
    for (const setting of systemSettings) {
      await query(
        'INSERT INTO system_settings (key, value, description) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET value=$2, description=$3',
        [setting.key, setting.value, setting.description]
      );
    }
    console.log('시스템 설정 데이터 삽입 완료');

    console.log('데이터베이스 초기화 완료!');

  } catch (error) {
    console.error('데이터베이스 초기화 실패:', error);
    process.exit(1);
  }
};

// 직접 실행시
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('초기화 성공');
      process.exit(0);
    })
    .catch((error) => {
      console.error('초기화 실패:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };