const { Pool } = require('pg');

// PostgreSQL 연결 설정
const pool = new Pool({
    connectionString: 'postgresql://postgres:0987@localhost:5432/omen_gateway',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

/**
 * 모든 도메인 목록 조회
 */
async function getAllDomains() {
    try {
        const query = 'SELECT * FROM domains ORDER BY domain_name';
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('도메인 조회 오류:', error);
        throw error;
    }
}

/**
 * 활성화된 도메인만 조회
 */
async function getActiveDomains() {
    try {
        const query = 'SELECT * FROM domains WHERE is_active = true ORDER BY domain_name';
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('활성 도메인 조회 오류:', error);
        throw error;
    }
}

/**
 * 특정 도메인 조회
 */
async function getDomainById(id) {
    try {
        const query = 'SELECT * FROM domains WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    } catch (error) {
        console.error('도메인 상세 조회 오류:', error);
        throw error;
    }
}

/**
 * 도메인 생성
 */
async function createDomain(domainData) {
    const { domain_name, server_id, is_active, ssl_enabled } = domainData;
    try {
        const query = `
            INSERT INTO domains (domain_name, server_id, is_active, ssl_enabled)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await pool.query(query, [domain_name, server_id, is_active, ssl_enabled]);
        return result.rows[0];
    } catch (error) {
        console.error('도메인 생성 오류:', error);
        throw error;
    }
}

/**
 * 도메인 업데이트
 */
async function updateDomain(id, domainData) {
    const { domain_name, server_id, is_active, ssl_enabled } = domainData;
    try {
        const query = `
            UPDATE domains
            SET domain_name = $1, server_id = $2, is_active = $3, ssl_enabled = $4, updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING *
        `;
        const result = await pool.query(query, [domain_name, server_id, is_active, ssl_enabled, id]);
        return result.rows[0];
    } catch (error) {
        console.error('도메인 업데이트 오류:', error);
        throw error;
    }
}

/**
 * 도메인 삭제
 */
async function deleteDomain(id) {
    try {
        const query = 'DELETE FROM domains WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    } catch (error) {
        console.error('도메인 삭제 오류:', error);
        throw error;
    }
}

module.exports = {
    getAllDomains,
    getActiveDomains,
    getDomainById,
    createDomain,
    updateDomain,
    deleteDomain
};