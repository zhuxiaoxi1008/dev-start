// client/src/widgets/link/LinkCard.tsx
import React from 'react'
import { Card } from '@/components/ui/card'
import type { Bookmark } from '@/types/userConfig'

interface Props {
  bookmark: Bookmark
  isDragging: boolean
}

export const LinkCard: React.FC<Props> = ({ bookmark, isDragging }) => {
  const handleClick = () => {
    if (isDragging) return
    if (bookmark.url) {
      window.open(bookmark.url, '_blank')
    }
  }

  if (bookmark.widget_type === 'banner') {
    return (
      <Card
        className="relative overflow-hidden w-full h-full shadow-sm border border-white/20
          bg-gradient-to-br from-blue-500 to-indigo-600 text-white cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex flex-col items-center justify-center h-full w-full p-3 sm:p-4 no-drag">
          {/* 小屏隐藏图标容器，节省纵向空间 */}
          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg bg-white/15 mb-2">
            <img src={bookmark.icon} alt={bookmark.title} className="w-6 h-6 object-contain" />
          </div>
          <h3 className="text-sm sm:text-lg font-bold mb-0.5 sm:mb-1 truncate max-w-full px-2">
            {bookmark.title}
          </h3>
          {/* 副标题移动端隐藏 */}
          <p className="hidden sm:inline-block text-sm opacity-80">JPG / PNG / WEBP</p>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className="relative overflow-hidden w-full h-full p-0 backdrop-blur-xl border border-border
        bg-card transition-colors cursor-pointer tap-scale"
      onClick={handleClick}
    >
      <div className="flex flex-col items-center justify-center w-full h-full no-drag px-1">
        <img
          src={bookmark.icon || `https://ui-avatars.com/api/?name=${bookmark.title}&background=random&color=fff`}
          alt={bookmark.title}
          className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src =
              `https://ui-avatars.com/api/?name=${bookmark.title}&background=random&color=fff&size=64`
          }}
        />
        {/* w > 1 时才显示标题 */}
        {bookmark.w > 1 && (
          <span className="text-xs sm:text-sm font-medium truncate w-full text-center min-h-2 mt-1">
            {bookmark.title}
          </span>
        )}
      </div>
    </Card>
  )
}
