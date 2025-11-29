/**
 * Trends API Routes
 * 트렌드 키워드 및 뉴스 조회 API
 * - Naver DataLab API
 * - Gemini AI API
 */

import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// API Keys
const NAVER_CLIENT_ID = 'fUhHJ1HWyF6fFw_aBfkg';
const NAVER_CLIENT_SECRET = 'gA4jUFDYK0';

// Gemini API Keys (로테이션)
const GEMINI_API_KEYS = [
  'AIzaSyDdoQjn_WcAi6_8FkS_ujr976okHXypT3s',  // 새 키 (우선)
  'AIzaSyBPMH_-SA7bConhlG1TTeiBNj8TnyQQ4Jc',  // 백업 키
];

let currentKeyIndex = 0;

function getNextGeminiKey(): string {
  const key = GEMINI_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
  return key;
}

/**
 * Naver 검색 API - 블로그 검색
 */
async function searchNaverBlog(query: string, display: number = 10): Promise<any> {
  const url = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(query)}&display=${display}&sort=sim`;
  
  const response = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
    },
  });

  if (!response.ok) {
    throw new Error(`Naver API Error: ${response.status}`);
  }

  return response.json();
}

/**
 * Naver 검색 API - 뉴스 검색
 */
async function searchNaverNews(query: string, display: number = 10): Promise<any> {
  const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=${display}&sort=date`;
  
  const response = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
    },
  });

  if (!response.ok) {
    throw new Error(`Naver News API Error: ${response.status}`);
  }

  return response.json();
}

/**
 * Gemini API - 트렌드 키워드 추천
 */
async function getGeminiTrendKeywords(query: string, businessType?: string): Promise<string[]> {
  const apiKey = getNextGeminiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  const prompt = `당신은 한국 SEO 및 블로그 마케팅 전문가입니다.
"${query}" 키워드와 관련된 2025년 최신 트렌드 키워드 10개를 추천해주세요.
${businessType ? `업종: ${businessType}` : ''}

요구사항:
1. 검색량이 많은 실제 트렌드 키워드
2. 롱테일 키워드 포함
3. 네이버/구글에서 검색되는 키워드
4. 블로그 글 제목으로 사용 가능한 키워드

JSON 형식으로만 응답:
{"keywords": ["키워드1", "키워드2", ...]}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      console.error('Gemini API Error:', response.status);
      return [];
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.keywords || [];
    }
    
    return [];
  } catch (error) {
    console.error('Gemini API Error:', error);
    return [];
  }
}

/**
 * Gemini API - 뉴스/트렌드 분석 (Naver API 대체)
 */
async function getGeminiNewsAnalysis(keyword: string): Promise<any[]> {
  const apiKey = getNextGeminiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  const prompt = `"${keyword}" 키워드와 관련된 2025년 최신 트렌드와 뉴스 동향을 분석해주세요.

다음 형식으로 5개의 트렌드/뉴스 항목을 JSON으로 응답:
{
  "news": [
    {
      "title": "트렌드 제목",
      "description": "간단한 설명 (100자 이내)",
      "trend": "상승/유지/하락",
      "relevance": "높음/중간/낮음"
    }
  ]
}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.news || [];
    }
    return [];
  } catch (error) {
    return [];
  }
}

/**
 * Gemini API - 콘텐츠 아이디어 생성
 */
async function getGeminiContentIdeas(query: string, businessType?: string): Promise<any[]> {
  const apiKey = getNextGeminiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  const prompt = `당신은 한국 블로그 콘텐츠 전략가입니다.
"${query}" 키워드로 작성할 수 있는 블로그 글 아이디어 5개를 생성해주세요.
${businessType ? `업종: ${businessType}` : ''}

각 아이디어에 포함할 내용:
1. 제목 (SEO 최적화, 클릭률 높은)
2. 주요 키워드 3개
3. 예상 검색량 (높음/중간/낮음)
4. 추천 이유

JSON 형식으로만 응답:
{
  "ideas": [
    {
      "title": "제목",
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "searchVolume": "높음",
      "reason": "추천 이유"
    }
  ]
}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2000,
        },
      }),
    });

    if (!response.ok) {
      console.error('Gemini Content Ideas API Error:', response.status);
      return [];
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.ideas || [];
    }
    
    return [];
  } catch (error) {
    console.error('Gemini Content Ideas Error:', error);
    return [];
  }
}

/**
 * 기본 트렌드 API - 상태 확인
 */
app.get('/', async (c) => {
  return c.json({
    success: true,
    message: '트렌드 API가 정상 작동 중입니다',
    endpoints: {
      keywords: '/api/trends/keywords?query=검색어&client_id=17',
      news: '/api/trends/news?keyword=검색어&client_id=17',
      ideas: '/api/trends/ideas?query=검색어&business_type=beauty',
      blog: '/api/trends/blog?query=검색어'
    }
  });
});

/**
 * 트렌드 키워드 조회
 */
app.get('/keywords', async (c) => {
  try {
    const query = c.req.query('query');
    const clientId = c.req.query('client_id');

    if (!query) {
      return c.json({ 
        success: false, 
        error: 'query 파라미터가 필요합니다' 
      }, 400);
    }

    // 클라이언트 업종 조회 (선택적)
    let businessType: string | undefined;
    if (clientId) {
      try {
        const client = await c.env.DB.prepare(
          'SELECT business_type FROM clients WHERE id = ?'
        ).bind(clientId).first();
        businessType = client?.business_type as string;
      } catch (e) {
        // DB 오류 무시 - 업종 없이 진행
      }
    }

    // Gemini로 트렌드 키워드 추천
    const geminiKeywords = await getGeminiTrendKeywords(query, businessType);

    // Naver 블로그 검색 시도 (실패해도 계속 진행)
    let naverKeywords: string[] = [];
    let naverTotal = 0;
    try {
      const naverResult = await searchNaverBlog(query, 20);
      naverTotal = naverResult.total || 0;
      if (naverResult.items) {
        naverResult.items.forEach((item: any) => {
          const title = item.title.replace(/<[^>]*>/g, '');
          const words = title.split(/[\s,\-_]+/).filter((w: string) => w.length > 1);
          naverKeywords.push(...words.slice(0, 3));
        });
      }
    } catch (e) {
      // Naver API 실패 시 무시
      console.log('Naver API unavailable, using Gemini only');
    }

    // 중복 제거 및 정리
    const allKeywords = [...new Set([...geminiKeywords, ...naverKeywords])].slice(0, 20);

    return c.json({
      success: true,
      data: {
        query,
        businessType,
        keywords: geminiKeywords,
        relatedKeywords: allKeywords.length > 0 ? allKeywords : geminiKeywords,
        naverTrend: naverTotal,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Keywords API Error:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '키워드 조회 실패' 
    }, 500);
  }
});

/**
 * 트렌드 뉴스 조회
 */
app.get('/news', async (c) => {
  try {
    const keyword = c.req.query('keyword');
    const clientId = c.req.query('client_id');

    if (!keyword) {
      return c.json({ 
        success: false, 
        error: 'keyword 파라미터가 필요합니다' 
      }, 400);
    }

    // Naver 뉴스 검색 시도
    let news: any[] = [];
    let total = 0;
    
    try {
      const newsResult = await searchNaverNews(keyword, 10);
      total = newsResult.total || 0;
      news = newsResult.items?.map((item: any) => ({
        title: item.title.replace(/<[^>]*>/g, ''),
        description: item.description.replace(/<[^>]*>/g, ''),
        link: item.link,
        originallink: item.originallink,
        pubDate: item.pubDate,
      })) || [];
    } catch (e) {
      // Naver API 실패 시 Gemini로 대체
      console.log('Naver News API unavailable, using Gemini fallback');
      const geminiNews = await getGeminiNewsAnalysis(keyword);
      news = geminiNews;
    }

    return c.json({
      success: true,
      data: {
        keyword,
        total,
        news,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('News API Error:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '뉴스 조회 실패' 
    }, 500);
  }
});

/**
 * 콘텐츠 아이디어 생성
 */
app.get('/ideas', async (c) => {
  try {
    const query = c.req.query('query');
    const businessType = c.req.query('business_type');

    if (!query) {
      return c.json({ 
        success: false, 
        error: 'query 파라미터가 필요합니다' 
      }, 400);
    }

    // Gemini로 콘텐츠 아이디어 생성
    const ideas = await getGeminiContentIdeas(query, businessType);

    return c.json({
      success: true,
      data: {
        query,
        businessType,
        ideas,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Ideas API Error:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '아이디어 생성 실패' 
    }, 500);
  }
});

/**
 * 블로그 트렌드 분석
 */
app.get('/blog', async (c) => {
  try {
    const query = c.req.query('query');

    if (!query) {
      return c.json({ 
        success: false, 
        error: 'query 파라미터가 필요합니다' 
      }, 400);
    }

    // Naver 블로그 검색
    const blogResult = await searchNaverBlog(query, 10);

    // 블로그 데이터 정리
    const blogs = blogResult.items?.map((item: any) => ({
      title: item.title.replace(/<[^>]*>/g, ''),
      description: item.description.replace(/<[^>]*>/g, ''),
      link: item.link,
      bloggername: item.bloggername,
      postdate: item.postdate,
    })) || [];

    return c.json({
      success: true,
      data: {
        query,
        total: blogResult.total || 0,
        blogs,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Blog API Error:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '블로그 조회 실패' 
    }, 500);
  }
});

/**
 * 종합 트렌드 분석
 */
app.get('/analysis', async (c) => {
  try {
    const query = c.req.query('query');
    const clientId = c.req.query('client_id');

    if (!query) {
      return c.json({ 
        success: false, 
        error: 'query 파라미터가 필요합니다' 
      }, 400);
    }

    // 클라이언트 업종 조회
    let businessType: string | undefined;
    if (clientId) {
      const client = await c.env.DB.prepare(
        'SELECT business_type FROM clients WHERE id = ?'
      ).bind(clientId).first();
      businessType = client?.business_type as string;
    }

    // 병렬로 모든 데이터 수집
    const [geminiKeywords, contentIdeas, naverNews, naverBlog] = await Promise.all([
      getGeminiTrendKeywords(query, businessType),
      getGeminiContentIdeas(query, businessType),
      searchNaverNews(query, 5),
      searchNaverBlog(query, 5),
    ]);

    return c.json({
      success: true,
      data: {
        query,
        businessType,
        analysis: {
          trendKeywords: geminiKeywords,
          contentIdeas,
          recentNews: naverNews.items?.slice(0, 5).map((item: any) => ({
            title: item.title.replace(/<[^>]*>/g, ''),
            link: item.link,
            pubDate: item.pubDate,
          })) || [],
          popularBlogs: naverBlog.items?.slice(0, 5).map((item: any) => ({
            title: item.title.replace(/<[^>]*>/g, ''),
            link: item.link,
            bloggername: item.bloggername,
          })) || [],
          metrics: {
            newsTotal: naverNews.total || 0,
            blogTotal: naverBlog.total || 0,
          }
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Analysis API Error:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '분석 실패' 
    }, 500);
  }
});

export default app;
