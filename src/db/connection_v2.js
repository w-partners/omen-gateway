const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

/**
 * OMEN SERVER GATEWAY v2.0 PostgreSQL 연결 관리자
 * - 연결 풀 관리
 * - 자동 재연결
 * - 쿼리 로깅 및 성능 모니터링
 * - 트랜잭션 관리
 */

// 데이터베이스 설정
const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'omen_gateway',
    password: process.env.DB_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT) || 5432,
    // 연결 풀 설정
    max: 20, // 최대 연결 수
    min: 2,  // 최소 연결 수
    idleTimeoutMillis: 30000, // 유휴 연결 타임아웃 (30초)
    connectionTimeoutMillis: 2000, // 연결 타임아웃 (2초)
    maxUses: 7500, // 연결당 최대 사용 횟수
    allowExitOnIdle: true
};

// 연결 풀 생성
const pool = new Pool(dbConfig);

// 연결 풀 이벤트 리스너
pool.on('connect', (client) => {
    console.log(`✅ PostgreSQL 새로운 클라이언트 연결됨 (PID: ${client.processID})`);
});

pool.on('acquire', (client) => {
    console.log(`🔄 클라이언트 획득됨 (PID: ${client.processID})`);
});

pool.on('remove', (client) => {
    console.log(`❌ 클라이언트 제거됨 (PID: ${client.processID})`);
});

pool.on('error', (err, client) => {
    console.error('❌ PostgreSQL 풀 에러:', err.message);
    // 에러 로그 저장 (선택사항)
    logError('pool_error', err);
});

/**
 * 데이터베이스 연결 테스트
 */
async function testConnection() {
    const start = Date.now();
    const client = await pool.connect();

    try {
        const result = await client.query('SELECT NOW() as server_time, version() as version');
        const duration = Date.now() - start;

        console.log(`✅ PostgreSQL 연결 성공 (${duration}ms)`);
        console.log(`📅 서버 시간: ${result.rows[0].server_time}`);
        console.log(`🔧 PostgreSQL 버전: ${result.rows[0].version.split(' ')[1]}`);

        return {
            success: true,
            duration,
            serverTime: result.rows[0].server_time,
            version: result.rows[0].version
        };

    } catch (error) {
        const duration = Date.now() - start;
        console.error(`❌ PostgreSQL 연결 실패 (${duration}ms):`, error.message);

        return {
            success: false,
            duration,
            error: error.message
        };

    } finally {
        client.release();
    }
}

/**
 * 쿼리 실행 (로깅 및 성능 모니터링 포함)
 */
async function query(text, params = []) {
    const start = Date.now();
    const client = await pool.connect();

    try {
        const result = await client.query(text, params);
        const duration = Date.now() - start;

        // 성능 모니터링 (느린 쿼리 감지)
        if (duration > 1000) {
            console.warn(`🐌 느린 쿼리 감지 (${duration}ms):`, text.substring(0, 100) + '...');
        }

        // 쿼리 로깅 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔍 쿼리 실행 (${duration}ms): ${text.substring(0, 50)}...`);
        }

        return {
            ...result,
            duration,
            queryText: text
        };

    } catch (error) {
        const duration = Date.now() - start;
        console.error(`❌ 쿼리 실행 실패 (${duration}ms):`, error.message);
        console.error(`📝 실행된 쿼리:`, text);

        // 에러 로그 저장
        logError('query_error', error, { query: text, params, duration });

        throw error;

    } finally {
        client.release();
    }
}

/**
 * 트랜잭션 실행
 */
async function transaction(callback) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await callback(client);

        await client.query('COMMIT');
        console.log('✅ 트랜잭션 커밋 완료');

        return result;

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ 트랜잭션 롤백:', error.message);

        logError('transaction_error', error);
        throw error;

    } finally {
        client.release();
    }
}

/**
 * 배치 쿼리 실행
 */
async function batchQuery(queries) {
    const start = Date.now();
    const client = await pool.connect();
    const results = [];

    try {
        await client.query('BEGIN');

        for (const { text, params } of queries) {
            const result = await client.query(text, params);
            results.push(result);
        }

        await client.query('COMMIT');

        const duration = Date.now() - start;
        console.log(`✅ 배치 쿼리 완료 (${queries.length}개 쿼리, ${duration}ms)`);

        return results;

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ 배치 쿼리 실패:', error.message);

        logError('batch_query_error', error, { queryCount: queries.length });
        throw error;

    } finally {
        client.release();
    }
}

/**
 * 데이터베이스 상태 확인
 */
async function getPoolStatus() {
    return {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
        config: {
            max: pool.options.max,
            min: pool.options.min,
            idleTimeoutMillis: pool.options.idleTimeoutMillis
        }
    };
}

/**
 * 헬스체크 (시스템 모니터링용)
 */
async function healthCheck() {
    try {
        const connectionTest = await testConnection();
        const poolStatus = await getPoolStatus();

        // 기본적인 테이블 존재 확인 쿼리
        const systemCheck = await query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
            LIMIT 5
        `);

        return {
            status: 'healthy',
            connection: connectionTest.success,
            pool: poolStatus,
            tableOperations: systemCheck.rows,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * 에러 로그 저장
 */
function logError(type, error, metadata = {}) {
    const logEntry = {
        type,
        message: error.message,
        stack: error.stack,
        metadata,
        timestamp: new Date().toISOString()
    };

    // 로그 파일에 저장 (비동기)
    const logDir = path.join(__dirname, '../../logs');
    const logFile = path.join(logDir, `db-errors-${new Date().toISOString().slice(0, 10)}.log`);

    // 로그 디렉토리 생성
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    fs.appendFile(logFile, JSON.stringify(logEntry) + '\n', (err) => {
        if (err) {
            console.error('로그 저장 실패:', err.message);
        }
    });
}

/**
 * 연결 정리 (프로세스 종료 시)
 */
async function closePool() {
    try {
        await pool.end();
        console.log('✅ PostgreSQL 연결 풀 정상 종료');
    } catch (error) {
        console.error('❌ 연결 풀 종료 실패:', error.message);
    }
}

// 프로세스 종료 시 연결 정리
process.on('SIGINT', async () => {
    console.log('\n🛑 프로세스 종료 신호 수신, 데이터베이스 연결 정리 중...');
    await closePool();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 프로세스 종료 신호 수신, 데이터베이스 연결 정리 중...');
    await closePool();
    process.exit(0);
});

// 예외 처리
process.on('uncaughtException', async (error) => {
    console.error('❌ 예외 처리되지 않은 에러:', error);
    logError('uncaught_exception', error);
    await closePool();
    process.exit(1);
});

module.exports = {
    pool,
    query,
    transaction,
    batchQuery,
    testConnection,
    healthCheck,
    getPoolStatus,
    closePool
};