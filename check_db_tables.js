const { Pool } = require('pg');

// 환경 변수 또는 기본값 사용
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'omen_gateway',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function checkDatabaseTables() {
  console.log('🔍 데이터베이스 테이블 상태 확인 중...\n');

  try {
    // 현재 존재하는 테이블들 확인
    console.log('📋 현재 존재하는 테이블들:');
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('✅ 존재하는 테이블:');
    tablesResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });

    console.log('\n🔍 누락된 테이블 확인:');

    // 필요한 테이블들 목록
    const requiredTables = [
      'users',
      'servers',
      'domains',
      'server_logs',
      'notification_settings',
      'system_settings'
    ];

    const existingTables = tablesResult.rows.map(row => row.table_name);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));

    if (missingTables.length > 0) {
      console.log('❌ 누락된 테이블들:');
      missingTables.forEach((table, index) => {
        console.log(`${index + 1}. ${table}`);
      });
    } else {
      console.log('✅ 모든 필수 테이블이 존재합니다.');
    }

    // 각 테이블의 레코드 수 확인
    console.log('\n📊 테이블별 레코드 수:');
    for (const table of existingTables) {
      try {
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`${table}: ${countResult.rows[0].count}개 레코드`);
      } catch (error) {
        console.log(`${table}: 레코드 수 확인 실패 - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ 데이터베이스 연결 또는 조회 실패:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabaseTables();