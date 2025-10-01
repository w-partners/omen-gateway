const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

async function testLogin() {
    const pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'omen_gateway',
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
    });

    try {
        console.log('🔐 로그인 테스트 시작...\n');

        const phone = '01034424668';
        const password = '01034424668';

        // 1. 사용자 조회 (실제 서버가 하는 쿼리와 동일)
        console.log('1️⃣ 사용자 조회 중...');
        const userQuery = `
            SELECT id, phone, password_hash, role, name, is_active
            FROM users
            WHERE phone = $1 AND is_active = true
        `;

        console.log(`쿼리: ${userQuery}`);
        console.log(`파라미터: ['${phone}']`);

        const result = await pool.query(userQuery, [phone]);

        console.log(`조회 결과: ${result.rows.length}개 행`);

        if (result.rows.length === 0) {
            console.log('❌ 사용자를 찾을 수 없습니다!');
            return;
        }

        const user = result.rows[0];
        console.log('✅ 사용자 발견:');
        console.log(`   ID: ${user.id}`);
        console.log(`   전화번호: ${user.phone}`);
        console.log(`   역할: ${user.role}`);
        console.log(`   활성: ${user.is_active}`);
        console.log(`   해시: ${user.password_hash.substring(0, 20)}...`);

        // 2. 비밀번호 검증
        console.log('\n2️⃣ 비밀번호 검증 중...');
        console.log(`입력된 비밀번호: '${password}'`);
        console.log(`저장된 해시: '${user.password_hash}'`);

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        console.log(`비밀번호 일치: ${isPasswordValid ? '✅ 성공' : '❌ 실패'}`);

        if (isPasswordValid) {
            console.log('\n🎉 로그인 성공! 세션을 생성해야 합니다.');
        } else {
            console.log('\n❌ 로그인 실패: 비밀번호가 일치하지 않습니다.');
        }

    } catch (err) {
        console.error('❌ 테스트 중 오류:', err.message);
        console.error(err.stack);
    } finally {
        await pool.end();
    }
}

testLogin();