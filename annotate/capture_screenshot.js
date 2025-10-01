const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function captureAndAnnotateScreenshot() {
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
        // OMEN Gateway 페이지 접속
        await page.goto('http://localhost:7777', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // 원본 스크린샷 캡처
        const screenshotPath = path.join(screenshotDir, `omen_gateway_${timestamp}.png`);
        await page.screenshot({
            path: screenshotPath,
            fullPage: true
        });
        console.log(`✅ 스크린샷 캡처 완료: ${screenshotPath}`);

        // DOM 요소 위치 추출
        const elements = await page.evaluate(() => {
            const annotations = [];

            // 헤더 요소
            const header = document.querySelector('h1');
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
            const cards = document.querySelectorAll('.server-card');
            cards.forEach((card, index) => {
                const rect = card.getBoundingClientRect();
                const status = card.querySelector('.status-badge');
                const isRunning = status && status.textContent.includes('실행중');

                annotations.push({
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                    text: isRunning ? '✅ 서버 실행중' : '🚧 서버 대기중',
                    color: isRunning ? 'green' : 'yellow'
                });
            });

            // 제어 버튼들
            const controlButtons = document.querySelectorAll('.btn-primary, .btn-success');
            controlButtons.forEach((btn) => {
                const rect = btn.getBoundingClientRect();
                annotations.push({
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                    text: '⭐ 제어 버튼',
                    color: 'blue'
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
                         elem.color === 'blue' ? '#0080ff' : '#ff0000';

            // 박스 그리기
            svgOverlay += `
                <rect x="${elem.x}" y="${elem.y}"
                      width="${elem.width}" height="${elem.height}"
                      fill="none" stroke="${color}" stroke-width="3" opacity="0.8"/>
                <rect x="${elem.x}" y="${elem.y - 25}"
                      width="${Math.min(200, elem.width)}" height="25"
                      fill="${color}" opacity="0.8"/>
                <text x="${elem.x + 5}" y="${elem.y - 5}"
                      fill="white" font-size="14" font-weight="bold">
                    ${elem.text}
                </text>
            `;
        });

        svgOverlay += '</svg>';

        // 주석된 이미지 저장
        const annotatedPath = path.join(annotatedDir, `annotated_omen_gateway_${timestamp}.png`);
        await image
            .composite([{
                input: Buffer.from(svgOverlay),
                top: 0,
                left: 0
            }])
            .toFile(annotatedPath);

        console.log(`✅ 주석 추가 완료: ${annotatedPath}`);

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
captureAndAnnotateScreenshot()
    .then(result => {
        console.log('📸 스크린샷 작업 완료:', result);
    })
    .catch(error => {
        console.error('❌ 오류 발생:', error);
    });