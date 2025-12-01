/**
 * Activity Logs API Routes
 * 활동 로그 API
 */

import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

/**
 * 활동 로그 목록 조회
 * GET /api/activity-logs?client_id=1&limit=50&offset=0
 */
app.get('/', async (c) => {
  try {
    const clientId = c.req.query('client_id');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    const status = c.req.query('status'); // success, error
    const action = c.req.query('action'); // content_created, content_published, etc.
    
    let query = `
      SELECT 
        al.*,
        c.name as client_name
      FROM activity_logs al
      LEFT JOIN clients c ON al.client_id = c.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (clientId) {
      query += ' AND al.client_id = ?';
      params.push(clientId);
    }
    
    if (status) {
      query += ' AND al.status = ?';
      params.push(status);
    }
    
    if (action) {
      query += ' AND al.action = ?';
      params.push(action);
    }
    
    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const stmt = c.env.DB.prepare(query).bind(...params);
    const result = await stmt.all();
    
    // 전체 개수 조회
    let countQuery = 'SELECT COUNT(*) as total FROM activity_logs WHERE 1=1';
    const countParams: any[] = [];
    
    if (clientId) {
      countQuery += ' AND client_id = ?';
      countParams.push(clientId);
    }
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (action) {
      countQuery += ' AND action = ?';
      countParams.push(action);
    }
    
    const countStmt = countParams.length > 0
      ? c.env.DB.prepare(countQuery).bind(...countParams)
      : c.env.DB.prepare(countQuery);
    const countResult = await countStmt.first();
    
    return c.json({
      success: true,
      data: {
        logs: result.results.map((log: any) => {
          let parsedDetails = null;
          if (log.details) {
            try {
              parsedDetails = JSON.parse(log.details);
            } catch {
              // JSON이 아닌 경우 문자열 그대로 사용
              parsedDetails = { message: log.details };
            }
          }
          return {
            ...log,
            details: parsedDetails
          };
        }),
        pagination: {
          total: countResult?.total || 0,
          limit,
          offset,
          hasMore: offset + limit < (countResult?.total as number || 0)
        }
      }
    });
  } catch (error) {
    console.error('Activity Logs List Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '활동 로그 조회 실패'
    }, 500);
  }
});

/**
 * 활동 로그 생성
 * POST /api/activity-logs
 */
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { client_id, action, details, status } = body;
    
    if (!client_id || !action || !status) {
      return c.json({
        success: false,
        error: 'client_id, action, status는 필수입니다'
      }, 400);
    }
    
    const now = new Date().toISOString();
    const detailsJson = details ? JSON.stringify(details) : null;
    
    const result = await c.env.DB.prepare(`
      INSERT INTO activity_logs (client_id, action, details, status, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(client_id, action, detailsJson, status, now).run();
    
    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        client_id,
        action,
        details,
        status,
        created_at: now
      }
    });
  } catch (error) {
    console.error('Activity Log Create Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '활동 로그 생성 실패'
    }, 500);
  }
});

/**
 * 최근 활동 요약
 * GET /api/activity-logs/summary?client_id=1&days=7
 */
app.get('/summary', async (c) => {
  try {
    const clientId = c.req.query('client_id');
    const days = parseInt(c.req.query('days') || '7');
    
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);
    const dateLimitStr = dateLimit.toISOString();
    
    let baseWhere = `WHERE created_at >= ?`;
    const baseParams: any[] = [dateLimitStr];
    
    if (clientId) {
      baseWhere += ' AND client_id = ?';
      baseParams.push(clientId);
    }
    
    // 액션별 통계
    const actionStats = await c.env.DB.prepare(`
      SELECT action, COUNT(*) as count
      FROM activity_logs
      ${baseWhere}
      GROUP BY action
      ORDER BY count DESC
    `).bind(...baseParams).all();
    
    // 상태별 통계
    const statusStats = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as count
      FROM activity_logs
      ${baseWhere}
      GROUP BY status
    `).bind(...baseParams).all();
    
    // 일별 통계
    const dailyStats = await c.env.DB.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM activity_logs
      ${baseWhere}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `).bind(...baseParams).all();
    
    return c.json({
      success: true,
      data: {
        period: `최근 ${days}일`,
        byAction: actionStats.results,
        byStatus: statusStats.results,
        byDate: dailyStats.results
      }
    });
  } catch (error) {
    console.error('Activity Summary Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '활동 요약 조회 실패'
    }, 500);
  }
});

/**
 * 활동 로그 삭제 (오래된 로그 정리)
 * DELETE /api/activity-logs?older_than_days=30
 */
app.delete('/', async (c) => {
  try {
    const olderThanDays = parseInt(c.req.query('older_than_days') || '30');
    
    if (olderThanDays < 7) {
      return c.json({
        success: false,
        error: '최소 7일 이상 지난 로그만 삭제할 수 있습니다'
      }, 400);
    }
    
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - olderThanDays);
    const dateLimitStr = dateLimit.toISOString();
    
    const result = await c.env.DB.prepare(`
      DELETE FROM activity_logs WHERE created_at < ?
    `).bind(dateLimitStr).run();
    
    return c.json({
      success: true,
      message: `${olderThanDays}일 이전 로그가 삭제되었습니다`,
      deleted_count: result.meta.changes
    });
  } catch (error) {
    console.error('Activity Log Delete Error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '활동 로그 삭제 실패'
    }, 500);
  }
});

export default app;
