/**
 * Contents API Routes
 * 콘텐츠 생성 및 관리 API
 */

import { Hono } from 'hono';
import { WordPressClient } from '../lib/wordpress';
import type { Content, Client } from '../types/database';
import { validateContentGeneration } from '../middleware/security';

type Bindings = {
  DB: D1Database;
  OPENAI_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// 콘텐츠 생성 엔드포인트에 검증 미들웨어 적용
app.use('/generate', validateContentGeneration());

/**
 * OpenAI API를 사용한 콘텐츠 생성
 */
async function generateContent(
  apiKey: string,
  systemPrompt: string,
  keywords: string[],
  title?: string
): Promise<{ title: string; content: string; excerpt: string }> {
  
  // 실전 블로그 마케팅 전략 통합 프롬프트
  const optimizedPrompt = title 
    ? `제목: "${title}"
키워드: ${keywords.join(', ')}

다음 요구사항을 모두 충족하는 실전 블로그 마케팅 글을 작성해주세요:

■ 검색 최적화 전략 (SEO/AEO/GEO 통합):
  ❶ 제목 최적화:
    - 주요 키워드를 제목 앞부분에 배치
    - 숫자, 질문형, 강력한 동사 활용으로 클릭률 극대화
    - 예: "2024년 최신", "5가지 방법", "완벽 가이드"
  
  ❷ 구조화된 콘텐츠:
    - H1(메인 제목) → H2(주요 섹션) → H3(세부 항목) 계층 준수
    - 검색 엔진과 AI가 이해하기 쉬운 명확한 구조
    - 키워드 밀도 2-3% 자연스럽게 유지
  
  ❸ 답변 중심 작성 (AEO):
    - 사용자의 검색 의도에 정확히 답변
    - "무엇", "어떻게", "왜", "언제" 질문에 직접 답변
    - 도입부에 핵심 답변 먼저 제시
    - 단락별로 하나의 명확한 메시지 전달

■ 신뢰도 구축 전략 (C-RANK):
  ❶ 전문성 표현:
    - 업계 전문 용어를 정확하게 사용
    - 구체적 수치, 통계, 연구 결과 인용
    - 단계별 실행 가이드 제공
  
  �② 실용성 강화:
    - 즉시 적용 가능한 실전 팁 제공
    - 구체적 사례와 예시 포함
    - 체크리스트, 비교표 등 실용적 형식 활용

■ 블로그 마케팅 핵심 원칙:
  ❶ 독자 중심 작성:
    - 독자의 문제를 명확히 파악하고 해결책 제시
    - 전문 용어는 쉽게 풀어서 설명
    - 읽기 쉬운 짧은 문장과 단락 사용
  
  ❷ 행동 유도:
    - 각 섹션마다 작은 액션 아이템 제시
    - 글 마지막에 명확한 CTA (Call-to-Action)
    - 댓글, 공유, 문의 등 참여 유도
  
  ❸ 지역 타겟팅 (해당 시):
    - 지역명을 자연스럽게 본문에 통합
    - "근처", "지역", "~에서" 등 로컬 키워드 활용
    - 지역 특화 정보 제공

■ 콘텐츠 구성:
  ❶ 도입부 (100-150자):
    - 독자의 문제/고민 공감
    - 핵심 해결책 미리보기
    - 읽어야 하는 이유 제시
  
  ❷ 본문 (1200-1500자):
    - 3-5개 주요 섹션 (H2)
    - 각 섹션마다 2-3개 세부 항목 (H3)
    - 리스트, 번호, 강조 등 다양한 형식 활용
  
  ❸ 결론 및 FAQ (200-300자):
    - 핵심 내용 요약
    - 구체적 행동 지침
    - 3-5개 FAQ 질문/답변

■ HTML 구조 예시:
  <h1>메인 제목 (키워드 포함)</h1>
  <p><strong>도입부: 문제 인식 및 해결 방향</strong></p>
  
  <h2>첫 번째 주요 섹션</h2>
  <h3>세부 항목 1</h3>
  <p>구체적 설명과 예시</p>
  <ul><li>실전 팁 1</li><li>실전 팁 2</li></ul>
  
  <h2>두 번째 주요 섹션</h2>
  <p>데이터와 근거 기반 설명</p>
  
  <h2>자주 묻는 질문 (FAQ)</h2>
  <h3>Q1: 구체적 질문?</h3>
  <p>명확한 답변</p>

총 1500-2000자 분량으로 작성하되, 독자가 끝까지 읽고 행동하게 만드는 글을 작성해주세요.`
    : `키워드: ${keywords.join(', ')}

다음 요구사항을 모두 충족하는 실전 블로그 마케팅 글을 작성해주세요:

■ 제목 생성 전략:
  - 숫자 활용: "7가지 방법", "2024년 TOP 10"
  - 질문형: "어떻게 ~할까?", "왜 ~해야 할까?"
  - 강력한 수식어: "완벽한", "검증된", "전문가가 알려주는"
  - 주요 키워드를 제목 앞부분에 배치
  - 60자 이내로 간결하게

■ 검색 최적화 (SEO/AEO/GEO):
  - H1, H2, H3 계층 구조 명확히
  - 키워드 밀도 2-3% 자연스럽게
  - 도입부에 핵심 답변 먼저 제시
  - "무엇", "어떻게", "왜" 질문에 직접 답변
  - 지역 키워드 자연스럽게 포함 (해당 시)

■ 신뢰도 구축 (C-RANK):
  - 구체적 수치와 데이터 제시
  - 전문 용어 정확히 사용
  - 단계별 실행 가이드
  - 실전 팁과 사례 포함

■ 블로그 마케팅 핵심:
  - 독자의 문제 파악 및 해결책 제시
  - 짧은 문장과 단락으로 가독성 확보
  - 리스트, 번호, 강조 활용
  - 각 섹션마다 작은 액션 아이템
  - 마지막에 명확한 행동 유도 (CTA)

■ 구성:
  <h1>키워드 포함 제목</h1>
  <p>도입부: 문제 공감 + 해결 방향</p>
  <h2>주요 섹션 1</h2>
  <h3>세부 항목</h3>
  <p>구체적 설명</p>
  <h2>FAQ</h2>
  <h3>Q1: 질문?</h3>
  <p>명확한 답변</p>

1500-2000자 분량으로, 독자가 끝까지 읽고 행동하게 만드는 글을 작성.`;

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

    // 환경변수에서 OpenAI API 키 가져오기
    const openaiApiKey = c.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return c.json({ success: false, error: 'OpenAI API 키가 설정되지 않았습니다' }, 400);
    }

    // 콘텐츠 생성
    const systemPrompt = 
      'You are a professional content writer. Write engaging, SEO-optimized blog posts with proper HTML structure including H1, H2, H3 tags.';

    const generated = await generateContent(
      openaiApiKey,
      systemPrompt,
      body.keywords,
      body.title
    );

    // 이미지 생성 (옵션)
    let imageUrl: string | undefined;
    if (body.generate_image && openaiApiKey) {
      const imagePrompt = body.image_prompt || `Professional illustration for: ${generated.title}`;
      imageUrl = await generateImage(openaiApiKey, imagePrompt);
    }

    // DB에 저장
    const result = await c.env.DB.prepare(`
      INSERT INTO contents (
        client_id, title, content, 
        status, image_url, keywords
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      body.client_id,
      generated.title,
      generated.content,
      'draft',
      imageUrl || null,
      JSON.stringify(body.keywords)
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

export default app;
