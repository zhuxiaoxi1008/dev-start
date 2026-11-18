import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// 配置全局跨域
app.use('/*', cors())

// 根路由测试
app.get('/', (c) => {
  return c.json({ message: 'Welcome to DevStart API (Hono + Cloudflare Workers)' })
})

// 后端健康检查与联调接口
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    message: 'Backend is running smoothly on Cloudflare Workers edge!',
    timestamp: new Date().toISOString() 
  })
})

export default app