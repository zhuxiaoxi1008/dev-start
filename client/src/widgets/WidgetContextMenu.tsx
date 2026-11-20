// client/src/widgets/WidgetContextMenu.tsx
// 小组件右键菜单：按类型展示信息 + 通用动作（打开/设置）+ 底部"移除组件"
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Settings, Trash2, ExternalLink } from 'lucide-react'
import type { Bookmark } from '@/types/userConfig'
import { getWidget } from './registry'
import { getContextMenuContent } from './contextMenu'
import { useWidgetActions } from './WidgetActionContext'
import type { WidgetType } from '@/types/widgets'

interface Props {
  open: boolean
  x: number
  y: number
  bookmark: Bookmark | null
  onClose: () => void
}

export function WidgetContextMenu({ open, x, y, bookmark, onClose }: Props) {
  const actions = useWidgetActions()
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x, y })
  const [confirmRemove, setConfirmRemove] = useState(false)

  // 关闭时重置确认态
  useEffect(() => {
    if (!open) setConfirmRemove(false)
  }, [open, bookmark?.id])

  // 定位 + 视口内自适应（内容异步加载高度变化时通过 ResizeObserver 重新钳制）
  useLayoutEffect(() => {
    if (!open || !ref.current) return
    const clamp = () => {
      const el = ref.current
      if (!el) return
      const w = el.offsetWidth
      const h = el.offsetHeight
      setPos({
        x: Math.max(8, Math.min(x, window.innerWidth - w - 8)),
        y: Math.max(8, Math.min(y, window.innerHeight - h - 8)),
      })
    }
    clamp()
    const ro = new ResizeObserver(clamp)
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [open, x, y])

  // 外部点击 / Esc / 滚动 / 缩放 关闭
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const onScroll = () => onClose()
    const onResize = () => onClose()
    window.addEventListener('mousedown', onDown, true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('mousedown', onDown, true)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open, onClose])

  if (!open || !bookmark) return null

  const rawType = (bookmark.widget_type || 'link') as WidgetType
  const type: WidgetType = rawType === 'banner' ? 'image_convert' : rawType
  const def = getWidget(type)
  const isLink = rawType === 'link' || rawType === 'banner'
  const Content = getContextMenuContent(rawType) ?? getContextMenuContent(type)

  const doRemove = async () => {
    if (!confirmRemove) {
      setConfirmRemove(true)
      return
    }
    actions?.removeWidget(bookmark.id)
    onClose()
  }

  const doAction = () => {
    if (isLink) {
      if (bookmark.url) window.open(bookmark.url, '_blank')
    } else {
      actions?.openSettings(bookmark.id)
    }
    onClose()
  }

  // 通过 portal 渲染到 body：脱离任何祖先的 overflow / transform / contain 上下文，
  // 保证菜单始终相对视口定位、不会撑出文档滚动条，层级也最稳
  return createPortal(
    <div
      ref={ref}
      className="fixed z-[200] w-64 rounded-xl border border-white/60 dark:border-white/10 bg-white/85 dark:bg-neutral-900/85 backdrop-blur-xl text-foreground shadow-xl p-2"
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="px-2 py-1.5 mb-1">
        <div className="text-sm font-medium truncate">{bookmark.title || '未命名组件'}</div>
        <div className="text-[11px] text-muted-foreground">{def?.label ?? '快捷方式'}</div>
      </div>

      {Content && (
        <div className="px-2 py-1.5 border-t border-border pt-2">
          <Content bookmark={bookmark} type={type} />
        </div>
      )}

      <button
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-black/5 dark:hover:bg-white/10 mt-1"
        onClick={doAction}
      >
        {isLink ? <ExternalLink size={15} /> : <Settings size={15} />}
        {isLink ? '打开链接' : '设置'}
      </button>

      <div className="border-t border-border my-1" />

      <button
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${
          confirmRemove ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'text-destructive hover:bg-destructive/10'
        }`}
        onClick={doRemove}
      >
        <Trash2 size={15} />
        {confirmRemove ? '确认移除？' : '移除组件'}
      </button>
    </div>,
    document.body,
  )
}
