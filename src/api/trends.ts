/**
 * Trends API Routes
 * 트렌드 키워드 및 뉴스 조회 API
 * - Naver DataLab API
 * - Gemini 1.5 Pro API (고성능 모델)
 * - Google Trends (SerpAPI)
 */

import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// API Keys
const NAVER_CLIENT_ID = 'fUhHJ1HWyF6fFw_aBfkg';
const NAVER_CLIENT_SECRET = 'gA4jUFDYK0';

// Gemini API Key - 1.5 Pro 모델 사용 (새 키 2025-12-01)
const GEMINI_API_KEY = 'AIzaSyApZL4NCnoZZkpS5t7LC7PNSKNeFngBFO0';

// Gemini 모델 설정 - gemini-2.0-flash (빠르고 안정적)
const GEMINI_MODEL = 'gemini-2.0-flash';

function getGeminiKey(): string {
  return GEMINI_API_KEY;
}

/**
 * Google Trends 분석 (Gemini 1.5 Pro로 대체)
 * - SerpAPI 무료 한도 초과로 Gemini AI로 구글 트렌드 분석 수행
 */
async function getGoogleTrendsAnalysis(query: string, geo: string = 'KR'): Promise<any> {
  const apiKey = getGeminiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  
  const prompt = `당신은 구글 트렌드 분석 전문가입니다.
"${query}" 키워드의 구글 검색 트렌드를 분석해주세요.
지역: ${geo === 'KR' ? '한국' : geo}

다음 정보를 JSON 형식으로 제공해주세요:
{
  "trendScore": 0-100 사이의 예상 트렌드 점수,
  "trendDirection": "상승" | "유지" | "하락",
  "risingQueries": [
    {"query": "급상승 검색어1", "growth": "+500%"},
    {"query": "급상승 검색어2", "growth": "+300%"}
  ],
  "topQueries": [
    {"query": "인기 검색어1", "score": 100},
    {"query": "인기 검색어2", "score": 85}
  ],
  "seasonality": "계절성 분석 (예: 봄철 급상승, 연중 안정적)",
  "recommendation": "마케팅 추천 사항"
}

반드시 실제 검색 트렌드를 기반으로 현실적인 데이터를 제공해주세요.
급상승 검색어 5개, 인기 검색어 5개를 포함해주세요.`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
      }),
    });

    if (!response.ok) {
      console.error('Gemini Google Trends Analysis Error:', response.status);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('Gemini Google Trends Analysis Error:', error);
    return null;
  }
}

/**
 * Google Trends 실시간 인기 검색어 (Gemini 1.5 Pro로 대체)
 */
async function getGoogleTrendingNow(geo: string = 'KR'): Promise<any> {
  const apiKey = getGeminiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  
  const prompt = `당신은 구글 트렌드 분석 전문가입니다.
${geo === 'KR' ? '한국' : geo}에서 현재 실시간으로 인기 있는 검색어를 분석해주세요.

다음 정보를 JSON 형식으로 제공해주세요:
{
  "trendingSearches": [
    {
      "query": "실시간 인기 검색어",
      "category": "카테고리 (뉴스/엔터/스포츠/비즈니스 등)",
      "traffic": "예상 검색량 (예: 100K+)",
      "relatedQueries": ["관련 검색어1", "관련 검색어2"]
    }
  ]
}

현재 2025년 기준으로 한국에서 관심 있는 실시간 트렌드 10개를 포함해주세요.`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 2000 },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('Gemini Trending Now Error:', error);
    return null;
  }
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
 * Gemini 1.5 Pro API - 트렌드 키워드 추천 (고성능)
 */
async function getGeminiTrendKeywords(query: string, businessType?: string): Promise<string[]> {
  const apiKey = getGeminiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  
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
 * Gemini 1.5 Pro API - 뉴스/트렌드 분석 (고성능)
 */
async function getGeminiNewsAnalysis(keyword: string): Promise<any[]> {
  const apiKey = getGeminiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  
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
 * Gemini 1.5 Pro API - 콘텐츠 아이디어 생성 (고성능)
 */
async function getGeminiContentIdeas(query: string, businessType?: string): Promise<any[]> {
  const apiKey = getGeminiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  
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
    message: '트렌드 API가 정상 작동 중입니다 (Gemini 2.0 Flash + Google Trends)',
    model: GEMINI_MODEL,
    endpoints: {
      keywords: '/api/trends/keywords?query=검색어&client_id=17',
      news: '/api/trends/news?keyword=검색어&client_id=17',
      ideas: '/api/trends/ideas?query=검색어&business_type=beauty',
      blog: '/api/trends/blog?query=검색어',
      google: '/api/trends/google?query=검색어',
      googleRelated: '/api/trends/google/related?query=검색어',
      googleTrending: '/api/trends/google/trending'
    }
  });
});

/**
 * Google Trends 검색 분석 (Gemini 1.5 Pro 기반)
 */
app.get('/google', async (c) => {
  try {
    const query = c.req.query('query');
    const geo = c.req.query('geo') || 'KR';

    if (!query) {
      return c.json({ 
        success: false, 
        error: 'query 파라미터가 필요합니다' 
      }, 400);
    }

    const trends = await getGoogleTrendsAnalysis(query, geo);
    
    if (!trends) {
      return c.json({
        success: false,
        error: 'Google Trends 분석을 수행할 수 없습니다'
      }, 500);
    }

    return c.json({
      success: true,
      data: {
        query,
        geo,
        model: GEMINI_MODEL,
        trendScore: trends.trendScore,
        trendDirection: trends.trendDirection,
        seasonality: trends.seasonality,
        recommendation: trends.recommendation,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Google Trends API Error:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Google Trends 분석 실패' 
    }, 500);
  }
});

/**
 * Google Trends 관련 검색어 조회 (Gemini 1.5 Pro 기반)
 */
app.get('/google/related', async (c) => {
  try {
    const query = c.req.query('query');
    const geo = c.req.query('geo') || 'KR';

    if (!query) {
      return c.json({ 
        success: false, 
        error: 'query 파라미터가 필요합니다' 
      }, 400);
    }

    const trends = await getGoogleTrendsAnalysis(query, geo);
    
    if (!trends) {
      return c.json({
        success: false,
        error: 'Google Trends 관련 검색어 분석을 수행할 수 없습니다'
      }, 500);
    }

    return c.json({
      success: true,
      data: {
        query,
        geo,
        model: GEMINI_MODEL,
        rising: trends.risingQueries || [],
        top: trends.topQueries || [],
        trendScore: trends.trendScore,
        trendDirection: trends.trendDirection,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Google Trends Related API Error:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Google Trends 관련 검색어 분석 실패' 
    }, 500);
  }
});

/**
 * Google Trends 실시간 인기 검색어 (Gemini 1.5 Pro 기반)
 */
app.get('/google/trending', async (c) => {
  try {
    const geo = c.req.query('geo') || 'KR';

    const trending = await getGoogleTrendingNow(geo);
    
    if (!trending) {
      return c.json({
        success: false,
        error: 'Google Trends 실시간 인기 검색어를 분석할 수 없습니다'
      }, 500);
    }

    return c.json({
      success: true,
      data: {
        geo,
        model: GEMINI_MODEL,
        trending: trending.trendingSearches || [],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Google Trends Trending API Error:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Google Trends 실시간 인기 검색어 분석 실패' 
    }, 500);
  }
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
 * 종합 트렌드 분석 (Gemini 1.5 Pro + Google Trends + Naver)
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

    // 병렬로 모든 데이터 수집 (Google Trends 포함 - Gemini 1.5 Pro 기반)
    const [geminiKeywords, contentIdeas, naverNews, naverBlog, googleTrendsAnalysis] = await Promise.allSettled([
      getGeminiTrendKeywords(query, businessType),
      getGeminiContentIdeas(query, businessType),
      searchNaverNews(query, 5),
      searchNaverBlog(query, 5),
      getGoogleTrendsAnalysis(query, 'KR'),
    ]);

    // 결과 추출 (실패 시 기본값 사용)
    const keywords = geminiKeywords.status === 'fulfilled' ? geminiKeywords.value : [];
    const ideas = contentIdeas.status === 'fulfilled' ? contentIdeas.value : [];
    const news = naverNews.status === 'fulfilled' ? naverNews.value : { items: [], total: 0 };
    const blog = naverBlog.status === 'fulfilled' ? naverBlog.value : { items: [], total: 0 };
    const gTrends = googleTrendsAnalysis.status === 'fulfilled' ? googleTrendsAnalysis.value : null;

    // Google Trends 데이터 정리 (Gemini 1.5 Pro 분석 결과)
    const googleData = {
      trendScore: gTrends?.trendScore || 0,
      trendDirection: gTrends?.trendDirection || '알 수 없음',
      seasonality: gTrends?.seasonality || '',
      recommendation: gTrends?.recommendation || '',
      risingQueries: gTrends?.risingQueries?.slice(0, 10) || [],
      topQueries: gTrends?.topQueries?.slice(0, 10) || []
    };

    return c.json({
      success: true,
      data: {
        query,
        businessType,
        model: GEMINI_MODEL,
        analysis: {
          trendKeywords: keywords,
          contentIdeas: ideas,
          recentNews: news.items?.slice(0, 5).map((item: any) => ({
            title: item.title.replace(/<[^>]*>/g, ''),
            link: item.link,
            pubDate: item.pubDate,
          })) || [],
          popularBlogs: blog.items?.slice(0, 5).map((item: any) => ({
            title: item.title.replace(/<[^>]*>/g, ''),
            link: item.link,
            bloggername: item.bloggername,
          })) || [],
          googleTrends: googleData,
          metrics: {
            newsTotal: news.total || 0,
            blogTotal: blog.total || 0,
            googleTrendScore: gTrends?.trendScore || 0,
            hasGoogleTrends: !!gTrends
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
