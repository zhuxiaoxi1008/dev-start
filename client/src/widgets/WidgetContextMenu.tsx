// client/src/widgets/WidgetContextMenu.tsx
// 小组件操作菜单
// 桌面：右键在光标处弹出浮层
// 移动端：长按从底部弹出操作表（全宽、48px 触点）
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Settings, Trash2, ExternalLink, Folder } from 'lucide-react'
import type { Bookmark, Category } from '@/types/userConfig'
import { getWidget } from './registry'
import { getContextMenuContent } from './contextMenu'
import { useWidgetActions } from './WidgetActionContext'
import type { WidgetType } from '@/types/widgets'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Props {
  open: boolean
  x: number
  y: number
  bookmark: Bookmark | null
  categories?: Category[]
  onMoveToCategory?: (bookmarkId: string, categoryId: string | null) => void
  onClose: () => void
}

export function WidgetContextMenu({ open, x, y, bookmark, categories = [], onMoveToCategory, onClose }: Props) {
  const actions = useWidgetActions()
  const isMobile = useIsMobile()
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x, y })
  const [confirmRemove, setConfirmRemove] = useState(false)

  // 关闭时重置确认态
  useEffect(() => {
    if (!open) setConfirmRemove(false)
  }, [open, bookmark?.id])

  // 桌面浮层定位 + 视口内自适应（内容异步加载高度变化时通过 ResizeObserver 重新钳制）
  useLayoutEffect(() => {
    if (!open || !ref.current || isMobile) return
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
  }, [open, x, y, isMobile])

  // 外部点击 / Esc / 滚动 / 缩放 关闭
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const onScroll = () => onClose()
    const onResize = () => onClose()
    // 触摸：点击浮层外部区域关闭（用 touchstart 以便移动端即时响应）
    const onTouch = (e: TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('mousedown', onDown, true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    window.addEventListener('touchstart', onTouch, true)
    return () => {
      window.removeEventListener('mousedown', onDown, true)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('touchstart', onTouch, true)
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

  const moveTo = (categoryId: string | null) => {
    onMoveToCategory?.(bookmark.id, categoryId)
    onClose()
  }

  const moveToCategory = categories.length > 0 ? (
    <div className="border-t border-border pt-2 mt-1">
      <div className="flex items-center gap-1 px-2 pb-1.5 text-[11px] text-muted-foreground">
        <Folder size={12} />移入分类
      </div>
      <div className="flex flex-wrap gap-1.5 px-2 max-h-32 overflow-y-auto overscroll-contain">
        <button
          className={`px-2 py-1 rounded-md text-xs border ${
            bookmark.category_id == null
              ? 'bg-primary text-primary-foreground border-transparent'
              : 'border-border hover:bg-accent'
          }`}
          onClick={() => moveTo(null)}
        >
          未分类
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            className={`px-2 py-1 rounded-md text-xs border max-w-[9rem] truncate ${
              bookmark.category_id === c.id
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'border-border hover:bg-accent'
            }`}
            onClick={() => moveTo(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  ) : null

  // ── 移动端：底部操作表 ──
  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-[200] bg-black/40 flex items-end" onClick={onClose}>
        <div
          ref={ref}
          className="w-full max-h-[80dvh] overflow-y-auto overscroll-contain bg-popover text-popover-foreground rounded-t-2xl shadow-xl pb-safe"
          onClick={e => e.stopPropagation()}
        >
          <div className="pt-2 pb-1 text-center">
            <div className="mx-auto w-10 h-1 rounded-full bg-foreground/20" />
          </div>
          <div className="px-4 py-2">
            <div className="text-base font-medium truncate">{bookmark.title || '未命名组件'}</div>
            <div className="text-xs text-muted-foreground">{def?.label ?? '快捷方式'}</div>
          </div>

          {Content && (
            <div className="px-4 py-2 border-t border-border">
              <Content bookmark={bookmark} type={type} />
            </div>
          )}

          {moveToCategory && <div className="px-4">{moveToCategory}</div>}

          <div className="border-t border-border">
            <button
              className="w-full min-h-12 flex items-center gap-3 px-4 text-sm active:bg-accent"
              onClick={doAction}
            >
              {isLink ? <ExternalLink size={18} /> : <Settings size={18} />}
              {isLink ? '打开链接' : '设置'}
            </button>
            <button
              className={`w-full min-h-12 flex items-center gap-3 px-4 text-sm border-t border-border ${
                confirmRemove ? 'bg-destructive text-destructive-foreground' : 'text-destructive active:bg-destructive/10'
              }`}
              onClick={doRemove}
            >
              <Trash2 size={18} />
              {confirmRemove ? '确认移除？' : '移除组件'}
            </button>
          </div>
          <button
            className="w-full min-h-12 px-4 text-sm text-muted-foreground border-t border-border active:bg-accent"
            onClick={onClose}
          >
            取消
          </button>
        </div>
      </div>,
      document.body
    )
  }

  // ── 桌面：光标处浮层（portal 渲染到 body，脱离祖先 overflow/transform 上下文）──
  return createPortal(
    <div
      ref={ref}
      className="fixed z-[200] w-64 rounded-xl border border-border bg-popover backdrop-blur-xl text-popover-foreground shadow-xl p-2"
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

      {moveToCategory}

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
    document.body
  )
}