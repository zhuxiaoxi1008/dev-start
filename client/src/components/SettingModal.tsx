import { X } from 'lucide-react'
import { WallpaperSettingPanel } from './WallpaperSettingPanel'

interface Props {
  open: boolean
  onClose: () => void
}

export function SettingModal({ open, onClose }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[600px] max-h-[80vh] overflow-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">背景设置</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <WallpaperSettingPanel />
      </div>
    </div>
  )
}
