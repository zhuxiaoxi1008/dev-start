import type { UserSettings } from '../types/userConfig'

function gradientStyle(settings: UserSettings) {
  return {
    background: `linear-gradient(${settings.bg_gradient_angle}deg, ${settings.bg_gradient})`,
  }
}

export function getBackgroundStyle(settings: UserSettings | null) {
  if (!settings) return {}

  const { bg_type, bg_solid_color, wallpaper_a, wallpaper_b } = settings

  switch (bg_type) {
    case 'solid':
      return { background: bg_solid_color }
    case 'wallpaperA':
      // 未配置壁纸地址时回退到渐变，避免整页空白
      if (!wallpaper_a) return gradientStyle(settings)
      return {
        backgroundImage: `url(${wallpaper_a})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    case 'wallpaperB':
      if (!wallpaper_b) return gradientStyle(settings)
      return {
        backgroundImage: `url(${wallpaper_b})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    case 'gradient':
    default:
      return gradientStyle(settings)
  }
}
