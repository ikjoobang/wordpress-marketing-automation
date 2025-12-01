/**
 * Clients API Routes
 * 클라이언트(업체) 관리 API
 */

import { Hono } from 'hono';
import { WordPressClient } from '../lib/wordpress';
import type { Client } from '../types/database';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

/**
 * 전체 클라이언트 목록 조회
 */
app.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM clients ORDER BY created_at DESC'
    ).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '클라이언트 조회 실패' 
    }, 500);
  }
});

/**
 * 단일 클라이언트 조회
 */
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const client = await c.env.DB.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).bind(id).first();

    if (!client) {
      return c.json({ success: false, error: '클라이언트를 찾을 수 없습니다' }, 404);
    }

    return c.json({ success: true, data: client });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '클라이언트 조회 실패' 
    }, 500);
  }
});

/**
 * 새 클라이언트 등록
 */
app.post('/', async (c) => {
  try {
    const body = await c.req.json<Omit<Client, 'id' | 'created_at' | 'updated_at'>>();

    // 필수 필드 검증
    if (!body.name || !body.wordpress_url || !body.wordpress_username || !body.wordpress_password) {
      return c.json({ 
        success: false, 
        error: '필수 필드가 누락되었습니다' 
      }, 400);
    }

    // 워드프레스 연결 테스트 (선택사항 - 프로덕션에서는 활성화 권장)
    // const wpClient = new WordPressClient({
    //   siteUrl: body.wordpress_url,
    //   username: body.wordpress_username,
    //   password: body.wordpress_password,
    // });

    // const testResult = await wpClient.testConnection();
    // if (!testResult.success) {
    //   return c.json({ 
    //     success: false, 
    //     error: `워드프레스 연결 실패: ${testResult.message}` 
    //   }, 400);
    // }

    // 추가 필드 처리
    const autoPublish = (body as any).auto_publish === 'on' || (body as any).auto_publish === true ? 1 : 0;
    const publishTime = (body as any).publish_time || '09:00';
    const publishFrequency = (body as any).publish_frequency || 'daily';
    const description = (body as any).description || null;
    const openaiApiKey = (body as any).openai_api_key || null;
    const systemPrompt = (body as any).system_prompt || null;
    const businessType = (body as any).business_type || null;

    // 클라이언트 등록
    const result = await c.env.DB.prepare(`
      INSERT INTO clients (
        name, description, wordpress_url, wordpress_username, wordpress_password,
        openai_api_key, system_prompt, business_type, auto_publish, publish_time, publish_frequency, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(
      body.name,
      description,
      body.wordpress_url,
      body.wordpress_username,
      body.wordpress_password,
      openaiApiKey,
      systemPrompt,
      businessType,
      autoPublish,
      publishTime,
      publishFrequency
    ).run();

    return c.json({ 
      success: true, 
      data: { id: result.meta.last_row_id },
      message: '클라이언트가 성공적으로 등록되었습니다'
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '클라이언트 등록 실패' 
    }, 500);
  }
});

/**
 * 클라이언트 정보 수정
 */
app.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<Partial<Client>>();

    // 워드프레스 연결 정보가 변경된 경우 테스트
    if (body.wordpress_url || body.wordpress_username || body.wordpress_password) {
      const current = await c.env.DB.prepare(
        'SELECT * FROM clients WHERE id = ?'
      ).bind(id).first() as Client | null;

      if (!current) {
        return c.json({ success: false, error: '클라이언트를 찾을 수 없습니다' }, 404);
      }

      const wpClient = new WordPressClient({
        siteUrl: body.wordpress_url || current.wordpress_url,
        username: body.wordpress_username || current.wordpress_username,
        password: body.wordpress_password || current.wordpress_password,
      });

      const testResult = await wpClient.testConnection();
      if (!testResult.success) {
        return c.json({ 
          success: false, 
          error: `워드프레스 연결 실패: ${testResult.message}` 
        }, 400);
      }
    }

    // 업데이트할 필드 구성
    const updates: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined) {
      updates.push('name = ?');
      values.push(body.name);
    }
    if (body.wordpress_url !== undefined) {
      updates.push('wordpress_url = ?');
      values.push(body.wordpress_url);
    }
    if (body.wordpress_username !== undefined) {
      updates.push('wordpress_username = ?');
      values.push(body.wordpress_username);
    }
    if (body.wordpress_password !== undefined) {
      updates.push('wordpress_password = ?');
      values.push(body.wordpress_password);
    }


    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await c.env.DB.prepare(`
      UPDATE clients SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return c.json({ 
      success: true, 
      message: '클라이언트 정보가 수정되었습니다'
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '클라이언트 수정 실패' 
    }, 500);
  }
});

/**
 * 클라이언트 삭제
 */
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    await c.env.DB.prepare(
      'DELETE FROM clients WHERE id = ?'
    ).bind(id).run();

    return c.json({ 
      success: true, 
      message: '클라이언트가 삭제되었습니다'
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '클라이언트 삭제 실패' 
    }, 500);
  }
});

/**
 * 클라이언트 통계 조회
 */
app.get('/:id/stats', async (c) => {
  try {
    const id = c.req.param('id');

    // 전체 콘텐츠 수
    const totalContents = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM contents WHERE client_id = ?'
    ).bind(id).first();

    // 발행된 콘텐츠 수
    const publishedContents = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM contents WHERE client_id = ? AND status = ?'
    ).bind(id, 'published').first();

    // 예약된 콘텐츠 수
    const scheduledContents = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM contents WHERE client_id = ? AND status = ?'
    ).bind(id, 'scheduled').first();

    return c.json({ 
      success: true, 
      data: {
        totalContents: totalContents?.count || 0,
        publishedContents: publishedContents?.count || 0,
        scheduledContents: scheduledContents?.count || 0,
        draftContents: (totalContents?.count || 0) - (publishedContents?.count || 0) - (scheduledContents?.count || 0)
      }
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '통계 조회 실패' 
    }, 500);
  }
});

export default app;
