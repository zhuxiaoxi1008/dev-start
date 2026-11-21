// client/src/widgets/WidgetModalHost.tsx
// 组件详情/设置弹窗的统一容器
// 桌面：居中浮层；移动端：全屏抽屉（顶部固定关闭条，内容可滚动）
import React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Props {
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}

export function WidgetModalHost({ onClose, children, wide }: Props) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-[100] bg-background flex flex-col">
        <div className="pt-safe px-2 shrink-0 flex items-center justify-between border-b border-border">
          <button
            onClick={onClose}
            className="touch-target flex items-center gap-1 px-2 text-sm text-muted-foreground active:bg-accent rounded-lg"
          >
            <X size={18} />关闭
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-safe">
          {children}
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`relative bg-popover text-popover-foreground backdrop-blur-xl ring-1 ring-foreground/10 rounded-2xl shadow-xl w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="touch-target absolute top-3 right-3 z-10 flex items-center justify-center rounded-full hover:bg-accent"
          aria-label="关闭"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>,
    document.body
  )
}