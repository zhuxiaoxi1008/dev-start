// client/src/components/WidgetPicker.tsx
// Sidebar 加号 -> 小组件选择面板：列出注册表里的全部组件
import React, { useState } from 'react'
import { X, Heart, Clock, AlarmClock, CalendarDays, CloudSun, ListTodo, NotebookPen, Flame, Image } from 'lucide-react'
import type { WidgetType } from '@/types/widgets'
import { listWidgets } from '@/widgets/registry'
import '@/widgets/registerAll'

const ICONS: Partial<Record<WidgetType, React.ComponentType<{ size?: number; className?: string }>>> = {
  anniversary: Heart,
  countdown: Clock,
  clock: AlarmClock,
  calendar: CalendarDays,
  weather: CloudSun,
  todo: ListTodo,
  notepad: NotebookPen,
  hotsearch: Flame,
  image_convert: Image,
}

const DESCRIPTIONS: Partial<Record<WidgetType, string>> = {
  anniversary: '记录已经走过的天数',
  countdown: '距离目标还有多少天',
  clock: '数字或表盘样式，可显示秒与日期',
  calendar: '农历、节气与黄历',
  weather: '实时天气与 7 天预报',
  todo: '轻量待办清单',
  notepad: '随手记点东西',
  hotsearch: '各平台热榜入口',
  image_convert: 'JPG / PNG / WEBP 互转',
}

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (type: WidgetType) => Promise<void>
}

export function WidgetPicker({ open, onClose, onAdd }: Props) {
  const [busy, setBusy] = useState<WidgetType | null>(null)

  if (!open) return null

  const handleAdd = async (type: WidgetType) => {
    if (busy) return
    setBusy(type)
    try {
      await onAdd(type)
      onClose()
    } finally {
      setBusy(null)
    }
  }

  const widgets = listWidgets()

  return (
    <div className="fixed inset-0 z-[90] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="relative bg-popover text-popover-foreground backdrop-blur-xl ring-1 ring-foreground/10 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain p-5 pb-safe"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-accent"
          onClick={onClose}
          aria-label="关闭"
        >
          <X size={18} />
        </button>
        <h3 className="text-center text-base font-semibold mb-1">添加小组件</h3>
        <p className="text-center text-xs text-muted-foreground mb-4">选择要放到桌面上的组件</p>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {widgets.map(({ type, label }) => {
            const Icon = ICONS[type] ?? CalendarDays
            return (
              <button
                key={type}
                className="flex items-start gap-2 sm:gap-3 p-3 min-h-[72px] rounded-xl border border-border active:bg-accent sm:hover:bg-accent text-left transition-colors disabled:opacity-50"
                onClick={() => handleAdd(type)}
                disabled={busy !== null}
              >
                <span className="w-9 h-9 rounded-lg bg-foreground/5 text-foreground flex items-center justify-center shrink-0">
                  <Icon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-[11px] text-muted-foreground leading-snug">
                    {busy === type ? '添加中...' : (DESCRIPTIONS[type] ?? '')}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
