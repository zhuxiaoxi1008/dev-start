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
      className="relative w-full h-full rounded-xl overflow-hidden border border-white/20 bg-white/40 dark:bg-zinc-900/50 backdrop-blur-sm shadow-sm cursor-pointer select-none p-3 flex flex-col text-zinc-800 dark:text-zinc-100"
      onClick={() => { if (!isDragging) onOpen() }}
    >
      <div className="flex items-center gap-1 text-xs mb-2 no-drag">
        <Flame size={13} className="text-orange-500" />
        <span className="font-medium mr-auto">热搜</span>
      </div>
      <div className="flex gap-1 mb-2 no-drag" onClick={e => e.stopPropagation()}>
        {PLATFORMS.map(p => (
          <button
            key={p.key}
            className={`flex-1 text-[11px] py-1 rounded ${platform.key === p.key ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'bg-black/5 dark:bg-white/10'}`}
            onClick={() => setPlatform(p)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col justify-center text-xs no-drag">
        <span className="opacity-60">榜单数据源暂未接入</span>
        <a
          className="mt-1 inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
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
      <p className="text-center text-xs opacity-60 mb-4">
        暂无可用的免费榜单接口，当前为跳转官方热榜的降级方案
      </p>
      <div className="space-y-2">
        {PLATFORMS.map(p => (
          <button
            key={p.key}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-black/5 dark:hover:bg-white/10 text-sm"
            onClick={() => open(p.url)}
          >
            <span className="inline-flex items-center gap-2"><Flame size={14} className="text-orange-500" />{p.label}热榜</span>
            <ExternalLink size={14} className="opacity-60" />
          </button>
        ))}
      </div>
      <div className="mt-4 text-center">
        <button className="text-xs underline opacity-60" onClick={onClose}>关闭</button>
      </div>
    </div>
  )
}
