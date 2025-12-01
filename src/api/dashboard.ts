/**
 * Dashboard Stats API Routes
 * 대시보드 통계 API
 */

import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

/**
 * 대시보드 기본 경로 - 전체 통계 반환
 * GET /api/dashboard
 */
app.get('/', async (c) => {
  try {
    // 클라이언트 통계
    const clientStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
      FROM clients
    `).first();
    
    // 콘텐츠 통계
    const contentStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM contents
    `).first();
    
    return c.json({
      success: true,
      data: {
        clients: {
          total: clientStats?.total || 0,
          active: clientStats?.active || 0
        },
        contents: {
          total: contentStats?.total || 0,
          draft: contentStats?.draft || 0,
          scheduled: contentStats?.scheduled || 0,
          published: contentStats?.published || 0,
          failed: contentStats?.failed || 0
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '대시보드 조회 실패'
    }, 500);
  }
});

/**
 * 대시보드 전체 통계
 * GET /api/dashboard/stats?client_id=1
 */
app.get('/stats', async (c) => {
  try {
    const clientId = c.req.query('client_id');
    
    let clientWhere = '';
    const params: any[] = [];
    
    if (clientId) {
      clientWhere = 'WHERE client_id = ?';
      params.push(clientId);
    }
    
    // 클라이언트 통계
    const clientStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
      FROM clients
    `).first();
    
    // 콘텐츠 통계
    const contentStatsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM contents
      ${clientWhere}
    `;
    
    const contentStats = clientId 
      ? await c.env.DB.prepare(contentStatsQuery).bind(clientId).first()
      : await c.env.DB.prepare(contentStatsQuery).first();
    
    // 프로젝트 통계
    const projectStatsQuery = `
      SELECT COUNT(*) as total
      FROM projects
      ${clientWhere}
    `;
    
    const projectStats = clientId
      ? await c.env.DB.prepare(projectStatsQuery).bind(clientId).first()
      : await c.env.DB.prepare(projectStatsQuery).first();
    
    // 최근 7일 활동
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString();
    
    let recentActivityQuery = `
      SELECT COUNT(*) as total
      FROM activity_logs
      WHERE created_at >= ?
    `;
    const recentParams: any[] = [weekAgoStr];
    
    if (clientId) {
      recentActivityQuery += ' AND client_id = ?';
      recentParams.push(clientId);
    }
    
    const recentActivity = await c.env.DB.prepare(recentActivityQuery).bind(...recentParams).first();
    
    // 오늘 발행된 콘텐츠
    const today = new Date().toISOString().split('T')[0];
    let todayQuery = `
      SELECT COUNT(*) as total
      FROM contents
      WHERE DATE(published_at) = ?
    `;
    const todayParams: any[] = [today];
    
    if (clientId) {
      todayQuery += ' AND client_id = ?';
      todayParams.push(clientId);
    }
    
    const todayPublished = await c.env.DB.prepare(todayQuery).bind(...todayParams).first();
    
    return c.json({
      success: true,
      data: {
        clients: {
          total: clientStats?.total || 0,
          active: clientStats?.active || 0
        },
        contents: {
          total: contentStats?.total || 0,
          draft: contentStats?.draft || 0,
          scheduled: contentStats?.scheduled || 0,
          published: contentStats?.published || 0,
          failed: contentStats?.failed || 0
        },
        projects: {
          total: projectStats?.total || 0
        },
        activity: {
          last7days: recentActivity?.total || 0,
          todayPublished: todayPublished?.total || 0
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '통계 조회 실패'
    }, 500);
  }
});

/**
 * 콘텐츠 발행 추이 (최근 30일)
 * GET /api/dashboard/trends?client_id=1
 */
app.get('/trends', async (c) => {
  try {
    const clientId = c.req.query('client_id');
    const days = parseInt(c.req.query('days') || '30');
    
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);
    const dateLimitStr = dateLimit.toISOString();
    
    let query = `
      SELECT 
        DATE(published_at) as date,
        COUNT(*) as count
      FROM contents
      WHERE published_at >= ? AND status = 'published'
    `;
    const params: any[] = [dateLimitStr];
    
    if (clientId) {
      query += ' AND client_id = ?';
      params.push(clientId);
    }
    
    query += ' GROUP BY DATE(published_at) ORDER BY date ASC';
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      data: {
        period: `최근 ${days}일`,
        trends: result.results
      }
    });
  } catch (error) {
    console.error('Dashboard Trends Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '추이 조회 실패'
    }, 500);
  }
});

/**
 * 클라이언트별 통계
 * GET /api/dashboard/by-client
 */
app.get('/by-client', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT 
        c.id,
        c.name,
        c.is_active,
        COUNT(DISTINCT ct.id) as content_count,
        COUNT(DISTINCT p.id) as project_count,
        SUM(CASE WHEN ct.status = 'published' THEN 1 ELSE 0 END) as published_count,
        MAX(ct.published_at) as last_published
      FROM clients c
      LEFT JOIN contents ct ON c.id = ct.client_id
      LEFT JOIN projects p ON c.id = p.client_id
      GROUP BY c.id, c.name, c.is_active
      ORDER BY published_count DESC
    `).all();
    
    return c.json({
      success: true,
      data: result.results
    });
  } catch (error) {
    console.error('Dashboard By Client Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '클라이언트별 통계 조회 실패'
    }, 500);
  }
});

/**
 * 최근 활동 목록
 * GET /api/dashboard/recent-activity?limit=10
 */
app.get('/recent-activity', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    
    const result = await c.env.DB.prepare(`
      SELECT 
        al.*,
        c.name as client_name
      FROM activity_logs al
      LEFT JOIN clients c ON al.client_id = c.id
      ORDER BY al.created_at DESC
      LIMIT ?
    `).bind(limit).all();
    
    return c.json({
      success: true,
      data: result.results.map((log: any) => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null
      }))
    });
  } catch (error) {
    console.error('Recent Activity Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '최근 활동 조회 실패'
    }, 500);
  }
});

/**
 * 예약된 콘텐츠 목록
 * GET /api/dashboard/scheduled?limit=10
 */
app.get('/scheduled', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    
    const result = await c.env.DB.prepare(`
      SELECT 
        ct.id,
        ct.title,
        ct.scheduled_at,
        ct.client_id,
        c.name as client_name
      FROM contents ct
      LEFT JOIN clients c ON ct.client_id = c.id
      WHERE ct.status = 'scheduled' AND ct.scheduled_at > datetime('now')
      ORDER BY ct.scheduled_at ASC
      LIMIT ?
    `).bind(limit).all();
    
    return c.json({
      success: true,
      data: result.results
    });
  } catch (error) {
    console.error('Scheduled Contents Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '예약 콘텐츠 조회 실패'
    }, 500);
  }
});

export default app;
