// worker/src/routes/todos.ts
// 待办事项 CRUD：按 user_id + widget_id 隔离，供前端待办小组件使用
import { Hono } from 'hono'
import { getSupabaseClient, type EnvBindings } from '../db/supabase'

const todos = new Hono<{ Bindings: EnvBindings }>()

// GET /api/todos?widget_id=xxx
todos.get('/', async (c) => {
  const supabase = getSupabaseClient(c.env)
  const userId = c.get('userId') as string
  const widgetId = c.req.query('widget_id')

  let query = supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (widgetId) query = query.eq('widget_id', widgetId)

  const { data, error } = await query
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data })
})

// POST /api/todos  { widget_id, content }
todos.post('/', async (c) => {
  const supabase = getSupabaseClient(c.env)
  const userId = c.get('userId') as string
  const body = await c.req.json<{ widget_id?: string; content?: string }>()
  const content = (body.content || '').trim()
  if (!content) return c.json({ error: '待办内容不能为空' }, 400)

  let lastQuery = supabase
    .from('todos')
    .select('sort_order')
    .eq('user_id', userId)

  if (body.widget_id) lastQuery = lastQuery.eq('widget_id', body.widget_id)

  const { data: last } = await lastQuery
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (last?.[0]?.sort_order ?? 0) + 1

  const { data, error } = await supabase
    .from('todos')
    .insert({ user_id: userId, widget_id: body.widget_id ?? null, content, sort_order: nextOrder })
    .select('*')
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

// PATCH /api/todos/:id  { content?, done?, sort_order? }
todos.patch('/:id', async (c) => {
  const supabase = getSupabaseClient(c.env)
  const userId = c.get('userId') as string
  const id = c.req.param('id')
  const body = await c.req.json<{ content?: string; done?: boolean; sort_order?: number }>()

  const payload: Record<string, unknown> = {}
  if (typeof body.content === 'string') payload.content = body.content
  if (typeof body.done === 'boolean') payload.done = body.done
  if (typeof body.sort_order === 'number') payload.sort_order = body.sort_order
  if (Object.keys(payload).length === 0) return c.json({ error: '没有合法更新字段' }, 400)

  const { data, error } = await supabase
    .from('todos')
    .update(payload)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// DELETE /api/todos/:id
todos.delete('/:id', async (c) => {
  const supabase = getSupabaseClient(c.env)
  const userId = c.get('userId') as string
  const id = c.req.param('id')

  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ ok: true })
})

export default todos
