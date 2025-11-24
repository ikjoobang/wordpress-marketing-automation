/**
 * Contents API Routes
 * 콘텐츠 생성 및 관리 API
 */

import { Hono } from 'hono';
import { WordPressClient } from '../lib/wordpress';
import type { Content, Client } from '../types/database';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

/**
 * OpenAI API를 사용한 콘텐츠 생성
 */
async function generateContent(
  apiKey: string,
  systemPrompt: string,
  keywords: string[],
  title?: string
): Promise<{ title: string; content: string; excerpt: string }> {
  
  // SEO/AEO/C-RANK/GEO 최적화 프롬프트 생성
  const optimizedPrompt = title 
    ? `제목: "${title}"
키워드: ${keywords.join(', ')}

다음 요구사항을 모두 충족하는 블로그 글을 작성해주세요:

■ SEO 최적화 (Search Engine Optimization):
  - 제목에 주요 키워드 포함
  - H1(제목), H2(주요 섹션), H3(하위 섹션) 구조화
  - 키워드 밀도 2-3% 유지
  - 메타 설명에 적합한 요약 제공
  - 내부 링크 권장 위치 표시

■ AEO 최적화 (Answer Engine Optimization):
  - 질문-답변 형식으로 구조화
  - 직접적이고 명확한 답변 제공
  - "무엇", "어떻게", "왜" 질문에 대한 답변 포함
  - FAQ 섹션 포함

■ C-RANK 최적화 (신뢰도 강화):
  - 전문 용어 정확히 사용
  - 구체적인 수치와 데이터 포함
  - 실용적인 팁과 베스트 프랙티스 제시
  - 단계별 가이드 제공

■ GEO 최적화 (지역 검색):
  - 해당되는 경우 지역명 자연스럽게 포함
  - "근처", "지역" 등 로컬 키워드 활용

■ HTML 구조:
  <h1>메인 제목</h1>
  <h2>주요 섹션</h2>
  <h3>하위 섹션</h3>
  <p>본문 내용</p>
  <ul><li>리스트 항목</li></ul>

총 1500-2000자 분량으로 작성해주세요.`
    : `키워드: ${keywords.join(', ')}

다음 요구사항을 모두 충족하는 블로그 글을 작성해주세요:

■ 제목 생성:
  - 주요 키워드 포함
  - 클릭을 유도하는 매력적인 제목
  - 60자 이내

■ SEO 최적화:
  - H1, H2, H3 계층 구조
  - 키워드 밀도 2-3%
  - 메타 설명 적합한 요약

■ AEO 최적화:
  - Q&A 형식 포함
  - 명확한 답변 제공
  - FAQ 섹션

■ C-RANK 최적화:
  - 전문성 표현
  - 구체적 데이터/수치
  - 실용적 조언

■ 구조:
  <h1>제목</h1>
  <h2>섹션</h2>
  <h3>서브섹션</h3>
  <p>내용</p>

1500-2000자 분량으로 작성.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: optimizedPrompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API Error: ${response.status}`);
  }

  const data = await response.json();
  const generatedText = data.choices[0].message.content;

  // 제목과 본문 추출
  const titleMatch = generatedText.match(/<h1>(.*?)<\/h1>/i) || generatedText.match(/^#\s+(.+)$/m);
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
 * DALL-E를 사용한 이미지 생성
 */
async function generateImage(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
    }),
  });

  if (!response.ok) {
    throw new Error(`DALL-E API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].url;
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

    if (!client.openai_api_key) {
      return c.json({ success: false, error: 'OpenAI API 키가 설정되지 않았습니다' }, 400);
    }

    // 콘텐츠 생성
    const systemPrompt = client.system_prompt || 
      'You are a professional content writer. Write engaging, SEO-optimized blog posts with proper HTML structure including H1, H2, H3 tags.';

    const generated = await generateContent(
      client.openai_api_key,
      systemPrompt,
      body.keywords,
      body.title
    );

    // 이미지 생성 (옵션)
    let imageUrl: string | undefined;
    if (body.generate_image && client.openai_api_key) {
      const imagePrompt = body.image_prompt || `Professional illustration for: ${generated.title}`;
      imageUrl = await generateImage(client.openai_api_key, imagePrompt);
    }

    // DB에 저장
    const result = await c.env.DB.prepare(`
      INSERT INTO contents (
        project_id, client_id, title, content, excerpt,
        status, featured_image_url, keywords
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.project_id || null,
      body.client_id,
      generated.title,
      generated.content,
      generated.excerpt,
      'draft',
      imageUrl || null,
      JSON.stringify(body.keywords)
    ).run();

    // 활동 로그 기록
    await c.env.DB.prepare(`
      INSERT INTO activity_logs (client_id, action, details, status)
      VALUES (?, ?, ?, ?)
    `).bind(
      body.client_id,
      'content_generated',
      `AI 콘텐츠 생성: ${generated.title}`,
      'success'
    ).run();

    return c.json({ 
      success: true, 
      data: {
        id: result.meta.last_row_id,
        ...generated,
        imageUrl
      },
      message: '콘텐츠가 생성되었습니다'
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '콘텐츠 생성 실패' 
    }, 500);
  }
});

/**
 * 워드프레스에 발행
 */
app.post('/:id/publish', async (c) => {
  try {
    const id = c.req.param('id');

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

export default app;
