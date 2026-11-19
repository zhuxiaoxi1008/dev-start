import { Hono } from 'hono'
import { corsMiddleware } from './middleware/cors'
import { userIdMiddleware } from './middleware/auth'
import settingRoutes from './routes/settings'
import bookmarkRoutes from './routes/bookmarks'
import categoryRoutes from './routes/categories'

const app = new Hono()

app.use('*', corsMiddleware)
// 所有api路由统一校验X-User-Id
app.use('/api/*', userIdMiddleware)

app.route('/api/settings', settingRoutes)
app.route('/api/bookmarks', bookmarkRoutes)
app.route('/api/categories', categoryRoutes)

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', time: new Date().toISOString() })
})

export default app
