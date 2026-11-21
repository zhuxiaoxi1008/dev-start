// client/src/widgets/clock/ClockWidget.tsx
// 独立时钟组件：数字/表盘两种样式，可选秒与日期
import React, { useEffect, useState } from 'react'
import type { WidgetCardProps, WidgetSettingsProps, ClockWidgetConfig } from '@/types/widgets'
import { BG_PRESETS, resolveBgImage } from '../bgAssets'

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const FONT_COLORS = ['#000000', '#ffffff', '#7c6fd0', '#3b6fd4', '#29a3e3', '#2fbf9b', '#35c4d7', '#d9a94e']

const pad = (n: number) => String(n).padStart(2, '0')

export function defaultClockConfig(): ClockWidgetConfig {
  return {
    style: 'digital',
    showSeconds: true,
    showDate: true,
    fontColor: '#ffffff',
    bgType: 'image',
    bgImage: BG_PRESETS[0]?.name ?? '',
    bgColor: '#1f2937',
    overlay: 0.35,
  }
}

function asClock(config: unknown): ClockWidgetConfig {
  return { ...defaultClockConfig(), ...(config as Partial<ClockWidgetConfig>) }
}

// 每秒（或每 10 秒）刷新一次当前时间
function useNow(showSeconds: boolean) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), showSeconds ? 1000 : 10000)
    return () => window.clearInterval(t)
  }, [showSeconds])
  return now
}

function AnalogClock({ now, showSeconds }: { now: Date; showSeconds: boolean }) {
  const h = now.getHours() % 12
  const m = now.getMinutes()
  const s = now.getSeconds()
  const hDeg = h * 30 + m * 0.5
  const mDeg = m * 6
  const sDeg = s * 6
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180
        const x = 50 + 38 * Math.sin(a)
        const y = 50 - 38 * Math.cos(a)
        return (
          <text
            key={i}
            x={x}
            y={y}
            fill="currentColor"
            fontSize="7"
            textAnchor="middle"
            dominantBaseline="middle"
            opacity="0.75"
          >
            {i === 0 ? 12 : i}
          </text>
        )
      })}
      <line
        x1="50" y1="50"
        x2={50 + 20 * Math.sin((hDeg * Math.PI) / 180)}
        y2={50 - 20 * Math.cos((hDeg * Math.PI) / 180)}
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      />
      <line
        x1="50" y1="50"
        x2={50 + 30 * Math.sin((mDeg * Math.PI) / 180)}
        y2={50 - 30 * Math.cos((mDeg * Math.PI) / 180)}
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      />
      {showSeconds && (
        <line
          x1="50" y1="50"
          x2={50 + 34 * Math.sin((sDeg * Math.PI) / 180)}
          y2={50 - 34 * Math.cos((sDeg * Math.PI) / 180)}
          stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.8"
        />
      )}
      <circle cx="50" cy="50" r="2" fill="currentColor" />
    </svg>
  )
}

export const ClockCard: React.FC<WidgetCardProps> = ({ config, isDragging, onOpen }) => {
  const cfg = asClock(config)
  const now = useNow(cfg.showSeconds)
  const bgUrl = cfg.bgType === 'image' ? resolveBgImage(cfg.bgImage) : ''
  const dateText = `${now.getMonth() + 1}月${now.getDate()}日 ${WEEK[now.getDay()]}`

  return (
    <div
      className="relative w-full h-full rounded-xl overflow-hidden shadow-sm cursor-pointer select-none tap-scale"
      style={{
        color: cfg.fontColor || '#fff',
        background: cfg.bgType === 'color' ? (cfg.bgColor || '#1f2937') : undefined,
        backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onClick={() => { if (!isDragging) onOpen() }}
    >
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${cfg.overlay ?? 0})` }} />
      <div className="relative z-10 h-full flex flex-col items-center justify-center gap-1.5 p-3">
        {cfg.style === 'analog' ? (
          <div className="w-full max-w-[7.5rem] aspect-square">
            <AnalogClock now={now} showSeconds={cfg.showSeconds} />
          </div>
        ) : (
          <div className="flex items-baseline justify-center gap-0.5 font-semibold tabular-nums leading-none">
            <span className="text-[2.5rem] tracking-tight">
              {pad(now.getHours())}:{pad(now.getMinutes())}
            </span>
            {cfg.showSeconds && (
              <span className="text-sm opacity-70">:{pad(now.getSeconds())}</span>
            )}
          </div>
        )}
        {cfg.showDate && <div className="text-xs opacity-90">{dateText}</div>}
      </div>
    </div>
  )
}

export const ClockSettings: React.FC<WidgetSettingsProps> = ({ bookmark, config, onSave, onClose }) => {
  const [cfg, setCfg] = useState<ClockWidgetConfig>(() => asClock(config))
  const patch = (p: Partial<ClockWidgetConfig>) => setCfg(prev => ({ ...prev, ...p }))

  return (
    <div className="p-4 sm:p-5">
      <h3 className="text-center text-base font-semibold mb-4">时钟</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左侧表单 */}
        <div className="space-y-4 text-sm">
          <div>
            <label className="block mb-1 font-medium">显示样式</label>
            <div className="flex rounded-lg overflow-hidden border border-border">
              {([['digital', '数字'], ['analog', '表盘']] as const).map(([value, label]) => (
                <button
                  key={value}
                  className={`flex-1 min-h-11 ${cfg.style === value ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground active:bg-accent/60'}`}
                  onClick={() => patch({ style: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between min-h-11">
            <span className="font-medium">显示秒</span>
            <input
              type="checkbox"
              className="accent-primary w-5 h-5"
              checked={cfg.showSeconds}
              onChange={e => patch({ showSeconds: e.target.checked })}
            />
          </label>

          <label className="flex items-center justify-between min-h-11">
            <span className="font-medium">显示日期</span>
            <input
              type="checkbox"
              className="accent-primary w-5 h-5"
              checked={cfg.showDate}
              onChange={e => patch({ showDate: e.target.checked })}
            />
          </label>

          <div>
            <label className="block mb-1 font-medium">字体颜色</label>
            <div className="flex gap-2 flex-wrap">
              {FONT_COLORS.map(c => (
                <button
                  key={c}
                  className="w-9 h-9 rounded border border-border"
                  style={{ background: c }}
                  onClick={() => patch({ fontColor: c })}
                  aria-label={c}
                >
                  {cfg.fontColor === c && <span style={{ color: c === '#000000' ? '#fff' : '#000' }}>✓</span>}
                </button>
              ))}
              <input
                type="color"
                className="w-9 h-9 rounded cursor-pointer"
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
                  className={`flex-1 min-h-11 ${cfg.bgType === t ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground active:bg-accent/60'}`}
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
                className="w-full h-11 rounded cursor-pointer"
                value={cfg.bgColor || '#1f2937'}
                onChange={e => patch({ bgColor: e.target.value })}
              />
            )}
            {cfg.bgType === 'image' && (
              <input
                className="w-full min-h-11 mt-2 rounded-lg border border-input bg-background/60 px-3 py-1.5 text-base sm:text-xs placeholder:text-muted-foreground"
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
              className="w-full h-11"
              value={cfg.overlay ?? 0}
              onChange={e => patch({ overlay: Number(e.target.value) })}
            />
          </div>

          <button
            className="w-full min-h-11 py-2 rounded-lg bg-primary text-primary-foreground font-medium active:bg-primary/80 sm:hover:bg-primary/80"
            onClick={() => onSave(cfg)}
          >
            完成
          </button>
        </div>

        {/* 右侧实时预览 */}
        <div className="flex flex-col items-center justify-center gap-3 order-first md:order-none">
          <div className="w-full max-w-64 h-36">
            <ClockCard
              bookmark={bookmark}
              config={cfg}
              isDragging={false}
              onOpen={() => {}}
            />
          </div>
          <div className="text-xs text-muted-foreground">时钟预览</div>
          <button className="min-h-11 px-3 text-xs text-muted-foreground underline active:text-foreground sm:hover:text-foreground" onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  )
}
