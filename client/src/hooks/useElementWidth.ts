// client/src/hooks/useElementWidth.ts
// 实测容器宽度（ResizeObserver）
// 用 callback ref + 稳定的 setState：节点出现/消失/被条件渲染替换时都能重新绑定观察器，
// 避免 ref 挂载在条件渲染分支上时首次拿不到节点、宽度永远为 0。
import { useCallback, useEffect, useState } from 'react'

export function useElementWidth<T extends HTMLElement = HTMLDivElement>() {
  const [node, setNode] = useState<T | null>(null)
  const [width, setWidth] = useState(0)

  // 稳定的 callback ref：React 只在挂载/卸载时调用，不会造成每帧重建
  const ref = useCallback((el: T | null) => {
    setNode(prev => (prev === el ? prev : el))
  }, [])

  useEffect(() => {
    if (!node) return

    const measure = () => {
      const w = node.clientWidth
      // 宽度为 0 时不更新，避免隐藏态/首帧写入 0 导致网格错位
      if (w > 0) setWidth(w)
    }
    measure()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }

    const ro = new ResizeObserver(measure)
    ro.observe(node)
    return () => ro.disconnect()
  }, [node])

  return { ref, width }
}