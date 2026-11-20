// client/src/components/BackgroundLayer.tsx (供参考)
import React from 'react';
import { useConfig } from '@/context/UserConfigContext';

export function BackgroundLayer() {
  const { settings } = useConfig();
  
  // 简单处理，根据你的 settings 渲染背景
  return (
    <div 
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        background: settings.bg_type === 'solid' 
          ? settings.bg_solid_color 
          : `linear-gradient(${settings.bg_gradient_angle}deg, ${settings.bg_gradient})`
      }}
    />
  );
}