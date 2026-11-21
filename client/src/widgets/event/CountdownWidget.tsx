// client/src/widgets/event/CountdownWidget.tsx
// 倒计时：剩余天数 = 目标日 - 今天；repeat=yearly 时取下一个周年日
import React from 'react'
import type { WidgetCardProps, WidgetSettingsProps, EventWidgetConfig } from '@/types/widgets'
import { EventCardBase } from './EventCardBase'
import { EventSettingsBase } from './EventSettingsBase'
import { BG_PRESETS } from '../bgAssets'

export function defaultCountdownConfig(): EventWidgetConfig {
  return {
    title: '倒计时',
    date: new Date().toISOString().slice(0, 10),
    repeat: 'none',
    fontColor: '#ffffff',
    bgType: 'image',
    bgImage: BG_PRESETS[1]?.name ?? BG_PRESETS[0]?.name ?? '',
    bgColor: '#2fbf9b',
    overlay: 0.15,
    showClock: false,
  }
}

function asEvent(config: unknown): EventWidgetConfig {
  return { ...defaultCountdownConfig(), ...(config as Partial<EventWidgetConfig>) }
}

// 剩余天数（含 yearly 重复：滚到下一个周年）
export function remainingDays(cfg: EventWidgetConfig): number {
  const today = new Date()
  if (!cfg.date) return 0
  const [y, m, d] = cfg.date.split('-').map(Number)
  let target = new Date(y, m - 1, d)
  const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (cfg.repeat === 'yearly' && target.getTime() < today0.getTime()) {
    target = new Date(today.getFullYear() + (new Date(today.getFullYear(), m - 1, d) >= today0 ? 0 : 1), m - 1, d)
  }
  return Math.max(0, Math.round((target.getTime() - today0.getTime()) / 86400000))
}

export const CountdownCard: React.FC<WidgetCardProps> = ({ config, isDragging, onOpen }) => {
  const cfg = asEvent(config)
  return <EventCardBase config={cfg} days={remainingDays(cfg)} daysPrefix="还有 " isDragging={isDragging} onOpen={onOpen} />
}

export const CountdownSettings: React.FC<WidgetSettingsProps> = ({ config, onSave, onClose }) => {
  return (
    <EventSettingsBase
      title="倒计时"
      initial={asEvent(config)}
      dateLabel="结束时间"
      showRepeat
      daysOf={remainingDays}
      daysPrefix="还有 "
      onSave={cfg => onSave(cfg)}
      onClose={onClose}
    />
  )
}