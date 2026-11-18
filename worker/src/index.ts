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

export default app