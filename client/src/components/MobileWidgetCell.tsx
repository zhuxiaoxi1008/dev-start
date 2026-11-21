// client/src/components/MobileWidgetCell.tsx
// 移动端单个卡片容器：负责长按唤起操作表 + 按组件尺寸折算网格跨行列
import type { Bookmark } from '@/types/userConfig'
import { useLongPress } from '@/hooks/useLongPress'
import { WidgetRenderer } from '@/widgets/WidgetRenderer'

export const MOBILE_ROW_H = 80
export const MOBILE_COLS = 2

interface Props {
  bookmark: Bookmark
  onLongPress: (bookmark: Bookmark, pos: { x: number; y: number }) => void
}

export function MobileWidgetCell({ bookmark, onLongPress }: Props) {
  const lp = useLongPress({
    onLongPress: (pos) => onLongPress(bookmark, pos),
  })

  // 行跨数与桌面 h 一致：gridAutoRows 已是 80px，h=2 即 2 行共 160px
  const rowSpan = Math.max(1, Math.round(bookmark.h || 2))
  // 跨列：宽组件（天气/图片转换等 w>=4）占满整行
  const colSpan = bookmark.w >= 4 ? MOBILE_COLS : 1

  return (
    <div
      className="relative min-w-0 tap-scale"
      style={{
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
      }}
      {...lp}
    >
      <WidgetRenderer bookmark={bookmark} isDragging={false} />
    </div>
  )
}