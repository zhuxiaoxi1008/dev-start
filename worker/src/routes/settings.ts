import { Hono } from 'hono'
import { getSupabaseClient, EnvBindings } from '../db/supabase'

const route = new Hono<{ Bindings: EnvBindings }>()

export type UserSettings = {
  id: string
  user_id: string
  wallpaper: string
  theme: string
  layout_config: {
    wallpaperB: string
  }
  bg_type: 'gradient' | 'solid' | 'wallpaperA' | 'wallpaperB'
  bg_solid_color: string
  bg_gradient: string
  bg_gradient_angle: number
  created_at: string
  updated_at: string
}
type UserSettingsPatch = Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

// GET /api/settings
route.get('/', async (c) => {
  const supabase = getSupabaseClient(c.env)
  const userId = c.get('userId') as string

  // 查询当前用户配置
  const { data: userSetting, error: userErr } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!userErr) {
    return c.json(userSetting)
  }

  if (userErr.code !== 'PGRST116') {
    return c.json({ error: '查询失败', detail: userErr }, 500)
  }

  // 读取全局模板表 setting_template，取第一条
  const { data: templateRows, error: templateErr } = await supabase
    .from('setting_template')
    .select('*')
    .limit(1)

  if (templateErr || !templateRows || templateRows.length === 0) {
    return c.json({ error: '缺少全局默认模板，请检查 setting_template 表', detail: templateErr }, 500)
  }
  const templateRow = templateRows[0]

  // 复制模板，绑定当前用户uuid
  const newUserRecord = {
    user_id: userId,
    wallpaper: templateRow.wallpaper,
    theme: templateRow.theme,
    layout_config: templateRow.layout_config,
    bg_type: templateRow.bg_type,
    bg_solid_color: templateRow.bg_solid_color,
    bg_gradient: templateRow.bg_gradient,
    bg_gradient_angle: templateRow.bg_gradient_angle,
  }

  const { data: newRow, error: insertErr } = await supabase
    .from('user_settings')
    .insert(newUserRecord)
    .select('*')
    .single()

  if (insertErr) {
    return c.json({ error: '新建用户配置失败', detail: insertErr }, 500)
  }
  return c.json(newRow)
})

// PATCH /api/settings
route.patch('/', async (c) => {
  const supabase = getSupabaseClient(c.env)
  const userId = c.get('userId') as string
  const body = await c.req.json<UserSettingsPatch>()

  const allowedKeys: (keyof UserSettingsPatch)[] = [
    'wallpaper',
    'theme',
    'layout_config',
    'bg_type',
    'bg_solid_color',
    'bg_gradient',
    'bg_gradient_angle',
  ]
  const payload: Record<string, unknown> = {}
  for (const key of allowedKeys) {
    if (body[key] !== undefined) {
      payload[key] = body[key]
    }
  }
  if (Object.keys(payload).length === 0) {
    return c.json({ error: '没有合法更新字段' }, 400)
  }

  const { data, error } = await supabase
    .from('user_settings')
    .update(payload)
    .eq('user_id', userId)
    .select('*')
    .single()
  if (error) {
    return c.json({ error: '更新配置失败', detail: error }, 500)
  }
  return c.json(data)
})

export default route
