// client/src/widgets/WidgetActionContext.tsx
// 小组件跨组件动作：右键菜单 / 外部触发 设置弹窗打开、移除组件
import { createContext, useContext, type ReactNode } from 'react'

export interface WidgetActions {
  /** 打开指定小组件的设置/详情弹窗 */
  openSettings: (id: string) => void
  /** 移除指定小组件（删除 bookmark） */
  removeWidget: (id: string) => void
  /** WidgetRenderer 注册自身的打开函数，供 openSettings 调用 */
  registerOpener: (id: string, fn: () => void) => () => void
}

const WidgetActionContext = createContext<WidgetActions | null>(null)

export function WidgetActionProvider({ actions, children }: { actions: WidgetActions; children: ReactNode }) {
  return <WidgetActionContext.Provider value={actions}>{children}</WidgetActionContext.Provider>
}

export function useWidgetActions(): WidgetActions | null {
  return useContext(WidgetActionContext)
}
