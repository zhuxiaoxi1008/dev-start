import { useUserConfigContext } from '../../context/UserConfigContext'

export default function LayoutPanel() {
  const { config } = useUserConfigContext()
  if (!config) return <div>加载中...</div>

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">布局设置</h3>
      <p className="text-slate-400 text-sm">后续扩展：列数、间距、卡片样式等</p>
    </div>
  )
}
