import { useConfig } from "@/context/UserConfigContext"
import { cn } from "@/lib/utils"

export function BackgroundLayer() {
  const { settings } = useConfig()

  let bgStyle: React.CSSProperties = {}

  if (settings.bg_type === "gradient") {
    const colors = settings.bg_gradient.split(",").map(s => s.trim()).join(",")
    bgStyle = {
      background: `linear-gradient(${settings.bg_gradient_angle}deg, ${colors})`,
    }
  } else if (settings.bg_type === "solid") {
    bgStyle = { background: settings.bg_solid_color }
  } else if (settings.bg_type === "wallpaperA" && settings.wallpaper) {
    bgStyle = {
      backgroundImage: `url(${settings.wallpaper})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }
  } else if (settings.bg_type === "wallpaperB" && settings.layout_config.wallpaperB) {
    bgStyle = {
      backgroundImage: `url(${settings.layout_config.wallpaperB})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-0 -z-10 bg-transition",
        settings.bg_type.startsWith("wallpaper") && "bg-black/40"
      )}
      style={bgStyle}
    />
  )
}
