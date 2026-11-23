// client/src/components/AddCategoryDialog.tsx
// 新建/重命名分类：名称写入 categories 表，供书签归类使用
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { Category } from '@/types/userConfig'
import { useConfig } from '@/context/UserConfigContext'

interface Props {
  open: boolean
  onClose: () => void
  sortOrder: number
  /** 传入时为重命名模式 */
  category?: Category | null
  onSaved: (category: Category) => void
}

export function AddCategoryDialog({ open, onClose, sortOrder, category, onSaved }: Props) {
  const { settings } = useConfig()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const editing = !!category

  // 每次打开时同步当前编辑值
  useEffect(() => {
    if (!open) return
    setName(category?.name ?? '')
    setError('')
  }, [open, category])

  if (!open) return null

  const close = () => { setName(''); setError(''); onClose() }

  const submit = async () => {
    const value = name.trim()
    if (!value) { setError('请填写分类名称'); return }
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(editing ? `/api/categories/${category!.id}` : '/api/categories', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': settings.user_id },
        body: JSON.stringify(editing ? { name: value } : { name: value, sort_order: sortOrder }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || '保存失败')
      }
      onSaved(await res.json() as Category)
      close()
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={close}>
      <div
        className="relative bg-popover text-popover-foreground ring-1 ring-foreground/10 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-sm p-5 pb-safe"
        onClick={e => e.stopPropagation()}
      >
        <button className="absolute top-3 right-3 p-1 rounded-full hover:bg-accent" onClick={close} aria-label="关闭">
          <X size={18} />
        </button>
        <h3 className="text-center text-base font-semibold mb-4">{editing ? '重命名分类' : '添加分类'}</h3>

        <label className="block text-xs font-medium mb-1">分类名称</label>
        <input
          className="w-full min-h-11 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground/20 placeholder:text-muted-foreground"
          placeholder="例如：开发工具"
          value={name}
          autoFocus
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit() }}
        />

        {error && <div className="mt-2 text-xs text-destructive">{error}</div>}

        <button
          className="w-full min-h-11 mt-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium active:bg-primary/80 hover:bg-primary/80 disabled:opacity-50"
          onClick={submit}
          disabled={busy || !name.trim()}
        >
          {busy ? '保存中...' : editing ? '保存' : '添加分类'}
        </button>
      </div>
    </div>
  )
}
