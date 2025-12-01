import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'
import clientsApi from './api/clients'
import contentsApi from './api/contents'
import customizerApi from './api/wordpress-customizer'
import trendsApi from './api/trends'
import projectsApi from './api/projects'
import activityLogsApi from './api/activity-logs'
import dashboardApi from './api/dashboard'
import { rateLimit, securityHeaders, csrfProtection } from './middleware/security'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// 보안 헤더 (모든 요청에 적용)
app.use('*', securityHeaders())

// Rate limiting (API 요청에만 적용)
app.use('/api/*', rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 60 // 1분당 최대 60개 요청
}))

// CSRF 방어 (API 요청에만 적용)
app.use('/api/*', csrfProtection())

// CORS 설정
app.use('/api/*', cors({
  origin: '*', // 프로덕션에서는 특정 도메인만 허용하도록 변경
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
}))

// 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './public' }))

// favicon 서빙 (404 에러 방지) - inline SVG 응답
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#3b82f6"/><text x="50" y="68" font-size="50" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold">W</text></svg>`
app.get('/favicon.ico', (c) => {
  return new Response(faviconSvg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' }
  })
})
app.get('/favicon.svg', (c) => {
  return new Response(faviconSvg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' }
  })
})

// API 라우트
app.route('/api/clients', clientsApi)
app.route('/api/contents', contentsApi)
app.route('/api/customizer', customizerApi)
app.route('/api/trends', trendsApi)
app.route('/api/projects', projectsApi)
app.route('/api/activity-logs', activityLogsApi)
app.route('/api/dashboard', dashboardApi)

// 렌더러
app.use(renderer)

// 메인 대시보드
app.get('/', (c) => {
  return c.render(
    <div>
      <h1>워드프레스 마케팅 자동화 대시보드</h1>
      <div id="app"></div>
    </div>
  )
})

export default app
