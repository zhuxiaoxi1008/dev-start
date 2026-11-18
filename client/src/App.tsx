import React, { useState, useEffect } from 'react'
import { Search, Sparkles, Folder, Settings, Terminal } from 'lucide-react'

// 搜索引擎配置
const searchEngines = [
  { name: 'Google', icon: '🌐', url: 'https://www.google.com/search?q=' },
  { name: '百度', icon: '🐾', url: 'https://www.baidu.com/s?wd=' },
  { name: 'GitHub', icon: '🐙', url: 'https://github.com/search?q=' },
  { name: 'DeepSeek', icon: '🤖', url: 'https://chat.deepseek.com/search?q=' },
]

export default function App() {
  const [engine, setEngine] = useState(searchEngines[0])
  const [keyword, setKeyword] = useState('')
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [apiStatus, setApiStatus] = useState<string>('正在连接后端...')

  // 从后端 API 加载分类与书签数据
  useEffect(() => {
    fetch('/api/bookmarks')
      .then((res) => res.json())
      .then((res: any) => {
        if (res.success && res.data) {
          setCategories(res.data)
          setApiStatus('后端连接正常，已同步云端书签')
        } else {
          setApiStatus('数据加载异常')
        }
        setLoading(false)
      })
      .catch(() => {
        setApiStatus('后端连接失败（请确保 Hono 服务已在 8787 端口启动）')
        setLoading(false)
      })
  }, [])

  // 处理搜索提交
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyword.trim()) return
    window.open(engine.url + encodeURIComponent(keyword), '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950">
      
      {/* 顶部状态栏 */}
      <header className="w-full max-w-6xl mx-auto p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/80 backdrop-blur-md text-xs text-indigo-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="font-medium">DevStart 开发者起始页</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline-block bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800">
            {apiStatus}
          </span>
          <button className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:bg-slate-800 transition text-slate-300">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 主体交互区域 */}
      <main className="w-full max-w-4xl mx-auto px-4 flex flex-col items-center my-auto z-10 space-y-8">
        
        {/* 核心标语 */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Hello, Developer.
          </h1>
          <p className="text-slate-400 text-sm">
            保持专注，代码改变世界。
          </p>
        </div>

        {/* 聚合搜索框 */}
        <form onSubmit={handleSearch} className="w-full max-w-2xl relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-400 transition" />
          </div>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={`使用 ${engine.name} 搜索或输入网址...`}
            className="w-full pl-12 pr-32 py-4 bg-slate-900/70 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
          />
          <div className="absolute inset-y-1.5 right-1.5 flex items-center gap-1 bg-slate-950/60 px-2 rounded-xl border border-slate-800/60">
            {searchEngines.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setEngine(item)}
                className={`px-2 py-1.5 rounded-lg text-xs transition flex items-center gap-1 ${
                  engine.name === item.name
                    ? 'bg-indigo-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                title={item.name}
              >
                <span>{item.icon}</span>
              </button>
            ))}
          </div>
        </form>

        {/* 网址导航分类看板 */}
        <div className="w-full space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <Folder className="w-4 h-4 text-indigo-400" />
              云端导航书签
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500 text-sm">正在加载云端书签数据...</div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md space-y-3">
                  <h3 className="text-xs font-semibold text-slate-300 tracking-wider uppercase">{cat.name}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {cat.bookmarks?.map((bookmark: any) => (
                      <a
                        key={bookmark.id}
                        href={bookmark.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/50 hover:bg-slate-800/60 hover:border-indigo-500/30 transition group"
                      >
                        <span className="text-base p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">{bookmark.icon || '🔗'}</span>
                        <span className="text-xs text-slate-300 group-hover:text-indigo-300 transition truncate">{bookmark.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-sm">暂无分类数据，请在 Supabase 中添加。</div>
          )}
        </div>

      </main>

      {/* 底部版权 */}
      <footer className="w-full max-w-6xl mx-auto p-6 text-center text-xs text-slate-600 z-10">
        DevStart Dashboard &copy; 2026 &bull; Powered by React, Hono & Cloudflare Workers
      </footer>

    </div>
  )
}