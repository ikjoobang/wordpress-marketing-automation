import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'
import clientsApi from './api/clients'
import contentsApi from './api/contents'
import customizerApi from './api/wordpress-customizer'
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

// API 라우트
app.route('/api/clients', clientsApi)
app.route('/api/contents', contentsApi)
app.route('/api/customizer', customizerApi)

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
