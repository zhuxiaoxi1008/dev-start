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

export type UserSettingsPatch = Partial<
  Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>
