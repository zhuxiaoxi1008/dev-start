// client/src/widgets/registry.ts
// 组件注册表：widget_type -> 卡片/设置弹窗/默认配置/默认尺寸
// 阶段2起逐个注册；未注册类型回退 LinkCard
import type { ComponentType, LazyExoticComponent } from 'react'
import type { WidgetType, WidgetConfig, WidgetCardProps, WidgetSettingsProps } from '@/types/widgets'
import { LinkCard } from './link/LinkCard'

export interface WidgetDefinition {
  label: string
  Card: ComponentType<WidgetCardProps> | LazyExoticComponent<ComponentType<WidgetCardProps>>
  Settings?: ComponentType<WidgetSettingsProps> | LazyExoticComponent<ComponentType<WidgetSettingsProps>>
  defaultConfig: () => WidgetConfig
}

// link/banner 走原有 LinkCard，不进注册表
const registry = new Map<WidgetType, WidgetDefinition>()

export function registerWidget(type: WidgetType, def: WidgetDefinition) {
  registry.set(type, def)
}

export function getWidget(type: WidgetType): WidgetDefinition | undefined {
  return registry.get(type)
}

export function listWidgets(): Array<{ type: WidgetType } & WidgetDefinition> {
  return Array.from(registry.entries()).map(([type, def]) => ({ type, ...def }))
}

export { LinkCard }