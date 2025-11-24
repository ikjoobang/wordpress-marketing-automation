/**
 * WordPress Customizer API Routes
 * 블로그 꾸미기: 테마, 색상, 위젯, 메뉴 관리
 */

import { Hono } from 'hono';
import { WordPressClient } from '../lib/wordpress';
import type { Client } from '../types/database';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

/**
 * 테마 목록 조회
 */
app.get('/clients/:clientId/themes', async (c) => {
  try {
    const clientId = c.req.param('clientId');
    
    // 클라이언트 정보 조회
    const client = await c.env.DB.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).bind(clientId).first() as Client | null;

    if (!client) {
      return c.json({ success: false, error: '클라이언트를 찾을 수 없습니다' }, 404);
    }

    const wpClient = new WordPressClient({
      siteUrl: client.wordpress_url,
      username: client.wordpress_username,
      password: client.wordpress_password,
    });

    // WordPress REST API로 테마 목록 가져오기
    const response = await fetch(`${client.wordpress_url}/wp-json/wp/v2/themes`, {
      headers: {
        'Authorization': wpClient['authHeader'],
      },
    });

    const themes = await response.json();

    return c.json({ 
      success: true, 
      data: themes
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '테마 조회 실패' 
    }, 500);
  }
});

/**
 * 활성 테마 변경
 */
app.post('/clients/:clientId/themes/:themeId/activate', async (c) => {
  try {
    const { clientId, themeId } = c.req.param();
    
    const client = await c.env.DB.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).bind(clientId).first() as Client | null;

    if (!client) {
      return c.json({ success: false, error: '클라이언트를 찾을 수 없습니다' }, 404);
    }

    const wpClient = new WordPressClient({
      siteUrl: client.wordpress_url,
      username: client.wordpress_username,
      password: client.wordpress_password,
    });

    // 테마 활성화
    const response = await fetch(`${client.wordpress_url}/wp-json/wp/v2/themes/${themeId}`, {
      method: 'POST',
      headers: {
        'Authorization': wpClient['authHeader'],
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'active' }),
    });

    const result = await response.json();

    // 활동 로그 기록
    await c.env.DB.prepare(`
      INSERT INTO activity_logs (client_id, action, details, status)
      VALUES (?, ?, ?, ?)
    `).bind(
      clientId,
      'theme_changed',
      `테마 변경: ${themeId}`,
      'success'
    ).run();

    return c.json({ 
      success: true, 
      data: result,
      message: '테마가 변경되었습니다'
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '테마 변경 실패' 
    }, 500);
  }
});

/**
 * 사이트 설정 조회 (제목, 설명, 로고 등)
 */
app.get('/clients/:clientId/settings', async (c) => {
  try {
    const clientId = c.req.param('clientId');
    
    const client = await c.env.DB.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).bind(clientId).first() as Client | null;

    if (!client) {
      return c.json({ success: false, error: '클라이언트를 찾을 수 없습니다' }, 404);
    }

    const wpClient = new WordPressClient({
      siteUrl: client.wordpress_url,
      username: client.wordpress_username,
      password: client.wordpress_password,
    });

    // 사이트 설정 가져오기
    const response = await fetch(`${client.wordpress_url}/wp-json`, {
      headers: {
        'Authorization': wpClient['authHeader'],
      },
    });

    const settings = await response.json();

    return c.json({ 
      success: true, 
      data: {
        name: settings.name,
        description: settings.description,
        url: settings.url,
        home: settings.home,
      }
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '설정 조회 실패' 
    }, 500);
  }
});

/**
 * 사이트 설정 업데이트
 */
app.put('/clients/:clientId/settings', async (c) => {
  try {
    const clientId = c.req.param('clientId');
    const body = await c.req.json<{
      title?: string;
      description?: string;
      site_icon?: number;
    }>();
    
    const client = await c.env.DB.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).bind(clientId).first() as Client | null;

    if (!client) {
      return c.json({ success: false, error: '클라이언트를 찾을 수 없습니다' }, 404);
    }

    const wpClient = new WordPressClient({
      siteUrl: client.wordpress_url,
      username: client.wordpress_username,
      password: client.wordpress_password,
    });

    // 설정 업데이트
    const response = await fetch(`${client.wordpress_url}/wp-json/wp/v2/settings`, {
      method: 'POST',
      headers: {
        'Authorization': wpClient['authHeader'],
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    // 활동 로그 기록
    await c.env.DB.prepare(`
      INSERT INTO activity_logs (client_id, action, details, status)
      VALUES (?, ?, ?, ?)
    `).bind(
      clientId,
      'settings_updated',
      `사이트 설정 업데이트`,
      'success'
    ).run();

    return c.json({ 
      success: true, 
      data: result,
      message: '설정이 업데이트되었습니다'
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '설정 업데이트 실패' 
    }, 500);
  }
});

/**
 * 메뉴 목록 조회
 */
app.get('/clients/:clientId/menus', async (c) => {
  try {
    const clientId = c.req.param('clientId');
    
    const client = await c.env.DB.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).bind(clientId).first() as Client | null;

    if (!client) {
      return c.json({ success: false, error: '클라이언트를 찾을 수 없습니다' }, 404);
    }

    // 메뉴 기능은 WordPress 플러그인이나 테마 지원 필요
    return c.json({ 
      success: true, 
      data: {
        message: '메뉴 관리는 WordPress 대시보드에서 직접 설정해주세요',
        dashboard_url: `${client.wordpress_url}/wp-admin/nav-menus.php`
      }
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '메뉴 조회 실패' 
    }, 500);
  }
});

/**
 * 색상 프리셋 저장
 */
app.post('/clients/:clientId/colors', async (c) => {
  try {
    const clientId = c.req.param('clientId');
    const body = await c.req.json<{
      primary_color?: string;
      secondary_color?: string;
      text_color?: string;
      background_color?: string;
    }>();
    
    // D1에 색상 설정 저장 (WordPress에는 테마별로 다르게 적용됨)
    await c.env.DB.prepare(`
      INSERT INTO activity_logs (client_id, action, details, status)
      VALUES (?, ?, ?, ?)
    `).bind(
      clientId,
      'color_preset_saved',
      `색상 설정 저장: ${JSON.stringify(body)}`,
      'success'
    ).run();

    return c.json({ 
      success: true, 
      data: body,
      message: '색상 설정이 저장되었습니다'
    });
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '색상 설정 실패' 
    }, 500);
  }
});

export default app;
