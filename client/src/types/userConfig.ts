// client/src/types/userConfig.ts
// 背景类型：与 worker/src/routes/settings.ts 中的 BgType 保持一致
import type { WidgetType, WidgetsConfigMap } from './widgets'

export type BgType = 'gradient' | 'solid' | 'wallpaperA' | 'wallpaperB'

export type UserSettings = {
  id: string
  user_id: string
  bg_type: BgType
  bg_solid_color: string
  bg_gradient: string
  bg_gradient_angle: number
  // 壁纸A：预设/推荐壁纸；壁纸B：自定义图片地址
  wallpaper_a: string
  wallpaper_b: string
  theme: string
  dark_mode: boolean
  sidebar_position: 'left' | 'right' | 'top' | 'bottom'
  layout_config: { wallpaperB?: string; widgets?: unknown[] }
  widgets_config: WidgetsConfigMap
  created_at: string
  updated_at: string
}

export type UserSettingsPatch = Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

export type Category = {
  id: string
  user_id: string | null
  name: string
  sort_order: number
  created_at?: string
}

export type Bookmark = {
  id: string
  user_id: string
  category_id: string | null
  title: string
  url: string
  icon: string
  widget_type: WidgetType // 组件类型
  w: number
  h: number
  x: number
  y: number
  sort_order: number
}