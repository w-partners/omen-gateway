const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'omen_gateway',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function checkTableStructure() {
  console.log('🔍 테이블 구조 확인 중...\n');

  try {
    // server_configs 테이블 구조 확인
    console.log('📋 server_configs 테이블 구조:');
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'server_configs'
      ORDER BY ordinal_position;
    `);

    structureResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.column_name} (${row.data_type}) - Nullable: ${row.is_nullable}, Default: ${row.column_default || 'None'}`);
    });

    // server_configs의 실제 데이터 확인
    console.log('\n📊 server_configs 데이터:');
    const dataResult = await pool.query('SELECT * FROM server_configs LIMIT 5');
    console.log('데이터 샘플:');
    dataResult.rows.forEach((row, index) => {
      console.log(`${index + 1}.`, JSON.stringify(row, null, 2));
    });

  } catch (error) {
    console.error('❌ 테이블 구조 확인 실패:', error.message);
  } finally {
    await pool.end();
  }
}

checkTableStructure();