const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL 연결 풀 설정
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'omen_gateway',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 연결 테스트
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL 연결 성공');
    client.release();
  } catch (error) {
    console.error('PostgreSQL 연결 실패:', error.message);
    throw error;
  }
};

// 쿼리 실행 함수
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('쿼리 실행:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('쿼리 실행 오류:', { text, error: error.message });
    throw error;
  }
};

// 트랜잭션 실행 함수
const executeTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// 연결 종료
const closeConnection = async () => {
  await pool.end();
  console.log('PostgreSQL 연결 종료');
};

module.exports = {
  query,
  executeTransaction,
  testConnection,
  closeConnection,
  pool
};