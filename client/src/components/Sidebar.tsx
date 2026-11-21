// client/src/components/Sidebar.tsx
import React from 'react';
import { Home, Plus, Settings as SettingsIcon, Sun, Moon } from 'lucide-react';
import { useConfig } from '@/context/UserConfigContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';

export function Sidebar({ onAddClick }: { onAddClick?: () => void }) {
  const { settings, patchSetting } = useConfig();
  const isMobile = useIsMobile();
  const pos = settings.sidebar_position || 'left';

  const toggleTheme = () => {
    patchSetting({ dark_mode: !settings.dark_mode });
  };

  // 触屏统一 44px 可点尺寸
  const btn = 'touch-target flex items-center justify-center p-2.5 rounded-lg active:bg-white/25 transition';

  if (isMobile) {
    return (
      <div className="fixed z-50 inset-x-0 bottom-0 px-safe">
        <div className="mx-3 mb-2 pb-safe">
          <div className="flex items-center justify-between gap-1 bg-black/45 backdrop-blur-md text-white p-1.5 rounded-2xl">
            <button className={btn} aria-label="首页"><Home size={20} /></button>
            <button className={btn} onClick={onAddClick} title="添加小组件" aria-label="添加小组件"><Plus size={20} /></button>
            <button onClick={toggleTheme} className={btn} aria-label="切换主题">
              {settings.dark_mode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className={btn} aria-label="设置"><SettingsIcon size={20} /></button>
          </div>
        </div>
      </div>
    );
  }

  const content = (
    <div className={cn(
      "flex bg-black/40 backdrop-blur-md text-white p-2 rounded-xl gap-4",
      pos === 'left' || pos === 'right' ? 'flex-col h-auto' : 'flex-row w-auto'
    )}>
      <button className={btn} aria-label="首页"><Home size={20} /></button>
      <button className={btn} onClick={onAddClick} title="添加小组件" aria-label="添加小组件"><Plus size={20} /></button>
      <div className="flex-1" />
      <button onClick={toggleTheme} className={btn} aria-label="切换主题">
        {settings.dark_mode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <button className={btn} aria-label="设置"><SettingsIcon size={20} /></button>
    </div>
  );

  return (
    <div className={cn(
      "fixed z-50",
      pos === 'left' && "left-4 top-1/2 -translate-y-1/2",
      pos === 'right' && "right-4 top-1/2 -translate-y-1/2",
      pos === 'top' && "top-4 left-1/2 -translate-x-1/2",
      pos === 'bottom' && "bottom-4 left-1/2 -translate-x-1/2",
    )}>
      {content}
    </div>
  );
}