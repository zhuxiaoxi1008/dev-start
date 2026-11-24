// client/src/widgets/contextMenuContent.tsx
// 右键菜单中"按组件类型扩展"的信息展示内容
// 仅负责展示信息，通用动作（打开/设置/移除）由 WidgetContextMenu 统一处理
import type { ReactNode } from 'react'
import { useConfig } from '@/context/UserConfigContext'
import type {
  WidgetConfig, EventWidgetConfig, ClockWidgetConfig, WeatherWidgetConfig, HotsearchWidgetConfig,
} from '@/types/widgets'
import { daysBetween, formatDateCn } from './event/EventCardBase'
import { defaultAnniversaryConfig } from './event/AnniversaryWidget'
import { defaultCountdownConfig, remainingDays } from './event/CountdownWidget'
import { defaultClockConfig } from './clock/ClockWidget'
import { defaultWeatherConfig } from './weather/WeatherWidget'
import { defaultHotsearchConfig } from './hotsearch/HotsearchWidget'
import { wmoInfo } from './weather/wmo'
import { useWeather } from './weather/useWeather'
import { useTodos } from './todo/TodoWidget'
import { useNote } from './notepad/NotepadWidget'
import type { ContextMenuContentProps } from './contextMenu'
import { registerContextMenuContent } from './contextMenu'

function useWidgetConfig(id: string): WidgetConfig | undefined {
  const { settings } = useConfig()
  return settings.widgets_config?.[id]
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs py-0.5">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="truncate text-right">{children}</span>
    </div>
  )
}

// link / banner（快捷方式）
const LinkContent = ({ bookmark }: ContextMenuContentProps) => {
  return (
    <>
      <InfoRow label="名称">{bookmark.title}</InfoRow>
      {bookmark.url ? <InfoRow label="地址">{bookmark.url}</InfoRow> : null}
    </>
  )
}

const AnniversaryContent = ({ bookmark }: ContextMenuContentProps) => {
  const raw = useWidgetConfig(bookmark.id) as Partial<EventWidgetConfig> | undefined
  const cfg = { ...defaultAnniversaryConfig(), ...(raw ?? {}) }
  const days = Math.max(0, daysBetween(cfg.date, new Date()))
  return (
    <>
      <InfoRow label="事件">{cfg.title}</InfoRow>
      <InfoRow label="起始">{formatDateCn(cfg.date)}</InfoRow>
      <InfoRow label="已累计">{days} 天</InfoRow>
    </>
  )
}

const CountdownContent = ({ bookmark }: ContextMenuContentProps) => {
  const raw = useWidgetConfig(bookmark.id) as Partial<EventWidgetConfig> | undefined
  const cfg = { ...defaultCountdownConfig(), ...(raw ?? {}) }
  const days = remainingDays(cfg)
  return (
    <>
      <InfoRow label="事件">{cfg.title}</InfoRow>
      <InfoRow label="目标">{formatDateCn(cfg.date)}</InfoRow>
      <InfoRow label="剩余">{days <= 0 ? '已到达' : `${days} 天`}</InfoRow>
      <InfoRow label="重复">{cfg.repeat === 'yearly' ? '每年' : '不重复'}</InfoRow>
    </>
  )
}

const ClockContent = ({ bookmark }: ContextMenuContentProps) => {
  const raw = useWidgetConfig(bookmark.id) as Partial<ClockWidgetConfig> | undefined
  const cfg = { ...defaultClockConfig(), ...(raw ?? {}) }
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <>
      <InfoRow label="当前时间">
        {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
      </InfoRow>
      <InfoRow label="样式">{cfg.style === 'analog' ? '表盘' : '数字'}</InfoRow>
      <InfoRow label="显示">{cfg.showDate ? '时间 · 日期' : '仅时间'}</InfoRow>
    </>
  )
}

const CalendarContent = ({ bookmark }: ContextMenuContentProps) => {
  const raw = useWidgetConfig(bookmark.id) as { weekStart?: 0 | 1 } | undefined
  return (
    <>
      <InfoRow label="内容">农历 · 节气 · 节日 · 黄历</InfoRow>
      <InfoRow label="周起始">{(raw?.weekStart ?? 1) === 0 ? '周日' : '周一'}</InfoRow>
    </>
  )
}

const WeatherContent = ({ bookmark }: ContextMenuContentProps) => {
  const { settings } = useConfig()
  const raw = useWidgetConfig(bookmark.id) as Partial<WeatherWidgetConfig> | undefined
  const cfg = { ...defaultWeatherConfig(), ...(raw ?? {}) }
  const { data, loading } = useWeather(settings.user_id, cfg.lat, cfg.lon)
  const cur = data?.current
  const { label } = wmoInfo(cur?.weather_code ?? 0, (cur?.is_day ?? 1) === 1)
  return (
    <>
      <InfoRow label="城市">{cfg.city}</InfoRow>
      <InfoRow label="天气">{loading ? '加载中' : cur ? `${Math.round(cur.temperature_2m)}°C · ${label}` : '获取失败'}</InfoRow>
      {data && (
        <InfoRow label="今日">
          {Math.round(data.daily.temperature_2m_min[0])}° ~ {Math.round(data.daily.temperature_2m_max[0])}°
        </InfoRow>
      )}
    </>
  )
}

const TodoContent = ({ bookmark }: ContextMenuContentProps) => {
  const { items, loading } = useTodos(bookmark.id)
  const pending = items.filter(t => !t.done).length
  return (
    <>
      <InfoRow label="总计">{loading ? '加载中' : `${items.length} 项`}</InfoRow>
      <InfoRow label="未完成">{loading ? '—' : `${pending} 项`}</InfoRow>
    </>
  )
}

const NotepadContent = ({ bookmark }: ContextMenuContentProps) => {
  const { content, loading } = useNote(bookmark.id)
  const preview = content.trim().split('\n')[0] || ''
  return (
    <div className="text-xs">
      {loading ? (
        <span className="text-muted-foreground">加载中...</span>
      ) : content ? (
        <p className="line-clamp-3 text-muted-foreground">{preview || '（空行）'}</p>
      ) : (
        <span className="text-muted-foreground">暂无内容</span>
      )}
    </div>
  )
}

const HotsearchContent = ({ bookmark }: ContextMenuContentProps) => {
  const raw = useWidgetConfig(bookmark.id) as Partial<HotsearchWidgetConfig> | undefined
  const cfg = { ...defaultHotsearchConfig(), ...(raw ?? {}) }
  return (
    <>
      <InfoRow label="当前平台">{cfg.platform || '百度'}</InfoRow>
      <InfoRow label="数据源">跳转官方热榜</InfoRow>
    </>
  )
}

const ImageConvertContent = () => (
  <>
    <InfoRow label="支持格式">JPG / PNG / WEBP</InfoRow>
    <InfoRow label="处理方式">本地浏览器，不上传</InfoRow>
  </>
)

const JsonFormatContent = () => (
  <>
    <InfoRow label="功能">格式化 · 压缩 · 校验</InfoRow>
    <InfoRow label="处理方式">本地浏览器，不上传</InfoRow>
  </>
)

const EncodeDecodeContent = () => (
  <>
    <InfoRow label="支持编码">Base64 / URL / HTML / Unicode / Hex</InfoRow>
    <InfoRow label="处理方式">本地浏览器，不上传</InfoRow>
  </>
)

registerContextMenuContent('link', LinkContent)
registerContextMenuContent('banner', LinkContent)
registerContextMenuContent('anniversary', AnniversaryContent)
registerContextMenuContent('countdown', CountdownContent)
registerContextMenuContent('clock', ClockContent)
registerContextMenuContent('calendar', CalendarContent)
registerContextMenuContent('weather', WeatherContent)
registerContextMenuContent('todo', TodoContent)
registerContextMenuContent('notepad', NotepadContent)
registerContextMenuContent('hotsearch', HotsearchContent)
registerContextMenuContent('image_convert', ImageConvertContent)
registerContextMenuContent('json_format', JsonFormatContent)
registerContextMenuContent('encode_decode', EncodeDecodeContent)
