import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'
import clientsApi from './api/clients'
import contentsApi from './api/contents'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS 설정
app.use('/api/*', cors())

// 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './public' }))

// API 라우트
app.route('/api/clients', clientsApi)
app.route('/api/contents', contentsApi)

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
