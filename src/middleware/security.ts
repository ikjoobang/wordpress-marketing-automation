/**
 * Security Middleware
 * Rate limiting, CSRF protection, input sanitization
 */

import { Context, Next } from 'hono';

/**
 * Rate Limiter using in-memory storage
 * Cloudflare Workers에서 작동하는 간단한 rate limiter
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function rateLimit(options: {
  windowMs: number;
  max: number;
}) {
  return async (c: Context, next: Next) => {
    const identifier = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const now = Date.now();
    
    // 만료된 항목 정리
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
    
    const entry = rateLimitStore.get(identifier);
    
    if (entry) {
      if (now < entry.resetTime) {
        if (entry.count >= options.max) {
          return c.json(
            { 
              success: false, 
              error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.' 
            }, 
            429
          );
        }
        entry.count++;
      } else {
        rateLimitStore.set(identifier, {
          count: 1,
          resetTime: now + options.windowMs
        });
      }
    } else {
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + options.windowMs
      });
    }
    
    await next();
  };
}

/**
 * Input Sanitization
 * XSS 및 SQL Injection 방지
 */
export function sanitizeInput() {
  return async (c: Context, next: Next) => {
    if (c.req.method === 'POST' || c.req.method === 'PUT') {
      try {
        const contentType = c.req.header('content-type');
        
        if (contentType?.includes('application/json')) {
          const body = await c.req.json();
          const sanitized = sanitizeObject(body);
          
          // Sanitized body를 context에 저장
          c.set('sanitizedBody', sanitized);
        }
      } catch (error) {
        // JSON 파싱 오류 시 다음 미들웨어로 진행
      }
    }
    
    await next();
  };
}

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  
  return obj;
}

function sanitizeString(str: string): string {
  // HTML 태그 이스케이프 (콘텐츠 제외)
  // 기본적인 XSS 방어
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * CSRF Protection
 * Simple token-based CSRF protection
 */
export function csrfProtection() {
  return async (c: Context, next: Next) => {
    const method = c.req.method;
    
    // GET, HEAD, OPTIONS는 CSRF 검증 제외
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      await next();
      return;
    }
    
    // API 요청에는 간단한 헤더 검증
    const origin = c.req.header('origin');
    const referer = c.req.header('referer');
    const host = c.req.header('host');
    
    // Same-origin 검증
    if (origin) {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        return c.json(
          { 
            success: false, 
            error: 'CSRF 검증 실패: 잘못된 origin' 
          }, 
          403
        );
      }
    } else if (referer) {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host) {
        return c.json(
          { 
            success: false, 
            error: 'CSRF 검증 실패: 잘못된 referer' 
          }, 
          403
        );
      }
    }
    
    await next();
  };
}

/**
 * Security Headers
 * 보안 관련 HTTP 헤더 추가
 */
export function securityHeaders() {
  return async (c: Context, next: Next) => {
    await next();
    
    // 응답 헤더 추가
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  };
}

/**
 * Content Validation
 * 콘텐츠 생성 시 입력값 검증
 */
export function validateContentGeneration() {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      
      // 필수 필드 검증
      if (!body.client_id || typeof body.client_id !== 'number') {
        return c.json({ success: false, error: 'client_id는 필수 항목입니다' }, 400);
      }
      
      if (!body.keywords || !Array.isArray(body.keywords) || body.keywords.length === 0) {
        return c.json({ success: false, error: 'keywords는 필수 항목입니다' }, 400);
      }
      
      // 키워드 길이 검증
      if (body.keywords.length > 10) {
        return c.json({ success: false, error: '키워드는 최대 10개까지 가능합니다' }, 400);
      }
      
      // 제목 길이 검증
      if (body.title && body.title.length > 200) {
        return c.json({ success: false, error: '제목은 200자를 초과할 수 없습니다' }, 400);
      }
      
      await next();
    } catch (error) {
      return c.json({ success: false, error: '잘못된 요청 형식입니다' }, 400);
    }
  };
}
