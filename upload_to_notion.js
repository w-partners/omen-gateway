const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

async function uploadImageToNotion(filePath, filename) {
  try {
    // Step 1: Create file upload object
    const createResponse = await axios.post('https://api.notion.com/v1/file_uploads', {
      filename: filename,
      content_type: 'image/png'
    }, {
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });

    const fileUploadId = createResponse.data.id;
    console.log('File upload created, ID:', fileUploadId);

    // Step 2: Upload the file content
    const fileBuffer = fs.readFileSync(filePath);
    const formData = new FormData();
    formData.append('file', fileBuffer, filename);

    await axios.post(`https://api.notion.com/v1/file_uploads/${fileUploadId}/send`, formData, {
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        ...formData.getHeaders()
      }
    });
    console.log('File uploaded successfully');

    // Step 3: Check upload status
    const statusResponse = await axios.get(`https://api.notion.com/v1/file_uploads/${fileUploadId}`, {
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28'
      }
    });

    console.log('Upload status:', statusResponse.data.status);
    return fileUploadId;

  } catch (error) {
    console.error('Upload error:', error.response?.data || error.message);
    throw error;
  }
}

async function createWorkLog() {
  try {
    // Upload the annotated image
    const imagePath = path.join(__dirname, 'annotate_screenshot', 'annotated_domain_fixed_2025-09-27T13-39-18.png');
    const imageId = await uploadImageToNotion(imagePath, 'domain_fixed_screenshot.png');

    // Create the work log page
    const response = await axios.post(
      `https://api.notion.com/v1/pages`,
      {
        parent: { database_id: DATABASE_ID },
        properties: {
          '이름': {
            title: [{
              type: 'text',
              text: { content: '🔧 Cloudflare 터널 설정 문제 해결 - platformmakers.org 502 오류 복구' }
            }]
          },
          '날짜': {
            date: { start: '2025-09-27' }
          },
          '카테고리': {
            multi_select: [{ name: 'OMEN SERVER GATEWAY with Cloudflare' }]
          },
          '상태': {
            select: { name: '✅ 완료' }
          },
          '설명': {
            rich_text: [{
              type: 'text',
              text: { content: 'Cloudflare 터널 config.yml 파일 충돌로 인한 502 Bad Gateway 오류를 해결. 글로벌 설정이 프로젝트 설정을 덮어쓰는 문제 발견 및 수정. 향후 재발 방지를 위한 자동시작 설정 개선 포함.' }
            }]
          }
        },
        children: [
          {
            type: 'heading_2',
            heading_2: {
              rich_text: [{ type: 'text', text: { content: '🎯 문제 상황' } }]
            }
          },
          {
            type: 'paragraph',
            paragraph: {
              rich_text: [{
                type: 'text',
                text: { content: '2025년 9월 27일 오후, platformmakers.org 도메인이 갑자기 502 Bad Gateway 오류를 발생시키며 접속이 불가능한 상황이 발생했습니다. OMEN Gateway v2.0 서버는 정상 작동 중이었지만, 외부에서 도메인을 통한 접속이 차단된 상태였습니다.' }
              }]
            }
          },
          {
            type: 'callout',
            callout: {
              icon: { emoji: '🚨' },
              rich_text: [{
                type: 'text',
                text: { content: '발생한 오류: 502 Bad Gateway - Cloudflare 터널이 로컬 서버와 연결되지 않음' }
              }]
            }
          },
          {
            type: 'heading_3',
            heading_3: {
              rich_text: [{ type: 'text', text: { content: '📋 초기 증상' } }]
            }
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: 'https://platformmakers.org 접속 시 502 오류' } }]
            }
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: 'localhost:7777은 정상 작동' } }]
            }
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: 'OMEN Gateway v2.0 서버 프로세스는 활성 상태' } }]
            }
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: 'Cloudflare 대시보드에서 터널은 "Healthy" 상태로 표시' } }]
            }
          },
          {
            type: 'divider',
            divider: {}
          },
          {
            type: 'heading_2',
            heading_2: {
              rich_text: [{ type: 'text', text: { content: '🔍 문제 분석 과정' } }]
            }
          },
          {
            type: 'paragraph',
            paragraph: {
              rich_text: [{
                type: 'text',
                text: { content: '문제의 원인을 찾기 위해 체계적인 디버깅 과정을 진행했습니다.' }
              }]
            }
          },
          {
            type: 'heading_3',
            heading_3: {
              rich_text: [{ type: 'text', text: { content: '1단계: Cloudflare 터널 상태 확인' } }]
            }
          },
          {
            type: 'code',
            code: {
              language: 'bash',
              rich_text: [{
                type: 'text',
                text: { content: 'cloudflared tunnel list\n\n# 결과:\nNAME  ID                                    CREATED\nomen  47d2bfd2-c96f-474e-942f-63578be456a5  2024-09-25' }
              }]
            }
          },
          {
            type: 'paragraph',
            paragraph: {
              rich_text: [{
                type: 'text',
                text: { content: '터널 자체는 존재했지만, 실제 연결 상태를 확인하니 문제가 발견되었습니다.' }
              }]
            }
          },
          {
            type: 'heading_3',
            heading_3: {
              rich_text: [{ type: 'text', text: { content: '2단계: 설정 파일 검토' } }]
            }
          },
          {
            type: 'code',
            code: {
              language: 'yaml',
              rich_text: [{
                type: 'text',
                text: { content: '# 프로젝트 폴더의 config.yml (정상)\ntunnel: omen\ncredentials-file: C:\\Users\\pasia\\.cloudflared\\cert.pem\n\ningress:\n  - hostname: platformmakers.org\n    service: http://localhost:7777\n  - service: http_status:404' }
              }]
            }
          },
          {
            type: 'callout',
            callout: {
              icon: { emoji: '💡' },
              rich_text: [{
                type: 'text',
                text: { content: '중요 발견: Cloudflare 글로벌 설정 파일(~/.cloudflared/config.yml)이 프로젝트 설정을 덮어쓰고 있었음!' }
              }]
            }
          },
          {
            type: 'heading_3',
            heading_3: {
              rich_text: [{ type: 'text', text: { content: '3단계: 충돌하는 설정 발견' } }]
            }
          },
          {
            type: 'code',
            code: {
              language: 'yaml',
              rich_text: [{
                type: 'text',
                text: { content: '# ~/.cloudflared/config.yml (문제의 원인)\ningress:\n  - hostname: platformmakers.org\n    service: http://localhost:7778  # 잘못된 포트!\n  - service: http_status:404' }
              }]
            }
          },
          {
            type: 'paragraph',
            paragraph: {
              rich_text: [{
                type: 'text',
                text: { content: '글로벌 설정 파일에서 platformmakers.org가 7778 포트로 잘못 설정되어 있었습니다. 이로 인해 실제 서버가 실행 중인 7777 포트로 트래픽이 전달되지 않았던 것입니다.' }
              }]
            }
          },
          {
            type: 'divider',
            divider: {}
          },
          {
            type: 'heading_2',
            heading_2: {
              rich_text: [{ type: 'text', text: { content: '✅ 해결 방법' } }]
            }
          },
          {
            type: 'heading_3',
            heading_3: {
              rich_text: [{ type: 'text', text: { content: '즉시 해결책: 올바른 설정 파일 명시' } }]
            }
          },
          {
            type: 'code',
            code: {
              language: 'bash',
              rich_text: [{
                type: 'text',
                text: { content: '# 프로젝트 폴더로 이동\ncd "C:\\Users\\pasia\\projects\\OMEN SERVER GATEWAY with Cloudflare"\n\n# 올바른 config.yml 파일을 명시적으로 지정하여 터널 실행\ncloudflared tunnel --config config.yml run omen' }
              }]
            }
          },
          {
            type: 'paragraph',
            paragraph: {
              rich_text: [{
                type: 'text',
                text: { content: '이 명령어를 실행하자마자 터널이 올바른 설정으로 재시작되었고, platformmakers.org 도메인이 정상적으로 작동하기 시작했습니다.' }
              }]
            }
          },
          {
            type: 'image',
            image: {
              type: 'file_upload',
              file_upload: { id: imageId },
              caption: [{
                type: 'text',
                text: { content: '✅ 문제 해결 후 정상 작동하는 platformmakers.org - 로그인 페이지로 302 리다이렉트 확인' }
              }]
            }
          },
          {
            type: 'heading_3',
            heading_3: {
              rich_text: [{ type: 'text', text: { content: '영구 해결책: 자동시작 설정 수정' } }]
            }
          },
          {
            type: 'paragraph',
            paragraph: {
              rich_text: [{
                type: 'text',
                text: { content: '윈도우 시작프로그램에 등록된 Cloudflare 터널 자동시작 스크립트를 수정하여, 항상 올바른 config.yml 파일을 사용하도록 설정했습니다.' }
              }]
            }
          },
          {
            type: 'code',
            code: {
              language: 'powershell',
              rich_text: [{
                type: 'text',
                text: { content: '@echo off\ncd /d "C:\\Users\\pasia\\projects\\OMEN SERVER GATEWAY with Cloudflare"\nstart "" cloudflared tunnel --config config.yml run omen' }
              }]
            }
          },
          {
            type: 'divider',
            divider: {}
          },
          {
            type: 'heading_2',
            heading_2: {
              rich_text: [{ type: 'text', text: { content: '🛡️ 재발 방지 대책' } }]
            }
          },
          {
            type: 'numbered_list_item',
            numbered_list_item: {
              rich_text: [{
                type: 'text',
                text: { content: '글로벌 설정 파일 정리' },
                annotations: { bold: true }
              },
              { type: 'text', text: { content: ': ~/.cloudflared/config.yml에서 프로젝트별 설정 제거' } }
              ]
            }
          },
          {
            type: 'numbered_list_item',
            numbered_list_item: {
              rich_text: [{
                type: 'text',
                text: { content: '명시적 설정 파일 사용' },
                annotations: { bold: true }
              },
              { type: 'text', text: { content: ': 터널 실행 시 항상 --config 플래그로 프로젝트 설정 파일 지정' } }
              ]
            }
          },
          {
            type: 'numbered_list_item',
            numbered_list_item: {
              rich_text: [{
                type: 'text',
                text: { content: '자동시작 스크립트 개선' },
                annotations: { bold: true }
              },
              { type: 'text', text: { content: ': 윈도우 시작 시 올바른 작업 디렉토리와 설정 파일 사용' } }
              ]
            }
          },
          {
            type: 'numbered_list_item',
            numbered_list_item: {
              rich_text: [{
                type: 'text',
                text: { content: '모니터링 추가' },
                annotations: { bold: true }
              },
              { type: 'text', text: { content: ': OMEN Gateway 관리 페이지에 터널 상태 확인 기능 추가 검토' } }
              ]
            }
          },
          {
            type: 'divider',
            divider: {}
          },
          {
            type: 'heading_2',
            heading_2: {
              rich_text: [{ type: 'text', text: { content: '💡 교훈 및 인사이트' } }]
            }
          },
          {
            type: 'quote',
            quote: {
              rich_text: [{
                type: 'text',
                text: { content: 'Cloudflare 터널 설정 시 글로벌 설정과 프로젝트 설정 간의 우선순위를 명확히 이해하는 것이 중요합니다. 기본적으로 cloudflared는 ~/.cloudflared/config.yml을 먼저 확인하므로, 프로젝트별 설정을 사용하려면 반드시 --config 플래그를 사용해야 합니다.' }
              }]
            }
          },
          {
            type: 'paragraph',
            paragraph: {
              rich_text: [{
                type: 'text',
                text: { content: '이번 문제 해결을 통해 다음과 같은 중요한 교훈을 얻었습니다:' }
              }]
            }
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: '설정 파일의 우선순위 체계를 명확히 이해하고 관리해야 함' } }]
            }
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: '자동화 스크립트 작성 시 명시적인 경로와 파라미터 사용이 필수' } }]
            }
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: '문제 발생 시 로그 파일과 설정 파일을 체계적으로 확인하는 프로세스 확립' } }]
            }
          },
          {
            type: 'heading_3',
            heading_3: {
              rich_text: [{ type: 'text', text: { content: '🔗 참고 자료' } }]
            }
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{
                type: 'text',
                text: { content: 'Cloudflare 터널 공식 문서: ' }
              },
              {
                type: 'text',
                text: {
                  content: 'https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/',
                  link: { url: 'https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/' }
                }
              }]
            }
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{
                type: 'text',
                text: { content: '프로젝트 GitHub 저장소: OMEN SERVER GATEWAY with Cloudflare' }
              }]
            }
          },
          {
            type: 'callout',
            callout: {
              icon: { emoji: '✨' },
              rich_text: [{
                type: 'text',
                text: { content: '최종 상태: 도메인 정상 작동, 자동시작 설정 개선 완료, 재발 방지 대책 수립' }
              }]
            }
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Work log created successfully!');
    console.log('Page URL:', response.data.url);
    return response.data;

  } catch (error) {
    console.error('Error creating work log:', error.response?.data || error.message);
    if (error.response?.data?.message) {
      console.error('Notion API Error:', error.response.data.message);
    }
  }
}

// Execute
createWorkLog();