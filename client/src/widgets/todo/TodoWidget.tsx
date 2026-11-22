// client/src/widgets/todo/TodoWidget.tsx
// 待办事项：卡片展示未完成项，弹窗内增删改与勾选
// 数据表 todos（见 worker/sql/migration_widgets.sql）
import React, { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { WidgetCardProps, WidgetSettingsProps } from '@/types/widgets'
import { useConfig } from '@/context/UserConfigContext'
import { notifyWidgetDataChanged, onWidgetDataChanged } from '../dataEvents'

export interface Todo {
  id: string
  content: string
  done: boolean
  sort_order: number
}

export function defaultTodoConfig(): Record<string, never> {
  return {}
}

export function useTodos(widgetId: string) {
  const { settings } = useConfig()
  const [items, setItems] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/todos?widget_id=${widgetId}`, {
        headers: { 'X-User-Id': settings.user_id },
      })
      if (!res.ok) throw new Error('待办加载失败')
      const json = await res.json() as { data: Todo[] }
      setItems(json.data ?? [])
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '待办加载失败')
    } finally {
      setLoading(false)
    }
  }, [widgetId, settings.user_id])

  useEffect(() => { load() }, [load])

  // 弹窗里增删改后同步刷新卡片
  useEffect(() => onWidgetDataChanged(widgetId, load), [widgetId, load])

  return { items, setItems, loading, error, reload: load }
}

export const TodoCard: React.FC<WidgetCardProps> = ({ bookmark, isDragging, onOpen }) => {
  const { items, loading } = useTodos(bookmark.id)
  const pending = items.filter(t => !t.done)

  return (
    <div
      className="relative w-full h-full rounded-xl overflow-hidden border border-border bg-card backdrop-blur-xl shadow-sm cursor-pointer select-none p-3 flex flex-col text-card-foreground"
      onClick={() => { if (!isDragging) onOpen() }}
    >
      <div className="flex items-center justify-between text-xs mb-2 no-drag">
        <span className="font-medium truncate">待办事项</span>
        <span className="text-muted-foreground">{pending.length} 项</span>
      </div>
      <div className="flex-1 overflow-hidden text-xs space-y-1 no-drag">
        {loading && <div className="text-muted-foreground">加载中...</div>}
        {!loading && pending.length === 0 && (
          <div className="h-full flex items-center justify-center text-muted-foreground">暂无待办，点击添加</div>
        )}
        {pending.slice(0, 4).map(t => (
          <div key={t.id} className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 shrink-0" />
            <span className="truncate">{t.content}</span>
          </div>
        ))}
        {pending.length > 4 && <div className="text-muted-foreground">还有 {pending.length - 4} 项...</div>}
      </div>
    </div>
  )
}

export const TodoSettings: React.FC<WidgetSettingsProps> = ({ bookmark, onClose }) => {
  const { items, setItems, loading, error, reload } = useTodos(bookmark.id)
  const { settings } = useConfig()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async () => {
    const content = text.trim()
    if (!content || busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': settings.user_id },
        body: JSON.stringify({ widget_id: bookmark.id, content }),
      })
      if (!res.ok) throw new Error('添加失败')
      const created = await res.json() as Todo
      setItems(prev => [...prev, created])
      setText('')
      notifyWidgetDataChanged(bookmark.id)
    } catch (e) {
      alert(e instanceof Error ? e.message : '添加失败')
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (todo: Todo) => {
    setItems(prev => prev.map(t => t.id === todo.id ? { ...t, done: !t.done } : t))
    const res = await fetch(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': settings.user_id },
      body: JSON.stringify({ done: !todo.done }),
    })
    if (!res.ok) reload()
    else notifyWidgetDataChanged(bookmark.id)
  }

  const remove = async (todo: Todo) => {
    setItems(prev => prev.filter(t => t.id !== todo.id))
    const res = await fetch(`/api/todos/${todo.id}`, {
      method: 'DELETE',
      headers: { 'X-User-Id': settings.user_id },
    })
    if (!res.ok) reload()
    else notifyWidgetDataChanged(bookmark.id)
  }

  return (
    <div className="p-5">
      <h3 className="text-center text-base font-semibold mb-4">待办事项</h3>

      <div className="flex gap-2 mb-3">
        <input
          className="flex-1 min-w-0 rounded-lg border border-input bg-background/60 px-3 py-2 text-base sm:text-sm placeholder:text-muted-foreground"
          placeholder="添加待办，回车确认"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add() }}
        />
        <button
          className="min-h-11 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm inline-flex items-center gap-1 active:bg-primary/80 sm:hover:bg-primary/80 disabled:opacity-50 shrink-0"
          onClick={add}
          disabled={busy || !text.trim()}
        >
          <Plus size={14} />添加
        </button>
      </div>

      {error && <div className="text-xs text-destructive mb-2">{error}</div>}
      {loading && <div className="text-xs text-muted-foreground">加载中...</div>}

      <div className="max-h-80 overflow-y-auto divide-y divide-border rounded-lg border border-border">
        {!loading && items.length === 0 && (
          <div className="py-8 text-center text-xs text-muted-foreground">暂无待办</div>
        )}
        {items.map(t => (
          <div key={t.id} className="flex items-center gap-2 px-3 py-2 text-sm group min-h-11">
            <input
              type="checkbox"
              className="accent-primary w-5 h-5 shrink-0"
              checked={t.done}
              onChange={() => toggle(t)}
            />
            <span className={`flex-1 ${t.done ? 'line-through text-muted-foreground' : ''}`}>{t.content}</span>
            <button
              className="touch-target flex items-center justify-center text-destructive sm:opacity-0 sm:group-hover:opacity-60 sm:hover:!opacity-100"
              onClick={() => remove(t)}
              aria-label="删除"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <button className="text-xs text-muted-foreground underline hover:text-foreground" onClick={onClose}>关闭</button>
      </div>
    </div>
  )
}
