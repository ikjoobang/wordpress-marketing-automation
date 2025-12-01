/**
 * Projects API Routes
 * 프로젝트 관리 API
 */

import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

/**
 * 프로젝트 목록 조회
 * GET /api/projects?client_id=1
 */
app.get('/', async (c) => {
  try {
    const clientId = c.req.query('client_id');
    
    let query = `
      SELECT 
        p.*,
        c.name as client_name,
        (SELECT COUNT(*) FROM contents WHERE project_id = p.id) as content_count,
        (SELECT COUNT(*) FROM contents WHERE project_id = p.id AND status = 'published') as published_count
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
    `;
    
    const params: any[] = [];
    
    if (clientId) {
      query += ' WHERE p.client_id = ?';
      params.push(clientId);
    }
    
    query += ' ORDER BY p.updated_at DESC';
    
    const stmt = params.length > 0 
      ? c.env.DB.prepare(query).bind(...params)
      : c.env.DB.prepare(query);
    
    const result = await stmt.all();
    
    // keywords JSON 파싱
    const projects = result.results.map((p: any) => ({
      ...p,
      keywords: p.keywords ? JSON.parse(p.keywords) : []
    }));
    
    return c.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Projects List Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '프로젝트 목록 조회 실패'
    }, 500);
  }
});

/**
 * 프로젝트 상세 조회
 * GET /api/projects/:id
 */
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const project = await c.env.DB.prepare(`
      SELECT 
        p.*,
        c.name as client_name,
        c.wordpress_url
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.id = ?
    `).bind(id).first();
    
    if (!project) {
      return c.json({
        success: false,
        error: '프로젝트를 찾을 수 없습니다'
      }, 404);
    }
    
    // 최근 콘텐츠 조회
    const contents = await c.env.DB.prepare(`
      SELECT id, title, status, published_at, created_at
      FROM contents
      WHERE project_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(id).all();
    
    return c.json({
      success: true,
      data: {
        ...project,
        keywords: project.keywords ? JSON.parse(project.keywords as string) : [],
        recent_contents: contents.results
      }
    });
  } catch (error) {
    console.error('Project Detail Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '프로젝트 조회 실패'
    }, 500);
  }
});

/**
 * 프로젝트 생성
 * POST /api/projects
 */
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { client_id, name, description, category_id, keywords } = body;
    
    if (!client_id || !name) {
      return c.json({
        success: false,
        error: 'client_id와 name은 필수입니다'
      }, 400);
    }
    
    const now = new Date().toISOString();
    const keywordsJson = keywords ? JSON.stringify(keywords) : null;
    
    const result = await c.env.DB.prepare(`
      INSERT INTO projects (client_id, name, description, category_id, keywords, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(client_id, name, description || null, category_id || null, keywordsJson, now, now).run();
    
    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        client_id,
        name,
        description,
        category_id,
        keywords: keywords || [],
        created_at: now,
        updated_at: now
      }
    });
  } catch (error) {
    console.error('Project Create Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '프로젝트 생성 실패'
    }, 500);
  }
});

/**
 * 프로젝트 수정
 * PUT /api/projects/:id
 */
app.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, description, category_id, keywords } = body;
    
    const now = new Date().toISOString();
    const keywordsJson = keywords ? JSON.stringify(keywords) : null;
    
    await c.env.DB.prepare(`
      UPDATE projects 
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          category_id = COALESCE(?, category_id),
          keywords = COALESCE(?, keywords),
          updated_at = ?
      WHERE id = ?
    `).bind(name || null, description || null, category_id || null, keywordsJson, now, id).run();
    
    const updated = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
    
    return c.json({
      success: true,
      data: {
        ...updated,
        keywords: updated?.keywords ? JSON.parse(updated.keywords as string) : []
      }
    });
  } catch (error) {
    console.error('Project Update Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '프로젝트 수정 실패'
    }, 500);
  }
});

/**
 * 프로젝트 삭제
 * DELETE /api/projects/:id
 */
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    // 연관 콘텐츠 확인
    const contentCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM contents WHERE project_id = ?'
    ).bind(id).first();
    
    if (contentCount && (contentCount.count as number) > 0) {
      return c.json({
        success: false,
        error: `이 프로젝트에 ${contentCount.count}개의 콘텐츠가 있습니다. 먼저 콘텐츠를 삭제해주세요.`
      }, 400);
    }
    
    await c.env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
    
    return c.json({
      success: true,
      message: '프로젝트가 삭제되었습니다'
    });
  } catch (error) {
    console.error('Project Delete Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '프로젝트 삭제 실패'
    }, 500);
  }
});

export default app;
