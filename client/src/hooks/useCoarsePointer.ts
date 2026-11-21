// client/src/hooks/useCoarsePointer.ts
// 是否为"手指"为主输入设备（手机/平板）。用于决定网格是否允许拖拽，
// 避免触屏上拖拽与页面滚动抢手势。触屏笔记本的触控板/鼠标仍为 fine，不受影响。
import { useEffect, useState } from 'react'

const QUERY = '(pointer: coarse)'

export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(QUERY).matches
  })

  useEffect(() => {
    if (!window.matchMedia) return
    const mql = window.matchMedia(QUERY)
    const onChange = (e: MediaQueryListEvent) => setCoarse(e.matches)
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    }
    mql.addListener(onChange)
    return () => mql.removeListener(onChange)
  }, [])

  return coarse
}