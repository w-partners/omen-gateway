const { Pool } = require('pg');

// PostgreSQL 연결 설정
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'omen_gateway',
    password: 'qwer1234',
    port: 5432,
});

async function createHealthLogsTable() {
    const client = await pool.connect();

    try {
        console.log('🔧 health_logs 테이블 생성 시작...');

        // health_logs 테이블 생성 SQL
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS health_logs (
                id SERIAL PRIMARY KEY,
                server_id VARCHAR(50) NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'unknown',
                response_time INTEGER DEFAULT 0,
                status_code INTEGER DEFAULT NULL,
                error_message TEXT DEFAULT NULL,
                cpu_usage DECIMAL(5,2) DEFAULT NULL,
                memory_usage DECIMAL(5,2) DEFAULT NULL,
                disk_usage DECIMAL(5,2) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (server_id) REFERENCES server_configs(server_id) ON DELETE CASCADE
            );
        `;

        await client.query(createTableSQL);
        console.log('✅ health_logs 테이블 생성 완료!');

        // 인덱스 생성 (성능 향상)
        const createIndexSQL = `
            CREATE INDEX IF NOT EXISTS idx_health_logs_server_id ON health_logs(server_id);
            CREATE INDEX IF NOT EXISTS idx_health_logs_created_at ON health_logs(created_at);
        `;

        await client.query(createIndexSQL);
        console.log('✅ health_logs 인덱스 생성 완료!');

        // 테이블 구조 확인
        const checkTableSQL = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'health_logs'
            ORDER BY ordinal_position;
        `;

        const result = await client.query(checkTableSQL);
        console.log('📋 health_logs 테이블 구조:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });

    } catch (error) {
        console.error('❌ health_logs 테이블 생성 실패:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// 실행
createHealthLogsTable()
    .then(() => {
        console.log('🎉 health_logs 테이블 설정 완료!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 실행 실패:', error.message);
        process.exit(1);
    });