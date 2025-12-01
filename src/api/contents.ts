/**
 * Contents API Routes
 * 콘텐츠 생성 및 관리 API
 * 
 * ★ Gemini 2.0 Flash 올인원 전략 ★
 * - 텍스트 생성: gemini-2.0-flash (빠르고 저렴)
 * - 이미지 생성: gemini-2.0-flash-exp-image-generation (같은 Flash 계열, 비용 효율적)
 * - 한국인/한국배경 자연스러운 아이폰 촬영 스타일
 * - Imagen 4 대비 훨씬 저렴!
 */

import { Hono } from 'hono';
import { WordPressClient } from '../lib/wordpress';
import type { Content, Client } from '../types/database';
import { validateContentGeneration } from '../middleware/security';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// ★ Gemini 2.0 Flash 올인원 설정 ★
const GEMINI_API_KEY = 'AIzaSyApZL4NCnoZZkpS5t7LC7PNSKNeFngBFO0';
const GEMINI_TEXT_MODEL = 'gemini-2.0-flash';
const GEMINI_IMAGE_MODEL = 'gemini-2.0-flash-exp-image-generation';

// 콘텐츠 생성 엔드포인트에 검증 미들웨어 적용
app.use('/generate', validateContentGeneration());

/**
 * Gemini 2.0 Flash를 사용한 콘텐츠 생성
 * ★ 중요: systemPrompt가 있으면 최우선 적용 ★
 */
async function generateContentWithGemini(
  keywords: string[],
  title?: string,
  systemPrompt?: string
): Promise<{ title: string; content: string; excerpt: string }> {
  
  // ★★★ 시스템 프롬프트가 있으면 최우선 적용 ★★★
  let optimizedPrompt: string;
  
  if (systemPrompt && systemPrompt.trim().length > 0) {
    // 업체 맞춤 시스템 프롬프트 최우선 사용 - 기본 프롬프트 완전 대체
    optimizedPrompt = `[최우선 지침 - 반드시 아래 모든 내용을 100% 정확히 준수하세요. 이 지침을 무시하면 안됩니다.]

${systemPrompt}

---
[작성할 콘텐츠 정보]
키워드: ${keywords.join(', ')}
${title ? `제목: "${title}"` : '제목: 위 지침의 제목 규칙에 따라 생성'}

---
[필수 HTML 출력 형식 - 반드시 지켜야 합니다]
1. 각 H2 섹션 시작 직후에 이미지 위치 표시: <p class="image-placeholder">[이미지: 키워드 관련 이미지]</p>
2. 각 H2 섹션 끝에 구분선과 요약 박스:
   <hr/><hr/>
   <div class="summary-box" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
   <p>📝 <strong>요약:</strong> 해당 섹션 핵심 내용 3줄 요약</p>
   </div>
3. 본문 스타일: style="line-height: 3.0; font-size: 16px; font-family: '나눔스퀘어', sans-serif;"
4. 해시태그: <p style="font-size: 11pt;">#해시태그1 #해시태그2 ...</p>
5. 푸터 구조:
   <footer>
   <p>💼 프라임에셋(주) ... (CTA 전체 내용)</p>
   <p>📞 채용 문의: 전화번호</p>
   <p>🌐 링크</p>
   <p>✉️ 이메일</p>
   <hr/>
   <p>푸터링크들</p>
   <p>© 2025. 저작권 표기</p>
   </footer>`;
  } else {
    // 기본 프롬프트 (시스템 프롬프트 없는 경우)
    optimizedPrompt = `키워드: ${keywords.join(', ')}
${title ? `제목: "${title}"` : ''}

네이버 블로그 스타일의 마케팅 글을 작성해주세요:

■ 구조:
- H1: 메인 제목 (2025년, 숫자 포함, 60자 이내)
- H2: 주요 섹션 3-5개 (❶❷❸ 이모지 사용)
- 각 H2 섹션 시작에 이미지 위치 표시
- 각 H2 섹션 끝에 <hr/><hr/> + 📝 요약 박스

■ 스타일:
- 시각 계층: ❶❷❸❹❺, ■, ✔️, <strong>, <em>
- 친근한 톤: ~하신가요?, 대표님, 사장님

■ 필수 요소:
- 본문 1,800~2,000자 (공백 제외)
- FAQ 7-10개
- 해시태그 10개 이상
- CTA 섹션

■ SEO:
- 키워드 밀도 2-3%
- H1-H3 계층 구조`;
  }

  console.log('=== generateContentWithGemini ===');
  console.log('systemPrompt 존재:', !!systemPrompt);
  console.log('systemPrompt 길이:', systemPrompt?.length || 0);
  console.log('최종 프롬프트 길이:', optimizedPrompt.length);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: optimizedPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,  // 토큰 제한 증가 (4000 -> 8192)
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API Error:', response.status, errorText);
    throw new Error(`Gemini API Error: ${response.status}`);
  }

  const data = await response.json();
  let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  if (!generatedText) {
    throw new Error('Gemini API returned empty content');
  }

  // 마크다운 코드 블록 제거 (```html ... ``` 또는 ``` ... ```)
  generatedText = generatedText
    .replace(/^```html\s*\n?/i, '')  // 시작 ```html 제거
    .replace(/^```\s*\n?/m, '')      // 시작 ``` 제거
    .replace(/\n?```\s*$/m, '')      // 끝 ``` 제거
    .trim();

  // 완전한 HTML 문서가 아닌 경우 body 내용만 추출
  if (generatedText.includes('<!DOCTYPE html>')) {
    const bodyMatch = generatedText.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      generatedText = bodyMatch[1].trim();
    }
  }

  // 제목과 본문 추출
  const titleMatch = generatedText.match(/<h1[^>]*>(.*?)<\/h1>/i) || generatedText.match(/^#\s+(.+)$/m);
  const extractedTitle = title || (titleMatch ? titleMatch[1] : keywords[0]);
  
  // 요약 생성 (첫 150자)
  const plainText = generatedText.replace(/<[^>]*>/g, '').substring(0, 150);

  return {
    title: extractedTitle,
    content: generatedText,
    excerpt: plainText + '...',
  };
}

/**
 * Gemini 2.0 Flash Image Generation을 사용한 이미지 생성
 * - 한국인/한국 배경 자연스러운 아이폰 촬영 스타일
 * - AI 느낌 없이 실제 사진처럼 생성
 * - 텍스트/글자 절대 포함 금지
 */
async function generateImageWithGemini(userPrompt: string, keywords: string[]): Promise<string> {
  const enhancedPrompt = `Generate a photorealistic image:

${userPrompt}

CRITICAL STYLE REQUIREMENTS for authentic Korean photo:
- Real Korean person with natural Korean facial features
- Modern Seoul urban setting (trendy cafe, Gangnam street, Hongdae area)
- Candid iPhone 15 Pro photo style - NOT staged or posed
- Natural soft daylight or warm cafe lighting
- Realistic skin with natural texture (no airbrushing/filters)
- Contemporary Korean fashion (modern casual or business casual)
- Authentic unstaged moment, slightly off-center composition
- Real-life depth of field, slight background blur

ABSOLUTE RESTRICTIONS - MUST FOLLOW:
- NO TEXT of any kind (Korean, English, numbers, logos, watermarks)
- NO letters, words, characters, typography, captions, labels
- NO signs, banners, posters with text
- NO brand names, company logos, UI elements
- PURE photography only - zero text elements anywhere in the image

- NO: AI-generated look, plastic skin, western features, stock photo feel`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: enhancedPrompt }] }],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT']
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini Image API Error:', response.status, errorText);
    throw new Error(`Gemini Image API Error: ${response.status}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
  
  if (!imagePart?.inlineData?.data) {
    throw new Error('Gemini Image API returned no image');
  }

  const mimeType = imagePart.inlineData.mimeType || 'image/png';
  return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}

/**
 * 콘텐츠 본문의 이미지 placeholder를 실제 이미지로 교체
 * DB 크기 제한 때문에 base64 대신 content_images 테이블에 별도 저장 후 URL로 참조
 */
async function replaceImagePlaceholders(
  content: string, 
  keywords: string[],
  contentId: number,
  db: D1Database,
  maxImages: number = 5
): Promise<{ content: string; images: string[]; thumbnailUrl: string | null }> {
  // 이미지 placeholder 패턴 찾기
  const placeholderPattern = /<p[^>]*class="image-placeholder"[^>]*>\[이미지:[^\]]+\]<\/p>|\[이미지:[^\]]+\]/gi;
  const matches = content.match(placeholderPattern) || [];
  
  console.log(`발견된 이미지 placeholder: ${matches.length}개`);
  
  // 최대 이미지 수 제한
  const imagesToGenerate = matches.slice(0, maxImages);
  const generatedImages: string[] = [];
  let thumbnailUrl: string | null = null;
  
  let updatedContent = content;
  
  for (let i = 0; i < imagesToGenerate.length; i++) {
    const placeholder = imagesToGenerate[i];
    
    // placeholder에서 이미지 설명 추출
    const descMatch = placeholder.match(/\[이미지:\s*([^\]]+)\]/i);
    const imageDesc = descMatch ? descMatch[1].trim() : `${keywords[0]} 관련 이미지`;
    
    console.log(`이미지 ${i + 1}/${imagesToGenerate.length} 생성 중: ${imageDesc}`);
    
    try {
      // 이미지 생성
      const imagePrompt = `Korean professional photo: ${imageDesc}. 
Style: Modern Seoul office or business setting, warm natural lighting, iPhone photo style.`;
      
      const base64Image = await generateImageWithGemini(imagePrompt, keywords);
      
      // content_images 테이블에 저장
      const imgResult = await db.prepare(`
        INSERT INTO content_images (content_id, image_data, alt_text, position)
        VALUES (?, ?, ?, ?)
      `).bind(contentId, base64Image, imageDesc, i).run();
      
      const imageId = imgResult.meta.last_row_id;
      const imageApiUrl = `/api/contents/${contentId}/images/${imageId}`;
      generatedImages.push(imageApiUrl);
      
      // 첫 번째 이미지를 썸네일로
      if (i === 0) {
        thumbnailUrl = imageApiUrl;
      }
      
      // placeholder를 img 태그로 교체 (API URL 참조)
      const imgTag = `<div class="content-image" style="margin: 20px 0; text-align: center;">
  <img src="${imageApiUrl}" alt="${imageDesc}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" loading="lazy">
  <p style="font-size: 12px; color: #666; margin-top: 8px;">${imageDesc}</p>
</div>`;
      
      updatedContent = updatedContent.replace(placeholder, imgTag);
      console.log(`이미지 ${i + 1} 저장 완료 (ID: ${imageId})`);
      
    } catch (error) {
      console.error(`이미지 ${i + 1} 생성 실패:`, error);
      updatedContent = updatedContent.replace(placeholder, '');
    }
  }
  
  // 남은 placeholder 제거
  updatedContent = updatedContent.replace(placeholderPattern, '');
  
  return { content: updatedContent, images: generatedImages, thumbnailUrl };
}

/**
 * 전체 콘텐츠 목록 조회
 */
app.get('/', async (c) => {
  try {
    const clientId = c.req.query('client_id');
    const status = c.req.query('status');

    let query = 'SELECT * FROM contents WHERE 1=1';
    const params: any[] = [];

    if (clientId) {
      query += ' AND client_id = ?';
      params.push(clientId);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const { results } = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '콘텐츠 조회 실패' 
    }, 500);
  }
});

/**
 * AI 콘텐츠 생성
 */
app.post('/generate', async (c) => {
  try {
    const body = await c.req.json<{
      client_id: number;
      project_id: number;
      keywords: string[];
      title?: string;
      generate_image?: boolean;
      image_prompt?: string;
    }>();

    // 클라이언트 정보 조회
    const client = await c.env.DB.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).bind(body.client_id).first() as Client | null;

    if (!client) {
      return c.json({ success: false, error: '클라이언트를 찾을 수 없습니다' }, 404);
    }

    // Gemini 2.0 Flash로 콘텐츠 생성 (OpenAI 키 불필요)
    // ★ 업체의 system_prompt를 반드시 전달 ★
    const generated = await generateContentWithGemini(
      body.keywords,
      body.title,
      client.system_prompt || undefined  // 업체별 맞춤 프롬프트 적용
    );

    // 1단계: 콘텐츠 먼저 저장 (이미지 없이)
    const result = await c.env.DB.prepare(`
      INSERT INTO contents (
        client_id, title, content, 
        status, image_url, keywords
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      body.client_id,
      generated.title,
      generated.content,  // 원본 콘텐츠 (placeholder 포함)
      'draft',
      null,
      JSON.stringify(body.keywords)
    ).run();

    const contentId = result.meta.last_row_id as number;
    let finalContent = generated.content;
    let thumbnailUrl: string | null = null;
    let totalImages = 0;

    // 2단계: 이미지 생성 옵션이 켜져 있으면 이미지 생성 및 본문 업데이트
    if (body.generate_image) {
      console.log('=== 섹션별 이미지 생성 시작 ===');
      
      try {
        // 본문 내 이미지 placeholder를 실제 이미지로 교체 (최대 5개)
        const imageResult = await replaceImagePlaceholders(
          generated.content,
          body.keywords,
          contentId,
          c.env.DB,
          5  // 최대 5개 이미지 생성
        );
        
        finalContent = imageResult.content;
        thumbnailUrl = imageResult.thumbnailUrl;
        totalImages = imageResult.images.length;
        
        // 3단계: 이미지가 삽입된 콘텐츠로 업데이트
        await c.env.DB.prepare(`
          UPDATE contents 
          SET content = ?, image_url = ?
          WHERE id = ?
        `).bind(finalContent, thumbnailUrl, contentId).run();
        
        console.log(`=== 이미지 생성 완료: 총 ${totalImages}개 ===`);
        
      } catch (imageError) {
        console.error('이미지 생성 중 오류:', imageError);
        // 이미지 생성 실패해도 텍스트 콘텐츠는 유지
      }
    }

    return c.json({ 
      success: true, 
      data: {
        id: contentId,
        title: generated.title,
        content: finalContent,
        excerpt: generated.excerpt,
        imageUrl: thumbnailUrl,
        totalImages: totalImages
      },
      message: totalImages > 0 
        ? `콘텐츠가 생성되었습니다 (이미지 ${totalImages}개 포함)`
        : '콘텐츠가 생성되었습니다'
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '콘텐츠 생성 실패' 
    }, 500);
  }
});

/**
 * 예약 발행 설정
 */
app.post('/:id/schedule', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<{
      scheduled_at: string;  // ISO 8601 형식: 2025-12-01T15:00:00
    }>();

    if (!body.scheduled_at) {
      return c.json({ success: false, error: '예약 시간이 필요합니다' }, 400);
    }

    // 콘텐츠 존재 확인
    const content = await c.env.DB.prepare(
      'SELECT * FROM contents WHERE id = ?'
    ).bind(id).first() as Content | null;

    if (!content) {
      return c.json({ success: false, error: '콘텐츠를 찾을 수 없습니다' }, 404);
    }

    // 예약 시간 검증 (과거 시간 불가)
    const scheduledTime = new Date(body.scheduled_at);
    const now = new Date();
    if (scheduledTime <= now) {
      return c.json({ success: false, error: '예약 시간은 현재 시간 이후여야 합니다' }, 400);
    }

    // 예약 발행 설정
    await c.env.DB.prepare(`
      UPDATE contents 
      SET status = 'scheduled', scheduled_at = ?
      WHERE id = ?
    `).bind(body.scheduled_at, id).run();

    // 활동 로그 기록
    await c.env.DB.prepare(`
      INSERT INTO activity_logs (client_id, action, details, status)
      VALUES (?, ?, ?, ?)
    `).bind(
      content.client_id,
      'content_scheduled',
      `예약 발행 설정: ${content.title} → ${body.scheduled_at}`,
      'success'
    ).run();

    return c.json({ 
      success: true, 
      data: {
        id: parseInt(id),
        scheduled_at: body.scheduled_at,
        status: 'scheduled'
      },
      message: `예약 발행이 설정되었습니다: ${new Date(body.scheduled_at).toLocaleString('ko-KR')}`
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '예약 설정 실패' 
    }, 500);
  }
});

/**
 * 예약 발행 취소
 */
app.delete('/:id/schedule', async (c) => {
  try {
    const id = c.req.param('id');

    // 콘텐츠 조회
    const content = await c.env.DB.prepare(
      'SELECT * FROM contents WHERE id = ?'
    ).bind(id).first() as Content | null;

    if (!content) {
      return c.json({ success: false, error: '콘텐츠를 찾을 수 없습니다' }, 404);
    }

    if (content.status !== 'scheduled') {
      return c.json({ success: false, error: '예약된 콘텐츠가 아닙니다' }, 400);
    }

    // 예약 취소 (draft로 변경)
    await c.env.DB.prepare(`
      UPDATE contents 
      SET status = 'draft', scheduled_at = NULL
      WHERE id = ?
    `).bind(id).run();

    // 활동 로그 기록
    await c.env.DB.prepare(`
      INSERT INTO activity_logs (client_id, action, details, status)
      VALUES (?, ?, ?, ?)
    `).bind(
      content.client_id,
      'schedule_cancelled',
      `예약 발행 취소: ${content.title}`,
      'success'
    ).run();

    return c.json({ 
      success: true, 
      message: '예약이 취소되었습니다'
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '예약 취소 실패' 
    }, 500);
  }
});

/**
 * 예약된 콘텐츠 목록 조회
 */
app.get('/scheduled/list', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT c.*, cl.name as client_name
      FROM contents c
      LEFT JOIN clients cl ON c.client_id = cl.id
      WHERE c.status = 'scheduled'
      ORDER BY c.scheduled_at ASC
    `).all();

    return c.json({ 
      success: true, 
      data: result.results,
      count: result.results.length
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '조회 실패' 
    }, 500);
  }
});

/**
 * 워드프레스에 발행
 */
app.post('/:id/publish', async (c) => {
  try {
    const id = c.req.param('id');
    const simulationMode = c.req.query('simulation') === 'true';

    // 콘텐츠 조회
    const content = await c.env.DB.prepare(
      'SELECT * FROM contents WHERE id = ?'
    ).bind(id).first() as Content | null;

    if (!content) {
      return c.json({ success: false, error: '콘텐츠를 찾을 수 없습니다' }, 404);
    }

    // 클라이언트 정보 조회
    const client = await c.env.DB.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).bind(content.client_id).first() as Client | null;

    if (!client) {
      return c.json({ success: false, error: '클라이언트를 찾을 수 없습니다' }, 404);
    }

    // 시뮬레이션 모드: 개발 환경에서 실제 발행 없이 테스트
    if (simulationMode) {
      // DB만 업데이트 (실제 워드프레스 발행은 건너뛰기)
      await c.env.DB.prepare(`
        UPDATE contents 
        SET status = ?, wordpress_post_id = ?, published_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind('published', 999999, id).run();

      // 활동 로그 기록
      await c.env.DB.prepare(`
        INSERT INTO activity_logs (client_id, action, details, status)
        VALUES (?, ?, ?, ?)
      `).bind(
        content.client_id,
        'content_published',
        `[시뮬레이션] 워드프레스 발행: ${content.title}`,
        'success'
      ).run();

      return c.json({ 
        success: true, 
        data: { 
          wordpress_post_id: 999999,
          simulation: true,
          message: '시뮬레이션 모드: DB만 업데이트됨 (실제 워드프레스 발행 안 됨)'
        },
        message: '콘텐츠가 발행되었습니다 (시뮬레이션)'
      });
    }

    // 실제 워드프레스 발행 (프로덕션 모드)
    // 워드프레스 클라이언트 생성
    const wpClient = new WordPressClient({
      siteUrl: client.wordpress_url,
      username: client.wordpress_username,
      password: client.wordpress_password,
    });

    // 이미지가 있으면 먼저 업로드
    let featuredMediaId: number | undefined;
    if (content.featured_image_url) {
      try {
        const media = await wpClient.uploadMediaFromUrl(
          content.featured_image_url,
          content.title,
          content.title
        );
        featuredMediaId = media.id;
      } catch (error) {
        console.error('Image upload failed:', error);
      }
    }

    // 워드프레스에 글 발행
    const wpPost = await wpClient.createPost({
      title: content.title,
      content: content.content,
      excerpt: content.excerpt,
      status: 'publish',
      featured_media: featuredMediaId,
      categories: content.categories ? JSON.parse(content.categories) : undefined,
      tags: content.tags ? JSON.parse(content.tags) : undefined,
    });

    // DB 업데이트
    await c.env.DB.prepare(`
      UPDATE contents 
      SET status = ?, wordpress_post_id = ?, published_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind('published', wpPost.id, id).run();

    // 활동 로그 기록
    await c.env.DB.prepare(`
      INSERT INTO activity_logs (client_id, action, details, status)
      VALUES (?, ?, ?, ?)
    `).bind(
      content.client_id,
      'content_published',
      `워드프레스 발행: ${content.title}`,
      'success'
    ).run();

    return c.json({ 
      success: true, 
      data: { wordpress_post_id: wpPost.id },
      message: '콘텐츠가 워드프레스에 발행되었습니다'
    });
  } catch (error) {
    // 실패 상태로 업데이트
    const id = c.req.param('id');
    await c.env.DB.prepare(
      'UPDATE contents SET status = ? WHERE id = ?'
    ).bind('failed', id).run();

    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '발행 실패' 
    }, 500);
  }
});

/**
 * 콘텐츠 삭제
 */
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    await c.env.DB.prepare(
      'DELETE FROM contents WHERE id = ?'
    ).bind(id).run();

    return c.json({ 
      success: true, 
      message: '콘텐츠가 삭제되었습니다'
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '콘텐츠 삭제 실패' 
    }, 500);
  }
});

/**
 * 콘텐츠 TXT 다운로드
 * GET /api/contents/:id/download/txt
 */
app.get('/:id/download/txt', async (c) => {
  try {
    const id = c.req.param('id');

    const content = await c.env.DB.prepare(
      'SELECT * FROM contents WHERE id = ?'
    ).bind(id).first() as Content | null;

    if (!content) {
      return c.json({ success: false, error: '콘텐츠를 찾을 수 없습니다' }, 404);
    }

    // HTML 태그 제거하여 순수 텍스트로 변환
    const plainText = content.content
      .replace(/<h1[^>]*>/gi, '\n\n# ')
      .replace(/<h2[^>]*>/gi, '\n\n## ')
      .replace(/<h3[^>]*>/gi, '\n\n### ')
      .replace(/<\/h[1-3]>/gi, '\n')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<\/li>/gi, '')
      .replace(/<p[^>]*>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<strong[^>]*>/gi, '**')
      .replace(/<\/strong>/gi, '**')
      .replace(/<em[^>]*>/gi, '_')
      .replace(/<\/em>/gi, '_')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const txtContent = `제목: ${content.title}
생성일: ${content.created_at}
상태: ${content.status}

---

${plainText}

---
워드프레스 마케팅 자동화 시스템에서 생성됨
`;

    const filename = `${content.title.replace(/[^a-zA-Z0-9가-힣]/g, '_').substring(0, 50)}.txt`;

    return new Response(txtContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'TXT 다운로드 실패' 
    }, 500);
  }
});

/**
 * 콘텐츠 HTML 다운로드
 * GET /api/contents/:id/download/html
 */
app.get('/:id/download/html', async (c) => {
  try {
    const id = c.req.param('id');

    const content = await c.env.DB.prepare(
      'SELECT * FROM contents WHERE id = ?'
    ).bind(id).first() as Content | null;

    if (!content) {
      return c.json({ success: false, error: '콘텐츠를 찾을 수 없습니다' }, 404);
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title}</title>
    <style>
        body { 
            font-family: 'Noto Sans KR', sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            line-height: 1.8;
            color: #333;
        }
        h1 { color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
        h2 { color: #2563eb; margin-top: 30px; }
        h3 { color: #4b5563; }
        p { margin: 15px 0; }
        ul, ol { margin: 15px 0; padding-left: 20px; }
        li { margin: 8px 0; }
        strong { color: #1f2937; }
        .meta { color: #6b7280; font-size: 0.9em; margin-bottom: 20px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 0.8em; }
    </style>
</head>
<body>
    <div class="meta">
        <p>생성일: ${content.created_at}</p>
        <p>상태: ${content.status}</p>
    </div>
    
    ${content.content}
    
    <div class="footer">
        <p>워드프레스 마케팅 자동화 시스템에서 생성됨</p>
    </div>
</body>
</html>`;

    const filename = `${content.title.replace(/[^a-zA-Z0-9가-힣]/g, '_').substring(0, 50)}.html`;

    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'HTML 다운로드 실패' 
    }, 500);
  }
});

/**
 * 콘텐츠 JSON 내보내기
 * GET /api/contents/:id/export
 */
app.get('/:id/export', async (c) => {
  try {
    const id = c.req.param('id');

    const content = await c.env.DB.prepare(
      'SELECT * FROM contents WHERE id = ?'
    ).bind(id).first() as Content | null;

    if (!content) {
      return c.json({ success: false, error: '콘텐츠를 찾을 수 없습니다' }, 404);
    }

    const exportData = {
      export_date: new Date().toISOString(),
      content: {
        id: content.id,
        title: content.title,
        content: content.content,
        excerpt: content.excerpt,
        status: content.status,
        created_at: content.created_at,
        published_at: content.published_at,
        wordpress_post_id: content.wordpress_post_id,
        featured_image_url: content.featured_image_url,
      }
    };

    const filename = `content_${content.id}_${new Date().toISOString().split('T')[0]}.json`;

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'JSON 내보내기 실패' 
    }, 500);
  }
});

/**
 * 전체 콘텐츠 목록 내보내기 (클라이언트별)
 * GET /api/contents/export/all?client_id=17
 */
app.get('/export/all', async (c) => {
  try {
    const clientId = c.req.query('client_id');

    let query = 'SELECT * FROM contents';
    const params: any[] = [];

    if (clientId) {
      query += ' WHERE client_id = ?';
      params.push(clientId);
    }

    query += ' ORDER BY created_at DESC';

    const { results } = await c.env.DB.prepare(query).bind(...params).all();

    const exportData = {
      export_date: new Date().toISOString(),
      total_count: results.length,
      client_id: clientId || 'all',
      contents: results
    };

    const filename = `contents_export_${clientId || 'all'}_${new Date().toISOString().split('T')[0]}.json`;

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '전체 내보내기 실패' 
    }, 500);
  }
});

/**
 * 콘텐츠 이미지 조회 API
 * GET /api/contents/:contentId/images/:imageId
 * 본문에 삽입된 이미지를 제공
 */
app.get('/:contentId/images/:imageId', async (c) => {
  try {
    const contentId = c.req.param('contentId');
    const imageId = c.req.param('imageId');
    
    const image = await c.env.DB.prepare(`
      SELECT image_data, alt_text FROM content_images 
      WHERE id = ? AND content_id = ?
    `).bind(imageId, contentId).first() as { image_data: string; alt_text: string } | null;
    
    if (!image) {
      return c.json({ success: false, error: '이미지를 찾을 수 없습니다' }, 404);
    }
    
    // base64 데이터에서 이미지 바이너리 추출
    const base64Data = image.image_data;
    const mimeMatch = base64Data.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    const base64Content = base64Data.replace(/^data:[^;]+;base64,/, '');
    
    // base64를 바이너리로 변환
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new Response(bytes, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000',  // 1년 캐시
        'Content-Disposition': `inline; filename="image_${imageId}.png"`,
      },
    });
  } catch (error) {
    console.error('이미지 조회 오류:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '이미지 조회 실패' 
    }, 500);
  }
});

/**
 * 콘텐츠의 모든 이미지 목록 조회
 * GET /api/contents/:contentId/images
 */
app.get('/:contentId/images', async (c) => {
  try {
    const contentId = c.req.param('contentId');
    
    const { results } = await c.env.DB.prepare(`
      SELECT id, alt_text, position, created_at FROM content_images 
      WHERE content_id = ?
      ORDER BY position ASC
    `).bind(contentId).all();
    
    return c.json({ 
      success: true, 
      data: results.map((img: any) => ({
        id: img.id,
        url: `/api/contents/${contentId}/images/${img.id}`,
        alt_text: img.alt_text,
        position: img.position,
        created_at: img.created_at
      }))
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '이미지 목록 조회 실패' 
    }, 500);
  }
});

export default app;
