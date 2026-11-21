// client/src/widgets/notepad/NotepadWidget.tsx
// 记事本：卡片展示内容摘要，弹窗内编辑保存
// 数据表 notes（见 worker/sql/migration_widgets.sql）
import React, { useCallback, useEffect, useState } from 'react'
import type { WidgetCardProps, WidgetSettingsProps } from '@/types/widgets'
import { useConfig } from '@/context/UserConfigContext'
import { notifyWidgetDataChanged, onWidgetDataChanged } from '../dataEvents'

export interface Note {
  id: string
  content: string
}

export function useNote(widgetId: string) {
  const { settings } = useConfig()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/notes?widget_id=${widgetId}`, {
        headers: { 'X-User-Id': settings.user_id },
      })
      if (!res.ok) throw new Error('记事本加载失败')
      const json = await res.json() as { data: Note | null }
      setContent(json.data?.content ?? '')
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '记事本加载失败')
    } finally {
      setLoading(false)
    }
  }, [widgetId, settings.user_id])

  useEffect(() => { load() }, [load])

  // 监听同卡片的保存事件
  useEffect(() => onWidgetDataChanged(widgetId, load), [widgetId, load])

  return { content, setContent, loading, error, reload: load }
}

export function defaultNotepadConfig(): Record<string, never> {
  return {}
}

export const NotepadCard: React.FC<WidgetCardProps> = ({ bookmark, isDragging, onOpen }) => {
  const { content, loading } = useNote(bookmark.id)

  return (
    <div
      className="relative w-full h-full rounded-xl overflow-hidden border border-white/60 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl shadow-sm cursor-pointer select-none p-3 flex flex-col text-foreground"
      onClick={() => { if (!isDragging) onOpen() }}
    >
      <div className="text-xs font-medium mb-2 no-drag">记事本</div>
      <div className="flex-1 overflow-hidden text-xs leading-relaxed no-drag">
        {loading ? (
          <span className="text-muted-foreground">加载中...</span>
        ) : content ? (
          <p className="whitespace-pre-wrap line-clamp-5">{content}</p>
        ) : (
          <span className="text-muted-foreground">点击开始记录</span>
        )}
      </div>
    </div>
  )
}

export const NotepadSettings: React.FC<WidgetSettingsProps> = ({ bookmark, onClose }) => {
  const { settings } = useConfig()
  const { content, setContent, loading, error, reload } = useNote(bookmark.id)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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
    <div className="p-5">
      <h3 className="text-center text-base font-semibold mb-4">记事本</h3>
      {error && <div className="text-xs text-destructive mb-2">{error}</div>}
      <textarea
        className="w-full h-[50vh] sm:h-64 rounded-lg border border-input bg-background/60 px-3 py-2 text-base sm:text-sm resize-none placeholder:text-muted-foreground"
        placeholder={loading ? '加载中...' : '记录点什么...'}
        value={content}
        onChange={e => setContent(e.target.value)}
      />
      <div className="mt-3 flex items-center justify-end gap-2">
        {saved && <span className="text-xs text-emerald-500 mr-auto">已保存</span>}
        <button className="min-h-11 px-3 py-1.5 rounded-lg border border-border text-sm active:bg-accent sm:hover:bg-accent" onClick={onClose}>
          关闭
        </button>
        <button
          className="min-h-11 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm active:bg-primary/80 sm:hover:bg-primary/80 disabled:opacity-50"
          onClick={save}
          disabled={saving}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )
}
