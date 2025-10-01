const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// PostgreSQL 연결 설정
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'omen_gateway',
    password: 'password',
    port: 5432,
});

/**
 * OMEN SERVER GATEWAY v2.0 데이터베이스 초기화
 * - 향상된 스키마 적용
 * - 실시간 모니터링 테이블 생성
 * - 헬스체크 시스템 구축
 * - 도메인 관리 시스템
 */
async function initializeDatabase() {
    const client = await pool.connect();

    try {
        console.log('🚀 OMEN SERVER GATEWAY v2.0 데이터베이스 초기화 시작...');

        // 1. 데이터베이스 존재 확인 및 생성
        await createDatabaseIfNotExists(client);

        // 2. 스키마 적용
        console.log('📋 데이터베이스 스키마 적용 중...');
        const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema_v2.sql'), 'utf8');
        await client.query(schemaSQL);
        console.log('✅ 스키마 적용 완료');

        // 3. 초기 데이터 삽입
        console.log('📊 초기 데이터 삽입 중...');
        const seedSQL = fs.readFileSync(path.join(__dirname, 'seed_v2.sql'), 'utf8');
        await client.query(seedSQL);
        console.log('✅ 초기 데이터 삽입 완료');

        // 4. 데이터 검증
        await validateData(client);

        // 5. 초기 시스템 상태 확인
        await checkSystemStatus(client);

        console.log('🎉 OMEN SERVER GATEWAY v2.0 데이터베이스 초기화 완료!');
        console.log('');
        console.log('📝 초기화된 구성 요소:');
        console.log('  - 사용자 관리 시스템');
        console.log('  - 서버 설정 및 모니터링');
        console.log('  - 도메인 관리 시스템');
        console.log('  - Cloudflare 터널 설정');
        console.log('  - 헬스체크 시스템');
        console.log('  - 실시간 알림 시스템');
        console.log('');
        console.log('🔑 기본 계정:');
        console.log('  - 최고관리자: 01034424668 / 01034424668');
        console.log('  - 관리자: 01012345678 / 01012345678');
        console.log('  - 운영자: 01000000000 / 01000000000');

    } catch (error) {
        console.error('❌ 데이터베이스 초기화 실패:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * 데이터베이스 존재 확인 및 생성
 */
async function createDatabaseIfNotExists(client) {
    try {
        const result = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = 'omen_gateway'"
        );

        if (result.rows.length === 0) {
            console.log('📦 omen_gateway 데이터베이스 생성 중...');
            await client.query('CREATE DATABASE omen_gateway');
            console.log('✅ 데이터베이스 생성 완료');
        } else {
            console.log('✅ omen_gateway 데이터베이스 이미 존재함');
        }
    } catch (error) {
        // 데이터베이스 생성 권한이 없을 경우 무시
        console.log('ℹ️  데이터베이스는 이미 존재하거나 생성 권한이 없습니다.');
    }
}

/**
 * 데이터 무결성 검증
 */
async function validateData(client) {
    console.log('🔍 데이터 무결성 검증 중...');

    // 1. 사용자 계정 확인
    const users = await client.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    console.log('👥 사용자 계정:', users.rows);

    // 2. 서버 설정 확인
    const servers = await client.query(`
        SELECT
            COUNT(*) as total_servers,
            SUM(CASE WHEN is_enabled THEN 1 ELSE 0 END) as enabled_servers
        FROM server_configs
    `);
    console.log('🖥️  서버 설정:', servers.rows[0]);

    // 3. 도메인 설정 확인
    const domains = await client.query(`
        SELECT
            COUNT(*) as total_domains,
            SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_domains
        FROM domains
    `);
    console.log('🌐 도메인 설정:', domains.rows[0]);

    // 4. 알림 설정 확인
    const notifications = await client.query(`
        SELECT
            trigger_condition,
            COUNT(*) as count
        FROM notification_settings
        GROUP BY trigger_condition
    `);
    console.log('🔔 알림 설정:', notifications.rows);

    console.log('✅ 데이터 검증 완료');
}

/**
 * 시스템 상태 확인
 */
async function checkSystemStatus(client) {
    console.log('📊 시스템 초기 상태 확인...');

    const dashboard = await client.query('SELECT * FROM system_dashboard_view');
    console.log('🎛️  대시보드 상태:', dashboard.rows[0]);

    const serverStatus = await client.query(`
        SELECT
            server_id,
            name,
            current_status,
            latest_response_time
        FROM server_status_view
        ORDER BY server_id
    `);

    console.log('🖥️  서버 상태:');
    serverStatus.rows.forEach(server => {
        const statusIcon = server.current_status === 'healthy' ? '✅' :
                          server.current_status === 'unhealthy' ? '❌' : '⚠️';
        console.log(`   ${statusIcon} ${server.server_id}: ${server.current_status} (${server.latest_response_time}ms)`);
    });
}

/**
 * 데이터베이스 연결 테스트
 */
async function testConnection() {
    const client = await pool.connect();

    try {
        const result = await client.query('SELECT NOW() as current_time');
        console.log('✅ PostgreSQL 연결 성공:', result.rows[0].current_time);
        return true;
    } catch (error) {
        console.error('❌ PostgreSQL 연결 실패:', error.message);
        return false;
    } finally {
        client.release();
    }
}

/**
 * 데이터베이스 초기화 스크립트 실행
 */
if (require.main === module) {
    (async () => {
        try {
            // 연결 테스트
            const connected = await testConnection();
            if (!connected) {
                console.error('데이터베이스 연결을 확인해주세요.');
                process.exit(1);
            }

            // 데이터베이스 초기화
            await initializeDatabase();

            console.log('');
            console.log('🎯 다음 단계:');
            console.log('  1. Node.js 백엔드 서버 실행: node server.js');
            console.log('  2. C# WPF GUI 애플리케이션 빌드 및 실행');
            console.log('  3. 서버 상태 모니터링 시작');

        } catch (error) {
            console.error('초기화 과정에서 오류가 발생했습니다:', error);
            process.exit(1);
        } finally {
            await pool.end();
        }
    })();
}

module.exports = {
    initializeDatabase,
    testConnection,
    pool
};