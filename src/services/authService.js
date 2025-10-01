const bcrypt = require('bcryptjs');
const { query } = require('../db/connection');

/**
 * 사용자 인증 서비스
 * 지침: requireAuth, requireOperator, checkRole 사용 금지
 * 오직 requireRole 패턴만 사용
 */

// 전화번호와 비밀번호로 사용자 인증
const authenticateUser = async (phone, password) => {
  try {
    const result = await query(
      'SELECT id, phone, password_hash, role, name, is_active FROM users WHERE phone = $1 AND is_active = true',
      [phone]
    );

    if (result.rows.length === 0) {
      return null; // 사용자 없음
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return null; // 비밀번호 불일치
    }

    // 비밀번호 해시 제외하고 반환
    const { password_hash, ...userInfo } = user;
    return userInfo;

  } catch (error) {
    console.error('사용자 인증 오류:', error);
    throw error;
  }
};

// ID로 사용자 조회
const getUserById = async (userId) => {
  try {
    const result = await query(
      'SELECT id, phone, role, name, is_active FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    throw error;
  }
};

// 역할 권한 체크
const hasRole = (userRole, allowedRoles) => {
  if (!Array.isArray(allowedRoles)) {
    allowedRoles = [allowedRoles];
  }

  // 역할 계층 정의
  const roleHierarchy = {
    'super_admin': 4,
    'admin': 3,
    'operator': 2,
    'member': 1
  };

  const userLevel = roleHierarchy[userRole] || 0;

  return allowedRoles.some(role => {
    const requiredLevel = roleHierarchy[role] || 0;
    return userLevel >= requiredLevel;
  });
};

// requireRole 미들웨어 (지침 준수)
const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // 세션이 초기화되지 않은 경우 처리
      if (!req.session) {
        return res.status(500).render('error', {
          error: '세션이 초기화되지 않았습니다',
          message: '서버 재시작이 필요합니다',
          user: null
        });
      }

      // 세션에서 사용자 정보 확인
      if (!req.session.user || !req.session.isAuthenticated) {
        return res.redirect('/login?message=login_required');
      }

      const user = req.session.user;

      // 사용자 활성 상태 재확인
      const currentUser = await getUserById(user.id);
      if (!currentUser) {
        req.session.destroy();
        return res.redirect('/login?message=user_not_found');
      }

      // 역할 권한 체크
      if (!hasRole(currentUser.role, allowedRoles)) {
        return res.status(403).render('error', {
          error: '접근 권한이 없습니다',
          message: `이 기능은 ${allowedRoles.join(', ')} 권한이 필요합니다.`,
          user: currentUser
        });
      }

      // 최신 사용자 정보로 세션 업데이트
      req.session.user = currentUser;
      req.user = currentUser;
      next();

    } catch (error) {
      console.error('권한 확인 오류:', error);
      res.status(500).render('error', {
        error: '시스템 오류가 발생했습니다',
        message: error.message,
        user: req.session ? req.session.user : null
      });
    }
  };
};

// 비밀번호 변경
const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    // 현재 비밀번호 확인
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('사용자를 찾을 수 없습니다');
    }

    const isValidCurrentPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValidCurrentPassword) {
      throw new Error('현재 비밀번호가 일치하지 않습니다');
    }

    // 새 비밀번호 해시
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 비밀번호 업데이트
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedNewPassword, userId]
    );

    return true;
  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    throw error;
  }
};

module.exports = {
  authenticateUser,
  getUserById,
  hasRole,
  requireRole,
  changePassword
};