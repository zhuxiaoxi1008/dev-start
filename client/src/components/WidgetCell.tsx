// client/src/components/WidgetCell.tsx
// 单个卡片容器：负责右键（桌面）/长按（触屏）唤起操作菜单
// 抽成组件的原因：useLongPress 是 hook，不能在 map 循环里调用
import type { Bookmark } from '@/types/userConfig'
import { useLongPress } from '@/hooks/useLongPress'
import { WidgetRenderer } from '@/widgets/WidgetRenderer'

interface Props {
  bookmark: Bookmark
  isDragging: boolean
  onRequestMenu: (bookmark: Bookmark, pos: { x: number; y: number }) => void
}

export function WidgetCell({ bookmark, isDragging, onRequestMenu }: Props) {
  const lp = useLongPress({
    onLongPress: (pos) => onRequestMenu(bookmark, pos),
  })

  return (
    <div
      className="group relative cursor-grab active:cursor-grabbing h-full w-full no-callout"
      onContextMenu={(e) => {
        e.preventDefault()
        onRequestMenu(bookmark, { x: e.clientX, y: e.clientY })
      }}
      onTouchStart={lp.onTouchStart}
      onTouchMove={lp.onTouchMove}
      onTouchEnd={lp.onTouchEnd}
      onTouchCancel={lp.onTouchCancel}
      onClickCapture={lp.onClickCapture}
    >
      <WidgetRenderer bookmark={bookmark} isDragging={isDragging} />
    </div>
  )
}