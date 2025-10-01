const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function captureProjectStructure() {
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
        // HTML로 프로젝트 구조 시각화
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>OMEN Gateway v2.0 - Project Structure</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px;
                    margin: 0;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 15px;
                    padding: 30px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                }
                h1 {
                    color: #333;
                    text-align: center;
                    border-bottom: 3px solid #667eea;
                    padding-bottom: 15px;
                    margin-bottom: 30px;
                }
                .section {
                    margin: 25px 0;
                    padding: 20px;
                    border-radius: 10px;
                    background: #f8f9fa;
                }
                .section h2 {
                    color: #667eea;
                    margin-top: 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .feature-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
                    margin-top: 15px;
                }
                .feature-card {
                    padding: 15px;
                    background: white;
                    border-radius: 8px;
                    border-left: 4px solid #667eea;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .feature-card.completed {
                    border-left-color: #00c851;
                }
                .feature-card.in-progress {
                    border-left-color: #ffbb33;
                }
                .status {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    margin-left: 10px;
                }
                .status.completed {
                    background: #00c851;
                    color: white;
                }
                .status.in-progress {
                    background: #ffbb33;
                    color: white;
                }
                .folder-structure {
                    font-family: 'Courier New', monospace;
                    background: #2d2d2d;
                    color: #f8f8f2;
                    padding: 20px;
                    border-radius: 8px;
                    overflow-x: auto;
                    line-height: 1.6;
                }
                .folder {
                    color: #66d9ef;
                }
                .file {
                    color: #a6e22e;
                }
                .new {
                    background: #ffeb3b;
                    color: #333;
                    padding: 0 4px;
                    border-radius: 3px;
                    font-size: 11px;
                    margin-left: 5px;
                }
                .tech-stack {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-top: 15px;
                }
                .tech-badge {
                    padding: 8px 15px;
                    background: #667eea;
                    color: white;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 500;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 OMEN SERVER GATEWAY with Cloudflare</h1>

                <div class="section">
                    <h2>📊 프로젝트 현황</h2>
                    <div class="feature-grid">
                        <div class="feature-card completed">
                            <strong>✅ 서버 모니터링</strong>
                            <span class="status completed">완료</span>
                            <p>실시간 서버 상태 확인 및 모니터링</p>
                        </div>
                        <div class="feature-card completed">
                            <strong>✅ 서버 제어</strong>
                            <span class="status completed">완료</span>
                            <p>원클릭 서버 시작/중지 기능</p>
                        </div>
                        <div class="feature-card completed">
                            <strong>✅ 헬스체크</strong>
                            <span class="status completed">완료</span>
                            <p>자동 헬스체크 시스템</p>
                        </div>
                        <div class="feature-card completed">
                            <strong>✅ 도메인 관리</strong>
                            <span class="status completed">완료</span>
                            <p>Cloudflare 터널 연동</p>
                        </div>
                        <div class="feature-card completed">
                            <strong>✅ 자동 시작</strong>
                            <span class="status completed">완료</span>
                            <p>윈도우 시작 시 자동 실행</p>
                        </div>
                        <div class="feature-card completed">
                            <strong>✅ GUI 인터페이스</strong>
                            <span class="status completed">완료</span>
                            <p>웹 기반 관리 인터페이스</p>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>🛠️ 기술 스택</h2>
                    <div class="tech-stack">
                        <span class="tech-badge">Node.js 18 LTS</span>
                        <span class="tech-badge">Express 4</span>
                        <span class="tech-badge">PostgreSQL 15</span>
                        <span class="tech-badge">EJS 3.x</span>
                        <span class="tech-badge">TypeScript 5</span>
                        <span class="tech-badge">Cloudflare Tunnel</span>
                        <span class="tech-badge">SCSS + BEM</span>
                        <span class="tech-badge">Jest + Playwright</span>
                    </div>
                </div>

                <div class="section">
                    <h2>📁 프로젝트 구조 (2025-09-27 업데이트)</h2>
                    <div class="folder-structure">
<span class="folder">📁 OMEN SERVER GATEWAY/</span>
├── <span class="file">📄 CLAUDE.md</span> <span class="new">업데이트</span>
├── <span class="file">📄 MENU_STRUCTURE.md</span> <span class="new">신규</span>
├── <span class="file">📄 BUSINESS_DOMAIN.md</span> <span class="new">신규</span>
├── <span class="file">📄 CL_QC.md</span> <span class="new">신규</span>
├── <span class="file">📄 CL_QC_FEEDBACK.md</span> <span class="new">신규</span>
├── <span class="file">📄 CL_QC_HISTORY.md</span> <span class="new">신규</span>
├── <span class="file">📄 CL_QC_issue_list.md</span> <span class="new">신규</span>
├── <span class="file">📄 CL_WORK_LOG.md</span> <span class="new">신규</span>
├── <span class="file">📄 root_checkpoint.md</span> <span class="new">신규</span>
├── <span class="folder">📁 annotate/</span> <span class="new">신규</span>
│   ├── <span class="folder">📁 annotate_screenshot/</span>
│   └── <span class="folder">📁 screenshot/</span>
├── <span class="folder">📁 QC/</span> <span class="new">신규</span>
│   └── <span class="folder">📁 screenshots/</span>
├── <span class="folder">📁 src/</span>
│   ├── <span class="folder">📁 entities/</span> <span class="new">신규</span>
│   │   └── <span class="file">📄 CLAUDE.md</span>
│   ├── <span class="folder">📁 server/</span> <span class="new">신규</span>
│   │   ├── <span class="file">📄 CLAUDE.md</span>
│   │   ├── <span class="folder">📁 routes/</span>
│   │   ├── <span class="folder">📁 services/</span>
│   │   └── <span class="folder">📁 db/</span>
│   └── <span class="folder">📁 views/</span> <span class="new">신규</span>
│       ├── <span class="file">📄 CLAUDE.md</span>
│       └── <span class="folder">📁 components/</span>
└── <span class="file">📄 server_v2.js</span>
                    </div>
                </div>

                <div class="section">
                    <h2>🎯 핵심 원칙</h2>
                    <div class="feature-grid">
                        <div class="feature-card">
                            <strong>🏗️ 3계층 아키텍처</strong>
                            <p>Views → Server → Database</p>
                        </div>
                        <div class="feature-card">
                            <strong>🚫 Mock 데이터 금지</strong>
                            <p>PostgreSQL 실제 데이터만 사용</p>
                        </div>
                        <div class="feature-card">
                            <strong>📝 Include 패턴</strong>
                            <p>Layout 패턴 절대 금지</p>
                        </div>
                        <div class="feature-card">
                            <strong>🔐 requireRole 패턴</strong>
                            <p>표준화된 권한 관리</p>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        await page.setContent(htmlContent);
        await page.waitForTimeout(1000);

        // 원본 스크린샷 캡처
        const screenshotPath = path.join(screenshotDir, `project_structure_${timestamp}.png`);
        await page.screenshot({
            path: screenshotPath,
            fullPage: true
        });
        console.log(`✅ 프로젝트 구조 스크린샷 캡처 완료: ${screenshotPath}`);

        // 주석 추가를 위한 요소 위치 추출
        const elements = await page.evaluate(() => {
            const annotations = [];

            // 헤더
            const h1 = document.querySelector('h1');
            if (h1) {
                const rect = h1.getBoundingClientRect();
                annotations.push({
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                    text: '✅ 프로젝트 타이틀',
                    color: 'green'
                });
            }

            // 완료된 기능들
            document.querySelectorAll('.feature-card.completed').forEach((card, i) => {
                const rect = card.getBoundingClientRect();
                annotations.push({
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                    text: '✅ 완료된 기능',
                    color: 'green'
                });
            });

            // 기술 스택
            const techSection = document.querySelector('.tech-stack');
            if (techSection) {
                const rect = techSection.getBoundingClientRect();
                annotations.push({
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height,
                    text: '⭐ 기술 스택',
                    color: 'blue'
                });
            }

            // 폴더 구조
            const folderStructure = document.querySelector('.folder-structure');
            if (folderStructure) {
                const rect = folderStructure.getBoundingClientRect();
                annotations.push({
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: Math.min(rect.height, 200),
                    text: '📁 업데이트된 폴더 구조',
                    color: 'yellow'
                });
            }

            return annotations;
        });

        // Sharp로 주석 추가
        const image = sharp(screenshotPath);
        const metadata = await image.metadata();

        let svgOverlay = `<svg width="${metadata.width}" height="${metadata.height}">`;

        elements.forEach(elem => {
            const color = elem.color === 'green' ? '#00c851' :
                         elem.color === 'yellow' ? '#ffbb33' :
                         elem.color === 'blue' ? '#0080ff' : '#ff4444';

            svgOverlay += `
                <rect x="${elem.x}" y="${elem.y}"
                      width="${elem.width}" height="${elem.height}"
                      fill="none" stroke="${color}" stroke-width="2" opacity="0.7"
                      stroke-dasharray="${elem.color === 'yellow' ? '10,5' : '0'}"/>
                <rect x="${elem.x}" y="${elem.y - 28}"
                      width="${Math.min(200, elem.width)}" height="26"
                      fill="${color}" opacity="0.9" rx="3"/>
                <text x="${elem.x + 8}" y="${elem.y - 8}"
                      fill="white" font-size="13" font-weight="bold">
                    ${elem.text}
                </text>
            `;
        });

        svgOverlay += '</svg>';

        // 주석된 이미지 저장
        const annotatedPath = path.join(annotatedDir, `annotated_structure_${timestamp}.png`);
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
captureProjectStructure()
    .then(result => {
        console.log('📸 프로젝트 구조 스크린샷 완료:', result);
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ 오류:', error);
        process.exit(1);
    });