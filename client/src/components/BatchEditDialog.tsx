// client/src/components/BatchEditDialog.tsx
// 批量编辑：勾选多个组件后统一归类或删除
import { useState } from 'react'
import { X } from 'lucide-react'
import type { Bookmark, Category } from '@/types/userConfig'

interface Props {
  open: boolean
  onClose: () => void
  bookmarks: Bookmark[]
  categories: Category[]
  onApplyCategory: (ids: string[], categoryId: string | null) => Promise<void>
  onDelete: (ids: string[]) => Promise<void>
}

export function BatchEditDialog({ open, onClose, bookmarks, categories, onApplyCategory, onDelete }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [categoryId, setCategoryId] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!open) return null

  const close = () => {
    setSelected(new Set()); setCategoryId(''); setConfirmDelete(false); onClose()
  }

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setConfirmDelete(false)
  }

  const allChecked = bookmarks.length > 0 && selected.size === bookmarks.length
  const toggleAll = () => {
    setSelected(allChecked ? new Set() : new Set(bookmarks.map(b => b.id)))
    setConfirmDelete(false)
  }

  const ids = [...selected]

  const applyCategory = async () => {
    if (!ids.length || busy) return
    setBusy(true)
    try {
      await onApplyCategory(ids, categoryId || null)
      close()
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!ids.length || busy) return
    if (!confirmDelete) { setConfirmDelete(true); return }
    setBusy(true)
    try {
      await onDelete(ids)
      close()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={close}>
      <div
        className="relative bg-popover text-popover-foreground ring-1 ring-foreground/10 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg max-h-[85dvh] flex flex-col p-5 pb-safe"
        onClick={e => e.stopPropagation()}
      >
        <button className="absolute top-3 right-3 p-1 rounded-full hover:bg-accent" onClick={close} aria-label="关闭">
          <X size={18} />
        </button>
        <h3 className="text-center text-base font-semibold mb-3">批量编辑</h3>

        <label className="flex items-center gap-2 px-1 py-2 text-sm border-b border-border">
          <input type="checkbox" className="accent-primary w-4 h-4" checked={allChecked} onChange={toggleAll} />
          <span>全选</span>
          <span className="ml-auto text-xs text-muted-foreground">已选 {selected.size} / {bookmarks.length}</span>
        </label>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-border">
          {bookmarks.map(b => {
            const category = categories.find(c => c.id === b.category_id)
            return (
              <label key={b.id} className="flex items-center gap-2 px-1 py-2.5 text-sm active:bg-accent cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-primary w-4 h-4 shrink-0"
                  checked={selected.has(b.id)}
                  onChange={() => toggle(b.id)}
                />
                {b.icon && <img src={b.icon} alt="" className="w-5 h-5 object-contain shrink-0" />}
                <span className="min-w-0 flex-1 truncate">{b.title || '未命名'}</span>
                <span className="text-[11px] text-muted-foreground shrink-0">{category?.name ?? '未分类'}</span>
              </label>
            )
          })}
        </div>

        <div className="pt-3 mt-1 border-t border-border space-y-2">
          <div className="flex gap-2">
            <select
              className="flex-1 min-h-11 rounded-lg border border-input bg-background/60 px-3 text-sm outline-none"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
            >
              <option value="">未分类</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button
              className="shrink-0 min-h-11 px-4 rounded-lg border border-border text-sm font-medium active:bg-accent hover:bg-accent disabled:opacity-50"
              onClick={applyCategory}
              disabled={!ids.length || busy}
            >
              移动到分类
            </button>
          </div>
          <button
            className={`w-full min-h-11 rounded-lg text-sm font-medium disabled:opacity-50 ${
              confirmDelete
                ? 'bg-destructive text-destructive-foreground'
                : 'border border-border text-destructive active:bg-destructive/10 hover:bg-destructive/10'
            }`}
            onClick={remove}
            disabled={!ids.length || busy}
          >
            {busy ? '处理中...' : confirmDelete ? `确认删除 ${ids.length} 项？` : '删除所选'}
          </button>
        </div>
      </div>
    </div>
  )
}
