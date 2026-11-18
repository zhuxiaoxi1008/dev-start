import { useState } from 'react'
import { useUserConfig } from '../context/UserConfigContext'
import { imageWallpaperPresets, gradientPresets, solidPresets } from '../utils/bg'

export default function WallpaperSettingPanel() {
  const { settings, updateSettings } = useUserConfig()
  const [activeTab, setActiveTab] = useState<'image' | 'gradient' | 'solid'>(
    settings.bg_type as 'image' | 'gradient' | 'solid'
  )

  // 切换 Tab 同时更新背景类型
  const handleTabChange = (tab: 'image' | 'gradient' | 'solid') => {
    setActiveTab(tab)
    if (tab === 'image' && !settings.wallpaper) {
      // 首次切到图片壁纸，自动选中第一张
      updateSettings({
        bg_type: 'image',
        wallpaper: imageWallpaperPresets[0].url
      })
    } else {
      updateSettings({ bg_type: tab })
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-white">壁纸设置</p>

      {/* 分类 Tab */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg">
        {[
          { key: 'image', label: '图片壁纸' },
          { key: 'gradient', label: '渐变壁纸' },
          { key: 'solid', label: '纯色壁纸' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabChange(tab.key as 'image' | 'gradient' | 'solid')}
            className={`flex-1 py-1.5 rounded-md text-xs transition ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 图片壁纸预设 */}
      {activeTab === 'image' && (
        <div className="grid grid-cols-2 gap-2">
          {imageWallpaperPresets.map((item) => (
            <button
              key={item.url}
              type="button"
              onClick={() => updateSettings({ bg_type: 'image', wallpaper: item.url })}
              className={`relative h-20 rounded-lg overflow-hidden border transition hover:scale-[1.02] ${
                settings.bg_type === 'image' && settings.wallpaper === item.url
                  ? 'border-indigo-400 ring-2 ring-indigo-400/50'
                  : 'border-slate-700'
              }`}
            >
              <img
                src={item.url}
                alt={item.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-2 py-0.5 truncate">
                {item.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 渐变壁纸预设 */}
      {activeTab === 'gradient' && (
        <>
          <div className="grid grid-cols-4 gap-2">
            {gradientPresets.map((wp) => (
              <button
                key={wp.name}
                type="button"
                onClick={() => updateSettings({
                  bg_type: 'gradient',
                  bg_gradient: wp.value,
                  bg_gradient_angle: wp.angle
                })}
                className={`h-14 rounded-lg border text-[10px] text-white drop-shadow transition hover:scale-[1.02] ${
                  settings.bg_type === 'gradient' && settings.bg_gradient === wp.value
                    ? 'border-indigo-400 ring-2 ring-indigo-400/50'
                    : 'border-slate-700'
                }`}
                style={{ background: `linear-gradient(${wp.angle}deg, ${wp.value})` }}
              >
                {wp.name}
              </button>
            ))}
          </div>

          <div className="pt-1">
            <label className="text-xs text-slate-400">
              渐变角度：{settings.bg_gradient_angle}°
            </label>
            <input
              type="range"
              min="0"
              max="360"
              value={settings.bg_gradient_angle}
              onChange={(e) => updateSettings({ bg_gradient_angle: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>
        </>
      )}

      {/* 纯色壁纸预设 */}
      {activeTab === 'solid' && (
        <div className="grid grid-cols-6 gap-2">
          {solidPresets.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => updateSettings({ bg_type: 'solid', bg_solid_color: item.value })}
              className={`h-10 rounded-lg border transition hover:scale-105 ${
                settings.bg_type === 'solid' && settings.bg_solid_color === item.value
                  ? 'border-indigo-400 ring-2 ring-indigo-400/50'
                  : 'border-slate-700'
              }`}
              style={{ backgroundColor: item.value }}
              title={item.name}
            />
          ))}
        </div>
      )}

      {/* 自定义壁纸预留提示 */}
      <div className="pt-2 border-t border-slate-800">
        <p className="text-xs text-slate-500">后续支持自定义上传本地图片壁纸</p>
      </div>
    </div>
  )
}
