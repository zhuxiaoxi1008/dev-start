// client/src/widgets/link/LinkCard.tsx
// 原 WidgetRenderer 中 link/banner 的渲染逻辑，原样迁移，行为不变
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
        className="relative overflow-hidden w-full h-full shadow-sm border border-white/20 bg-gradient-to-br from-blue-500 to-indigo-600 text-white cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex flex-col items-center justify-center h-full w-full p-4 no-drag">
          <h3 className="text-lg font-bold mb-1">{bookmark.title}</h3>
          <p className="text-sm opacity-80">JPG / PNG / WEBP</p>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className="relative overflow-hidden w-full h-full shadow-sm border border-white/20 backdrop-blur-sm bg-white/40 hover:bg-white/60 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex flex-col items-center justify-center w-full h-full p-2 no-drag">
        <img
          src={bookmark.icon || `https://ui-avatars.com/api/?name=${bookmark.title}&background=random&color=fff`}
          alt={bookmark.title}
          className="w-10 h-10 object-contain mb-2"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${bookmark.title}&background=random&color=fff&size=64`
          }}
        />
        <span className="text-sm font-medium truncate w-full text-center">{bookmark.title}</span>
      </div>
    </Card>
  )
}