const { execSync, exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

/**
 * 포트 관리 서비스 v2.0
 * 포트 충돌 검사, 프로세스 관리, 안전한 서버 시작/중지
 */

// 시스템에서 사용하는 포트 정의
const SYSTEM_PORTS = {
    OMEN_GATEWAY: 7777,
    LEARNING_ASSISTANT: 8080,
    GOLF_COURSE: 9090,
    ADMIN_PANEL: 3000
};

/**
 * 특정 포트가 사용 중인지 확인
 * @param {number} port - 확인할 포트 번호
 * @returns {Promise<Object>} 포트 사용 정보
 */
async function checkPortUsage(port) {
    try {
        const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
        const lines = stdout.trim().split('\n').filter(line => line.trim());

        const processes = lines.map(line => {
            const parts = line.trim().split(/\s+/);
            const localAddress = parts[1];
            const state = parts[3];
            const pid = parts[4];

            return {
                localAddress,
                state,
                pid: parseInt(pid),
                port
            };
        });

        return {
            port,
            isUsed: processes.length > 0,
            processes
        };
    } catch (error) {
        return {
            port,
            isUsed: false,
            processes: []
        };
    }
}

/**
 * 모든 시스템 포트 상태 확인
 * @returns {Promise<Object>} 전체 포트 상태
 */
async function checkAllPortsStatus() {
    const portChecks = await Promise.all(
        Object.values(SYSTEM_PORTS).map(port => checkPortUsage(port))
    );

    const portStatus = {};
    Object.keys(SYSTEM_PORTS).forEach((serviceName, index) => {
        portStatus[serviceName] = portChecks[index];
    });

    return {
        timestamp: new Date().toISOString(),
        ports: portStatus,
        summary: {
            total: Object.keys(SYSTEM_PORTS).length,
            used: portChecks.filter(p => p.isUsed).length,
            available: portChecks.filter(p => !p.isUsed).length
        }
    };
}

/**
 * 특정 프로세스 ID로 프로세스 종료
 * @param {number} pid - 프로세스 ID
 * @returns {Promise<boolean>} 성공 여부
 */
async function killProcessByPid(pid) {
    try {
        execSync(`taskkill /f /pid ${pid}`, { stdio: 'ignore' });
        return true;
    } catch (error) {
        console.error(`프로세스 ${pid} 종료 실패:`, error.message);
        return false;
    }
}

/**
 * 특정 포트의 모든 프로세스 종료
 * @param {number} port - 포트 번호
 * @returns {Promise<Object>} 종료 결과
 */
async function killPortProcesses(port) {
    try {
        const portInfo = await checkPortUsage(port);

        if (!portInfo.isUsed) {
            return {
                success: true,
                message: `포트 ${port}는 사용 중이지 않습니다.`,
                killedProcesses: []
            };
        }

        const killedProcesses = [];
        for (const process of portInfo.processes) {
            const killed = await killProcessByPid(process.pid);
            killedProcesses.push({
                pid: process.pid,
                success: killed
            });
        }

        return {
            success: true,
            message: `포트 ${port}의 ${killedProcesses.length}개 프로세스 종료 시도`,
            killedProcesses
        };
    } catch (error) {
        return {
            success: false,
            message: `포트 ${port} 프로세스 종료 실패: ${error.message}`,
            killedProcesses: []
        };
    }
}

/**
 * EnterpriseDB HTTP 서버 종료
 * @returns {Promise<Object>} 종료 결과
 */
async function killEnterpriseDB() {
    try {
        // httpd.exe 프로세스 찾기
        const { stdout } = await execAsync('tasklist /fi "imagename eq httpd.exe" /fo csv');
        const lines = stdout.trim().split('\n');

        if (lines.length <= 1) {
            return {
                success: true,
                message: 'EnterpriseDB HTTP 서버가 실행 중이지 않습니다.',
                killedProcesses: []
            };
        }

        // httpd.exe 프로세스 모두 종료
        execSync('taskkill /f /im httpd.exe', { stdio: 'ignore' });

        return {
            success: true,
            message: 'EnterpriseDB HTTP 서버를 성공적으로 종료했습니다.',
            killedProcesses: ['httpd.exe']
        };
    } catch (error) {
        return {
            success: false,
            message: `EnterpriseDB 종료 실패: ${error.message}`,
            killedProcesses: []
        };
    }
}

/**
 * 중복 Node.js 프로세스 정리
 * @returns {Promise<Object>} 정리 결과
 */
async function cleanupNodeProcesses() {
    try {
        // 현재 실행 중인 Node.js 프로세스 수 확인
        const { stdout } = await execAsync('tasklist /fi "imagename eq node.exe" /fo csv');
        const lines = stdout.trim().split('\n');
        const nodeProcessCount = lines.length - 1; // 헤더 제외

        if (nodeProcessCount <= 1) {
            return {
                success: true,
                message: '중복 Node.js 프로세스가 없습니다.',
                processCount: nodeProcessCount
            };
        }

        // 모든 Node.js 프로세스 종료
        execSync('taskkill /f /im node.exe', { stdio: 'ignore' });

        // 잠깐 대기
        await new Promise(resolve => setTimeout(resolve, 2000));

        return {
            success: true,
            message: `${nodeProcessCount}개의 Node.js 프로세스를 정리했습니다.`,
            processCount: nodeProcessCount
        };
    } catch (error) {
        return {
            success: false,
            message: `Node.js 프로세스 정리 실패: ${error.message}`,
            processCount: 0
        };
    }
}

/**
 * 안전한 서버 재시작 수행
 * @returns {Promise<Object>} 재시작 결과
 */
async function performSafeRestart() {
    const results = {
        portCleaning: null,
        enterpriseDB: null,
        nodeCleanup: null,
        finalPortCheck: null
    };

    try {
        // 1. EnterpriseDB 종료
        results.enterpriseDB = await killEnterpriseDB();

        // 2. Node.js 프로세스 정리
        results.nodeCleanup = await cleanupNodeProcesses();

        // 3. 포트 8080 정리
        results.portCleaning = await killPortProcesses(SYSTEM_PORTS.LEARNING_ASSISTANT);

        // 4. 최종 포트 상태 확인
        results.finalPortCheck = await checkAllPortsStatus();

        return {
            success: true,
            message: '안전한 재시작 프로세스가 완료되었습니다.',
            details: results
        };
    } catch (error) {
        return {
            success: false,
            message: `안전한 재시작 실패: ${error.message}`,
            details: results
        };
    }
}

/**
 * 시스템 프로세스 상태 조회
 * @returns {Promise<Object>} 프로세스 정보
 */
async function getSystemProcessInfo() {
    try {
        // Node.js 프로세스 정보
        const { stdout: nodeInfo } = await execAsync('tasklist /fi "imagename eq node.exe" /fo csv');
        const nodeLines = nodeInfo.trim().split('\n');

        // httpd.exe 프로세스 정보
        const { stdout: httpdInfo } = await execAsync('tasklist /fi "imagename eq httpd.exe" /fo csv');
        const httpdLines = httpdInfo.trim().split('\n');

        return {
            timestamp: new Date().toISOString(),
            nodeJs: {
                count: Math.max(0, nodeLines.length - 1),
                processes: nodeLines.slice(1).map(line => {
                    const parts = line.split(',');
                    return {
                        name: parts[0]?.replace(/"/g, ''),
                        pid: parts[1]?.replace(/"/g, ''),
                        memory: parts[4]?.replace(/"/g, '')
                    };
                })
            },
            enterpriseDB: {
                count: Math.max(0, httpdLines.length - 1),
                processes: httpdLines.slice(1).map(line => {
                    const parts = line.split(',');
                    return {
                        name: parts[0]?.replace(/"/g, ''),
                        pid: parts[1]?.replace(/"/g, ''),
                        memory: parts[4]?.replace(/"/g, '')
                    };
                })
            }
        };
    } catch (error) {
        return {
            timestamp: new Date().toISOString(),
            nodeJs: { count: 0, processes: [] },
            enterpriseDB: { count: 0, processes: [] },
            error: error.message
        };
    }
}

module.exports = {
    SYSTEM_PORTS,
    checkPortUsage,
    checkAllPortsStatus,
    killProcessByPid,
    killPortProcesses,
    killEnterpriseDB,
    cleanupNodeProcesses,
    performSafeRestart,
    getSystemProcessInfo
};