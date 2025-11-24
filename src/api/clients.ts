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

    // 워드프레스 연결 테스트
    const wpClient = new WordPressClient({
      siteUrl: body.wordpress_url,
      username: body.wordpress_username,
      password: body.wordpress_password,
    });

    const testResult = await wpClient.testConnection();
    if (!testResult.success) {
      return c.json({ 
        success: false, 
        error: `워드프레스 연결 실패: ${testResult.message}` 
      }, 400);
    }

    // 클라이언트 등록
    const result = await c.env.DB.prepare(`
      INSERT INTO clients (
        name, description, wordpress_url, wordpress_username, 
        wordpress_password, openai_api_key, system_prompt, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.name,
      body.description || null,
      body.wordpress_url,
      body.wordpress_username,
      body.wordpress_password,
      body.openai_api_key || null,
      body.system_prompt || null,
      body.is_active !== false ? 1 : 0
    ).run();

    // 활동 로그 기록
    await c.env.DB.prepare(`
      INSERT INTO activity_logs (client_id, action, details, status)
      VALUES (?, ?, ?, ?)
    `).bind(
      result.meta.last_row_id,
      'client_created',
      `새 클라이언트 등록: ${body.name}`,
      'success'
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
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description);
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
    if (body.openai_api_key !== undefined) {
      updates.push('openai_api_key = ?');
      values.push(body.openai_api_key);
    }
    if (body.system_prompt !== undefined) {
      updates.push('system_prompt = ?');
      values.push(body.system_prompt);
    }
    if (body.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(body.is_active ? 1 : 0);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await c.env.DB.prepare(`
      UPDATE clients SET ${updates.join(', ')} WHERE id = ?
    `).bind(...values).run();

    // 활동 로그 기록
    await c.env.DB.prepare(`
      INSERT INTO activity_logs (client_id, action, details, status)
      VALUES (?, ?, ?, ?)
    `).bind(
      id,
      'client_updated',
      `클라이언트 정보 수정`,
      'success'
    ).run();

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

    // 프로젝트 수
    const totalProjects = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM projects WHERE client_id = ?'
    ).bind(id).first();

    // 최근 활동
    const recentActivities = await c.env.DB.prepare(
      'SELECT * FROM activity_logs WHERE client_id = ? ORDER BY created_at DESC LIMIT 10'
    ).bind(id).all();

    return c.json({ 
      success: true, 
      data: {
        totalContents: totalContents?.count || 0,
        publishedContents: publishedContents?.count || 0,
        scheduledContents: scheduledContents?.count || 0,
        totalProjects: totalProjects?.count || 0,
        recentActivities: recentActivities.results || []
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
