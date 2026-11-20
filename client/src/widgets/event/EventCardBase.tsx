// client/src/widgets/event/EventCardBase.tsx
// 纪念日/倒计时共用卡片基座：背景图/色 + 遮罩 + 字色 + 可选时钟表盘
import React, { useEffect, useState } from 'react'
import type { EventWidgetConfig } from '@/types/widgets'
import { resolveBgImage } from '../bgAssets'

interface Props {
  config: EventWidgetConfig
  days: number            // 纪念日=已过天数；倒计时=剩余天数
  daysPrefix?: string     // 倒计时"还有"
  isDragging: boolean
  onOpen: () => void
}

// 半透明时钟表盘（纪念日设计图样式），纯 CSS/SVG，每秒走针
function ClockOverlay() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds()
  const hDeg = h * 30 + m * 0.5, mDeg = m * 6, sDeg = s * 6
  return (
    <svg viewBox="0 0 100 100" className="absolute right-1 top-1 w-2/3 h-2/3 opacity-40 pointer-events-none">
      <circle cx="50" cy="50" r="46" fill="none" stroke="white" strokeWidth="1" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180
        const x = 50 + 38 * Math.sin(a), y = 50 - 38 * Math.cos(a)
        return <text key={i} x={x} y={y} fill="white" fontSize="7" textAnchor="middle" dominantBaseline="middle">{i === 0 ? 12 : i}</text>
      })}
      <line x1="50" y1="50" x2={50 + 20 * Math.sin(hDeg * Math.PI / 180)} y2={50 - 20 * Math.cos(hDeg * Math.PI / 180)} stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="50" y1="50" x2={50 + 30 * Math.sin(mDeg * Math.PI / 180)} y2={50 - 30 * Math.cos(mDeg * Math.PI / 180)} stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="50" y1="50" x2={50 + 34 * Math.sin(sDeg * Math.PI / 180)} y2={50 - 34 * Math.cos(sDeg * Math.PI / 180)} stroke="white" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  )
}

export function EventCardBase({ config, days, daysPrefix, isDragging, onOpen }: Props) {
  const bgUrl = config.bgType === 'image' ? resolveBgImage(config.bgImage) : ''
  return (
    <div
      className="relative w-full h-full rounded-xl overflow-hidden shadow-sm cursor-pointer select-none"
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
      {config.showClock && <ClockOverlay />}
      <div className="relative z-10 flex flex-col justify-between h-full p-3 no-drag">
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