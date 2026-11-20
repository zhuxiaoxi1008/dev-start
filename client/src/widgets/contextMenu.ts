// client/src/widgets/contextMenu.ts
// 右键菜单内容注册表：widget_type -> 内容组件
// 内容组件只负责"展示信息"，通用动作（打开/设置/移除）由 WidgetContextMenu 统一处理
import type { ComponentType } from 'react'
import type { WidgetType } from '@/types/widgets'
import type { Bookmark } from '@/types/userConfig'

export interface ContextMenuContentProps {
  /** 当前右键的组件对应 bookmark */
  bookmark: Bookmark
  /** 组件类型（已规范化，banner 映射为 image_convert） */
  type: WidgetType
}

export type ContextMenuContentComp = ComponentType<ContextMenuContentProps>

const registry = new Map<WidgetType, ContextMenuContentComp>()

export function registerContextMenuContent(type: WidgetType, comp: ContextMenuContentComp) {
  registry.set(type, comp)
}

export function getContextMenuContent(type: WidgetType): ContextMenuContentComp | undefined {
  return registry.get(type)
}
