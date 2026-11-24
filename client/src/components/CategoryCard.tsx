// client/src/components/CategoryCard.tsx
// 桌面分类框：展示分类名与其中的书签/组件图标，点击查看全部
// 右键（桌面）/ 长按（触屏）弹出分类操作菜单：添加书签 / 重命名 / 删除
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Folder, Link as LinkIcon, X, BookmarkPlus, Pencil, Trash2,
  Clock, Calendar, CloudRain, ListTodo, StickyNote, Flame, Image, PartyPopper, Hourglass, FileText, Braces, Binary,
} from 'lucide-react'
import type { Bookmark, Category } from '@/types/userConfig'
import { useLongPress } from '@/hooks/useLongPress'
import { useIsMobile } from '@/hooks/useIsMobile'

// 组件类型 → 图标映射（分组框与分组弹窗共用）
const WIDGET_ICONS: Record<string, typeof LinkIcon> = {
  link: LinkIcon,
  banner: Image,
  anniversary: PartyPopper,
  countdown: Hourglass,
  clock: Clock,
  calendar: Calendar,
  weather: CloudRain,
  todo: ListTodo,
  notepad: StickyNote,
  hotsearch: Flame,
  image_convert: Image,
  markdown: FileText,
  json_format: Braces,
  encode_decode: Binary,
}

function WidgetTypeIcon({ bookmark, size = 14 }: { bookmark: Bookmark; size?: number }) {
  const type = bookmark.widget_type || 'link'
  const Icon = WIDGET_ICONS[type] ?? LinkIcon

  // link 类型：有自定义图标则显示图片，否则显示链接图标
  if (type === 'link' && bookmark.icon) {
    return (
      <span className="relative flex items-center justify-center w-full h-full">
        <LinkIcon size={size} className="opacity-30" />
        <img
          src={bookmark.icon}
          alt=""
          className="absolute inset-0 w-full h-full object-contain"
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
      </span>
    )
  }

  // 其他类型：显示对应的 lucide 图标
  return (
    <span className="flex items-center justify-center w-full h-full">
      <Icon size={size} className="opacity-70" />
    </span>
  )
}

interface CardProps {
  category: Category
  bookmarks: Bookmark[]
  isDragging: boolean
  onOpen: () => void
  onAddBookmark: (category: Category) => void
  onRename: (category: Category) => void
  onDelete: (category: Category) => Promise<void>
}

export function CategoryCard({ category, bookmarks, isDragging, onOpen, onAddBookmark, onRename, onDelete }: CardProps) {
  const items = bookmarks.filter(b => b.category_id === category.id)
  const isMobile = useIsMobile()
  const [menu, setMenu] = useState<{ open: boolean; x: number; y: number }>({ open: false, x: 0, y: 0 })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  const lp = useLongPress({
    onLongPress: pos => setMenu({ open: true, x: pos.x, y: pos.y }),
  })

  const closeMenu = () => {
    setMenu(m => ({ ...m, open: false }))
    setConfirmDelete(false)
  }

  const openMenuAt = (x: number, y: number) => {
    setConfirmDelete(false)
    setMenu({ open: true, x, y })
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    if (busy) return
    setBusy(true)
    try {
      await onDelete(category)
      closeMenu()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div
        data-widget-cell
        className="w-full h-full rounded-xl border border-border bg-card backdrop-blur-xl shadow-sm p-2.5 flex flex-col cursor-grab active:cursor-grabbing select-none tap-scale no-callout"
        onContextMenu={e => {
          e.preventDefault()
          e.stopPropagation()
          openMenuAt(e.clientX, e.clientY)
        }}
        onTouchStart={lp.onTouchStart}
        onTouchMove={lp.onTouchMove}
        onTouchEnd={lp.onTouchEnd}
        onTouchCancel={lp.onTouchCancel}
        onClickCapture={lp.onClickCapture}
        onClick={() => { if (!isDragging && !menu.open) onOpen() }}
      >
        <div className="flex items-center gap-1.5 text-xs mb-1.5 min-w-0">
          <Folder size={14} className="shrink-0 opacity-80" />
          <span className="font-medium truncate">{category.name}</span>
          <span className="ml-auto shrink-0 text-muted-foreground">{items.length}</span>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {items.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground">空分类</div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 content-start">
              {items.slice(0, 6).map(b => (
                <div key={b.id} className="aspect-square rounded-lg bg-foreground/5 p-1.5">
                  <WidgetTypeIcon bookmark={b} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CategoryMenu
        open={menu.open}
        x={menu.x}
        y={menu.y}
        isMobile={isMobile}
        confirmDelete={confirmDelete}
        busy={busy}
        onClose={closeMenu}
        onAddBookmark={() => { closeMenu(); onAddBookmark(category) }}
        onRename={() => { closeMenu(); onRename(category) }}
        onDelete={handleDelete}
      />
    </>
  )
}

interface MenuProps {
  open: boolean
  x: number
  y: number
  isMobile: boolean
  confirmDelete: boolean
  busy: boolean
  onClose: () => void
  onAddBookmark: () => void
  onRename: () => void
  onDelete: () => void
}

function CategoryMenu({ open, x, y, isMobile, confirmDelete, busy, onClose, onAddBookmark, onRename, onDelete }: MenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x, y })

  useLayoutEffect(() => {
    if (!open || !ref.current || isMobile) return
    const el = ref.current
    setPos({
      x: Math.max(8, Math.min(x, window.innerWidth - el.offsetWidth - 8)),
      y: Math.max(8, Math.min(y, window.innerHeight - el.offsetHeight - 8)),
    })
  }, [open, x, y, isMobile])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onTouch = (e: TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const onScroll = () => onClose()
    window.addEventListener('mousedown', onDown, true)
    window.addEventListener('touchstart', onTouch, true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('mousedown', onDown, true)
      window.removeEventListener('touchstart', onTouch, true)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open, onClose])

  if (!open) return null

  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-[200] bg-black/40 flex items-end" onClick={onClose}>
        <div
          ref={ref}
          className="w-full bg-popover text-popover-foreground rounded-t-2xl shadow-xl pb-safe overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="pt-2 pb-1 text-center">
            <div className="mx-auto w-10 h-1 rounded-full bg-foreground/20" />
          </div>
          <button className="w-full min-h-12 flex items-center gap-3 px-4 text-sm active:bg-accent border-b border-border" onClick={onAddBookmark}>
            <BookmarkPlus size={18} />添加书签
          </button>
          <button className="w-full min-h-12 flex items-center gap-3 px-4 text-sm active:bg-accent border-b border-border" onClick={onRename}>
            <Pencil size={18} />重命名
          </button>
          <button
            className={`w-full min-h-12 flex items-center gap-3 px-4 text-sm border-b border-border ${
              confirmDelete ? 'bg-destructive text-destructive-foreground' : 'text-destructive active:bg-destructive/10'
            }`}
            onClick={onDelete}
            disabled={busy}
          >
            <Trash2 size={18} />{busy ? '删除中...' : confirmDelete ? '确认删除分类？' : '删除分类'}
          </button>
          <button className="w-full min-h-12 px-4 text-sm text-muted-foreground active:bg-accent" onClick={onClose}>取消</button>
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[200] w-52 rounded-xl border border-border bg-popover backdrop-blur-xl text-popover-foreground shadow-xl p-1.5"
      style={{ left: pos.x, top: pos.y }}
    >
      <button className="w-full min-h-9 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm hover:bg-accent" onClick={onAddBookmark}>
        <BookmarkPlus size={15} />添加书签
      </button>
      <button className="w-full min-h-9 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm hover:bg-accent" onClick={onRename}>
        <Pencil size={15} />重命名
      </button>
      <div className="border-t border-border my-1" />
      <button
        className={`w-full min-h-9 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm ${
          confirmDelete ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'text-destructive hover:bg-destructive/10'
        }`}
        onClick={onDelete}
        disabled={busy}
      >
        <Trash2 size={15} />{busy ? '删除中...' : confirmDelete ? '确认删除分类？' : '删除分类'}
      </button>
    </div>,
    document.body
  )
}

interface ModalProps {
  open: boolean
  category: Category | null
  bookmarks: Bookmark[]
  onClose: () => void
  onRemoveFromCategory?: (bookmarkId: string) => void
}

export function CategoryBookmarksModal({ open, category, bookmarks, onClose, onRemoveFromCategory }: ModalProps) {
  if (!open || !category) return null
  const items = bookmarks.filter(b => b.category_id === category.id)

  return (
    <div className="fixed inset-0 z-[120] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="relative bg-popover text-popover-foreground ring-1 ring-foreground/10 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md max-h-[85dvh] flex flex-col p-5 pb-safe"
        onClick={e => e.stopPropagation()}
      >
        <button className="absolute top-3 right-3 p-1 rounded-full hover:bg-accent" onClick={onClose} aria-label="关闭">
          <X size={18} />
        </button>
        <h3 className="text-center text-base font-semibold mb-1 flex items-center justify-center gap-1.5">
          <Folder size={16} />
          {category.name}
        </h3>
        <p className="text-center text-xs text-muted-foreground mb-3">共 {items.length} 个书签</p>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-border">
          {items.length === 0 && (
            <div className="py-10 text-center text-xs text-muted-foreground">这个分类还没有书签</div>
          )}
          {items.map(b => {
            const isLink = (b.widget_type || 'link') === 'link'
            return (
              <div key={b.id} className="flex items-center gap-3 px-1 py-2.5 text-sm">
                <span className="w-8 h-8 rounded-lg bg-foreground/5 p-1.5 shrink-0">
                  <WidgetTypeIcon bookmark={b} size={16} />
                </span>
                {isLink ? (
                  <a
                    href={b.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 active:bg-accent hover:bg-accent rounded-lg px-1 -mx-1"
                    onClick={e => { if (!b.url) e.preventDefault() }}
                  >
                    <span className="block truncate">{b.title || '未命名'}</span>
                    <span className="block text-[11px] text-muted-foreground truncate">{b.url}</span>
                  </a>
                ) : (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{b.title || '未命名'}</span>
                    <span className="block text-[11px] text-muted-foreground truncate">{b.widget_type}</span>
                  </span>
                )}
                {onRemoveFromCategory && (
                  <button
                    className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                    onClick={() => onRemoveFromCategory(b.id)}
                    aria-label="移出分类"
                    title="移出分类"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
