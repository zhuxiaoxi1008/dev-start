// client/src/widgets/WidgetRenderer.tsx
// 查注册表分发；link 及未注册类型回退 LinkCard，banner 兼容映射到图片格式转换
import React, { Suspense } from 'react'
import { useConfig } from '@/context/UserConfigContext'
import type { Bookmark } from '@/types/userConfig'
import type { WidgetConfig } from '@/types/widgets'
import { getWidget, LinkCard } from './registry'
import { WidgetModalHost } from './WidgetModalHost'
import './registerAll'

interface WidgetRendererProps {
  bookmark: Bookmark
  isDragging: boolean
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({ bookmark, isDragging }) => {
  const { settings, patchSetting } = useConfig()
  const [modalOpen, setModalOpen] = React.useState(false)

  const type = bookmark.widget_type || 'link'
  // banner 是"图片格式转换"的旧形态，统一交给 image_convert 组件处理
  const def = getWidget(type === 'banner' ? 'image_convert' : type)

  if (!def || type === 'link') {
    return <LinkCard bookmark={bookmark} isDragging={isDragging} />
  }

  const config: WidgetConfig = (settings.widgets_config?.[bookmark.id] as WidgetConfig) ?? def.defaultConfig()
  const Card = def.Card
  const Settings = def.Settings

  const handleSave = (next: WidgetConfig) => {
    patchSetting({
      widgets_config: { ...settings.widgets_config, [bookmark.id]: next },
    })
    setModalOpen(false)
  }

  return (
    <>
      <Suspense fallback={<div className="w-full h-full rounded-xl bg-white/30 animate-pulse" />}>
        <Card
          bookmark={bookmark}
          config={config}
          isDragging={isDragging}
          onOpen={() => { if (!isDragging) setModalOpen(true) }}
        />
      </Suspense>
      {modalOpen && Settings && (
        <WidgetModalHost onClose={() => setModalOpen(false)} wide={type === 'calendar'}>
          <Suspense fallback={<div className="p-8 text-center text-sm">加载中...</div>}>
            <Settings
              bookmark={bookmark}
              config={config}
              onSave={handleSave}
              onClose={() => setModalOpen(false)}
            />
          </Suspense>
        </WidgetModalHost>
      )}
    </>
  )
}