// client/src/components/RootContextMenu.tsx
// 空白处右键菜单：添加书签 / 添加分类 / 更换壁纸 / 批量编辑 / 设置
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BookmarkPlus, FolderPlus, Image as ImageIcon, RefreshCw, ListChecks, Settings } from 'lucide-react'

export type RootMenuAction = 'addBookmark' | 'addCategory' | 'wallpaper' | 'batch' | 'settings'

interface Props {
  open: boolean
  x: number
  y: number
  onClose: () => void
  onAction: (action: RootMenuAction) => void
}

const ITEMS: { key: RootMenuAction; label: string; icon: typeof Settings; extra?: typeof Settings }[] = [
  { key: 'addBookmark', label: '添加书签', icon: BookmarkPlus },
  { key: 'addCategory', label: '添加分类', icon: FolderPlus },
  { key: 'wallpaper', label: '更换壁纸', icon: ImageIcon, extra: RefreshCw },
  { key: 'batch', label: '批量编辑', icon: ListChecks },
  { key: 'settings', label: '设置', icon: Settings },
]

export function RootContextMenu({ open, x, y, onClose, onAction }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x, y })

  // 视口内自适应定位
  useLayoutEffect(() => {
    if (!open || !ref.current) return
    const el = ref.current
    setPos({
      x: Math.max(8, Math.min(x, window.innerWidth - el.offsetWidth - 8)),
      y: Math.max(8, Math.min(y, window.innerHeight - el.offsetHeight - 8)),
    })
  }, [open, x, y])

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

  if (!open) return null

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[200] w-52 rounded-xl border border-border bg-popover backdrop-blur-xl text-popover-foreground shadow-xl p-1.5"
      style={{ left: pos.x, top: pos.y }}
    >
      {ITEMS.map(({ key, label, icon: Icon, extra: Extra }) => (
        <button
          key={key}
          className="w-full min-h-9 flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-left hover:bg-accent active:bg-accent transition-colors"
          onClick={() => { onClose(); onAction(key) }}
        >
          <Icon size={16} className="opacity-80 shrink-0" />
          <span>{label}</span>
          {Extra && <Extra size={14} className="ml-auto opacity-60" />}
        </button>
      ))}
    </div>,
    document.body
  )
}
