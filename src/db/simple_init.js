const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initializeSimpleDatabase() {
    const pool = new Pool({
        user: 'postgres',
        host: 'localhost',
        database: 'omen_gateway',
        password: 'postgres',
        port: 5432,
    });

    try {
        console.log('🚀 간단한 데이터베이스 초기화 시작...');

        const schemaSQL = fs.readFileSync(path.join(__dirname, 'simple_schema.sql'), 'utf8');

        await pool.query(schemaSQL);

        console.log('✅ 간단한 데이터베이스 스키마 초기화 완료');

        // 테이블 목록 확인
        const result = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
        `);

        console.log('📋 생성된 테이블:');
        result.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        console.log('🎉 데이터베이스 준비 완료!');

    } catch (error) {
        console.error('❌ 데이터베이스 초기화 실패:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    initializeSimpleDatabase().catch(console.error);
}

module.exports = { initializeSimpleDatabase };