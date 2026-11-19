import React, { useState } from 'react'
import { useConfig } from './context/UserConfigContext'
import { BackgroundLayer } from './components/BackgroundLayer'
import { SettingModal } from './components/SettingModal'
import { Search, Sparkles, Folder, Plus, Trash2, Edit3, Check, X, FolderPlus, ExternalLink, Settings } from 'lucide-react'

// 搜索引擎配置
const searchEngines = [
  { name: 'Google', icon: '🌐', url: 'https://www.google.com/search?q=' },
  { name: '百度', icon: '🐾', url: 'https://www.baidu.com/s?wd=' },
  { name: 'GitHub', icon: '🐙', url: 'https://github.com/search?q=' },
  { name: 'DeepSeek', icon: '🤖', url: 'https://chat.deepseek.com/search?q=' },
]

export default function App() {
  const { loading } = useConfig()
  const [settingOpen, setSettingOpen] = useState(false)

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-800">加载配置...</div>
  }

  return (
    <div className="min-h-screen text-slate-800 relative">
      <BackgroundLayer />

      {/* 顶部搜索栏 */}
      <header className="p-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4" />
            <input
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/80 backdrop-blur outline-none"
              placeholder="搜索..."
            />
          </div>
          <button onClick={() => setSettingOpen(true)} className="p-2 bg-white/80 rounded-xl">
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* 主内容：书签区域 */}
      <main className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-4 gap-4">
          {/* 原有书签卡片区域 */}
        </div>
      </main>

      <SettingModal open={settingOpen} onClose={() => setSettingOpen(false)} />
    </div>
  )
}
