const { Pool } = require('pg');
require('dotenv').config();

async function checkUsers() {
    const pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'omen_gateway',
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
    });

    try {
        console.log('👥 사용자 계정 정보 확인...\n');

        const users = await pool.query(`
            SELECT id, phone, role, name, is_active, created_at
            FROM users
            ORDER BY role, phone
        `);

        console.log('📱 등록된 사용자 목록:');
        users.rows.forEach((user, index) => {
            console.log(`${index + 1}. 📱 ${user.phone}`);
            console.log(`   👤 이름: ${user.name || '설정되지 않음'}`);
            console.log(`   🎭 역할: ${user.role}`);
            console.log(`   ✅ 활성: ${user.is_active ? '활성' : '비활성'}`);
            console.log(`   📅 생성일: ${user.created_at}`);
            console.log('');
        });

        // 특정 계정 확인
        console.log('🔍 로그인 시도 계정(01034424668) 확인:');
        const targetUser = await pool.query(`
            SELECT * FROM users WHERE phone = $1
        `, ['01034424668']);

        if (targetUser.rows.length > 0) {
            console.log('✅ 계정 발견:');
            console.log(`   📱 전화번호: ${targetUser.rows[0].phone}`);
            console.log(`   🎭 역할: ${targetUser.rows[0].role}`);
            console.log(`   ✅ 활성: ${targetUser.rows[0].is_active ? '활성' : '비활성'}`);
            console.log(`   🔐 비밀번호 해시: ${targetUser.rows[0].password_hash?.substring(0, 20)}...`);
        } else {
            console.log('❌ 해당 계정을 찾을 수 없습니다!');
        }

    } catch (err) {
        console.error('❌ 오류:', err.message);
    } finally {
        await pool.end();
    }
}

checkUsers();