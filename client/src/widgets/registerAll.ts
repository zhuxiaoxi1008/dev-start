// client/src/widgets/registerAll.ts
// 统一注册入口：各阶段组件在此登记（副作用模块，WidgetRenderer 引入）
// 阶段2：纪念日 / 倒计时 / 日历 / 图片转换
// 阶段3-5：天气 / 待办 / 记事本 / 热搜
import { lazy } from 'react'
import { registerWidget } from './registry'
import { AnniversaryCard, AnniversarySettings, defaultAnniversaryConfig } from './event/AnniversaryWidget'
import { CountdownCard, CountdownSettings, defaultCountdownConfig } from './event/CountdownWidget'
import { ClockCard, ClockSettings, defaultClockConfig } from './clock/ClockWidget'
import { ImageConvertCard, ImageConvertSettings } from './imageConvert/ImageConvertWidget'
import { WeatherCard, WeatherSettings, defaultWeatherConfig } from './weather/WeatherWidget'
import { TodoCard, TodoSettings, defaultTodoConfig } from './todo/TodoWidget'
import { NotepadCard, NotepadSettings, defaultNotepadConfig } from './notepad/NotepadWidget'
import { HotsearchCard, HotsearchSettings, defaultHotsearchConfig } from './hotsearch/HotsearchWidget'
// 右键菜单"按类型扩展"的信息内容注册（副作用：执行各类型 registerContextMenuContent）
import './contextMenuContent'

// 日历依赖 lunar-typescript（包体较大），按需懒加载，避免拖慢首屏
const CalendarCard = lazy(() =>
  import('./calendar/CalendarWidget').then(m => ({ default: m.CalendarCard })))
const CalendarSettings = lazy(() =>
  import('./calendar/CalendarWidget').then(m => ({ default: m.CalendarSettings })))

registerWidget('anniversary', {
  label: '纪念日',
  Card: AnniversaryCard,
  Settings: AnniversarySettings,
  defaultConfig: defaultAnniversaryConfig,
})

registerWidget('countdown', {
  label: '倒计时',
  Card: CountdownCard,
  Settings: CountdownSettings,
  defaultConfig: defaultCountdownConfig,
})

registerWidget('clock', {
  label: '时钟',
  Card: ClockCard,
  Settings: ClockSettings,
  defaultConfig: defaultClockConfig,
})

registerWidget('calendar', {
  label: '日历',
  Card: CalendarCard,
  Settings: CalendarSettings,
  defaultConfig: () => ({ weekStart: 1 }),
})

registerWidget('image_convert', {
  label: '图片格式转换',
  Card: ImageConvertCard,
  Settings: ImageConvertSettings,
  defaultConfig: () => ({}),
})

registerWidget('weather', {
  label: '天气',
  Card: WeatherCard,
  Settings: WeatherSettings,
  defaultConfig: defaultWeatherConfig,
})

registerWidget('todo', {
  label: '待办事项',
  Card: TodoCard,
  Settings: TodoSettings,
  defaultConfig: defaultTodoConfig,
})

registerWidget('notepad', {
  label: '记事本',
  Card: NotepadCard,
  Settings: NotepadSettings,
  defaultConfig: defaultNotepadConfig,
})

registerWidget('hotsearch', {
  label: '热搜',
  Card: HotsearchCard,
  Settings: HotsearchSettings,
  defaultConfig: defaultHotsearchConfig,
})
