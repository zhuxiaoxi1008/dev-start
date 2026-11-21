// client/src/widgets/event/AnniversaryWidget.tsx
// 纪念日：已过天数 = 今天 - 起始日
import React from 'react'
import type { WidgetCardProps, WidgetSettingsProps, EventWidgetConfig } from '@/types/widgets'
import { EventCardBase, daysBetween } from './EventCardBase'
import { EventSettingsBase } from './EventSettingsBase'
import { BG_PRESETS } from '../bgAssets'

export function defaultAnniversaryConfig(): EventWidgetConfig {
  return {
    title: '纪念日',
    date: new Date().toISOString().slice(0, 10),
    fontColor: '#ffffff',
    bgType: 'image',
    bgImage: BG_PRESETS[0]?.name ?? '',
    bgColor: '#3b82f6',
    overlay: 0.15,
  }
}

function asEvent(config: unknown): EventWidgetConfig {
  return { ...defaultAnniversaryConfig(), ...(config as Partial<EventWidgetConfig>) }
}

export const AnniversaryCard: React.FC<WidgetCardProps> = ({ config, isDragging, onOpen }) => {
  const cfg = asEvent(config)
  const days = Math.max(0, daysBetween(cfg.date, new Date()))
  return <EventCardBase config={cfg} days={days} isDragging={isDragging} onOpen={onOpen} />
}

export const AnniversarySettings: React.FC<WidgetSettingsProps> = ({ config, onSave, onClose }) => {
  return (
    <EventSettingsBase
      title="纪念日"
      initial={asEvent(config)}
      dateLabel="起始时间"
      daysOf={cfg => Math.max(0, daysBetween(cfg.date, new Date()))}
      onSave={cfg => onSave(cfg)}
      onClose={onClose}
    />
  )
}