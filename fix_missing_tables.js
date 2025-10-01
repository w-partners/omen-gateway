const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'omen_gateway',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function fixMissingTables() {
  console.log('🔧 누락된 테이블 생성 시작...\n');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. servers 테이블 생성 (server_configs와 동일한 구조)
    console.log('📋 1. servers 테이블 생성...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS servers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        port INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'offline',
        health_status VARCHAR(50) DEFAULT 'unknown',
        last_health_check TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // server_configs의 데이터를 servers 테이블로 복사
    console.log('📋 server_configs 데이터를 servers로 복사...');
    await client.query(`
      INSERT INTO servers (name, description, port, status, health_status, last_health_check, created_at, updated_at)
      SELECT name, description, port, status, health_status, last_health_check, created_at, updated_at
      FROM server_configs
      ON CONFLICT DO NOTHING;
    `);

    // 2. notification_settings 테이블 생성
    console.log('📋 2. notification_settings 테이블 생성...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        id SERIAL PRIMARY KEY,
        server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
        trigger_condition VARCHAR(100) NOT NULL,
        notification_type VARCHAR(50) DEFAULT 'email',
        recipient_email VARCHAR(255),
        recipient_webhook VARCHAR(500),
        message_template TEXT,
        is_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 기본 알림 설정 추가
    console.log('📋 기본 알림 설정 추가...');
    await client.query(`
      INSERT INTO notification_settings (server_id, trigger_condition, notification_type, is_enabled)
      SELECT id, 'status_change', 'console', true
      FROM servers
      ON CONFLICT DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅ 모든 테이블 생성 및 데이터 마이그레이션 완료!');

    // 최종 상태 확인
    console.log('\n📊 최종 테이블 상태:');
    const serversCount = await client.query('SELECT COUNT(*) FROM servers');
    const notificationCount = await client.query('SELECT COUNT(*) FROM notification_settings');

    console.log(`servers 테이블: ${serversCount.rows[0].count}개 레코드`);
    console.log(`notification_settings 테이블: ${notificationCount.rows[0].count}개 레코드`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 테이블 생성 실패:', error.message);
    console.error('상세 오류:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixMissingTables();