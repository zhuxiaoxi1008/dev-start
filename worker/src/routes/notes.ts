// worker/src/routes/notes.ts
// 记事本：每张卡片一条记录，按 user_id + widget_id 定位
import { Hono } from 'hono'
import { getSupabaseClient, type EnvBindings } from '../db/supabase'

const notes = new Hono<{ Bindings: EnvBindings }>()

// GET /api/notes?widget_id=xxx -> { data: note | null }
notes.get('/', async (c) => {
  const supabase = getSupabaseClient(c.env)
  const userId = c.get('userId') as string
  const widgetId = c.req.query('widget_id')
  if (!widgetId) return c.json({ error: '缺少 widget_id' }, 400)

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .eq('widget_id', widgetId)
    .maybeSingle()

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data: data ?? null })
})

// PUT /api/notes  { widget_id, content } -> 存在则更新，否则新建
notes.put('/', async (c) => {
  const supabase = getSupabaseClient(c.env)
  const userId = c.get('userId') as string
  const body = await c.req.json<{ widget_id?: string; content?: string }>()
  if (!body.widget_id) return c.json({ error: '缺少 widget_id' }, 400)
  const content = body.content ?? ''

  const { data: existing, error: findErr } = await supabase
    .from('notes')
    .select('id')
    .eq('user_id', userId)
    .eq('widget_id', body.widget_id)
    .maybeSingle()

  if (findErr) return c.json({ error: findErr.message }, 500)

  if (existing) {
    const { data, error } = await supabase
      .from('notes')
      .update({ content })
      .eq('id', existing.id)
      .eq('user_id', userId)
      .select('*')
      .single()
    if (error) return c.json({ error: error.message }, 500)
    return c.json(data)
  }

  const { data, error } = await supabase
    .from('notes')
    .insert({ user_id: userId, widget_id: body.widget_id, content })
    .select('*')
    .single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

export default notes
