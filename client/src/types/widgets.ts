// client/src/types/widgets.ts
// 小组件配置类型：统一存 user_settings.widgets_config，key 为 bookmark id
import type { Bookmark } from './userConfig'

export type WidgetType =
  | 'link' | 'banner'
  | 'anniversary' | 'countdown' | 'calendar' | 'weather'
  | 'todo' | 'notepad' | 'hotsearch' | 'image_convert'

// 事件类组件（纪念日/倒计时）共用背景体系
export interface EventWidgetConfig {
  title: string
  date: string            // YYYY-MM-DD
  repeat?: 'none' | 'yearly'  // 仅倒计时使用
  fontColor: string
  bgType: 'image' | 'color'
  bgImage: string         // 预设图为 assets 文件名，自定义为 URL
  bgColor: string
  overlay: number         // 0~0.8 背景遮罩透明度
  showClock?: boolean     // 纪念日背景叠加时钟表盘
}

export interface WeatherWidgetConfig {
  city: string
  lat: number
  lon: number
}

export interface CalendarWidgetConfig {
  weekStart?: 0 | 1       // 周起始：0=周日 1=周一
}

export interface HotsearchWidgetConfig {
  platform?: string
}

export type WidgetConfig =
  | EventWidgetConfig | WeatherWidgetConfig | CalendarWidgetConfig
  | HotsearchWidgetConfig | Record<string, never>

export type WidgetsConfigMap = Record<string, WidgetConfig>

// 各组件默认网格尺寸（12 列网格，rowHeight=80）
export const WIDGET_DEFAULT_SIZE: Record<WidgetType, { w: number; h: number }> = {
  link: { w: 2, h: 2 },
  banner: { w: 4, h: 2 },
  anniversary: { w: 2, h: 2 },
  countdown: { w: 2, h: 2 },
  calendar: { w: 2, h: 2 },
  weather: { w: 4, h: 2 },
  todo: { w: 2, h: 2 },
  notepad: { w: 2, h: 2 },
  hotsearch: { w: 2, h: 2 },
  image_convert: { w: 4, h: 2 },
}

export interface WidgetCardProps {
  bookmark: Bookmark
  config: WidgetConfig
  isDragging: boolean
  onOpen: () => void      // 打开详情/设置弹窗
}

export interface WidgetSettingsProps {
  bookmark: Bookmark
  config: WidgetConfig
  onSave: (config: WidgetConfig) => void
  onClose: () => void
}