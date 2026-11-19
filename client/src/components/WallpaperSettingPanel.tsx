import { useConfig } from '@/context/UserConfigContext'

const presetWallpaperA = [
  { label: '浅蓝渐变', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80' },
  { label: '云海远山', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80' },
  { label: '淡紫黄昏', url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&q=80' },
  { label: '干净冰川', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&q=80' },
  { label: '柔光湖面', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80' },
]

export function WallpaperSettingPanel() {
  const { settings, patchSetting } = useConfig()
  const { dark_mode, bg_type, wallpaper_a, wallpaper_b } = settings

  const openRecommendWallpaper = () => {
    window.open('https://unsplash.com/s/photos/soft-gradient-wallpaper', '_blank')
  }

  return (
    <div className="space-y-4 text-black">
      {/* 深色模式 */}
      <div className="flex items-center justify-between">
        <span>深色模式</span>
        <button
          onClick={() => patchSetting({ dark_mode: !dark_mode })}
          className={`w-11 h-6 rounded-full transition-colors ${dark_mode ? 'bg-black' : 'bg-gray-200'}`}
        >
          <div
            className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${dark_mode ? 'translate-x-5' : 'translate-x-0.5'}`}
          />
        </button>
      </div>

      {/* 背景类型 4按钮 2行2列 */}
      <div>
        <div className="mb-2">背景类型</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => patchSetting({ bg_type: 'gradient' })}
            className={`py-2.5 rounded-xl border transition-all ${
              bg_type === 'gradient'
                ? 'bg-black text-white border-black'
                : 'bg-white border-gray-200 text-black'
            }`}
          >
            渐变背景
          </button>
          <button
            onClick={() => patchSetting({ bg_type: 'solid' })}
            className={`py-2.5 rounded-xl border transition-all ${
              bg_type === 'solid'
                ? 'bg-black text-white border-black'
                : 'bg-white border-gray-200 text-black'
            }`}
          >
            纯色背景
          </button>
          <button
            onClick={() => patchSetting({ bg_type: 'wallpaperA' })}
            className={`py-2.5 rounded-xl border transition-all ${
              bg_type === 'wallpaperA'
                ? 'bg-black text-white border-black'
                : 'bg-white border-gray-200 text-black'
            }`}
          >
            壁纸A
          </button>
          <button
            onClick={() => patchSetting({ bg_type: 'wallpaperB' })}
            className={`py-2.5 rounded-xl border transition-all ${
              bg_type === 'wallpaperB'
                ? 'bg-black text-white border-black'
                : 'bg-white border-gray-200 text-black'
            }`}
          >
            壁纸B
          </button>
        </div>
      </div>

      {/* 壁纸A链接区域 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span>壁纸A链接</span>
          <button
            onClick={openRecommendWallpaper}
            className="px-3 py-1.5 bg-black text-white rounded-lg text-sm"
          >
            推荐壁纸
          </button>
        </div>
        <select
          className="w-full p-2.5 rounded-xl border border-gray-200 bg-white mb-2 text-black"
          value={presetWallpaperA.some(item => item.url === wallpaper_a) ? wallpaper_a : ''}
          onChange={(e) => {
            if (e.target.value) patchSetting({ wallpaper_a: e.target.value })
          }}
        >
          <option value="">-- 选择预设壁纸 --</option>
          {presetWallpaperA.map((item) => (
            <option key={item.url} value={item.url}>{item.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="https://xxx.jpg"
          value={wallpaper_a}
          onChange={(e) => patchSetting({ wallpaper_a: e.target.value })}
          className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-black outline-none focus:ring-1 focus:ring-black/30 placeholder:text-gray-400"
        />
      </div>

      {/* 壁纸B链接 */}
      <div>
        <div className="mb-2">壁纸B链接（自定义图片地址url）</div>
        <input
          type="text"
          placeholder="https://自定义图片地址.jpg"
          value={wallpaper_b}
          onChange={(e) => patchSetting({ wallpaper_b: e.target.value })}
          className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-black outline-none focus:ring-1 focus:ring-black/30 placeholder:text-gray-400"
        />
      </div>
    </div>
  )
}
