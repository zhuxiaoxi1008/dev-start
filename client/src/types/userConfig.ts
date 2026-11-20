// client/src/types/userConfig.ts
export type UserSettings = {
  // ... 保持你原来的设置不变
  id: string
  user_id: string
  bg_type: 'gradient' | 'solid' | 'wallpaperA' | 'wallpaperB'
  bg_solid_color: string
  bg_gradient: string
  bg_gradient_angle: number
  dark_mode: boolean
  sidebar_position: 'left' | 'right' | 'top' | 'bottom'
  layout_config: { wallpaperB: string }
  created_at: string
  updated_at: string
}

export type Bookmark = {
  id: string
  user_id: string
  category_id: string | null
  title: string
  url: string
  icon: string
  widget_type: 'link' | 'banner' // 组件类型
  w: number
  h: number
  x: number
  y: number
  sort_order: number
}