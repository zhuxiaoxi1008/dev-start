// worker/src/routes/bookmarks.ts
import { Hono } from 'hono'
import { getSupabaseClient, type EnvBindings } from '../db/supabase'
import { userIdMiddleware } from '../middleware/auth'

// 将 EnvBindings 传给 Hono，这样 c.env 就有类型提示了
const bookmarks = new Hono<{ Bindings: EnvBindings }>()

// 1. 获取当前用户的所有书签
bookmarks.get('/', userIdMiddleware, async (c) => {
  const userId = c.get('userId')
  const supabase = getSupabaseClient(c.env)
  
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('获取书签失败:', error)
    return c.json({ error: error.message }, 500)
  }
  
  return c.json({ data })
})

// 2. 新增书签/小组件（Sidebar 加号面板调用）
bookmarks.post('/', userIdMiddleware, async (c) => {
  const userId = c.get('userId')
  const supabase = getSupabaseClient(c.env)
  const body = await c.req.json<{
    title?: string
    url?: string
    icon?: string
    widget_type?: string
    category_id?: string | null
    w?: number
    h?: number
    x?: number
    y?: number
    sort_order?: number
  }>()

  const title = (body.title || '').trim()
  if (!title) return c.json({ error: '标题不能为空' }, 400)

  const { data, error } = await supabase
    .from('bookmarks')
    .insert({
      user_id: userId,
      title,
      url: body.url ?? '',
      icon: body.icon ?? '',
      widget_type: body.widget_type ?? 'link',
      category_id: body.category_id ?? null,
      w: body.w ?? 2,
      h: body.h ?? 2,
      x: body.x ?? 0,
      y: body.y ?? 0,
      sort_order: body.sort_order ?? 0,
    })
    .select('*')
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

// 3. 更新书签位置（拖拽后保存）
bookmarks.patch('/layout', userIdMiddleware, async (c) => {
  const userId = c.get('userId')
  const supabase = getSupabaseClient(c.env)
  
  // 接收前端传过来的拖拽数据数组
  const layouts = await c.req.json() 

  // 批量更新位置
  const promises = layouts.map((item: any) => 
    supabase.from('bookmarks')
      .update({ x: item.x, y: item.y, w: item.w, h: item.h })
      .eq('id', item.i)
      .eq('user_id', userId)
  )
  
  const results = await Promise.all(promises)
  
  // 检查是否所有更新都成功
  const failed = results.find(r => r.error)
  if (failed) {
    return c.json({ error: '部分布局更新失败' }, 500)
  }

  return c.json({ success: true })
})

// 4. 删除书签/小组件（右键菜单"移除组件"调用）
bookmarks.delete('/:id', userIdMiddleware, async (c) => {
  const userId = c.get('userId')
  const supabase = getSupabaseClient(c.env)
  const id = c.req.param('id')

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

export default bookmarks