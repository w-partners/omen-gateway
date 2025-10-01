const { query } = require('../db/connection');
const { exec } = require('child_process');
const si = require('systeminformation');

/**
 * 시스템 관리 서비스
 * 지침: 하드코딩 절대 금지, 모든 설정은 DB에서 조회
 */

// 시스템 설정 조회
const getSystemSetting = async (key) => {
  try {
    const result = await query(
      'SELECT value FROM system_settings WHERE key = $1',
      [key]
    );
    return result.rows.length > 0 ? result.rows[0].value : null;
  } catch (error) {
    console.error('시스템 설정 조회 오류:', error);
    throw error;
  }
};

// 여러 시스템 설정 조회
const getSystemSettings = async (keys) => {
  try {
    const result = await query(
      'SELECT key, value FROM system_settings WHERE key = ANY($1)',
      [keys]
    );

    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });

    return settings;
  } catch (error) {
    console.error('시스템 설정 조회 오류:', error);
    throw error;
  }
};

// 시스템 설정 업데이트
const updateSystemSetting = async (key, value, description = null) => {
  try {
    const updateQuery = description
      ? 'UPDATE system_settings SET value = $2, description = $3, updated_at = CURRENT_TIMESTAMP WHERE key = $1'
      : 'UPDATE system_settings SET value = $2, updated_at = CURRENT_TIMESTAMP WHERE key = $1';

    const params = description ? [key, value, description] : [key, value];

    const result = await query(updateQuery, params);
    return result.rowCount > 0;
  } catch (error) {
    console.error('시스템 설정 업데이트 오류:', error);
    throw error;
  }
};

// 시스템 정보 수집
const getSystemInfo = async () => {
  try {
    const [cpu, mem, disk, network] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.networkInterfaces()
    ]);

    return {
      cpu: Math.round(cpu.currentLoad),
      memory: Math.round((mem.used / mem.total) * 100),
      disk: disk[0] ? Math.round((disk[0].used / disk[0].size) * 100) : 0,
      network: network.filter(iface => !iface.internal),
      timestamp: new Date()
    };
  } catch (error) {
    console.error('시스템 정보 수집 오류:', error);
    throw error;
  }
};

// Cloudflare Tunnel 시작
const startCloudflareeTunnel = async (userId) => {
  try {
    const configPath = await getSystemSetting('cloudflare_config_path');
    const tunnelName = await getSystemSetting('tunnel_name');

    if (!configPath || !tunnelName) {
      throw new Error('Cloudflare 설정이 없습니다');
    }

    const fullConfigPath = require('path').join(__dirname, '..', '..', configPath);

    return new Promise((resolve, reject) => {
      exec(`start /B cloudflared tunnel run --config "${fullConfigPath}"`, (error) => {
        if (error) {
          console.error('Cloudflare Tunnel 시작 오류:', error);
          reject(new Error(`Tunnel 시작 실패: ${error.message}`));
        } else {
          console.log('Cloudflare Tunnel 시작됨');
          resolve({ success: true, message: 'Cloudflare Tunnel 시작됨' });
        }
      });
    });
  } catch (error) {
    console.error('Cloudflare Tunnel 시작 오류:', error);
    throw error;
  }
};

// PostgreSQL 서비스 시작
const startPostgreSQL = async (userId) => {
  try {
    const serviceName = await getSystemSetting('postgresql_service_name');

    if (!serviceName) {
      throw new Error('PostgreSQL 서비스 이름이 설정되지 않았습니다');
    }

    return new Promise((resolve, reject) => {
      exec(`net start ${serviceName}`, (error, stdout) => {
        if (error) {
          if (stdout && stdout.includes('already been started')) {
            resolve({ success: true, message: 'PostgreSQL 이미 실행 중' });
          } else {
            reject(new Error(`PostgreSQL 시작 실패: ${error.message}`));
          }
        } else {
          resolve({ success: true, message: 'PostgreSQL 시작됨' });
        }
      });
    });
  } catch (error) {
    console.error('PostgreSQL 시작 오류:', error);
    throw error;
  }
};

// 포트 상태 확인
const checkPortStatus = async (ports) => {
  try {
    const portStatus = {};

    for (const port of ports) {
      await new Promise((resolve) => {
        exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
          portStatus[port] = !error && stdout.trim() !== '';
          resolve();
        });
      });
    }

    return portStatus;
  } catch (error) {
    console.error('포트 상태 확인 오류:', error);
    throw error;
  }
};

// 프로세스 정보 조회
const getProcessInfo = async (processName) => {
  try {
    return new Promise((resolve) => {
      exec(`tasklist /FI "IMAGENAME eq ${processName}.exe" /FO CSV`, (error, stdout) => {
        if (error || !stdout) {
          resolve([]);
          return;
        }

        const lines = stdout.trim().split('\n');
        const processes = [];

        if (lines.length > 1) { // 헤더 제외
          for (let i = 1; i < lines.length; i++) {
            const fields = lines[i].split('","');
            if (fields.length >= 5) {
              processes.push({
                name: fields[0].replace(/"/g, ''),
                pid: fields[1].replace(/"/g, ''),
                sessionName: fields[2].replace(/"/g, ''),
                sessionNumber: fields[3].replace(/"/g, ''),
                memUsage: fields[4].replace(/"/g, '')
              });
            }
          }
        }

        resolve(processes);
      });
    });
  } catch (error) {
    console.error('프로세스 정보 조회 오류:', error);
    throw error;
  }
};

// 디스크 공간 정리
const cleanupDiskSpace = async () => {
  try {
    // 임시 파일 정리
    return new Promise((resolve, reject) => {
      exec('cleanmgr /sagerun:1', (error) => {
        if (error) {
          reject(new Error(`디스크 정리 실패: ${error.message}`));
        } else {
          resolve({ success: true, message: '디스크 정리 완료' });
        }
      });
    });
  } catch (error) {
    console.error('디스크 정리 오류:', error);
    throw error;
  }
};

module.exports = {
  getSystemSetting,
  getSystemSettings,
  updateSystemSetting,
  getSystemInfo,
  startCloudflareeTunnel,
  startPostgreSQL,
  checkPortStatus,
  getProcessInfo,
  cleanupDiskSpace
};