// client/src/components/AddBookmarkDialog.tsx
// 添加书签：标题 / 网址 / 图标（支持一键获取站点图标）/ 分类
import { useEffect, useState } from 'react'
import { X, Download, Loader2 } from 'lucide-react'
import type { Bookmark, Category } from '@/types/userConfig'
import { useConfig } from '@/context/UserConfigContext'
import { WIDGET_DEFAULT_SIZE } from '@/types/widgets'

interface Props {
  open: boolean
  onClose: () => void
  categories: Category[]
  defaultY: number
  /** 从分类框添加时预选该分类 */
  defaultCategoryId?: string | null
  onCreated: (bookmark: Bookmark) => void
}

function normalizeUrl(value: string) {
  const v = value.trim()
  if (!v) return ''
  return /^https?:\/\//i.test(v) ? v : `https://${v}`
}

// 依次尝试站点自带 favicon 与常见图标服务，取第一个能加载的
function iconCandidates(value: string): string[] {
  try {
    const u = new URL(normalizeUrl(value))
    return [
      `${u.origin}/favicon.ico`,
      `https://favicon.im/${u.hostname}?larger=true`,
      `https://api.iowen.cn/favicon/${u.hostname}.png`,
      `https://icons.duckduckgo.com/ip3/${u.hostname}.ico`,
      `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`,
    ]
  } catch {
    return []
  }
}

function probeImage(src: string, timeout = 2500): Promise<boolean> {
  return new Promise(resolve => {
    const img = new Image()
    let done = false
    const finish = (ok: boolean) => {
      if (done) return
      done = true
      img.onload = null
      img.onerror = null
      resolve(ok)
    }
    img.onload = () => finish(true)
    img.onerror = () => finish(false)
    window.setTimeout(() => finish(false), timeout)
    img.src = src
  })
}

async function resolveIcon(value: string) {
  for (const src of iconCandidates(value)) {
    if (await probeImage(src)) return src
  }
  return ''
}

export function AddBookmarkDialog({ open, onClose, categories, defaultY, defaultCategoryId, onCreated }: Props) {
  const { settings } = useConfig()
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [icon, setIcon] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [fetching, setFetching] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // 每次打开时按来源预选分类
  useEffect(() => {
    if (open) setCategoryId(defaultCategoryId ?? '')
  }, [open, defaultCategoryId])

  if (!open) return null

  const reset = () => {
    setTitle(''); setUrl(''); setIcon(''); setCategoryId(''); setError('')
  }

  const close = () => { reset(); onClose() }

  const handleFetchIcon = async () => {
    if (!url.trim() || fetching) return
    setFetching(true)
    setError('')
    try {
      const found = await resolveIcon(url)
      if (found) {
        setIcon(found)
        if (!title.trim()) {
          try { setTitle(new URL(normalizeUrl(url)).hostname.replace(/^www\./, '')) } catch { /* ignore */ }
        }
      } else {
        setError('没有取到图标，可以手动填写图标地址')
      }
    } finally {
      setFetching(false)
    }
  }

  const submit = async () => {
    if (busy) return
    const t = title.trim()
    const u = normalizeUrl(url)
    if (!t) { setError('请填写标题'); return }
    if (!u) { setError('请填写网址'); return }
    setBusy(true)
    setError('')
    try {
      const size = WIDGET_DEFAULT_SIZE.link ?? { w: 2, h: 2 }
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': settings.user_id },
        body: JSON.stringify({
          title: t,
          url: u,
          icon: icon.trim(),
          widget_type: 'link',
          category_id: categoryId || null,
          w: size.w,
          h: size.h,
          x: 0,
          y: defaultY,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || '添加失败')
      }
      onCreated(await res.json() as Bookmark)
      reset()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '添加失败')
    } finally {
      setBusy(false)
    }
  }

  const input = 'w-full min-h-11 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-foreground/20 placeholder:text-muted-foreground'

  return (
    <div className="fixed inset-0 z-[120] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={close}>
      <div
        className="relative bg-popover text-popover-foreground ring-1 ring-foreground/10 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md max-h-[85dvh] overflow-y-auto overscroll-contain p-5 pb-safe"
        onClick={e => e.stopPropagation()}
      >
        <button className="absolute top-3 right-3 p-1 rounded-full hover:bg-accent" onClick={close} aria-label="关闭">
          <X size={18} />
        </button>
        <h3 className="text-center text-base font-semibold mb-4">添加书签</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">标题</label>
            <input className={input} placeholder="例如：GitHub" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">网址</label>
            <input className={input} placeholder="https://github.com" value={url} onChange={e => setUrl(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">图标</label>
            <div className="flex gap-2">
              <input className={input} placeholder="图标地址，可自动获取" value={icon} onChange={e => setIcon(e.target.value)} />
              <button
                className="shrink-0 min-h-11 px-3 rounded-lg border border-border text-xs font-medium inline-flex items-center gap-1 active:bg-accent hover:bg-accent disabled:opacity-50"
                onClick={handleFetchIcon}
                disabled={fetching || !url.trim()}
              >
                {fetching ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {fetching ? '获取中' : '获取图标'}
              </button>
            </div>
            {icon && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center overflow-hidden">
                  <img src={icon} alt="" className="w-5 h-5 object-contain" />
                </span>
                图标预览
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">分类</label>
            <select
              className={input}
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
            >
              <option value="">未分类</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {error && <div className="text-xs text-destructive">{error}</div>}

          <button
            className="w-full min-h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium active:bg-primary/80 hover:bg-primary/80 disabled:opacity-50"
            onClick={submit}
            disabled={busy || fetching}
          >
            {busy ? '添加中...' : '添加'}
          </button>
        </div>
      </div>
    </div>
  )
}
