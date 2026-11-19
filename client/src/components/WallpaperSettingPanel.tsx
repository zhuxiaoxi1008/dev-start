import { useConfig } from '../context/UserConfigContext'
import { Check } from 'lucide-react'
import type { UserSettingsPatch } from '../types/userConfig'

const bgTypeList = [
  { label: '渐变背景', value: 'gradient' },
  { label: '纯色背景', value: 'solid' },
  { label: '壁纸A', value: 'wallpaperA' },
  { label: '壁纸B', value: 'wallpaperB' },
]

export function WallpaperSettingPanel() {
  const { settings, updateSettings } = useConfig()
  if (!settings) return null

  const handleChangeBgType = (v: string) => {
    updateSettings({ bg_type: v as UserSettingsPatch['bg_type'] })
  }

  const handleGradientChange = (val: string) => {
    updateSettings({ bg_gradient: val })
  }
  const handleAngleChange = (val: number) => {
    updateSettings({ bg_gradient_angle: val })
  }
  const handleSolidColor = (val: string) => {
    updateSettings({ bg_solid_color: val })
  }
  const handleWallpaperA = (url: string) => {
    updateSettings({ wallpaper: url })
  }
  const handleWallpaperB = (url: string) => {
    updateSettings({ layout_config: { ...settings.layout_config, wallpaperB: url } })
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-medium mb-3">背景类型</div>
        <div className="grid grid-cols-2 gap-2">
          {bgTypeList.map(item => (
            <button
              key={item.value}
              onClick={() => handleChangeBgType(item.value)}
              className={`border rounded-lg px-3 py-2 flex items-center justify-between ${
                settings.bg_type === item.value ? 'border-blue-500 bg-blue-50' : ''
              }`}
            >
              {item.label}
              {settings.bg_type === item.value && <Check size={16} />}
            </button>
          ))}
        </div>
      </div>

      {settings.bg_type === 'gradient' && (
        <div className="space-y-4">
          <div>
            <label className="text-sm">渐变色值（逗号分隔）</label>
            <input
              className="w-full border rounded px-2 py-1 mt-1"
              value={settings.bg_gradient}
              onChange={(e) => handleGradientChange(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm">渐变角度 {settings.bg_gradient_angle}°</label>
            <input
              type="range"
              min="0"
              max="360"
              value={settings.bg_gradient_angle}
              onChange={(e) => handleAngleChange(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      )}

      {settings.bg_type === 'solid' && (
        <div>
          <label className="text-sm">纯色</label>
          <input
            type="color"
            value={settings.bg_solid_color}
            onChange={(e) => handleSolidColor(e.target.value)}
            className="mt-1"
          />
        </div>
      )}

      {(settings.bg_type === 'wallpaperA' || settings.bg_type === 'wallpaperB') && (
        <div className="space-y-4">
          <div>
            <label className="text-sm">壁纸A 链接</label>
            <input
              className="w-full border rounded px-2 py-1 mt-1"
              value={settings.wallpaper}
              onChange={(e) => handleWallpaperA(e.target.value)}
              placeholder="https://xxx.jpg"
            />
          </div>
          <div>
            <label className="text-sm">壁纸B 链接</label>
            <input
              className="w-full border rounded px-2 py-1 mt-1"
              value={settings.layout_config.wallpaperB}
              onChange={(e) => handleWallpaperB(e.target.value)}
              placeholder="https://xxx.jpg"
            />
          </div>
        </div>
      )}
    </div>
  )
}
