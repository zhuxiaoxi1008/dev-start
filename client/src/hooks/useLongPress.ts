// client/src/hooks/useLongPress.ts
// 触屏长按判定：默认 500ms，位移超过 8px 视为滚动并取消
import { useCallback, useRef } from 'react'
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react'

interface Options {
  delay?: number
  moveThreshold?: number
  onLongPress: (pos: { x: number; y: number }) => void
}

export function useLongPress({ delay = 500, moveThreshold = 8, onLongPress }: Options) {
  const timer = useRef<number | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const fired = useRef(false)

  const clear = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    start.current = null
  }, [])

  const onTouchStart = useCallback((e: ReactTouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    fired.current = false
    start.current = { x: t.clientX, y: t.clientY }
    timer.current = window.setTimeout(() => {
      const p = start.current
      if (p) {
        fired.current = true
        onLongPress(p)
      }
      timer.current = null
    }, delay)
  }, [delay, onLongPress])

  const onTouchMove = useCallback((e: ReactTouchEvent) => {
    const s = start.current
    const t = e.touches[0]
    if (!s || !t) return
    if (Math.hypot(t.clientX - s.x, t.clientY - s.y) > moveThreshold) clear()
  }, [clear, moveThreshold])

  const onTouchEnd = useCallback(() => { clear() }, [clear])
  const onTouchCancel = useCallback(() => { clear() }, [clear])

  // 长按已触发后，手指抬起时浏览器仍会补发一次 click。
  // 在捕获阶段吞掉它，避免"长按弹出菜单"又紧接着触发卡片自身的点击（打开设置）。
  const onClickCapture = useCallback((e: ReactMouseEvent) => {
    if (!fired.current) return
    fired.current = false
    e.stopPropagation()
    e.preventDefault()
  }, [])

  return { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel, onClickCapture }
}