// client/src/components/SettingsModal.tsx
// 常规设置：深色模式、侧边栏位置
import { X } from 'lucide-react'
import { useConfig } from '@/context/UserConfigContext'
import type { UserSettings } from '@/types/userConfig'

interface Props {
  open: boolean
  onClose: () => void
}

const POSITIONS: { value: UserSettings['sidebar_position']; label: string }[] = [
  { value: 'left', label: '左侧' },
  { value: 'right', label: '右侧' },
  { value: 'top', label: '顶部' },
  { value: 'bottom', label: '底部' },
]

export function SettingsModal({ open, onClose }: Props) {
  const { settings, patchSetting } = useConfig()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="relative bg-popover text-popover-foreground ring-1 ring-foreground/10 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md p-5 pb-safe"
        onClick={e => e.stopPropagation()}
      >
        <button className="absolute top-3 right-3 p-1 rounded-full hover:bg-accent" onClick={onClose} aria-label="关闭">
          <X size={18} />
        </button>
        <h3 className="text-center text-base font-semibold mb-4">设置</h3>

        <div className="space-y-4 text-sm">
          <label className="flex items-center justify-between min-h-11">
            <span className="font-medium">深色模式</span>
            <input
              type="checkbox"
              className="accent-primary w-5 h-5"
              checked={settings.dark_mode}
              onChange={e => patchSetting({ dark_mode: e.target.checked })}
            />
          </label>

          <div>
            <div className="font-medium mb-2">侧边栏位置</div>
            <div className="grid grid-cols-4 gap-1 rounded-lg overflow-hidden border border-border">
              {POSITIONS.map(({ value, label }) => (
                <button
                  key={value}
                  className={`min-h-11 text-sm ${
                    settings.sidebar_position === value
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-muted-foreground active:bg-accent/60 hover:bg-accent/60'
                  }`}
                  onClick={() => patchSetting({ sidebar_position: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            className="w-full min-h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium active:bg-primary/80 hover:bg-primary/80"
            onClick={onClose}
          >
            完成
          </button>
        </div>
      </div>
    </div>
  )
}
