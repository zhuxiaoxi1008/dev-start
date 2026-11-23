// client/src/widgets/markdown/MarkdownWidget.tsx
// Markdown 记事本：卡片展示渲染预览摘要，弹窗内编辑 + 实时预览
// 复用 notes 数据表（widget_type = 'markdown'）
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, Pencil, EyeOff } from 'lucide-react'
import { marked } from 'marked'
import type { WidgetCardProps, WidgetSettingsProps } from '@/types/widgets'
import { useConfig } from '@/context/UserConfigContext'
import { notifyWidgetDataChanged, onWidgetDataChanged } from '../dataEvents'

// 配置 marked：关闭 mangle，启用基础 GFM
marked.setOptions({ gfm: true, breaks: true })

interface Note {
  id: string
  content: string
}

export function useMarkdownNote(widgetId: string) {
  const { settings } = useConfig()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/notes?widget_id=${widgetId}`, {
        headers: { 'X-User-Id': settings.user_id },
      })
      if (!res.ok) throw new Error('加载失败')
      const json = await res.json() as { data: Note | null }
      setContent(json.data?.content ?? '')
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [widgetId, settings.user_id])

  useEffect(() => { load() }, [load])
  useEffect(() => onWidgetDataChanged(widgetId, load), [widgetId, load])

  return { content, setContent, loading, error, reload: load }
}

// 从纯文本中提取摘要（去掉 markdown 标记符号）
function plainSummary(md: string, max = 120): string {
  return md
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*|__|~~|`/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, max)
}

export function defaultMarkdownConfig(): Record<string, never> {
  return {}
}

export const MarkdownCard: React.FC<WidgetCardProps> = ({ bookmark, isDragging, onOpen }) => {
  const { content, loading } = useMarkdownNote(bookmark.id)
  const html = useMemo(() => {
    if (!content) return ''
    try { return marked.parse(content) as string } catch { return '' }
  }, [content])

  return (
    <div
      className="relative w-full h-full rounded-xl overflow-hidden border border-border bg-card backdrop-blur-xl shadow-sm cursor-pointer select-none p-3 flex flex-col text-card-foreground"
      onClick={() => { if (!isDragging) onOpen() }}
    >
      <div className="flex items-center gap-1.5 text-xs mb-1.5 no-drag">
        <Pencil size={13} className="opacity-60" />
        <span className="font-medium truncate">Markdown</span>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden text-xs no-drag">
        {loading ? (
          <span className="text-muted-foreground">加载中...</span>
        ) : content ? (
          <div
            className="md-preview max-w-none line-clamp-6 opacity-80"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <span className="text-muted-foreground">点击开始记录</span>
        )}
      </div>
    </div>
  )
}

export const MarkdownSettings: React.FC<WidgetSettingsProps> = ({ bookmark, onClose }) => {
  const { settings } = useConfig()
  const { content, setContent, loading, error, reload } = useMarkdownNote(bookmark.id)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showPreview, setShowPreview] = useState(true)

  const html = useMemo(() => {
    if (!content) return ''
    try { return marked.parse(content) as string } catch { return '' }
  }, [content])

  const save = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': settings.user_id },
        body: JSON.stringify({ widget_id: bookmark.id, content }),
      })
      if (!res.ok) throw new Error('保存失败')
      setSaved(true)
      notifyWidgetDataChanged(bookmark.id)
      setTimeout(() => setSaved(false), 1500)
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存失败')
      reload()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-5 flex flex-col" style={{ maxHeight: '85dvh' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold">Markdown 记事本</h3>
        <div className="flex items-center gap-1">
          <button
            className={`min-h-9 px-2.5 py-1 rounded-lg text-xs inline-flex items-center gap-1 transition-colors ${showPreview ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-accent'}`}
            onClick={() => setShowPreview(v => !v)}
          >
            {showPreview ? <><Eye size={13} />预览开</> : <><EyeOff size={13} />预览关</>}
          </button>
        </div>
      </div>

      {error && <div className="text-xs text-destructive mb-2">{error}</div>}

      <div className={`flex gap-3 flex-1 min-h-0 ${showPreview ? 'flex-col sm:flex-row' : ''}`}>
        <textarea
          className={`rounded-lg border border-input bg-background/60 px-3 py-2 text-sm resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 ${showPreview ? 'flex-1 min-h-[40vh] sm:min-h-0' : 'flex-1 h-[55vh]'}`}
          placeholder={loading ? '加载中...' : '# 支持 Markdown 语法\n\n- 列表\n- **加粗**、*斜体*、~~删除线~~\n- `代码` 和 ```代码块```\n- [链接](https://...)\n- > 引用'}
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        {showPreview && (
          <div className="rounded-lg border border-border bg-background/40 p-3 overflow-y-auto overscroll-contain flex-1 min-h-[30vh] sm:min-h-0">
            {content ? (
              <div
                className="md-preview max-w-none"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <span className="text-xs text-muted-foreground">预览区域</span>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 shrink-0">
        {saved && <span className="text-xs text-emerald-500 mr-auto">已保存</span>}
        <button className="min-h-9 px-3 py-1.5 rounded-lg border border-border text-sm active:bg-accent hover:bg-accent" onClick={onClose}>
          关闭
        </button>
        <button
          className="min-h-9 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm active:bg-primary/80 hover:bg-primary/80 disabled:opacity-50"
          onClick={save}
          disabled={saving}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )
}
