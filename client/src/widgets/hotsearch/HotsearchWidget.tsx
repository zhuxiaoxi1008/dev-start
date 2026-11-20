// client/src/widgets/hotsearch/HotsearchWidget.tsx
// 热搜：暂无可靠的免费榜单 API，按计划书降级为"平台 tab + 跳转官方热榜"
// 若后续接入可用聚合 API，只需替换本文件的数据层
import React, { useState } from 'react'
import { ExternalLink, Flame } from 'lucide-react'
import type { WidgetCardProps, WidgetSettingsProps } from '@/types/widgets'

interface Platform {
  key: string
  label: string
  url: string
}

const PLATFORMS: Platform[] = [
  { key: 'baidu', label: '百度', url: 'https://top.baidu.com/board?tab=realtime' },
  { key: 'weibo', label: '微博', url: 'https://s.weibo.com/top/summary' },
  { key: 'bilibili', label: '哔哩哔哩', url: 'https://www.bilibili.com/v/popular/rank/all' },
]

export function defaultHotsearchConfig(): { platform: string } {
  return { platform: 'baidu' }
}

export const HotsearchCard: React.FC<WidgetCardProps> = ({ isDragging, onOpen }) => {
  const [platform, setPlatform] = useState(PLATFORMS[0])

  return (
    <div
      className="relative w-full h-full rounded-xl overflow-hidden border border-white/60 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl shadow-sm cursor-pointer select-none p-3 flex flex-col text-foreground"
      onClick={() => { if (!isDragging) onOpen() }}
    >
      <div className="flex items-center gap-1 text-xs mb-2 no-drag">
        <Flame size={13} className="text-muted-foreground" />
        <span className="font-medium mr-auto">热搜</span>
      </div>
      <div className="flex gap-1 mb-2 no-drag" onClick={e => e.stopPropagation()}>
        {PLATFORMS.map(p => (
          <button
            key={p.key}
            className={`flex-1 text-[11px] py-1 rounded transition-colors ${platform.key === p.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
            onClick={() => setPlatform(p)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col justify-center text-xs no-drag">
        <span className="text-muted-foreground">榜单数据源暂未接入</span>
        <a
          className="mt-1 inline-flex items-center gap-1 underline underline-offset-2 hover:opacity-70"
          href={platform.url}
          target="_blank"
          rel="noreferrer"
          onClick={e => e.stopPropagation()}
        >
          前往{platform.label}热榜查看 <ExternalLink size={11} />
        </a>
      </div>
    </div>
  )
}

export const HotsearchSettings: React.FC<WidgetSettingsProps> = ({ onClose }) => {
  const open = (url: string) => window.open(url, '_blank')

  return (
    <div className="p-5">
      <h3 className="text-center text-base font-semibold mb-1">热搜</h3>
      <p className="text-center text-xs text-muted-foreground mb-4">
        暂无可用的免费榜单接口，当前为跳转官方热榜的降级方案
      </p>
      <div className="space-y-2">
        {PLATFORMS.map(p => (
          <button
            key={p.key}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border hover:bg-accent text-sm"
            onClick={() => open(p.url)}
          >
            <span className="inline-flex items-center gap-2"><Flame size={14} className="text-muted-foreground" />{p.label}热榜</span>
            <ExternalLink size={14} className="text-muted-foreground" />
          </button>
        ))}
      </div>
      <div className="mt-4 text-center">
        <button className="text-xs text-muted-foreground underline hover:text-foreground" onClick={onClose}>关闭</button>
      </div>
    </div>
  )
}
