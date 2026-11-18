import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@supabase/supabase-js'

type Bindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

// 开启全局跨域，方便前端调试
app.use('/*', cors())

// 辅助函数：初始化 Supabase 客户端
const getSupabase = (env: Bindings) => {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error('Supabase credentials missing in wrangler environment')
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
}

// 1. 增强版健康检查：测试 Supabase 连通性
app.get('/api/health', async (c) => {
  try {
    const supabase = getSupabase(c.env)
    const { error } = await supabase.from('categories').select('id').limit(1)

    if (error) {
      return c.json({ status: 'db_error', error: error.message }, 400)
    }

    return c.json({
      status: 'ok',
      message: 'Supabase connected successfully via Cloudflare Workers edge!',
      dbTestResult: 'Query categories table passed',
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return c.json({ status: 'exception', error: err.message }, 500)
  }
})

// 2. 获取所有分类及关联的书签（按 sort_order 升序排列）
app.get('/api/bookmarks', async (c) => {
  try {
    const supabase = getSupabase(c.env)

    const { data, error } = await supabase
      .from('categories')
      .select('*, bookmarks(*)')
      .order('sort_order', { ascending: true })
      .order('sort_order', { referencedTable: 'bookmarks', ascending: true })

    if (error) {
      return c.json({ success: false, error: error.message }, 400)
    }

    return c.json({ success: true, data })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

// 3. 新增分类
app.post('/api/categories', async (c) => {
  try {
    const supabase = getSupabase(c.env)
    const { name, sort_order = 0 } = await c.req.json()

    if (!name) {
      return c.json({ success: false, error: '分类名称不能为空' }, 400)
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, sort_order }])
      .select()
      .single()

    if (error) {
      return c.json({ success: false, error: error.message }, 400)
    }

    return c.json({ success: true, data })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

// 4. 新增网址书签
app.post('/api/bookmarks', async (c) => {
  try {
    const supabase = getSupabase(c.env)
    const { category_id, title, url, icon = '🔗', sort_order = 0 } = await c.req.json()

    if (!category_id || !title || !url) {
      return c.json({ success: false, error: '分类ID、标题和网址均为必填项' }, 400)
    }

    const { data, error } = await supabase
      .from('bookmarks')
      .insert([{ category_id, title, url, icon, sort_order }])
      .select()
      .single()

    if (error) {
      return c.json({ success: false, error: error.message }, 400)
    }

    return c.json({ success: true, data })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

// 5. 删除书签
app.delete('/api/bookmarks/:id', async (c) => {
  try {
    const supabase = getSupabase(c.env)
    const id = c.req.param('id')

    const { error } = await supabase.from('bookmarks').delete().eq('id', id)

    if (error) {
      return c.json({ success: false, error: error.message }, 400)
    }

    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

// 6. 删除分类（级联删除该分类下的所有书签）
app.delete('/api/categories/:id', async (c) => {
  try {
    const supabase = getSupabase(c.env)
    const id = c.req.param('id')

    const { error } = await supabase.from('categories').delete().eq('id', id)

    if (error) {
      return c.json({ success: false, error: error.message }, 400)
    }

    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

// ==========================================
// 👇 以下为改造后的设置接口（7、8号）
// ==========================================

// 7. 获取个性化设置（按 user_id 隔离）
app.get('/api/settings', async (c) => {
  try {
    const supabase = getSupabase(c.env)
    const user_id = c.req.query('user_id')

    if (!user_id) {
      return c.json({ success: false, error: 'user_id 参数必填' }, 400)
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle()

    if (error) {
      return c.json({ success: false, error: error.message }, 400)
    }

    return c.json({ success: true, data })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

// 8. 更新或创建个性化设置（upsert + 渐变背景字段）
app.put('/api/settings', async (c) => {
  try {
    const supabase = getSupabase(c.env)
    const body = await c.req.json()
    const { user_id } = body

    if (!user_id) {
      return c.json({ success: false, error: 'user_id 必填' }, 400)
    }

    const payload = {
      user_id,
      bg_type: body.bg_type ?? 'gradient',
      bg_solid_color: body.bg_solid_color ?? '#0f172a',
      bg_gradient: body.bg_gradient ?? '#1e1b4b,#020617',
      bg_gradient_angle: body.bg_gradient_angle ?? 135,
      wallpaper: body.wallpaper ?? null,
      theme: body.theme ?? 'dark',
      layout_config: body.layout_config ?? {},
      updated_at: new Date().toISOString(),
    }

    // 基于 user_id 唯一约束做 upsert，存在则更新、不存在则插入
    const { data, error } = await supabase
      .from('user_settings')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      return c.json({ success: false, error: error.message }, 400)
    }

    return c.json({ success: true, data })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

export default app
