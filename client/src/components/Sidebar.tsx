// client/src/components/Sidebar.tsx
import React from 'react';
import { Home, Plus, Settings as SettingsIcon, Sun, Moon } from 'lucide-react';
import { useConfig } from '@/context/UserConfigContext';
import { cn } from '@/lib/utils'; // 假设你有这个工具类用于合并 class

export function Sidebar() {
  const { settings, patchSetting } = useConfig();
  const pos = settings.sidebar_position || 'left';

  const toggleTheme = () => {
    patchSetting({ dark_mode: !settings.dark_mode });
  };

  // 基础样式（内部内容）
  const content = (
    <div className={cn(
      "flex bg-black/40 backdrop-blur-md text-white p-2 rounded-xl gap-4",
      pos === 'left' || pos === 'right' ? 'flex-col h-auto' : 'flex-row w-auto'
    )}>
      <button className="p-2 hover:bg-white/20 rounded-lg transition"><Home size={20} /></button>
      <button className="p-2 hover:bg-white/20 rounded-lg transition"><Plus size={20} /></button>
      <div className="flex-1" />
      <button onClick={toggleTheme} className="p-2 hover:bg-white/20 rounded-lg transition">
        {settings.dark_mode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <button className="p-2 hover:bg-white/20 rounded-lg transition"><SettingsIcon size={20} /></button>
    </div>
  );

  // 根据位置返回不同的绝对定位包装器
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