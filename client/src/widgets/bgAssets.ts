// client/src/widgets/bgAssets.ts
// 事件类组件的预设背景图（src/assets/bg 下 20 张）
// 用 Vite 的 import.meta.glob 静态收集，打包后走指纹 URL
const modules = import.meta.glob('../assets/bg/*.jpg', { eager: true, import: 'default' }) as Record<string, string>

export interface BgPreset { name: string; url: string }

export const BG_PRESETS: BgPreset[] = Object.entries(modules)
  .map(([path, url]) => ({
    name: path.split('/').pop()!.replace('.jpg', ''),
    url,
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

// bgImage 存的是预设名（如 background01）或完整 URL；这里统一解析成可用地址
export function resolveBgImage(bgImage: string): string {
  if (!bgImage) return BG_PRESETS[0]?.url ?? ''
  if (/^(https?:|data:|blob:|\/)/.test(bgImage)) return bgImage
  const hit = BG_PRESETS.find(p => p.name === bgImage)
  return hit?.url ?? ''
}