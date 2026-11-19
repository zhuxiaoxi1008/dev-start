import { Hono } from 'hono'
import { getSupabaseClient, EnvBindings } from '../db/supabase'

const route = new Hono<{ Bindings: EnvBindings }>()

route.get('/', async (c) => {
  const supabase = getSupabaseClient(c.env)
  const userId = c.get('userId') as string
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

route.post('/', async (c) => {
  const supabase = getSupabaseClient(c.env)
  const userId = c.get('userId') as string
  const body = await c.req.json()
  const { data, error } = await supabase
    .from('categories')
    .insert({ ...body, user_id: userId })
    .select()
    .single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

route.patch('/:id', async (c) => {
  const supabase = getSupabaseClient(c.env)
  const userId = c.get('userId') as string
  const id = c.req.param('id')
  const body = await c.req.json()
  const { data, error } = await supabase
    .from('categories')
    .update(body)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

route.delete('/:id', async (c) => {
  const supabase = getSupabaseClient(c.env)
  const userId = c.get('userId') as string
  const id = c.req.param('id')
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ ok: true })
})

export default route
