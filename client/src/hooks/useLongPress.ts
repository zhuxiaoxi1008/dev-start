// client/src/hooks/useLongPress.ts
// 触屏长按判定：默认 500ms、移动超过 8px 取消（用于替代桌面右键打开菜单）
import { useCallback, useRef } from 'react'

interface Options {
  delay?: number
  moveThreshold?: number
  onLongPress: (pos: { x: number; y: number }) => void
}

export function useLongPress({ delay = 500, moveThreshold = 8, onLongPress }: Options) {
  const timer = useRef<number | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const fired = useRef(false)

  const clear = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    start.current = null
  }

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    fired.current = false
    start.current = { x: t.clientX, y: t.clientY }
    timer.current = window.setTimeout(() => {
      fired.current = true
      const p = start.current
      if (p) onLongPress(p)
      // 触发后立刻清理，避免后续 touchmove 反复判定
      timer.current = null
    }, delay)
  }, [delay, onLongPress])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!start.current) return
    const t = e.touches[0]
    if (!t) return
    const dx = t.clientX - start.current.x
    const dy = t.clientY - start.current.y
    // 手指明显移动视为滚动意图，取消长按
    if (Math.hypot(dx, dy) > moveThreshold) clear()
  }, [moveThreshold])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    clear()
    // 长按已触发时，阻止随后的 click 造成误触（打开弹窗/打开链接）
    if (fired.current) {
      e.preventDefault()
      fired.current = false
    }
  }, [])

  const onTouchCancel = useCallback(() => { clear() }, [])

  return { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel }
}