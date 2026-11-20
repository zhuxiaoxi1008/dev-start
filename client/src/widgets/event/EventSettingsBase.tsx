// client/src/widgets/event/EventSettingsBase.tsx
// 纪念日/倒计时共用设置弹窗：左表单右实时预览（按设计图）
import React, { useState } from 'react'
import type { EventWidgetConfig } from '@/types/widgets'
import { BG_PRESETS, resolveBgImage } from '../bgAssets'
import { EventCardBase, formatDateCn } from './EventCardBase'

const FONT_COLORS = ['#000000', '#ffffff', '#7c6fd0', '#3b6fd4', '#29a3e3', '#2fbf9b', '#35c4d7', '#d9a94e']

interface Props {
  title: string                 // 弹窗标题：纪念日/倒计时
  initial: EventWidgetConfig
  dateLabel: string             // 起始时间/结束时间
  showRepeat?: boolean
  daysOf: (cfg: EventWidgetConfig) => number
  daysPrefix?: string
  onSave: (cfg: EventWidgetConfig) => void
  onClose: () => void
}

export function EventSettingsBase({ title, initial, dateLabel, showRepeat, daysOf, daysPrefix, onSave, onClose }: Props) {
  const [cfg, setCfg] = useState<EventWidgetConfig>(initial)
  const patch = (p: Partial<EventWidgetConfig>) => setCfg(prev => ({ ...prev, ...p }))

  return (
    <div className="p-5">
      <h3 className="text-center text-base font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左侧表单 */}
        <div className="space-y-4 text-sm">
          <div>
            <label className="block mb-1 font-medium">事件名称</label>
            <input
              className="w-full rounded-lg border border-input bg-background/60 px-3 py-2 placeholder:text-muted-foreground"
              value={cfg.title}
              onChange={e => patch({ title: e.target.value })}
              placeholder="请输入事件名称"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">{dateLabel}</label>
            <div className="flex gap-2">
              <input
                type="date"
                className="flex-1 rounded-lg border border-input bg-background/60 px-3 py-2"
                value={cfg.date}
                onChange={e => patch({ date: e.target.value })}
              />
              {showRepeat && (
                <select
                  className="rounded-lg border border-input bg-background/60 px-2 py-2"
                  value={cfg.repeat ?? 'none'}
                  onChange={e => patch({ repeat: e.target.value as 'none' | 'yearly' })}
                >
                  <option value="none">不重复</option>
                  <option value="yearly">每年</option>
                </select>
              )}
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium">字体颜色</label>
            <div className="flex gap-2 flex-wrap">
              {FONT_COLORS.map(c => (
                <button
                  key={c}
                  className="w-7 h-7 rounded border border-border"
                  style={{ background: c }}
                  onClick={() => patch({ fontColor: c })}
                  aria-label={c}
                >
                  {cfg.fontColor === c && <span style={{ color: c === '#000000' ? '#fff' : '#000' }}>✓</span>}
                </button>
              ))}
              <input
                type="color"
                className="w-7 h-7 rounded cursor-pointer"
                value={cfg.fontColor}
                onChange={e => patch({ fontColor: e.target.value })}
                title="自定义颜色"
              />
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium">背景</label>
            <div className="flex rounded-lg overflow-hidden border border-border mb-2">
              {(['image', 'color'] as const).map(t => (
                <button
                  key={t}
                  className={`flex-1 py-1.5 ${cfg.bgType === t ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:bg-accent/60'}`}
                  onClick={() => patch({ bgType: t })}
                >
                  {t === 'image' ? '图片' : '颜色'}
                </button>
              ))}
            </div>
            {cfg.bgType === 'image' ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {BG_PRESETS.map(p => (
                  <button
                    key={p.name}
                    className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 ${cfg.bgImage === p.name ? 'border-primary' : 'border-transparent'}`}
                    onClick={() => patch({ bgImage: p.name })}
                  >
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="color"
                className="w-full h-9 rounded cursor-pointer"
                value={cfg.bgColor || '#3b82f6'}
                onChange={e => patch({ bgColor: e.target.value })}
              />
            )}
            {cfg.bgType === 'image' && (
              <input
                className="w-full mt-2 rounded-lg border border-input bg-background/60 px-3 py-1.5 text-xs placeholder:text-muted-foreground"
                placeholder="或粘贴自定义图片 URL"
                value={/^https?:/.test(cfg.bgImage) ? cfg.bgImage : ''}
                onChange={e => patch({ bgImage: e.target.value })}
              />
            )}
          </div>
          <div>
            <label className="block mb-1 font-medium">背景遮罩</label>
            <input
              type="range" min={0} max={0.8} step={0.05}
              className="w-full"
              value={cfg.overlay ?? 0}
              onChange={e => patch({ overlay: Number(e.target.value) })}
            />
          </div>
          <button
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/80"
            onClick={() => onSave(cfg)}
          >
            完成
          </button>
        </div>
        {/* 右侧实时预览 */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-64 h-36">
            <EventCardBase
              config={cfg}
              days={daysOf(cfg)}
              daysPrefix={daysPrefix}
              isDragging={false}
              onOpen={() => {}}
            />
          </div>
          <div className="text-xs text-muted-foreground">{title} · {formatDateCn(cfg.date)}</div>
          <button className="text-xs text-muted-foreground underline hover:text-foreground" onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  )
}