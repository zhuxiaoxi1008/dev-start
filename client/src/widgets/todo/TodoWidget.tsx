// client/src/widgets/todo/TodoWidget.tsx
// 待办事项：卡片展示未完成项，弹窗内增删改与勾选
// 数据表 todos（见 worker/sql/migration_widgets.sql）
import React, { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, Check, Circle } from 'lucide-react'
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
  useEffect(() => onWidgetDataChanged(widgetId, load), [widgetId, load])

  return { items, setItems, loading, error, reload: load }
}

export const TodoCard: React.FC<WidgetCardProps> = ({ bookmark, isDragging, onOpen }) => {
  const { items, loading } = useTodos(bookmark.id)
  const pending = items.filter(t => !t.done)
  const done = items.filter(t => t.done)

  return (
    <div
      className="relative w-full h-full rounded-xl overflow-hidden border border-border bg-card backdrop-blur-xl shadow-sm cursor-pointer select-none p-3 flex flex-col text-card-foreground"
      onClick={() => { if (!isDragging) onOpen() }}
    >
      <div className="flex items-center justify-between text-xs mb-2 no-drag">
        <span className="font-medium truncate">待办事项</span>
        <span className="text-muted-foreground">
          {pending.length > 0 ? `${pending.length} 项待办` : '全部完成'}
        </span>
      </div>
      <div className="flex-1 overflow-hidden text-xs space-y-1.5 no-drag">
        {loading && <div className="text-muted-foreground">加载中...</div>}
        {!loading && pending.length === 0 && (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <Circle size={16} className="mr-1.5 opacity-30" />
            暂无待办
          </div>
        )}
        {pending.slice(0, 4).map(t => (
          <div key={t.id} className="flex items-center gap-2 truncate">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-foreground/30 shrink-0" />
            <span className="truncate">{t.content}</span>
          </div>
        ))}
        {pending.length > 4 && <div className="text-muted-foreground text-[11px]">还有 {pending.length - 4} 项...</div>}
        {done.length > 0 && pending.length <= 4 && (
          <div className="text-muted-foreground text-[11px] pt-1 border-t border-border/50">
            已完成 {done.length} 项
          </div>
        )}
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

  const pending = items.filter(t => !t.done)
  const doneItems = items.filter(t => t.done)

  return (
    <div className="p-5 flex flex-col" style={{ maxHeight: '85dvh' }}>
      <div className="text-center mb-4 shrink-0">
        <h3 className="text-base font-semibold">待办事项</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {pending.length} 项待办 · {doneItems.length} 项已完成
        </p>
      </div>

      {/* 输入栏 */}
      <div className="flex gap-2 mb-3 shrink-0">
        <input
          className="flex-1 min-w-0 min-h-11 rounded-xl border border-input bg-background/60 px-3 py-2 text-base sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="添加待办，回车确认"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add() }}
        />
        <button
          className="min-h-11 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm inline-flex items-center gap-1 active:scale-95 transition-transform disabled:opacity-40 shrink-0"
          onClick={add}
          disabled={busy || !text.trim()}
        >
          <Plus size={16} />添加
        </button>
      </div>

      {error && <div className="text-xs text-destructive mb-2 shrink-0">{error}</div>}

      {/* 列表区域 */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3">
        {loading ? (
          <div className="text-xs text-muted-foreground text-center py-4">加载中...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <Circle size={28} className="mx-auto opacity-20 mb-2" />
            <div className="text-xs text-muted-foreground">暂无待办事项</div>
            <div className="text-[11px] text-muted-foreground mt-1">在上方输入框中添加</div>
          </div>
        ) : (
          <>
            {/* 待办分组 */}
            {pending.length > 0 && (
              <div>
                <div className="text-[11px] font-medium text-muted-foreground mb-1.5 px-1">待办</div>
                <div className="space-y-1">
                  {pending.map(t => (
                    <div
                      key={t.id}
                      className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-foreground/[0.03] hover:bg-foreground/5 transition-colors min-h-11"
                    >
                      <button
                        className="shrink-0 w-5 h-5 rounded-full border-2 border-foreground/25 hover:border-primary flex items-center justify-center transition-colors"
                        onClick={() => toggle(t)}
                        aria-label="标记完成"
                      />
                      <span className="flex-1 text-sm">{t.content}</span>
                      <button
                        className="shrink-0 p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => remove(t)}
                        aria-label="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 已完成分组 */}
            {doneItems.length > 0 && (
              <div>
                <div className="text-[11px] font-medium text-muted-foreground mb-1.5 px-1">已完成</div>
                <div className="space-y-1">
                  {doneItems.map(t => (
                    <div
                      key={t.id}
                      className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-foreground/[0.02] hover:bg-foreground/5 transition-colors min-h-11"
                    >
                      <button
                        className="shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                        onClick={() => toggle(t)}
                        aria-label="取消完成"
                      >
                        <Check size={12} strokeWidth={3} />
                      </button>
                      <span className="flex-1 text-sm line-through text-muted-foreground">{t.content}</span>
                      <button
                        className="shrink-0 p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => remove(t)}
                        aria-label="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-3 text-center shrink-0 border-t border-border pt-3">
        <button className="text-xs text-muted-foreground underline hover:text-foreground" onClick={onClose}>关闭</button>
      </div>
    </div>
  )
}
