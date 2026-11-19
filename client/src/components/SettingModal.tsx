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
      <div className="bg-white w-full max-w-md rounded-2xl p-4 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-black">
          <X size={20} />
        </button>
        <h3 className="text-lg font-medium mb-3 text-black">背景设置</h3>
        <WallpaperSettingPanel />
      </div>
    </div>
  )
}
