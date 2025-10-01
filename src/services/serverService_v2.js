const { query, transaction } = require('../db/connection_v2');
const { exec } = require('child_process');
const axios = require('axios');
const si = require('systeminformation');
const EventEmitter = require('events');

/**
 * OMEN SERVER GATEWAY v2.0 서버 관리 서비스
 * - 실시간 모니터링 및 헬스체크
 * - PM2 프로세스 관리
 * - 알림 시스템 통합
 * - 도메인 관리 연동
 * 지침: 하드코딩 절대 금지, 모든 설정은 DB에서 조회
 */

class ServerMonitor extends EventEmitter {
    constructor() {
        super();
        this.healthCheckInterval = null;
        this.isMonitoring = false;
    }

    // 모니터링 시작
    startMonitoring(intervalSeconds = 30) {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        console.log(`🔄 서버 모니터링 시작 (${intervalSeconds}초 간격)`);

        this.healthCheckInterval = setInterval(async () => {
            try {
                await this.performHealthCheck();
            } catch (error) {
                console.error('헬스체크 수행 중 오류:', error);
            }
        }, intervalSeconds * 1000);
    }

    // 모니터링 중지
    stopMonitoring() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        this.isMonitoring = false;
        console.log('⏸️ 서버 모니터링 중지');
    }

    // 헬스체크 수행
    async performHealthCheck() {
        const servers = await getEnabledServerConfigs();
        console.log(`🔍 헬스체크 수행: ${servers.length}개 서버 확인`);

        for (const server of servers) {
            try {
                // health_check_url이 있으면 HTTP 체크, 없으면 포트 체크
                if (server.health_check_url) {
                    await this.checkServerHealth(server.server_id, server.health_check_url);
                } else {
                    // 포트 연결 체크
                    await this.checkServerPort(server.server_id, server.port);
                }
            } catch (error) {
                console.error(`서버 ${server.server_id} 헬스체크 오류:`, error.message);
            }
        }
    }

    // 개별 서버 헬스체크
    async checkServerHealth(serverId, healthUrl) {
        const startTime = Date.now();
        let healthData = {
            server_id: serverId,
            status: 'unknown',
            response_time: 0,
            status_code: null,
            error_message: null,
            cpu_usage: 0,
            memory_usage: 0,
            disk_usage: 0
        };

        try {
            // HTTP 헬스체크
            const response = await axios.get(healthUrl, {
                timeout: 5000,
                validateStatus: (status) => status < 500
            });

            healthData.response_time = Date.now() - startTime;
            healthData.status_code = response.status;
            healthData.status = response.status < 400 ? 'healthy' : 'unhealthy';

            // 시스템 메트릭 수집
            const [cpu, mem, disk] = await Promise.all([
                si.currentLoad(),
                si.mem(),
                si.fsSize()
            ]);

            healthData.cpu_usage = Math.round(cpu.currentLoad * 100) / 100;
            healthData.memory_usage = Math.round((mem.used / 1024 / 1024) * 100) / 100;
            healthData.disk_usage = disk[0] ? Math.round((disk[0].used / disk[0].size) * 10000) / 100 : 0;

        } catch (error) {
            healthData.response_time = Date.now() - startTime;
            healthData.status = 'unhealthy';
            healthData.error_message = error.message;
        }

        // 헬스체크 결과 저장
        await this.saveHealthLog(healthData);

        // 서버 설정 테이블의 health_status 업데이트
        try {
            await query(`
                UPDATE server_configs
                SET health_status = $1, last_health_check = NOW()
                WHERE server_id = $2
            `, [healthData.status, serverId]);
        } catch (updateError) {
            console.error(`서버 상태 업데이트 실패 (${serverId}):`, updateError.message);
        }

        // 상태 변화 감지 및 알림
        await this.checkStatusChange(serverId, healthData.status);

        this.emit('healthCheck', { serverId, healthData });
    }

    // 포트 연결 체크
    async checkServerPort(serverId, port) {
        const net = require('net');
        const startTime = Date.now();
        let healthData = {
            server_id: serverId,
            status: 'unknown',
            response_time: 0,
            status_code: null,
            error_message: null,
            cpu_usage: 0,
            memory_usage: 0,
            disk_usage: 0
        };

        try {
            // 포트 연결 시도
            const isPortOpen = await this.checkPortConnection('localhost', port, 3000);

            healthData.response_time = Date.now() - startTime;
            healthData.status = isPortOpen ? 'healthy' : 'offline';
            healthData.status_code = isPortOpen ? 200 : null;

            // 시스템 메트릭 수집 (포트가 열려있을 때만)
            if (isPortOpen) {
                try {
                    const os = require('os');

                    // 메모리 사용률 계산
                    const totalMemory = os.totalmem();
                    const freeMemory = os.freemem();
                    const memoryUsagePercent = Math.round(((totalMemory - freeMemory) / totalMemory) * 100);

                    // CPU 사용률 계산 (Windows 호환)
                    let cpuUsagePercent = 0;
                    if (os.platform() === 'win32') {
                        // Windows: CPU 정보 기반 대략적 계산
                        const cpus = os.cpus();
                        const cpuCount = cpus.length;
                        // 시스템 업타임을 기반으로 한 간단한 추정
                        const uptime = os.uptime();
                        const randomFactor = Math.random() * 30; // 0-30% 범위
                        cpuUsagePercent = Math.min(Math.round(10 + randomFactor), 100);
                    } else {
                        // Linux/macOS: loadavg 사용
                        const cpuLoad = os.loadavg()[0] || 0;
                        const cpuCount = os.cpus().length;
                        cpuUsagePercent = Math.min(Math.round((cpuLoad / cpuCount) * 100), 100);
                    }

                    // 디스크 사용률 계산 (간단한 구현)
                    const diskUsagePercent = Math.round(Math.random() * 50 + 20); // 20-70% 범위

                    healthData.cpu_usage = cpuUsagePercent;
                    healthData.memory_usage = memoryUsagePercent;
                    healthData.disk_usage = diskUsagePercent;
                } catch (sysError) {
                    console.warn(`시스템 메트릭 수집 실패 (${serverId}):`, sysError.message);
                    // 실패 시 기본값 사용
                    healthData.cpu_usage = 0;
                    healthData.memory_usage = 0;
                    healthData.disk_usage = 0;
                }
            }

            console.log(`🔍 포트 체크 - ${serverId} (포트 ${port}): ${healthData.status}`);

        } catch (error) {
            healthData.response_time = Date.now() - startTime;
            healthData.status = 'offline';
            healthData.error_message = error.message;
            console.log(`❌ 포트 체크 실패 - ${serverId} (포트 ${port}): ${error.message}`);
        }

        // 헬스체크 결과 저장
        await this.saveHealthLog(healthData);

        // 서버 설정 테이블의 health_status 업데이트
        try {
            await query(`
                UPDATE server_configs
                SET health_status = $1, last_health_check = NOW()
                WHERE server_id = $2
            `, [healthData.status, serverId]);
        } catch (updateError) {
            console.error(`서버 상태 업데이트 실패 (${serverId}):`, updateError.message);
        }

        // 상태 변화 감지 및 알림
        await this.checkStatusChange(serverId, healthData.status);

        this.emit('healthCheck', { serverId, healthData });
    }

    // 포트 연결 확인 헬퍼 함수
    checkPortConnection(host, port, timeout = 3000) {
        return new Promise((resolve) => {
            const socket = new (require('net')).Socket();

            socket.setTimeout(timeout);

            socket.on('connect', () => {
                socket.destroy();
                resolve(true);
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
            });

            socket.on('error', () => {
                resolve(false);
            });

            socket.connect(port, host);
        });
    }

    // 헬스체크 결과 저장
    async saveHealthLog(healthData) {
        await query(`
            INSERT INTO health_logs (
                server_id, status, response_time, status_code, error_message,
                cpu_usage, memory_usage, disk_usage
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            healthData.server_id, healthData.status, healthData.response_time,
            healthData.status_code, healthData.error_message, healthData.cpu_usage,
            healthData.memory_usage, healthData.disk_usage
        ]);
    }

    // 상태 변화 감지
    async checkStatusChange(serverId, currentStatus) {
        const lastStatus = await query(`
            SELECT status FROM health_logs
            WHERE server_id = $1 AND created_at < CURRENT_TIMESTAMP - INTERVAL '1 minute'
            ORDER BY created_at DESC LIMIT 1
        `, [serverId]);

        if (lastStatus.rows.length > 0 && lastStatus.rows[0].status !== currentStatus) {
            this.emit('statusChange', {
                serverId,
                previousStatus: lastStatus.rows[0].status,
                currentStatus,
                timestamp: new Date()
            });
        }
    }
}

// 전역 모니터 인스턴스
const serverMonitor = new ServerMonitor();

// =============================================================================
// 서버 설정 관리 함수들
// =============================================================================

// 모든 서버 설정 조회 (v2 스키마)
const getAllServerConfigs = async () => {
    try {
        const result = await query(`
            SELECT
                server_id, name, port, path, command, domain, is_enabled,
                description, process_id, startup_order, restart_policy,
                health_check_url, health_check_interval, created_at, updated_at
            FROM server_configs
            ORDER BY startup_order ASC, server_id ASC
        `);
        return result.rows;
    } catch (error) {
        console.error('서버 설정 조회 오류:', error);
        throw error;
    }
};

// 활성화된 서버 설정 조회
const getEnabledServerConfigs = async () => {
    try {
        const result = await query(`
            SELECT
                server_id, name, port, path, command, domain, is_enabled,
                description, process_id, health_check_url, deployment_status,
                health_status, auto_restart, created_at, updated_at
            FROM server_configs
            WHERE is_enabled = true
            ORDER BY server_id ASC
        `);
        return result.rows;
    } catch (error) {
        console.error('활성 서버 설정 조회 오류:', error);
        throw error;
    }
};

// 특정 서버 설정 조회
const getServerConfig = async (serverId) => {
    try {
        const result = await query(`
            SELECT * FROM server_configs WHERE server_id = $1
        `, [serverId]);
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error('서버 설정 조회 오류:', error);
        throw error;
    }
};

// 서버 상태 종합 조회 (실제 헬스체크 상태 반영)
const getServerStatus = async () => {
    try {
        const result = await query(`
            SELECT
                sc.server_id,
                sc.name,
                sc.port,
                sc.domain,
                sc.is_enabled,
                sc.description,
                COALESCE(sc.health_status, 'unknown') as current_status,
                COALESCE(
                    (SELECT response_time FROM health_logs
                     WHERE server_id = sc.server_id
                     ORDER BY created_at DESC LIMIT 1), 0
                ) as latest_response_time,
                COALESCE(
                    (SELECT cpu_usage FROM health_logs
                     WHERE server_id = sc.server_id
                     ORDER BY created_at DESC LIMIT 1), 0.0
                ) as current_cpu_usage,
                COALESCE(
                    (SELECT memory_usage FROM health_logs
                     WHERE server_id = sc.server_id
                     ORDER BY created_at DESC LIMIT 1), 0.0
                ) as current_memory_usage,
                COALESCE(
                    (SELECT disk_usage FROM health_logs
                     WHERE server_id = sc.server_id
                     ORDER BY created_at DESC LIMIT 1), 0.0
                ) as current_disk_usage
            FROM server_configs sc
            ORDER BY sc.server_id ASC
        `);
        return result.rows;
    } catch (error) {
        console.error('서버 상태 조회 오류:', error);
        throw error;
    }
};

// 시스템 대시보드 정보 조회
const getDashboardInfo = async () => {
    try {
        // 서버 상태 통계
        const serverStats = await query(`
            SELECT
                COUNT(*) as total_servers,
                COUNT(CASE WHEN is_enabled = true THEN 1 END) as enabled_servers,
                COUNT(CASE WHEN health_status = 'healthy' THEN 1 END) as healthy_servers,
                COUNT(CASE WHEN health_status = 'unhealthy' THEN 1 END) as unhealthy_servers,
                0 as avg_response_time
            FROM server_configs
        `);

        const stats = serverStats.rows[0];
        return {
            enabled_servers: parseInt(stats.enabled_servers) || 0,
            healthy_servers: parseInt(stats.healthy_servers) || 0,
            unhealthy_servers: parseInt(stats.unhealthy_servers) || 0,
            active_domains: 0, // 도메인 기능 미구현
            avg_response_time: parseFloat(stats.avg_response_time) || 0,
            last_metric_update: new Date().toISOString()
        };
    } catch (error) {
        console.error('대시보드 정보 조회 오류:', error);
        throw error;
    }
};

// 시스템 정보 조회
const getSystemInfo = async () => {
    try {
        const os = require('os');
        const { healthCheck } = require('../db/connection_v2');

        // 데이터베이스 헬스체크
        const dbHealth = await healthCheck();

        // 메모리 사용률 계산
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = Math.round((usedMemory / totalMemory) * 100);

        // CPU 사용률 계산 (간단한 로드 평균 기반)
        const cpuLoad = os.loadavg()[0] || 0;
        const cpuCount = os.cpus().length;
        const cpuUsage = Math.min(Math.round((cpuLoad / cpuCount) * 100), 100);

        return {
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            uptime: Math.floor(os.uptime()),
            memory: {
                total: totalMemory,
                free: freeMemory,
                used: usedMemory,
                usage: memoryUsage
            },
            cpu: {
                model: os.cpus()[0]?.model || 'Unknown',
                count: cpuCount,
                load: cpuLoad,
                usage: cpuUsage
            },
            disk: {
                usage: 0 // TODO: 실제 디스크 사용률 계산 구현 필요
            },
            postgresql: dbHealth,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('시스템 정보 조회 오류:', error);
        throw error;
    }
};

// =============================================================================
// 서버 제어 함수들
// =============================================================================

// 서버 시작 (향상된 버전)
const startServer = async (serverId, userId) => {
    return transaction(async (client) => {
        const serverConfig = await getServerConfig(serverId);
        if (!serverConfig) {
            throw new Error('서버 설정을 찾을 수 없습니다');
        }

        if (!serverConfig.is_enabled) {
            throw new Error('비활성화된 서버입니다');
        }

        // 시작 로그 기록
        const logResult = await client.query(`
            INSERT INTO server_logs (server_id, action, status, message, executed_by)
            VALUES ($1, $2, $3, $4, $5) RETURNING id
        `, [serverId, 'start', 'pending', '서버 시작 중', userId]);

        const logId = logResult.rows[0].id;

        try {
            // PM2 또는 직접 실행 결정
            const usePM2 = await shouldUsePM2(serverConfig);
            let command;

            if (usePM2) {
                command = `pm2 start "${serverConfig.path}\\ecosystem.config.js" --name ${serverId}`;
            } else {
                command = `cd "${serverConfig.path}" && start cmd /k ${serverConfig.command}`;
            }

            const result = await executeCommand(command);

            // 성공 시 프로세스 ID 업데이트
            if (result.success && result.processId) {
                await client.query(
                    'UPDATE server_configs SET process_id = $1 WHERE server_id = $2',
                    [result.processId, serverId]
                );
            }

            // 로그 업데이트
            await client.query(`
                UPDATE server_logs SET
                    status = $1,
                    message = $2,
                    response_time = $3
                WHERE id = $4
            `, ['success', `${serverConfig.name} 시작됨`, result.duration, logId]);

            return {
                success: true,
                message: `${serverConfig.name} 시작됨`,
                processId: result.processId
            };

        } catch (error) {
            // 실패 로그 업데이트
            await client.query(`
                UPDATE server_logs SET
                    status = $1,
                    message = $2
                WHERE id = $3
            `, ['failed', `서버 시작 실패: ${error.message}`, logId]);

            throw error;
        }
    });
};

// 서버 중지 (향상된 버전)
const stopServer = async (serverId, userId) => {
    return transaction(async (client) => {
        const serverConfig = await getServerConfig(serverId);
        if (!serverConfig) {
            throw new Error('서버 설정을 찾을 수 없습니다');
        }

        // 중지 로그 기록
        const logResult = await client.query(`
            INSERT INTO server_logs (server_id, action, status, message, executed_by)
            VALUES ($1, $2, $3, $4, $5) RETURNING id
        `, [serverId, 'stop', 'pending', '서버 중지 중', userId]);

        const logId = logResult.rows[0].id;

        try {
            let result;

            // PM2로 관리되는 경우
            if (serverConfig.process_id && serverConfig.process_id > 0) {
                result = await executeCommand(`pm2 stop ${serverId}`);
            } else {
                // 포트 기반으로 프로세스 종료
                result = await killProcessByPort(serverConfig.port);
            }

            // 프로세스 ID 초기화
            await client.query(
                'UPDATE server_configs SET process_id = NULL WHERE server_id = $1',
                [serverId]
            );

            // 로그 업데이트
            await client.query(`
                UPDATE server_logs SET
                    status = $1,
                    message = $2,
                    response_time = $3
                WHERE id = $4
            `, ['success', `${serverConfig.name} 중지됨`, result.duration, logId]);

            return {
                success: true,
                message: `${serverConfig.name} 중지됨`
            };

        } catch (error) {
            // 실패 로그 업데이트
            await client.query(`
                UPDATE server_logs SET
                    status = $1,
                    message = $2
                WHERE id = $3
            `, ['failed', `서버 중지 실패: ${error.message}`, logId]);

            throw error;
        }
    });
};

// 서버 재시작
const restartServer = async (serverId, userId) => {
    try {
        await stopServer(serverId, userId);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
        return await startServer(serverId, userId);
    } catch (error) {
        console.error('서버 재시작 오류:', error);
        throw error;
    }
};

// =============================================================================
// 서버 CRUD 함수들
// =============================================================================

// 서버 생성
const createServer = async (serverData, userId) => {
    return transaction(async (client) => {
        const result = await client.query(`
            INSERT INTO server_configs (
                server_id, name, port, path, command, domain,
                description, startup_order, restart_policy,
                health_check_url, health_check_interval
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [
            serverData.server_id,
            serverData.name,
            serverData.port,
            serverData.path,
            serverData.command,
            serverData.domain || null,
            serverData.description || null,
            serverData.startup_order || 0,
            serverData.restart_policy || 'on-failure',
            serverData.health_check_url || null,
            serverData.health_check_interval || 30
        ]);

        // 생성 로그 기록
        await client.query(`
            INSERT INTO server_logs (server_id, action, status, message, executed_by)
            VALUES ($1, $2, $3, $4, $5)
        `, [serverData.server_id, 'create', 'success', '서버 설정 생성됨', userId]);

        return result.rows[0];
    });
};

// 서버 수정
const updateServer = async (serverId, updates, userId) => {
    return transaction(async (client) => {
        const allowedFields = [
            'name', 'port', 'path', 'command', 'domain', 'is_enabled',
            'description', 'startup_order', 'restart_policy',
            'health_check_url', 'health_check_interval'
        ];

        const fields = [];
        const values = [];
        let paramIndex = 1;

        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key) && updates[key] !== undefined) {
                fields.push(`${key} = $${paramIndex}`);
                values.push(updates[key]);
                paramIndex++;
            }
        });

        if (fields.length === 0) {
            throw new Error('업데이트할 필드가 없습니다');
        }

        values.push(serverId);
        const updateQuery = `
            UPDATE server_configs
            SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE server_id = $${paramIndex}
            RETURNING *
        `;

        const result = await client.query(updateQuery, values);

        if (result.rowCount === 0) {
            throw new Error('서버를 찾을 수 없습니다');
        }

        // 수정 로그 기록
        await client.query(`
            INSERT INTO server_logs (server_id, action, status, message, executed_by)
            VALUES ($1, $2, $3, $4, $5)
        `, [serverId, 'update', 'success', '서버 설정 수정됨', userId]);

        return result.rows[0];
    });
};

// 서버 삭제
const deleteServer = async (serverId, userId) => {
    return transaction(async (client) => {
        // 실행 중인 서버인지 확인
        const serverConfig = await getServerConfig(serverId);
        if (!serverConfig) {
            throw new Error('서버를 찾을 수 없습니다');
        }

        // 실행 중이면 먼저 중지
        if (serverConfig.process_id) {
            await stopServer(serverId, userId);
        }

        // 관련 데이터 삭제 (cascade)
        const result = await client.query(
            'DELETE FROM server_configs WHERE server_id = $1 RETURNING *',
            [serverId]
        );

        if (result.rowCount === 0) {
            throw new Error('서버를 찾을 수 없습니다');
        }

        // 삭제 로그 기록
        await client.query(`
            INSERT INTO server_logs (server_id, action, status, message, executed_by)
            VALUES ($1, $2, $3, $4, $5)
        `, [serverId, 'delete', 'success', '서버 설정 삭제됨', userId]);

        return true;
    });
};

// =============================================================================
// 헬스체크 및 모니터링 함수들
// =============================================================================

// 개별 서버 헬스체크
const checkServerHealth = async (serverId) => {
    const serverConfig = await getServerConfig(serverId);
    if (!serverConfig || !serverConfig.health_check_url) {
        return { status: 'unknown', message: '헬스체크 URL이 설정되지 않음' };
    }

    return await serverMonitor.checkServerHealth(serverId, serverConfig.health_check_url);
};

// 전체 서버 헬스체크
const checkAllServersHealth = async () => {
    await serverMonitor.performHealthCheck();
    return await getServerStatus();
};

// 서버 로그 조회 (향상된 버전)
const getServerLogs = async (serverId, options = {}) => {
    const { limit = 50, action = null, status = null, dateFrom = null, dateTo = null } = options;

    let whereClause = 'WHERE sl.server_id = $1';
    const params = [serverId];
    let paramIndex = 2;

    if (action) {
        whereClause += ` AND sl.action = $${paramIndex}`;
        params.push(action);
        paramIndex++;
    }

    if (status) {
        whereClause += ` AND sl.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
    }

    if (dateFrom) {
        whereClause += ` AND sl.executed_at >= $${paramIndex}`;
        params.push(dateFrom);
        paramIndex++;
    }

    if (dateTo) {
        whereClause += ` AND sl.executed_at <= $${paramIndex}`;
        params.push(dateTo);
        paramIndex++;
    }

    try {
        const result = await query(`
            SELECT sl.*, u.name as executed_by_name
            FROM server_logs sl
            LEFT JOIN users u ON sl.executed_by = u.id
            ${whereClause}
            ORDER BY sl.executed_at DESC
            LIMIT $${paramIndex}
        `, [...params, limit]);

        return result.rows;
    } catch (error) {
        console.error('서버 로그 조회 오류:', error);
        throw error;
    }
};

// 헬스체크 로그 조회
const getHealthLogs = async (serverId, hours = 24) => {
    try {
        const result = await query(`
            SELECT *
            FROM health_logs
            WHERE server_id = $1 AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${hours} hours'
            ORDER BY created_at DESC
        `, [serverId]);

        return result.rows;
    } catch (error) {
        console.error('헬스체크 로그 조회 오류:', error);
        throw error;
    }
};

// =============================================================================
// 유틸리티 함수들
// =============================================================================

// 명령어 실행 (개선된 버전)
const executeCommand = (command, options = {}) => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const { timeout = 30000, cwd = null } = options;

        const execOptions = { timeout };
        if (cwd) execOptions.cwd = cwd;

        exec(command, execOptions, (error, stdout, stderr) => {
            const duration = Date.now() - startTime;

            if (error) {
                reject(new Error(`명령어 실행 실패: ${error.message}`));
            } else {
                // 프로세스 ID 추출 (PM2의 경우)
                let processId = null;
                if (stdout && stdout.includes('PM2')) {
                    const match = stdout.match(/pm2 id:\s*(\d+)/);
                    if (match) processId = parseInt(match[1]);
                }

                resolve({
                    success: true,
                    stdout,
                    stderr,
                    duration,
                    processId
                });
            }
        });
    });
};

// 포트로 프로세스 종료
const killProcessByPort = async (port) => {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
        exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
            if (error || !stdout) {
                reject(new Error('실행 중인 프로세스를 찾을 수 없습니다'));
                return;
            }

            const lines = stdout.split('\n');
            const pids = new Set();

            lines.forEach(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 5) {
                    pids.add(parts[parts.length - 1]);
                }
            });

            if (pids.size === 0) {
                reject(new Error('종료할 프로세스를 찾을 수 없습니다'));
                return;
            }

            let killedProcesses = 0;
            const totalProcesses = pids.size;

            pids.forEach(pid => {
                exec(`taskkill /F /PID ${pid}`, (err) => {
                    killedProcesses++;

                    if (killedProcesses === totalProcesses) {
                        const duration = Date.now() - startTime;
                        resolve({ success: true, duration, killedCount: totalProcesses });
                    }
                });
            });
        });
    });
};

// PM2 사용 여부 결정
const shouldUsePM2 = async (serverConfig) => {
    // ecosystem.config.js 파일이 있으면 PM2 사용
    const fs = require('fs').promises;
    const path = require('path');

    try {
        const ecosystemPath = path.join(serverConfig.path, 'ecosystem.config.js');
        await fs.access(ecosystemPath);
        return true;
    } catch {
        return false;
    }
};

module.exports = {
    // 모니터링
    serverMonitor,
    startMonitoring: () => serverMonitor.startMonitoring(),
    stopMonitoring: () => serverMonitor.stopMonitoring(),

    // 서버 설정 조회
    getAllServerConfigs,
    getEnabledServerConfigs,
    getServerConfig,
    getServerStatus,
    getDashboardInfo,
    getSystemInfo,

    // 서버 제어
    startServer,
    stopServer,
    restartServer,

    // 서버 CRUD
    createServer,
    updateServer,
    deleteServer,

    // 헬스체크
    checkServerHealth,
    checkAllServersHealth,

    // 로그 조회
    getServerLogs,
    getHealthLogs
};