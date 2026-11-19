import React, { useState, useEffect } from 'react'
import { Search, Sparkles, Folder, Plus, Trash2, Edit3, Check, X, FolderPlus, ExternalLink, Github, Zap, Database } from 'lucide-react'
import { useConfig } from '@/context/UserConfigContext'
import { BackgroundLayer } from '@/components/BackgroundLayer'
import { TimeDisplay } from '@/components/TimeDisplay'
import { SearchBar } from '@/components/SearchBar'
import { QuickBookmarkBar } from '@/components/QuickBookmarkBar'
import { SettingModal } from '@/components/SettingModal'

const searchEngines = [
  { name: 'Google', icon: '🌐', url: 'https://www.google.com/search?q=' },
  { name: '百度', icon: '🐾', url: 'https://www.baidu.com/s?wd=' },
  { name: 'GitHub', icon: '🐙', url: 'https://github.com/search?q=' },
  { name: 'DeepSeek', icon: '🤖', url: 'https://chat.deepseek.com/search?q=' },
]

interface EngineItem {
  name: string
  icon: string
  url: string
}

const defaultBookmarks = [
  { id: '1', name: 'GitHub', url: 'https://github.com', icon: Github },
  { id: '2', name: 'Vite', url: 'https://vitejs.dev', icon: Zap },
  { id: '3', name: 'Supabase', url: 'https://supabase.com', icon: Database },
]

function HomePage() {
  const { loading, settings } = useConfig()
  const [keyword, setKeyword] = useState("")
  const [selectedEngine, setSelectedEngine] = useState<EngineItem>(searchEngines[0])
  const [settingOpen, setSettingOpen] = useState(false)

  const handleSearch = () => {
    const val = keyword.trim()
    if (!val) return
    window.open(selectedEngine.url + encodeURIComponent(val), "_blank")
  }

  useEffect(() => {
    if (settings.dark_mode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [settings.dark_mode])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-foreground">加载配置...</div>
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <BackgroundLayer />
      <div className="relative z-10 flex flex-col items-center pt-16 px-4">
        <TimeDisplay />
        <SearchBar
          engines={searchEngines}
          selectedEngine={selectedEngine}
          keyword={keyword}
          onChangeKeyword={setKeyword}
          onChangeEngine={setSelectedEngine}
          onSearch={handleSearch}
          onOpenSetting={() => setSettingOpen(true)}
        />
        <QuickBookmarkBar list={defaultBookmarks} />
      </div>
      <SettingModal open={settingOpen} onClose={() => setSettingOpen(false)} />
    </div>
  )
}

export default HomePage
