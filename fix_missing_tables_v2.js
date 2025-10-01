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

    // 1. servers 테이블이 이미 있는지 확인
    const serverTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'servers'
      );
    `);

    if (!serverTableCheck.rows[0].exists) {
      console.log('📋 1. servers 테이블 생성...');
      await client.query(`
        CREATE TABLE servers (
          id SERIAL PRIMARY KEY,
          server_id VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          port INTEGER NOT NULL,
          path TEXT NOT NULL,
          command TEXT NOT NULL,
          domain VARCHAR(255),
          is_enabled BOOLEAN DEFAULT true,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          process_id INTEGER,
          deployment_status VARCHAR(50) DEFAULT 'stopped',
          error_message TEXT,
          last_started_at TIMESTAMP,
          last_stopped_at TIMESTAMP,
          auto_restart BOOLEAN DEFAULT false,
          environment_variables JSONB DEFAULT '{}',
          health_check_url VARCHAR(255),
          health_status VARCHAR(50) DEFAULT 'unknown',
          last_health_check TIMESTAMP
        );
      `);

      // server_configs의 데이터를 servers 테이블로 복사
      console.log('📋 server_configs 데이터를 servers로 복사...');
      await client.query(`
        INSERT INTO servers (
          server_id, name, port, path, command, domain, is_enabled, description,
          created_at, updated_at, process_id, deployment_status, error_message,
          last_started_at, last_stopped_at, auto_restart, environment_variables,
          health_check_url, health_status, last_health_check
        )
        SELECT
          server_id, name, port, path, command, domain, is_enabled, description,
          created_at, updated_at, process_id, deployment_status, error_message,
          last_started_at, last_stopped_at, auto_restart, environment_variables,
          health_check_url, health_status, last_health_check
        FROM server_configs
        ON CONFLICT (server_id) DO NOTHING;
      `);
    } else {
      console.log('✅ servers 테이블이 이미 존재합니다.');
    }

    // 2. notification_settings 테이블 생성
    const notificationTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'notification_settings'
      );
    `);

    if (!notificationTableCheck.rows[0].exists) {
      console.log('📋 2. notification_settings 테이블 생성...');
      await client.query(`
        CREATE TABLE notification_settings (
          id SERIAL PRIMARY KEY,
          server_id VARCHAR(255) NOT NULL,
          trigger_condition VARCHAR(100) NOT NULL,
          notification_type VARCHAR(50) DEFAULT 'console',
          recipient_email VARCHAR(255),
          recipient_webhook VARCHAR(500),
          message_template TEXT,
          is_enabled BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (server_id) REFERENCES servers(server_id) ON DELETE CASCADE
        );
      `);

      // 기본 알림 설정 추가
      console.log('📋 기본 알림 설정 추가...');
      await client.query(`
        INSERT INTO notification_settings (server_id, trigger_condition, notification_type, is_enabled)
        SELECT server_id, 'status_change', 'console', true
        FROM servers
        ON CONFLICT DO NOTHING;
      `);

      await client.query(`
        INSERT INTO notification_settings (server_id, trigger_condition, notification_type, is_enabled)
        SELECT server_id, 'health_change', 'console', true
        FROM servers
        ON CONFLICT DO NOTHING;
      `);
    } else {
      console.log('✅ notification_settings 테이블이 이미 존재합니다.');
    }

    await client.query('COMMIT');
    console.log('✅ 모든 테이블 생성 및 데이터 마이그레이션 완료!');

    // 최종 상태 확인
    console.log('\n📊 최종 테이블 상태:');
    const serversCount = await client.query('SELECT COUNT(*) FROM servers');
    const notificationCount = await client.query('SELECT COUNT(*) FROM notification_settings');

    console.log(`servers 테이블: ${serversCount.rows[0].count}개 레코드`);
    console.log(`notification_settings 테이블: ${notificationCount.rows[0].count}개 레코드`);

    // 서버 데이터 샘플 확인
    console.log('\n📋 servers 테이블 데이터:');
    const serverData = await client.query('SELECT server_id, name, health_status, deployment_status FROM servers');
    serverData.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.server_id}: ${row.name} (Status: ${row.deployment_status}, Health: ${row.health_status})`);
    });

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