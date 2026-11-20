import { Hono } from 'hono'
import { getSupabaseClient, EnvBindings } from '../db/supabase'

const route = new Hono<{ Bindings: EnvBindings }>()

// 背景类型：与 client/src/types/userConfig.ts 中的 BgType 保持一致
export type BgType = 'gradient' | 'solid' | 'wallpaperA' | 'wallpaperB'

export type UserSettings = {
  id: string
  user_id: string
  theme: string
  layout_config: { wallpaperB?: string }
  bg_type: BgType
  bg_solid_color: string
  bg_gradient: string
  bg_gradient_angle: number
  wallpaper_a: string
  wallpaper_b: string
  dark_mode: boolean
  sidebar_position: 'left' | 'right' | 'top' | 'bottom'
  widgets_config: Record<string, unknown>
  created_at: string
  updated_at: string
}

type UserSettingsPatch = Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

const VALID_BG_TYPES: BgType[] = ['gradient', 'solid', 'wallpaperA', 'wallpaperB']

route.get('/', async (c) => {
  const supabase = getSupabaseClient(c.env)
  const userId = c.get('userId') as string

  console.log(`[GET /api/settings] 请求 userId: ${userId}`)

  const { data: userSetting, error: userErr } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!userErr && userSetting) {
    return c.json(userSetting)
  }

  if (userErr && userErr.code !== 'PGRST116') {
    console.error('❌ 查询用户设置失败:', userErr)
    return c.json({ error: '查询失败', detail: userErr.message }, 500)
  }

  console.log(`[GET /api/settings] 新用户，读取 setting_template 全局模板...`)
  const { data: templateRows, error: templateErr } = await supabase
    .from('setting_template')
    .select('*')
    .limit(1)

  if (templateErr || !templateRows || templateRows.length === 0) {
    return c.json({ error: '缺少全局默认模板', detail: templateErr?.message }, 500)
  }
  const templateRow = templateRows[0]

  const newUserRecord = {
    user_id: userId,
    theme: templateRow.theme,
    layout_config: templateRow.layout_config,
    bg_type: templateRow.bg_type,
    bg_solid_color: templateRow.bg_solid_color,
    bg_gradient: templateRow.bg_gradient,
    bg_gradient_angle: templateRow.bg_gradient_angle,
    wallpaper_a: templateRow.wallpaper_a ?? '',
    wallpaper_b: templateRow.wallpaper_b ?? '',
    dark_mode: false,
    sidebar_position: 'left'
  }

  const { data: newRow, error: insertErr } = await supabase
    .from('user_settings')
    .insert(newUserRecord)
    .select('*')
    .single()

  // 并发冲突兜底：23505 = 唯一冲突（以后你再加索引才会触发）
  if (insertErr) {
    if (insertErr.code === '23505') {
      console.log(`[GET /api/settings] 并发竞争，用户 ${userId} 已存在，重新查询`)
      const { data: existRow } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single()
      return c.json(existRow)
    }
    console.error('❌ 新建用户配置失败:', insertErr)
    return c.json({ error: '新建用户配置失败', detail: insertErr.message }, 500)
  }

  // 默认书签由数据库触发器 trigger_insert_default_bookmarks 在插入 user_settings 时自动写入，
  // 此处不再重复插入，避免新用户拿到两套默认书签。
  console.log(`[GET /api/settings] 用户配置创建成功`)
  return c.json(newRow)
})

route.patch('/', async (c) => {
  const supabase = getSupabaseClient(c.env)
  const userId = c.get('userId') as string
  const body = await c.req.json<UserSettingsPatch>()

  const allowedKeys: (keyof UserSettingsPatch)[] = [
    'theme', 'layout_config', 'bg_type',
    'bg_solid_color', 'bg_gradient', 'bg_gradient_angle',
    'wallpaper_a', 'wallpaper_b',
    'dark_mode', 'sidebar_position', 'widgets_config'
  ]
  const payload: Record<string, unknown> = {}
  for (const key of allowedKeys) {
    if (body[key] !== undefined) {
      payload[key] = body[key]
    }
  }
  if (Object.keys(payload).length === 0) return c.json({ error: '没有合法更新字段' }, 400)

  // 只接受四种合法背景类型，避免脏数据写入后前端渲染不出背景
  if (payload.bg_type && !VALID_BG_TYPES.includes(payload.bg_type as BgType)) {
    return c.json({ error: 'bg_type 取值非法', detail: String(payload.bg_type) }, 400)
  }

  const { data, error } = await supabase
    .from('user_settings')
    .update(payload)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) return c.json({ error: '更新配置失败', detail: error.message }, 500)
  return c.json(data)
})

export default route
