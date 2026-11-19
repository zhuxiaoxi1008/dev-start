import { useConfig } from '@/context/UserConfigContext'

export function BackgroundLayer() {
  const { settings } = useConfig()
  const { bg_type, wallpaper_a, wallpaper_b, solid_color, gradient_color } = settings

  switch (bg_type) {
    case 'gradient':
      return <div className="fixed inset-0 -z-10" style={{ background: gradient_color }} />
    case 'solid':
      return <div className="fixed inset-0 -z-10" style={{ backgroundColor: solid_color }} />
    case 'wallpaperA':
      if (!wallpaper_a) return null
      return (
        <div
          className="fixed inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${wallpaper_a})` }}
        />
      )
    case 'wallpaperB':
      if (!wallpaper_b) return null
      return (
        <div
          className="fixed inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${wallpaper_b})` }}
        />
      )
    default:
      return null
  }
}
