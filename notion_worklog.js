const { Client } = require('@notionhq/client');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Notion API 설정
const notion = new Client({
    auth: process.env.NOTION_API_KEY
});

// Extract from URL: https://www.notion.so/w-partners/OMEN-SERVER-GATEWAY-with-Cloudflare-2796d94c60b880faa632c41ec45723be
const DATABASE_ID = process.env.NOTION_DATABASE_ID; // Akashic Records Database ID

async function uploadImageToNotion(filePath, filename) {
    try {
        console.log(`📤 이미지 업로드 시작: ${filename}`);

        // 1단계: 파일 업로드 객체 생성
        const createResponse = await axios.post('https://api.notion.com/v1/file_uploads', {
            filename: filename,
            content_type: 'image/png'
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            }
        });

        const fileUploadId = createResponse.data.id;
        console.log(`✅ 업로드 ID 생성: ${fileUploadId}`);

        // 2단계: 파일 내용 전송
        const fileBuffer = fs.readFileSync(filePath);
        const formData = new FormData();
        formData.append('file', fileBuffer, filename);

        await axios.post(`https://api.notion.com/v1/file_uploads/${fileUploadId}/send`, formData, {
            headers: {
                'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
                'Notion-Version': '2022-06-28',
                ...formData.getHeaders()
            }
        });

        // 3단계: 업로드 상태 확인
        const statusResponse = await axios.get(`https://api.notion.com/v1/file_uploads/${fileUploadId}`, {
            headers: {
                'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
                'Notion-Version': '2022-06-28'
            }
        });

        console.log(`✅ 이미지 업로드 완료: ${filename}`);
        return {
            fileUploadId: fileUploadId,
            status: statusResponse.data.status
        };
    } catch (error) {
        console.error(`❌ 이미지 업로드 실패:`, error);
        return null;
    }
}

async function createWorkLog() {
    try {
        // 주석된 스크린샷 업로드
        const screenshots = [
            {
                path: 'C:\\Users\\pasia\\projects\\OMEN SERVER GATEWAY with Cloudflare\\annotate\\annotate_screenshot\\annotated_structure_2025-09-27T12-33-08.png',
                filename: 'project_structure_updated.png',
                caption: '✅ 업데이트된 프로젝트 구조 - 3계층 아키텍처 및 QC 시스템 구축 완료'
            }
        ];

        const uploadedImages = [];
        for (const screenshot of screenshots) {
            if (fs.existsSync(screenshot.path)) {
                const result = await uploadImageToNotion(screenshot.path, screenshot.filename);
                if (result && result.status === 'uploaded') {
                    uploadedImages.push({
                        ...screenshot,
                        uploadId: result.fileUploadId
                    });
                }
            }
        }

        // 워크로그 페이지 생성
        const response = await notion.pages.create({
            parent: { database_id: DATABASE_ID },
            properties: {
                '이름': {
                    title: [{
                        type: 'text',
                        text: { content: '🚀 OMEN Gateway v2.0 - 프로젝트 구조 개선 및 지침 업데이트' }
                    }]
                },
                '날짜': {
                    date: { start: new Date().toISOString().split('T')[0] }
                },
                '카테고리': {
                    multi_select: [{ name: 'OMEN SERVER GATEWAY' }]
                },
                '상태': {
                    select: { name: '✅ 완료' }
                },
                '설명': {
                    rich_text: [{
                        type: 'text',
                        text: { content: '업데이트된 지침에 따른 프로젝트 구조 개선, 3계층 아키텍처 구현, QC 시스템 구축, 세션 연속성을 위한 checkpoint 시스템 도입' }
                    }]
                }
            },
            children: [
                // 제목 섹션
                {
                    object: 'block',
                    type: 'heading_1',
                    heading_1: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '🎯 OMEN Gateway v2.0 - 프로젝트 구조 개선 작업' }
                        }]
                    }
                },

                // 작업 개요
                {
                    object: 'block',
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '📋 작업 개요' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '사용자의 업데이트된 지침에 따라 OMEN SERVER GATEWAY with Cloudflare 프로젝트의 전체적인 구조를 개선하고, 체계적인 문서화 시스템을 구축했습니다. 이번 작업은 프로젝트의 유지보수성, 확장성, 세션 연속성을 크게 향상시키는 것을 목표로 진행되었습니다.' }
                        }]
                    }
                },

                // 주요 성과 콜아웃
                {
                    object: 'block',
                    type: 'callout',
                    callout: {
                        icon: { emoji: '✅' },
                        rich_text: [{
                            type: 'text',
                            text: { content: '모든 핵심 기능이 정상 작동 중이며, 새로운 구조 개선으로 인해 향후 개발이 더욱 체계적으로 진행될 수 있는 기반이 마련되었습니다.' }
                        }]
                    }
                },

                // 구현 상세
                {
                    object: 'block',
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '🛠️ 구현 상세' }
                        }]
                    }
                },

                // 3계층 아키텍처 구현
                {
                    object: 'block',
                    type: 'heading_3',
                    heading_3: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '1. 3계층 격리 아키텍처 구현' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: 'Views → Server → Database 단방향 의존성 구조 확립' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: 'src/entities, src/server, src/views 계층별 폴더 구조 생성' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '각 계층별 전용 CLAUDE.md 파일로 세부 규칙 문서화' }
                        }]
                    }
                },

                // QC 시스템 구축
                {
                    object: 'block',
                    type: 'heading_3',
                    heading_3: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '2. 품질 관리(QC) 시스템 구축' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: 'CL_QC.md: QC 진행 방법 및 세부 지시사항' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: 'CL_QC_FEEDBACK.md: 반복 발생 문제 기록 및 예방' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: 'CL_QC_HISTORY.md: 문제 원인 및 해결방안 기록' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: 'CL_QC_issue_list.md: 세션 연속성을 위한 이슈 추적' }
                        }]
                    }
                },

                // 세션 연속성 시스템
                {
                    object: 'block',
                    type: 'heading_3',
                    heading_3: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '3. 세션 연속성 시스템 구현' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '{기능}_checkpoint.md 시스템으로 작업 이력 관리' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '계층별, 기능별 checkpoint 파일 배치' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '1000줄 이하 유지로 효율적인 관리' }
                        }]
                    }
                },

                // 스크린샷 이미지
                ...(uploadedImages.length > 0 ? uploadedImages.map(img => ({
                    object: 'block',
                    type: 'image',
                    image: {
                        type: 'file_upload',
                        file_upload: { id: img.uploadId },
                        caption: [{
                            type: 'text',
                            text: { content: img.caption }
                        }]
                    }
                })) : []),

                // 핵심 개선 사항
                {
                    object: 'block',
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '⚡ 핵심 개선 사항' }
                        }]
                    }
                },

                // 코드 예제 - requireRole 패턴
                {
                    object: 'block',
                    type: 'heading_3',
                    heading_3: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '💻 requireRole 패턴 표준화' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'code',
                    code: {
                        language: 'javascript',
                        rich_text: [{
                            type: 'text',
                            text: { content: "// ✅ 올바른 사용법\nrouter.post('/admin/action', requireRole('operator', 'admin', 'super_admin'), async (req, res) => {\n    // 권한이 있는 사용자만 접근 가능\n});\n\n// ❌ 사용 금지 (정의되지 않은 미들웨어)\n// router.use(requireAuth); // 금지\n// router.use(requireOperator); // 금지\n// router.use(checkRole); // 금지" }
                        }]
                    }
                },

                // Include 패턴
                {
                    object: 'block',
                    type: 'heading_3',
                    heading_3: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '📝 EJS Include 패턴 강제' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'code',
                    code: {
                        language: 'html',
                        rich_text: [{
                            type: 'text',
                            text: { content: "<!-- ✅ Include 패턴 (올바른 방법) -->\n<%- include('partials/header', { title: title }) %>\n<div class=\"content\">\n    <!-- 페이지 콘텐츠 -->\n</div>\n<%- include('partials/footer') %>\n\n<!-- ❌ Layout 패턴 (절대 금지) -->\n<!-- <%- body %> 변수 사용 금지 -->" }
                        }]
                    }
                },

                // 기술적 성과
                {
                    object: 'block',
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '📊 기술적 성과' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '✅ PostgreSQL 기반 실제 데이터 처리 (Mock 데이터 완전 제거)' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '✅ BEM 네이밍 컨벤션 및 문자열 연결 방식 표준화' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '✅ UTF-8 인코딩 강제 규칙 적용' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '✅ 포트 7777에서 OMEN Gateway v2.0 정상 작동' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '✅ https://platformmakers.org 외부 접속 정상 작동' }
                        }]
                    }
                },

                // 학습 및 인사이트
                {
                    object: 'block',
                    type: 'quote',
                    quote: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '💡 체계적인 문서화와 구조화된 아키텍처는 프로젝트의 장기적인 성공을 위한 필수 요소입니다. 이번 구조 개선으로 향후 기능 추가와 유지보수가 훨씬 효율적으로 진행될 수 있는 기반이 마련되었습니다.' }
                        }]
                    }
                },

                // 다음 단계
                {
                    object: 'block',
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '🎯 다음 단계' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'numbered_list_item',
                    numbered_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '신규 기능 개발 시 3계층 아키텍처 원칙 준수' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'numbered_list_item',
                    numbered_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: 'QC 시스템을 활용한 지속적인 품질 관리' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'numbered_list_item',
                    numbered_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: 'checkpoint 시스템으로 세션 연속성 유지' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'numbered_list_item',
                    numbered_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: 'BUSINESS_DOMAIN.md 기반 비즈니스 요구사항 구현' }
                        }]
                    }
                },

                // 구분선
                {
                    object: 'block',
                    type: 'divider',
                    divider: {}
                },

                // 프로젝트 정보
                {
                    object: 'block',
                    type: 'heading_3',
                    heading_3: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '📌 프로젝트 정보' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '프로젝트명: OMEN SERVER GATEWAY with Cloudflare' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '메인 포트: 7777 (OMEN Gateway v2.0)' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '외부 접속: https://platformmakers.org' }
                        }]
                    }
                },
                {
                    object: 'block',
                    type: 'bulleted_list_item',
                    bulleted_list_item: {
                        rich_text: [{
                            type: 'text',
                            text: { content: '작업 일시: 2025-09-27' }
                        }]
                    }
                }
            ]
        });

        console.log('✅ 노션 워크로그 생성 완료!');
        console.log(`📝 페이지 URL: https://www.notion.so/${response.id.replace(/-/g, '')}`);
        return response;

    } catch (error) {
        console.error('❌ 워크로그 생성 실패:', error);
        throw error;
    }
}

// 실행
createWorkLog()
    .then(() => {
        console.log('🎉 모든 작업 완료!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ 오류 발생:', error);
        process.exit(1);
    });