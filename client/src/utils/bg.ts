import type { UserSettings } from '../types/userConfig'

export function getBackgroundStyle(settings: UserSettings | null) {
  if (!settings) return {}

  const { bg_type, bg_solid_color, bg_gradient, bg_gradient_angle, wallpaper, layout_config } = settings

  switch (bg_type) {
    case 'solid':
      return {
        background: bg_solid_color,
      }
    case 'gradient':
      return {
        background: `linear-gradient(${bg_gradient_angle}deg, ${bg_gradient})`,
      }
    case 'wallpaperA':
      return {
        backgroundImage: `url(${wallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    case 'wallpaperB':
      return {
        backgroundImage: `url(${layout_config.wallpaperB})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    default:
      return {}
  }
}
