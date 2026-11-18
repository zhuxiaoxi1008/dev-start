export interface BgConfig {
  bg_type: 'solid' | 'gradient' | 'image'
  bg_solid_color: string
  bg_gradient: string
  bg_gradient_angle: number
  wallpaper: string
}

/**
 * 根据配置生成最终 CSS 背景样式
 * 图片壁纸自动叠加暗色渐变蒙版，保证文字可读性
 */
export function getBgStyle(config: BgConfig): React.CSSProperties {
  if (config.bg_type === 'image' && config.wallpaper) {
    return {
      backgroundImage: `
        linear-gradient(to bottom, rgba(15,23,42,0.25), rgba(15,23,42,0.6)),
        url(${config.wallpaper})
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      transition: 'background 0.5s ease'
    }
  }

  if (config.bg_type === 'gradient') {
    const colors = config.bg_gradient.split(',')
    return {
      background: `linear-gradient(${config.bg_gradient_angle}deg, ${colors.join(', ')})`,
      transition: 'background 0.4s ease'
    }
  }

  return {
    backgroundColor: config.bg_solid_color,
    transition: 'background 0.4s ease'
  }
}

// ==================== 预设集合 ====================

/** 图片壁纸预设（可自行替换为你喜欢的图片 URL） */
export const imageWallpaperPresets = [
  { name: '暗夜沙丘', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80' },
  { name: '海浪俯拍', url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&q=80' },
  { name: '草原风车', url: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1920&q=80' },
  { name: '静谧湖面', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80' },
  { name: '海岸日出', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80' },
]

/** 渐变壁纸预设 */
export const gradientPresets = [
  { name: '深邃星云 (默认)', value: '#3e3c73,#2cbbab', angle: 135 },
  { name: '极光翡翠', value: '#064e3b,#020617', angle: 135 },
  { name: '暗夜绯红', value: '#4c0519,#020617', angle: 135 },
  { name: '湖蓝渐变', value: '#2193b0,#6dd5ed', angle: 150 },
  { name: '纯净黑曜石', value: '#0f172a,#020617', angle: 180 },
  { name: '紫蓝静谧', value: '#0f0c29,#302b63,#24243e', angle: 140 },
  { name: '青空紫霞', value: '#4facfe,#00f2fe', angle: 135 },
  { name: '暖阳金橙', value: '#f093fb,#f5576c', angle: 135 },
]

/** 纯色壁纸预设 */
export const solidPresets = [
  { name: '深空黑', value: '#0f172a' },
  { name: '墨绿', value: '#064e3b' },
  { name: '藏青', value: '#1e3a8a' },
  { name: '暗紫', value: '#3b0764' },
  { name: '炭灰', value: '#1f2937' },
  { name: '暗红', value: '#4c0519' },
]
