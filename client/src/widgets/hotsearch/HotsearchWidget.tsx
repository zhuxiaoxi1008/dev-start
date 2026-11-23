// client/src/widgets/hotsearch/HotsearchWidget.tsx
// 热搜：通过自家后端代理拉取实时榜单，失败则降级为跳转官方热榜
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ExternalLink, Flame, Loader2, TrendingUp } from 'lucide-react'
import type { WidgetCardProps, WidgetSettingsProps } from '@/types/widgets'
import { useConfig } from '@/context/UserConfigContext'

interface Platform {
  key: string
  label: string
  url: string
  api: string
  parse: (json: any) => HotItem[]
}

interface HotItem {
  title: string
  url: string
  hot?: string
}

const PLATFORMS: Platform[] = [
  {
    key: 'weibo',
    label: '微博',
    url: 'https://s.weibo.com/top/summary',
    api: '/api/hotlist/weibo',
    parse: (json) => (json?.data ?? []).slice(0, 10),
  },
  {
    key: 'baidu',
    label: '百度',
    url: 'https://top.baidu.com/board?tab=realtime',
    api: '/api/hotlist/baidu',
    parse: (json) => (json?.data ?? []).slice(0, 10),
  },
  {
    key: 'zhihu',
    label: '知乎',
    url: 'https://www.zhihu.com/hot',
    api: '/api/hotlist/zhihu',
    parse: (json) => (json?.data ?? []).slice(0, 10),
  },
  {
    key: 'douyin',
    label: '抖音',
    url: 'https://www.douyin.com/hot',
    api: '/api/hotlist/douyin',
    parse: (json) => (json?.data ?? []).slice(0, 10),
  },
  {
    key: 'v2ex',
    label: 'V2EX',
    url: 'https://www.v2ex.com',
    api: '/api/hotlist/v2ex',
    parse: (json) => (json?.data ?? []).slice(0, 10),
  },
  {
    key: 'hackernews',
    label: 'HN',
    url: 'https://news.ycombinator.com/',
    api: '/api/hotlist/hackernews',
    parse: (json) => (json?.data ?? []).slice(0, 10),
  },
  {
    key: 'reddit',
    label: 'Reddit',
    url: 'https://www.reddit.com/r/popular/',
    api: '/api/hotlist/reddit',
    parse: (json) => (json?.data ?? []).slice(0, 10),
  },
  {
    key: 'github',
    label: 'GitHub',
    url: 'https://github.com/trending',
    api: '/api/hotlist/github',
    parse: (json) => (json?.data ?? []).slice(0, 10),
  },
]

export function defaultHotsearchConfig(): { platform: string } {
  return { platform: 'weibo' }
}

function useHotSearch(platform: Platform, userId: string) {
  const [items, setItems] = useState<HotItem[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      const res = await fetch(platform.api, {
        signal: controller.signal,
        headers: { 'X-User-Id': userId },
      })
      clearTimeout(timer)
      if (!res.ok) throw new Error('fetch failed')
      const json = await res.json()
      const parsed = platform.parse(json)
      if (parsed.length === 0) throw new Error('empty')
      setItems(parsed)
    } catch {
      setFailed(true)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [platform, userId])

  useEffect(() => {
    load()
  }, [load])

  return { items, loading, failed, reload: load }
}

export const HotsearchCard: React.FC<WidgetCardProps> = ({ isDragging, onOpen }) => {
  const { settings } = useConfig()
  const [platform, setPlatform] = useState(PLATFORMS[0])
  const { items, loading, failed } = useHotSearch(platform, settings.user_id)

  // 横向 tab 栏：选中项自动滚动到可视区中间
  const tabRef = useRef<HTMLDivElement>(null)
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const selectPlatform = (p: Platform) => {
  setPlatform(p)
  // 只滚动 tab 容器自身，不波及祖先元素（scrollIntoView 会连带滚动页面导致抖动）
  requestAnimationFrame(() => {
    const container = tabRef.current
    const el = btnRefs.current[p.key]
    if (!container || !el) return

    // 计算让按钮居中所需的滚动位置
    const targetLeft =
      el.offsetLeft - (container.clientWidth - el.offsetWidth) / 2

    // 已接近目标位置就不滚，避免连续点击重复触发动画
    if (Math.abs(container.scrollLeft - targetLeft) < 4) return

    container.scrollTo({
      left: Math.max(0, targetLeft), // 不滚出左边界
      behavior: 'smooth',
    })
  })
}


  return (
    <div
      className="relative w-full h-full rounded-xl overflow-hidden border border-border bg-card backdrop-blur-xl shadow-sm cursor-pointer select-none p-3 flex flex-col text-card-foreground"
      onClick={() => {
        if (!isDragging) onOpen()
      }}
    >
      <div className="flex items-center gap-1 text-xs mb-2 no-drag">
        <Flame size={13} className="text-orange-500" />
        <span className="font-medium mr-auto">热搜</span>
        <span className="text-muted-foreground">{platform.label}</span>
      </div>

      {/* 平台切换：横向滚动，点击自动居中 */}
      <div
        ref={tabRef}
        className="flex gap-1 mb-2 no-drag overflow-x-auto no-scrollbar [overscroll-behavior-x:contain]"
        onClick={(e) => e.stopPropagation()}
      >
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            ref={(el) => {
              btnRefs.current[p.key] = el
            }}
            className={`shrink-0 px-2.5 text-[11px] py-1 rounded-md transition-colors ${
              platform.key === p.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
            onClick={() => selectPlatform(p)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div
        className="flex-1 min-h-0 overflow-hidden text-xs no-drag space-y-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        {loading && (
          <div className="flex items-center gap-1.5 text-muted-foreground py-2">
            <Loader2 size={12} className="animate-spin" />
            加载中...
          </div>
        )}
        {failed && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1.5">
            <TrendingUp size={20} className="opacity-40" />
            <a
              className="inline-flex items-center gap-1 underline underline-offset-2 hover:opacity-70"
              href={platform.url}
              target="_blank"
              rel="noreferrer"
            >
              前往{platform.label}热榜 <ExternalLink size={11} />
            </a>
          </div>
        )}
        {!loading && !failed && items.map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 py-0.5 leading-tight hover:text-primary truncate"
          >
            <span
              className={`shrink-0 w-4 text-right font-medium ${
                i < 3 ? 'text-orange-500' : 'text-muted-foreground'
              }`}
            >
              {i + 1}
            </span>
            <span className="truncate">{item.title}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

export const HotsearchSettings: React.FC<WidgetSettingsProps> = ({ onClose }) => {
  return (
    <div className="p-5">
      <h3 className="text-center text-base font-semibold mb-1 flex items-center justify-center gap-1.5">
        <Flame size={16} className="text-orange-500" />
        热搜榜单
      </h3>
      <p className="text-center text-xs text-muted-foreground mb-4">
        数据来自公共 API，可能因网络波动加载失败
      </p>
      <div className="space-y-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border hover:bg-accent text-sm"
            onClick={() => window.open(p.url, '_blank')}
          >
            <span className="inline-flex items-center gap-2">
              <Flame size={14} className="text-orange-500" />
              {p.label}热榜
            </span>
            <ExternalLink size={14} className="text-muted-foreground" />
          </button>
        ))}
      </div>
      <div className="mt-4 text-center">
        <button
          className="text-xs text-muted-foreground underline hover:text-foreground"
          onClick={onClose}
        >
          关闭
        </button>
      </div>
    </div>
  )
}
