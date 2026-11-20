import React from 'react';
import { Card } from '@/components/ui/card';

interface WidgetRendererProps {
  bookmark: {
    id: string;
    title: string;
    url: string;
    icon: string;
    widget_type: 'link' | 'banner';
    bgColor?: string; 
  };
  isDragging: boolean; // 接收拖拽标记
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({ bookmark, isDragging }) => {
  
  const handleClick = () => {
    // ✅ 如果刚刚拖拽过，直接return，不打开链接
    if (isDragging) return
    if (bookmark.url) {
      window.open(bookmark.url, '_blank');
    }
  };

  if (bookmark.widget_type === 'link' || !bookmark.widget_type) {
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
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${bookmark.title}&background=random&color=fff&size=64`;
            }}
          />
          <span className="text-sm font-medium truncate w-full text-center">{bookmark.title}</span>
        </div>
      </Card>
    );
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
    );
  }

  return null;
};
