const { query } = require('../db/connection');
const { exec } = require('child_process');
const psList = require('ps-list');
const net = require('net');

/**
 * 서버 관리 서비스
 * 지침: 하드코딩 절대 금지, 모든 설정은 DB에서 조회
 */

// 모든 서버 설정 조회
const getAllServerConfigs = async () => {
  try {
    const result = await query(
      'SELECT server_id, name, port, path, command, domain, is_enabled, description FROM server_configs ORDER BY server_id'
    );
    return result.rows;
  } catch (error) {
    console.error('서버 설정 조회 오류:', error);
    throw error;
  }
};

// 특정 서버 설정 조회
const getServerConfig = async (serverId) => {
  try {
    const result = await query(
      'SELECT server_id, name, port, path, command, domain, is_enabled, description FROM server_configs WHERE server_id = $1',
      [serverId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('서버 설정 조회 오류:', error);
    throw error;
  }
};

// 활성화된 서버 설정 조회
const getEnabledServerConfigs = async () => {
  try {
    const result = await query(
      'SELECT server_id, name, port, path, command, domain, is_enabled, description FROM server_configs WHERE is_enabled = true ORDER BY server_id'
    );
    return result.rows;
  } catch (error) {
    console.error('활성 서버 설정 조회 오류:', error);
    throw error;
  }
};

// 포트가 사용 중인지 확인하는 헬퍼 함수
const checkPortInUse = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // 포트가 사용 중임
        resolve(true);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      // 포트를 사용할 수 있음 (서버가 실행 중이지 않음)
      server.close();
      resolve(false);
    });

    server.listen(port, '127.0.0.1');
  });
};

// 서버 상태 확인 (포트 체크 방식)
const getServerStatus = async () => {
  try {
    const serverConfigs = await getAllServerConfigs();

    // 각 서버의 포트 상태를 확인
    const serverStatusPromises = serverConfigs.map(async (server) => {
      const isRunning = await checkPortInUse(server.port);

      return {
        ...server,
        status: isRunning ? 'running' : 'stopped'
      };
    });

    const serverStatus = await Promise.all(serverStatusPromises);
    return serverStatus;
  } catch (error) {
    console.error('서버 상태 확인 오류:', error);
    throw error;
  }
};

// 서버 시작
const startServer = async (serverId, userId) => {
  try {
    const serverConfig = await getServerConfig(serverId);
    if (!serverConfig) {
      throw new Error('서버 설정을 찾을 수 없습니다');
    }

    if (!serverConfig.is_enabled) {
      throw new Error('비활성화된 서버입니다');
    }

    // 로그 기록 시작
    await query(
      'INSERT INTO server_logs (server_id, action, status, message, executed_by) VALUES ($1, $2, $3, $4, $5)',
      [serverId, 'start', 'pending', '서버 시작 중', userId]
    );

    return new Promise((resolve, reject) => {
      exec(`cd "${serverConfig.path}" && start cmd /k ${serverConfig.command}`, (error) => {
        if (error) {
          // 실패 로그 기록
          query(
            'UPDATE server_logs SET status = $1, message = $2 WHERE server_id = $3 AND action = $4 AND status = $5',
            ['failed', `서버 시작 실패: ${error.message}`, serverId, 'start', 'pending']
          );
          reject(new Error(`서버 시작 실패: ${error.message}`));
        } else {
          // 성공 로그 기록
          query(
            'UPDATE server_logs SET status = $1, message = $2 WHERE server_id = $3 AND action = $4 AND status = $5',
            ['success', `${serverConfig.name} 시작됨`, serverId, 'start', 'pending']
          );
          resolve({ success: true, message: `${serverConfig.name} 시작됨` });
        }
      });
    });

  } catch (error) {
    console.error('서버 시작 오류:', error);
    throw error;
  }
};

// 서버 중지
const stopServer = async (serverId, userId) => {
  try {
    const serverConfig = await getServerConfig(serverId);
    if (!serverConfig) {
      throw new Error('서버 설정을 찾을 수 없습니다');
    }

    // 로그 기록 시작
    await query(
      'INSERT INTO server_logs (server_id, action, status, message, executed_by) VALUES ($1, $2, $3, $4, $5)',
      [serverId, 'stop', 'pending', '서버 중지 중', userId]
    );

    return new Promise((resolve, reject) => {
      exec(`netstat -ano | findstr :${serverConfig.port}`, (error, stdout) => {
        if (error || !stdout) {
          // 실행 중인 서버가 없음
          query(
            'UPDATE server_logs SET status = $1, message = $2 WHERE server_id = $3 AND action = $4 AND status = $5',
            ['failed', '실행 중인 서버를 찾을 수 없습니다', serverId, 'stop', 'pending']
          );
          reject(new Error('실행 중인 서버를 찾을 수 없습니다'));
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

        let killedProcesses = 0;
        const totalProcesses = pids.size;

        if (totalProcesses === 0) {
          query(
            'UPDATE server_logs SET status = $1, message = $2 WHERE server_id = $3 AND action = $4 AND status = $5',
            ['failed', '종료할 프로세스를 찾을 수 없습니다', serverId, 'stop', 'pending']
          );
          reject(new Error('종료할 프로세스를 찾을 수 없습니다'));
          return;
        }

        pids.forEach(pid => {
          exec(`taskkill /F /PID ${pid}`, (err) => {
            killedProcesses++;
            if (err) {
              console.error('프로세스 종료 오류:', err);
            }

            // 모든 프로세스 종료 처리 완료
            if (killedProcesses === totalProcesses) {
              query(
                'UPDATE server_logs SET status = $1, message = $2 WHERE server_id = $3 AND action = $4 AND status = $5',
                ['success', `${serverConfig.name} 중지됨`, serverId, 'stop', 'pending']
              );
              resolve({ success: true, message: `${serverConfig.name} 중지됨` });
            }
          });
        });
      });
    });

  } catch (error) {
    console.error('서버 중지 오류:', error);
    throw error;
  }
};

// 서버 설정 업데이트
const updateServerConfig = async (serverId, updates) => {
  try {
    const allowedFields = ['name', 'port', 'path', 'command', 'domain', 'is_enabled', 'description'];
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('업데이트할 필드가 없습니다');
    }

    values.push(serverId); // WHERE 조건용
    const updateQuery = `UPDATE server_configs SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE server_id = $${paramIndex}`;

    await query(updateQuery, values);
    return true;
  } catch (error) {
    console.error('서버 설정 업데이트 오류:', error);
    throw error;
  }
};

// 서버 로그 조회
const getServerLogs = async (serverId, limit = 50) => {
  try {
    const result = await query(
      'SELECT sl.*, u.name as executed_by_name FROM server_logs sl LEFT JOIN users u ON sl.executed_by = u.id WHERE sl.server_id = $1 ORDER BY sl.executed_at DESC LIMIT $2',
      [serverId, limit]
    );
    return result.rows;
  } catch (error) {
    console.error('서버 로그 조회 오류:', error);
    throw error;
  }
};

module.exports = {
  getAllServerConfigs,
  getServerConfig,
  getEnabledServerConfigs,
  getServerStatus,
  startServer,
  stopServer,
  updateServerConfig,
  getServerLogs
};