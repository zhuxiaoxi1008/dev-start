// client/src/widgets/WidgetModalHost.tsx
// 组件详情/设置弹窗的统一容器：遮罩 + 居中面板 + 关闭按钮
import React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface Props {
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}

export function WidgetModalHost({ onClose, children, wide }: Props) {
  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`relative bg-white dark:bg-zinc-900 dark:text-zinc-100 rounded-2xl shadow-xl w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
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