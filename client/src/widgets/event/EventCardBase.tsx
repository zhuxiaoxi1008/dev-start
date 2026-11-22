// client/src/widgets/event/EventCardBase.tsx
// 纪念日/倒计时共用卡片基座：背景图/色 + 遮罩 + 字色
import type { EventWidgetConfig } from '@/types/widgets'
import { resolveBgImage } from '../bgAssets'

interface Props {
  config: EventWidgetConfig
  days: number            // 纪念日=已过天数；倒计时=剩余天数
  daysPrefix?: string     // 倒计时"还有"
  isDragging: boolean
  onOpen: () => void
}

export function EventCardBase({ config, days, daysPrefix, isDragging, onOpen }: Props) {
  const bgUrl = config.bgType === 'image' ? resolveBgImage(config.bgImage) : ''
  return (
    <div
      className="relative w-full h-full rounded-xl overflow-hidden shadow-sm cursor-pointer select-none tap-scale"
      style={{
        color: config.fontColor || '#fff',
        background: config.bgType === 'color' ? (config.bgColor || '#3b82f6') : undefined,
        backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onClick={() => { if (!isDragging) onOpen() }}
    >
      {/* 遮罩 */}
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${config.overlay ?? 0})` }} />
      <div
        className="relative z-10 flex flex-col justify-between h-full p-3 no-drag"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.45)' }}
      >
        <div className="text-sm font-medium truncate">{config.title || '未命名事件'}</div>
        <div className="text-2xl font-bold leading-tight">
          {daysPrefix}{days}<span className="text-sm font-normal ml-1">天</span>
        </div>
        <div className="text-xs opacity-90">{formatDateCn(config.date)}</div>
      </div>
    </div>
  )
}

export function formatDateCn(date: string): string {
  if (!date) return ''
  const [y, m, d] = date.split('-')
  return `${y}年${m}月${d}日`
}

// 天数差：按本地日历日计算（忽略时分秒）
export function daysBetween(from: string, to: Date): number {
  if (!from) return 0
  const [y, m, d] = from.split('-').map(Number)
  const a = new Date(y, m - 1, d).getTime()
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime()
  return Math.round((b - a) / 86400000)
}