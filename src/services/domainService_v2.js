const { query, transaction } = require('../db/connection_v2');
const { exec } = require('child_process');
const axios = require('axios');
const yaml = require('js-yaml');
const fs = require('fs').promises;
const path = require('path');

/**
 * OMEN SERVER GATEWAY v2.0 도메인 관리 서비스
 * - 도메인 CRUD 관리
 * - Cloudflare DNS 통합
 * - 터널 매핑 관리
 * - SSL 인증서 관리
 */

// =============================================================================
// 도메인 CRUD 관리
// =============================================================================

// 모든 도메인 조회
const getAllDomains = async () => {
    try {
        const result = await query(`
            SELECT
                d.*,
                sc.name as server_name,
                ct.tunnel_name
            FROM domains d
            LEFT JOIN server_configs sc ON d.server_id = sc.server_id
            LEFT JOIN cloudflare_tunnels ct ON d.cloudflare_tunnel_id = ct.tunnel_id
            ORDER BY d.domain_name
        `);
        return result.rows;
    } catch (error) {
        console.error('도메인 조회 오류:', error);
        throw error;
    }
};

// 활성 도메인 조회
const getActiveDomains = async () => {
    try {
        const result = await query(`
            SELECT
                d.*,
                sc.name as server_name,
                ct.tunnel_name
            FROM domains d
            LEFT JOIN server_configs sc ON d.server_id = sc.server_id
            LEFT JOIN cloudflare_tunnels ct ON d.cloudflare_tunnel_id = ct.tunnel_id
            WHERE d.is_active = true
            ORDER BY d.domain_name
        `);
        return result.rows;
    } catch (error) {
        console.error('활성 도메인 조회 오류:', error);
        throw error;
    }
};

// 특정 도메인 조회
const getDomainById = async (domainId) => {
    try {
        const result = await query(`
            SELECT
                d.*,
                sc.name as server_name,
                ct.tunnel_name
            FROM domains d
            LEFT JOIN server_configs sc ON d.server_id = sc.server_id
            LEFT JOIN cloudflare_tunnels ct ON d.cloudflare_tunnel_id = ct.tunnel_id
            WHERE d.id = $1
        `, [domainId]);

        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error('도메인 조회 오류:', error);
        throw error;
    }
};

// 서버별 도메인 조회
const getDomainsByServer = async (serverId) => {
    try {
        const result = await query(`
            SELECT * FROM domains WHERE server_id = $1 ORDER BY domain_name
        `, [serverId]);
        return result.rows;
    } catch (error) {
        console.error('서버별 도메인 조회 오류:', error);
        throw error;
    }
};

// 도메인 생성
const createDomain = async (domainData, userId) => {
    return transaction(async (client) => {
        // 중복 도메인 확인
        const existing = await client.query(
            'SELECT id FROM domains WHERE domain_name = $1',
            [domainData.domain_name]
        );

        if (existing.rows.length > 0) {
            throw new Error('이미 존재하는 도메인입니다');
        }

        // 서버 존재 확인
        const server = await client.query(
            'SELECT server_id FROM server_configs WHERE server_id = $1',
            [domainData.server_id]
        );

        if (server.rows.length === 0) {
            throw new Error('지정된 서버를 찾을 수 없습니다');
        }

        // 도메인 생성
        const result = await client.query(`
            INSERT INTO domains (
                domain_name, server_id, cloudflare_tunnel_id,
                ssl_enabled, is_active, dns_records
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [
            domainData.domain_name,
            domainData.server_id,
            domainData.cloudflare_tunnel_id || null,
            domainData.ssl_enabled !== undefined ? domainData.ssl_enabled : true,
            domainData.is_active !== undefined ? domainData.is_active : true,
            domainData.dns_records ? JSON.stringify(domainData.dns_records) : null
        ]);

        // 생성 로그 기록
        await client.query(`
            INSERT INTO server_logs (server_id, action, status, message, executed_by)
            VALUES ($1, $2, $3, $4, $5)
        `, [domainData.server_id, 'domain_create', 'success', `도메인 ${domainData.domain_name} 생성됨`, userId]);

        return result.rows[0];
    });
};

// 도메인 수정
const updateDomain = async (domainId, updates, userId) => {
    return transaction(async (client) => {
        const allowedFields = [
            'domain_name', 'server_id', 'cloudflare_tunnel_id',
            'ssl_enabled', 'is_active', 'dns_records'
        ];

        const fields = [];
        const values = [];
        let paramIndex = 1;

        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key) && updates[key] !== undefined) {
                if (key === 'dns_records' && typeof updates[key] === 'object') {
                    fields.push(`${key} = $${paramIndex}`);
                    values.push(JSON.stringify(updates[key]));
                } else {
                    fields.push(`${key} = $${paramIndex}`);
                    values.push(updates[key]);
                }
                paramIndex++;
            }
        });

        if (fields.length === 0) {
            throw new Error('업데이트할 필드가 없습니다');
        }

        values.push(domainId);
        const updateQuery = `
            UPDATE domains
            SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await client.query(updateQuery, values);

        if (result.rowCount === 0) {
            throw new Error('도메인을 찾을 수 없습니다');
        }

        const domain = result.rows[0];

        // 수정 로그 기록
        await client.query(`
            INSERT INTO server_logs (server_id, action, status, message, executed_by)
            VALUES ($1, $2, $3, $4, $5)
        `, [domain.server_id, 'domain_update', 'success', `도메인 ${domain.domain_name} 수정됨`, userId]);

        return domain;
    });
};

// 도메인 삭제
const deleteDomain = async (domainId, userId) => {
    return transaction(async (client) => {
        // 도메인 조회
        const domainResult = await client.query(
            'SELECT * FROM domains WHERE id = $1',
            [domainId]
        );

        if (domainResult.rows.length === 0) {
            throw new Error('도메인을 찾을 수 없습니다');
        }

        const domain = domainResult.rows[0];

        // 도메인 삭제
        await client.query('DELETE FROM domains WHERE id = $1', [domainId]);

        // 삭제 로그 기록
        await client.query(`
            INSERT INTO server_logs (server_id, action, status, message, executed_by)
            VALUES ($1, $2, $3, $4, $5)
        `, [domain.server_id, 'domain_delete', 'success', `도메인 ${domain.domain_name} 삭제됨`, userId]);

        return true;
    });
};

// =============================================================================
// Cloudflare DNS 관리
// =============================================================================

// Cloudflare DNS 레코드 생성
const createCloudfareDNSRecord = async (domainName, tunnelId, recordType = 'CNAME') => {
    try {
        // 실제 Cloudflare API 호출은 API 키가 필요하므로 시뮬레이션
        // 실제 구현 시에는 Cloudflare API를 사용해야 함

        const dnsRecord = {
            type: recordType,
            name: domainName,
            content: `${tunnelId}.cfargotunnel.com`,
            ttl: 1, // Auto
            proxied: true
        };

        // 시뮬레이션: DNS 레코드 정보를 데이터베이스에 저장
        await query(`
            UPDATE domains
            SET dns_records = $1, updated_at = CURRENT_TIMESTAMP
            WHERE domain_name = $2
        `, [JSON.stringify(dnsRecord), domainName]);

        return {
            success: true,
            record: dnsRecord,
            message: `DNS 레코드 생성 시뮬레이션 완료: ${domainName} -> ${tunnelId}.cfargotunnel.com`
        };

    } catch (error) {
        console.error('Cloudflare DNS 레코드 생성 오류:', error);
        throw error;
    }
};

// DNS 레코드 검증
const verifyDNSRecord = async (domainName) => {
    try {
        // DNS 조회를 통한 검증
        return new Promise((resolve) => {
            exec(`nslookup ${domainName}`, (error, stdout, stderr) => {
                if (error) {
                    resolve({
                        domain: domainName,
                        resolved: false,
                        error: error.message
                    });
                } else {
                    const isResolved = stdout.includes('cfargotunnel.com') ||
                                      stdout.includes('cloudflare');

                    resolve({
                        domain: domainName,
                        resolved: isResolved,
                        output: stdout,
                        timestamp: new Date()
                    });
                }
            });
        });
    } catch (error) {
        console.error('DNS 레코드 검증 오류:', error);
        return {
            domain: domainName,
            resolved: false,
            error: error.message
        };
    }
};

// 도메인 헬스체크
const checkDomainHealth = async (domainName, useHttps = true) => {
    try {
        const protocol = useHttps ? 'https' : 'http';
        const url = `${protocol}://${domainName}`;

        const startTime = Date.now();

        const response = await axios.get(url, {
            timeout: 10000,
            validateStatus: (status) => status < 500,
            maxRedirects: 5
        });

        const responseTime = Date.now() - startTime;

        return {
            domain: domainName,
            url,
            status: 'healthy',
            status_code: response.status,
            response_time: responseTime,
            ssl_valid: useHttps && response.status < 400,
            timestamp: new Date()
        };

    } catch (error) {
        return {
            domain: domainName,
            url: `${useHttps ? 'https' : 'http'}://${domainName}`,
            status: 'unhealthy',
            status_code: error.response ? error.response.status : null,
            response_time: null,
            ssl_valid: false,
            error_message: error.message,
            timestamp: new Date()
        };
    }
};

// =============================================================================
// Cloudflare 설정 파일 관리
// =============================================================================

// Cloudflare 설정 파일 생성
const generateCloudflareConfig = async (tunnelId, ingress = []) => {
    try {
        const tunnel = await query(
            'SELECT * FROM cloudflare_tunnels WHERE tunnel_id = $1',
            [tunnelId]
        );

        if (tunnel.rows.length === 0) {
            throw new Error('터널을 찾을 수 없습니다');
        }

        const tunnelConfig = tunnel.rows[0];

        // 관련 도메인들 조회
        const domains = await query(
            'SELECT * FROM domains WHERE cloudflare_tunnel_id = $1 AND is_active = true',
            [tunnelId]
        );

        // 기본 ingress 규칙 생성
        const ingressRules = [];

        for (const domain of domains.rows) {
            // 서버 정보 조회
            const server = await query(
                'SELECT port FROM server_configs WHERE server_id = $1',
                [domain.server_id]
            );

            if (server.rows.length > 0) {
                ingressRules.push({
                    hostname: domain.domain_name,
                    service: `http://localhost:${server.rows[0].port}`
                });
            }
        }

        // 기본 catch-all 규칙 추가
        ingressRules.push({
            service: 'http_status:404'
        });

        const config = {
            tunnel: tunnelConfig.tunnel_id,
            'credentials-file': `./credentials/${tunnelId}.json`,
            ingress: ingressRules
        };

        // YAML 형태로 변환
        const yamlConfig = yaml.dump(config, { indent: 2 });

        // 설정 파일 경로
        const configDir = path.join(__dirname, '../../tunnels');
        const configPath = path.join(configDir, `${tunnelConfig.tunnel_name}-config.yml`);

        // 디렉토리 생성
        await fs.mkdir(configDir, { recursive: true });

        // 설정 파일 저장
        await fs.writeFile(configPath, yamlConfig, 'utf8');

        // 데이터베이스에 설정 파일 경로 업데이트
        await query(
            'UPDATE cloudflare_tunnels SET config_path = $1 WHERE tunnel_id = $2',
            [configPath, tunnelId]
        );

        return {
            success: true,
            config_path: configPath,
            config: config,
            yaml: yamlConfig
        };

    } catch (error) {
        console.error('Cloudflare 설정 파일 생성 오류:', error);
        throw error;
    }
};

// 설정 파일 읽기
const readCloudflareConfig = async (configPath) => {
    try {
        const yamlContent = await fs.readFile(configPath, 'utf8');
        const config = yaml.load(yamlContent);
        return config;
    } catch (error) {
        console.error('설정 파일 읽기 오류:', error);
        throw error;
    }
};

// =============================================================================
// 도메인 매핑 관리
// =============================================================================

// 서버-도메인 매핑 조회
const getServerDomainMapping = async () => {
    try {
        const result = await query(`
            SELECT
                sc.server_id,
                sc.name as server_name,
                sc.port,
                ARRAY_AGG(d.domain_name ORDER BY d.domain_name) as domains,
                COUNT(d.id) as domain_count
            FROM server_configs sc
            LEFT JOIN domains d ON sc.server_id = d.server_id AND d.is_active = true
            WHERE sc.is_enabled = true
            GROUP BY sc.server_id, sc.name, sc.port
            ORDER BY sc.server_id
        `);
        return result.rows;
    } catch (error) {
        console.error('서버-도메인 매핑 조회 오류:', error);
        throw error;
    }
};

// 터널별 도메인 조회
const getDomainsByTunnel = async (tunnelId) => {
    try {
        const result = await query(`
            SELECT
                d.*,
                sc.name as server_name,
                sc.port
            FROM domains d
            JOIN server_configs sc ON d.server_id = sc.server_id
            WHERE d.cloudflare_tunnel_id = $1 AND d.is_active = true
            ORDER BY d.domain_name
        `, [tunnelId]);
        return result.rows;
    } catch (error) {
        console.error('터널별 도메인 조회 오류:', error);
        throw error;
    }
};

// 도메인 통계 조회
const getDomainStatistics = async () => {
    try {
        const result = await query(`
            SELECT
                COUNT(*) as total_domains,
                SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_domains,
                SUM(CASE WHEN ssl_enabled THEN 1 ELSE 0 END) as ssl_enabled_domains,
                COUNT(DISTINCT server_id) as servers_with_domains,
                COUNT(DISTINCT cloudflare_tunnel_id) as tunnels_used
            FROM domains
        `);
        return result.rows[0];
    } catch (error) {
        console.error('도메인 통계 조회 오류:', error);
        throw error;
    }
};

module.exports = {
    // 도메인 CRUD
    getAllDomains,
    getActiveDomains,
    getDomainById,
    getDomainsByServer,
    createDomain,
    updateDomain,
    deleteDomain,

    // DNS 관리
    createCloudfareDNSRecord,
    verifyDNSRecord,
    checkDomainHealth,

    // 설정 파일 관리
    generateCloudflareConfig,
    readCloudflareConfig,

    // 매핑 및 통계
    getServerDomainMapping,
    getDomainsByTunnel,
    getDomainStatistics
};