// client/src/widgets/calendar/CalendarWidget.tsx
// 日历：卡片展示年月/当日/农历/第N天/第N周；弹窗为月视图 + 右侧黄历详情
// 全部由 lunar-typescript 纯前端计算（该模块按需懒加载，见 registerAll.ts）
import React, { useMemo, useState } from 'react'
import { Solar } from 'lunar-typescript'
import type { WidgetCardProps, WidgetSettingsProps, CalendarWidgetConfig } from '@/types/widgets'

const WEEK_CN = ['日', '一', '二', '三', '四', '五', '六']

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1)
  const d0 = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((d0.getTime() - start.getTime()) / 86400000) + 1
}

function weekOfYear(date: Date): number {
  return Solar.fromDate(date).getSolarWeek(1).getIndexInYear()
}

// 当天的节气/节日（没有则返回空串，避免和农历日重复展示）
function dayEvent(solar: Solar): string {
  const lunar = solar.getLunar()
  return lunar.getJieQi() || [...solar.getFestivals(), ...lunar.getFestivals()][0] || ''
}

// 月视图格子标签：节气/节日 > 农历日（初一显示月份）
function dayGridLabel(solar: Solar): { label: string; isEvent: boolean } {
  const event = dayEvent(solar)
  if (event) return { label: event, isEvent: true }
  const lunar = solar.getLunar()
  if (solar.getDay() === 1) return { label: `${lunar.getMonthInChinese()}月`, isEvent: false }
  return { label: lunar.getDayInChinese(), isEvent: false }
}

export function CalendarCard({ isDragging, onOpen }: WidgetCardProps) {
  const solar = Solar.fromDate(new Date())
  const lunar = solar.getLunar()
  const today = new Date()
  const event = dayEvent(solar)

  return (
    <div
      className={`relative w-full h-full rounded-xl overflow-hidden bg-white backdrop-blur-xl shadow-sm cursor-pointer select-none flex flex-col items-center justify-center text-card-foreground`}
      onClick={() => { if (!isDragging) onOpen() }}
    >
      <div className="flex-1 flex items-center justify-center w-full text-xl text-muted-foreground mb-0.5 no-drag bg-red-400 text-white">
        {today.getFullYear()}年{today.getMonth() + 1}月 · 星期{WEEK_CN[today.getDay()]}
      </div>
      <div className="flex-2 flex items-center justify-center text-6xl font-bold leading-none mb-1 no-drag tabular-nums">{today.getDate()}</div>
      <div className="flex-1 text-xs text-center space-y-1 no-drag">
        <div className="truncate">
          {lunar.getMonthInChinese()}月{lunar.getDayInChinese()}
          {event ? <span className="text-orange-500 ml-1">{event}</span> : ''}
        </div>
        <div className="text-muted-foreground">第{dayOfYear(today)}天 · 第{weekOfYear(today)}周</div>
      </div>
    </div>
  )
}

function MonthGrid({ year, month, weekStart, selected, onSelect }: {
  year: number
  month: number              // 0-11
  weekStart: 0 | 1
  selected: Date
  onSelect: (d: Date) => void
}) {
  const today = new Date()
  const first = new Date(year, month, 1)
  const firstWeekday = first.getDay()
  const offset = (firstWeekday - weekStart + 7) % 7

  // 42 格（6 行），前后补邻月日期
  const cells: Array<{ date: Date; inMonth: boolean }> = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - offset + i)
    cells.push({ date: d, inMonth: d.getMonth() === month })
  }

  const weekHeaders = Array.from({ length: 7 }, (_, i) => WEEK_CN[(i + weekStart) % 7])

  return (
    <div>
      <div className="grid grid-cols-7 mb-1 text-center text-xs text-muted-foreground">
        {weekHeaders.map(w => <div key={w} className="py-1">{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {cells.map(({ date, inMonth }, idx) => {
          const solar = Solar.fromDate(date)
          const isToday = date.toDateString() === today.toDateString()
          const isSelected = date.toDateString() === selected.toDateString()
          const isWeekend = date.getDay() === 0 || date.getDay() === 6
          const { label, isEvent } = dayGridLabel(solar)
          return (
            <button
              key={idx}
              onClick={() => onSelect(date)}
              className={[
                'flex flex-col items-center justify-center rounded-lg min-h-10 sm:min-h-11 px-0.5 leading-none transition-colors',
                isSelected ? 'bg-primary text-primary-foreground'
                  : isToday ? 'bg-accent text-accent-foreground ring-1 ring-foreground/20'
                    : 'active:bg-accent sm:hover:bg-accent',
                !inMonth ? 'opacity-35' : '',
              ].join(' ')}
            >
              <span className={`text-sm font-medium ${isWeekend && !isSelected ? 'text-red-500' : ''}`}>
                {date.getDate()}
              </span>
              <span className={`text-[10px] leading-none mt-0.5 truncate max-w-full ${isSelected ? 'opacity-80' : isEvent ? 'text-red-500' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DetailPanel({ date }: { date: Date }) {
  const solar = Solar.fromDate(date)
  const lunar = solar.getLunar()
  const positions = [
    { name: '喜神', dir: lunar.getDayPositionXi(), desc: lunar.getDayPositionXiDesc() },
    { name: '福神', dir: lunar.getDayPositionFu(), desc: lunar.getDayPositionFuDesc() },
    { name: '财神', dir: lunar.getDayPositionCai(), desc: lunar.getDayPositionCaiDesc() },
    { name: '阳贵', dir: lunar.getDayPositionYangGui(), desc: lunar.getDayPositionYangGuiDesc() },
    { name: '阴贵', dir: lunar.getDayPositionYinGui(), desc: lunar.getDayPositionYinGuiDesc() },
  ]

  return (
    <div className="text-sm space-y-3">
      <div className="text-center">
        <div className="text-lg font-semibold">
          {date.getFullYear()}年{date.getMonth() + 1}月{date.getDate()}日
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          星期{WEEK_CN[date.getDay()]} · 农历{lunar.getMonthInChinese()}月{lunar.getDayInChinese()}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center text-xs">
        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{lunar.getYearInGanZhi()}年</span>
        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{lunar.getMonthInGanZhi()}月</span>
        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{lunar.getDayInGanZhi()}日</span>
        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">生肖{lunar.getYearShengXiao()}</span>
        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{solar.getXingZuo()}座</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-emerald-500/10 p-2">
          <div className="text-emerald-600 dark:text-emerald-400 font-medium mb-1 text-xs">宜</div>
          <div className="text-xs leading-relaxed">{lunar.getDayYi().join(' ') || '—'}</div>
        </div>
        <div className="rounded-lg bg-red-500/10 p-2">
          <div className="text-red-600 dark:text-red-400 font-medium mb-1 text-xs">忌</div>
          <div className="text-xs leading-relaxed">{lunar.getDayJi().join(' ') || '—'}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-muted p-2 text-center">
          <div className="text-muted-foreground">月相</div>
          <div className="font-medium mt-0.5">{lunar.getYueXiang()}</div>
        </div>
        <div className="rounded-lg bg-muted p-2 text-center">
          <div className="text-muted-foreground">物候</div>
          <div className="font-medium mt-0.5 truncate" title={lunar.getWuHou()}>{lunar.getWuHou()}</div>
        </div>
        <div className="rounded-lg bg-muted p-2 text-center">
          <div className="text-muted-foreground">值日</div>
          <div className="font-medium mt-0.5">{lunar.getZhiXing()}</div>
        </div>
      </div>

      <div>
        <div className="text-xs text-muted-foreground mb-1">吉神方位</div>
        <div className="grid grid-cols-5 gap-1 text-center text-xs">
          {positions.map(p => (
            <div key={p.name} className="rounded-lg bg-muted py-1.5">
              <div className="text-muted-foreground">{p.name}</div>
              <div className="font-medium">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        冲{lunar.getDayChongDesc()} · 煞{lunar.getDaySha()}
      </div>
    </div>
  )
}

export const CalendarSettings: React.FC<WidgetSettingsProps> = ({ config, onClose }) => {
  const cfg = config as CalendarWidgetConfig
  const weekStart: 0 | 1 = cfg.weekStart ?? 1
  const [view, setView] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [selected, setSelected] = useState(() => new Date())

  const monthTitle = useMemo(() => `${view.year}年${view.month + 1}月`, [view])

  const shiftMonth = (delta: number) => {
    setView(prev => {
      const d = new Date(prev.year, prev.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const backToToday = () => {
    const now = new Date()
    setView({ year: now.getFullYear(), month: now.getMonth() })
    setSelected(now)
  }

  return (
    <div className="p-5">
      <h3 className="text-center text-base font-semibold mb-4">日历</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <button className="touch-target flex items-center justify-center px-2 rounded active:bg-accent sm:hover:bg-accent" onClick={() => shiftMonth(-1)} aria-label="上个月">‹</button>
              <span className="text-sm font-medium">{monthTitle}</span>
              <button className="touch-target flex items-center justify-center px-2 rounded active:bg-accent sm:hover:bg-accent" onClick={() => shiftMonth(1)} aria-label="下个月">›</button>
            </div>
            <button className="touch-target flex items-center justify-center text-xs px-2 rounded border border-border text-muted-foreground active:bg-accent sm:hover:bg-accent" onClick={backToToday}>
              今天
            </button>
          </div>
          <MonthGrid
            year={view.year}
            month={view.month}
            weekStart={weekStart}
            selected={selected}
            onSelect={setSelected}
          />
        </div>
        <div className="md:border-l md:border-border md:pl-5">
          <DetailPanel date={selected} />
        </div>
      </div>
      <div className="mt-4 text-center">
        <button className="text-xs text-muted-foreground underline hover:text-foreground" onClick={onClose}>关闭</button>
      </div>
    </div>
  )
}
