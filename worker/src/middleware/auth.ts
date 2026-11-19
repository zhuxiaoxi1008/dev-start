import type { Context, Next } from 'hono'

export async function userIdMiddleware(c: Context, next: Next) {
  const userId = c.req.header('X-User-Id')
  if (!userId) {
    return c.json({ error: '缺少 X-User-Id 请求头' }, 400)
  }
  c.set('userId', userId)
  await next()
}
