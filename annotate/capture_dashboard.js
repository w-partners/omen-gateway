const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function captureAndAnnotateDashboard() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // 타임스탬프 생성
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const screenshotDir = path.join(__dirname, 'screenshot');
    const annotatedDir = path.join(__dirname, 'annotate_screenshot');

    // 디렉토리 생성
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    if (!fs.existsSync(annotatedDir)) fs.mkdirSync(annotatedDir, { recursive: true });

    try {
        // OMEN Gateway 로그인 페이지 접속
        await page.goto('http://localhost:7777', { waitUntil: 'networkidle' });

        // 로그인 수행 (운영자 계정)
        await page.fill('input[name="phone"]', '01000000000');
        await page.fill('input[name="password"]', '01000000000');
        await page.click('button[type="submit"]');

        // 대시보드 로딩 대기
        await page.waitForSelector('.server-card', { timeout: 10000 });
        await page.waitForTimeout(2000);

        // 원본 스크린샷 캡처
        const screenshotPath = path.join(screenshotDir, `dashboard_${timestamp}.png`);
        await page.screenshot({
            path: screenshotPath,
            fullPage: true
        });
        console.log(`✅ 대시보드 스크린샷 캡처 완료: ${screenshotPath}`);

        // DOM 요소 위치 추출
        const elements = await page.evaluate(() => {
            const annotations = [];

            // 헤더 영역
            const header = document.querySelector('.navbar, .header, h1');
            if (header) {
                const rect = header.getBoundingClientRect();
                annotations.push({
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                    text: '✅ OMEN Gateway v2.0 헤더',
                    color: 'green'
                });
            }

            // 서버 상태 카드들
            const serverCards = document.querySelectorAll('.server-card, .card');
            serverCards.forEach((card, index) => {
                const rect = card.getBoundingClientRect();
                const title = card.querySelector('h3, h4, .card-title');
                const status = card.querySelector('.status, .badge, .status-badge');

                let cardText = '🚧 서버 카드';
                let cardColor = 'yellow';

                if (status) {
                    const statusText = status.textContent.toLowerCase();
                    if (statusText.includes('실행중') || statusText.includes('running')) {
                        cardText = '✅ 서버 실행중';
                        cardColor = 'green';
                    } else if (statusText.includes('중지') || statusText.includes('stopped')) {
                        cardText = '❌ 서버 중지됨';
                        cardColor = 'red';
                    }
                }

                if (title) {
                    cardText += ` - ${title.textContent.trim()}`;
                }

                annotations.push({
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                    text: cardText,
                    color: cardColor
                });
            });

            // 제어 버튼들
            const buttons = document.querySelectorAll('button, .btn');
            buttons.forEach((btn) => {
                const rect = btn.getBoundingClientRect();
                const btnText = btn.textContent.trim();

                if (btnText.includes('시작') || btnText.includes('Start')) {
                    annotations.push({
                        x: rect.left,
                        y: rect.top,
                        width: rect.width,
                        height: rect.height,
                        text: '⭐ 시작 버튼',
                        color: 'blue'
                    });
                } else if (btnText.includes('중지') || btnText.includes('Stop')) {
                    annotations.push({
                        x: rect.left,
                        y: rect.top,
                        width: rect.width,
                        height: rect.height,
                        text: '⭐ 중지 버튼',
                        color: 'blue'
                    });
                } else if (btnText.includes('추가') || btnText.includes('Add')) {
                    annotations.push({
                        x: rect.left,
                        y: rect.top,
                        width: rect.width,
                        height: rect.height,
                        text: '⭐ 추가 버튼',
                        color: 'blue'
                    });
                }
            });

            // 네비게이션 메뉴
            const navItems = document.querySelectorAll('.nav-link, .menu-item');
            navItems.forEach((item) => {
                const rect = item.getBoundingClientRect();
                annotations.push({
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                    text: '✅ 메뉴 항목',
                    color: 'green'
                });
            });

            return annotations;
        });

        // Sharp를 사용한 주석 추가
        const image = sharp(screenshotPath);
        const metadata = await image.metadata();

        // SVG 오버레이 생성
        let svgOverlay = `<svg width="${metadata.width}" height="${metadata.height}">`;

        elements.forEach(elem => {
            const color = elem.color === 'green' ? '#00ff00' :
                         elem.color === 'yellow' ? '#ffff00' :
                         elem.color === 'blue' ? '#0080ff' :
                         elem.color === 'red' ? '#ff0000' : '#888888';

            // 박스와 라벨 그리기
            svgOverlay += `
                <rect x="${elem.x}" y="${elem.y}"
                      width="${elem.width}" height="${elem.height}"
                      fill="none" stroke="${color}" stroke-width="3" opacity="0.8"/>
                <rect x="${elem.x}" y="${elem.y - 30}"
                      width="${Math.min(250, elem.width)}" height="28"
                      fill="${color}" opacity="0.9"/>
                <text x="${elem.x + 5}" y="${elem.y - 8}"
                      fill="white" font-size="14" font-weight="bold">
                    ${elem.text}
                </text>
            `;
        });

        svgOverlay += '</svg>';

        // 주석된 이미지 저장
        const annotatedPath = path.join(annotatedDir, `annotated_dashboard_${timestamp}.png`);
        await image
            .composite([{
                input: Buffer.from(svgOverlay),
                top: 0,
                left: 0
            }])
            .toFile(annotatedPath);

        console.log(`✅ 대시보드 주석 추가 완료: ${annotatedPath}`);

        return {
            original: screenshotPath,
            annotated: annotatedPath,
            timestamp: timestamp
        };

    } finally {
        await browser.close();
    }
}

// 실행
captureAndAnnotateDashboard()
    .then(result => {
        console.log('📸 대시보드 스크린샷 작업 완료:', result);
    })
    .catch(error => {
        console.error('❌ 오류 발생:', error);
    });