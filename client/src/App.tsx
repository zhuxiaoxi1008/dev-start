import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  Sparkles,
  Folder,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  FolderPlus,
  ExternalLink,
  Settings,
} from 'lucide-react'
import { useUserConfig } from './context/UserConfigContext'
import { getBgStyle } from './utils/bg'
import WallpaperSettingPanel from './components/WallpaperSettingPanel'

const searchEngines = [
  { name: 'Google', icon: '🌐', url: 'https://www.google.com/search?q=' },
  { name: '百度', icon: '🐾', url: 'https://www.baidu.com/s?wd=' },
  { name: 'GitHub', icon: '🐙', url: 'https://github.com/search?q=' },
  { name: 'DeepSeek', icon: '🤖', url: 'https://chat.deepseek.com/search?q=' },
]

interface Bookmark {
  id: string
  category_id: string
  title: string
  url: string
  icon?: string
  sort_order: number
}

interface Category {
  id: string
  name: string
  sort_order: number
  bookmarks: Bookmark[]
}

export default function App() {
  const { settings, updateSettings, loading: configLoading } = useUserConfig()
  const bgStyle = getBgStyle(settings)

  const [engine, setEngine] = useState(searchEngines[0])
  const [keyword, setKeyword] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [apiStatus, setApiStatus] = useState<string>('同步中...')
  const [isEditMode, setIsEditMode] = useState(false)
  const [now, setNow] = useState(new Date())

  // 弹窗状态
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const [showBookmarkModal, setShowBookmarkModal] = useState(false)
  const [bookmarkForm, setBookmarkForm] = useState({
    category_id: '',
    title: '',
    url: '',
    icon: '🔗',
  })

  const [showSettingsModal, setShowSettingsModal] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // 1. 拉取后端书签数据
  const fetchBookmarks = async () => {
    try {
      const res = await fetch('/api/bookmarks')
      const data = await res.json()
      if (data.success && data.data) {
        setCategories(data.data)
        setApiStatus('已连接云端')
      } else {
        setApiStatus('数据异常')
      }
    } catch {
      setApiStatus('离线模式')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookmarks()
  }, [])

  // 2. 实时时钟更新
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 3. 全局快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === 'Escape') {
        setShowCategoryModal(false)
        setShowBookmarkModal(false)
        setShowSettingsModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 搜索提交
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = keyword.trim()
    if (!trimmed) return
    if (/^https?:\/\//i.test(trimmed)) {
      window.open(trimmed, '_blank')
      return
    }
    window.open(engine.url + encodeURIComponent(trimmed), '_blank')
  }

  // 新增分类
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newCategoryName.trim(),
        sort_order: categories.length + 1,
      }),
    })
    const data = await res.json()
    if (data.success) {
      setNewCategoryName('')
      setShowCategoryModal(false)
      fetchBookmarks()
    }
  }

  // 删除分类
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`确定要删除分类「${name}」及其下的所有书签吗？`)) return
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      fetchBookmarks()
    }
  }

  // 打开新增书签弹窗
  const openAddBookmark = (categoryId?: string) => {
    setBookmarkForm({
      category_id: categoryId || (categories[0]?.id ?? ''),
      title: '',
      url: '',
      icon: '🔗',
    })
    setShowBookmarkModal(true)
  }

  // 新增书签
  const handleCreateBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookmarkForm.category_id || !bookmarkForm.title.trim() || !bookmarkForm.url.trim()) return

    let formattedUrl = bookmarkForm.url.trim()
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl
    }

    const targetCat = categories.find((c) => c.id === bookmarkForm.category_id)
    const nextOrder = (targetCat?.bookmarks?.length ?? 0) + 1

    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category_id: bookmarkForm.category_id,
        title: bookmarkForm.title.trim(),
        url: formattedUrl,
        icon: bookmarkForm.icon.trim() || '🔗',
        sort_order: nextOrder,
      }),
    })
    const data = await res.json()
    if (data.success) {
      setShowBookmarkModal(false)
      fetchBookmarks()
    }
  }

  // 删除书签
  const handleDeleteBookmark = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    const res = await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      fetchBookmarks()
    }
  }

  const timeString = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateString = now.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  const gridClass =
    settings.layout_config.columns === 3
      ? 'grid grid-cols-1 md:grid-cols-3 gap-4'
      : 'grid grid-cols-1 md:grid-cols-2 gap-4'

  if (configLoading) {
    return (
      <div className="min-h-screen w-full grid place-items-center text-slate-200 bg-slate-950">
        加载中...
      </div>
    )
  }

  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col justify-between relative overflow-x-hidden"
      style={bgStyle}
    >
      {/* 顶部状态栏 */}
      <header className="w-full max-w-6xl mx-auto p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs text-indigo-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="font-medium">DevStart</span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-300 hidden sm:inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {apiStatus}
          </span>

          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md hover:bg-white/20 transition text-xs text-slate-200"
            title="新建分类"
          >
            <FolderPlus className="w-3.5 h-3.5 text-indigo-300" />
            <span className="hidden sm:inline">新建分类</span>
          </button>

          <button
            onClick={() => openAddBookmark()}
            disabled={categories.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 disabled:opacity-40 transition text-xs text-white font-medium shadow-sm"
            title="添加书签"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">添加网址</span>
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-xl border backdrop-blur-md transition bg-white/10 border-white/15 text-slate-200 hover:bg-white/20"
            title="设置面板"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`p-2 rounded-xl border backdrop-blur-md transition ${
              isEditMode
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-white/10 border-white/15 text-slate-200 hover:bg-white/20'
            }`}
            title={isEditMode ? '完成编辑' : '管理/删除'}
          >
            {isEditMode ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 主体交互区域 */}
      <main className="w-full max-w-5xl mx-auto px-4 flex flex-col items-center my-auto z-10 space-y-8 py-4">
        {/* 实时时钟与日期 */}
        {settings.layout_config.showClock && (
          <div className="text-center space-y-1">
            <div className="text-6xl sm:text-6xl font-medium tracking-tight text-white drop-shadow-lg tabular-nums">
              {timeString}
            </div>
            <p className="text-slate-300 text-xs sm:text-sm tracking-wide drop-shadow">{dateString}</p>
          </div>
        )}

        {/* 聚合搜索框 */}
        <form onSubmit={handleSearch} className="w-full max-w-2xl relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-300 group-focus-within:text-indigo-300 transition" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={`使用 ${engine.name} 搜索，或按 / 键快速聚焦...`}
            className="w-full pl-12 pr-36 py-4 bg-white/10 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-400 transition"
          />
          <div className="absolute inset-y-1.5 right-1.5 flex items-center gap-1 bg-slate-950/60 px-2 rounded-xl border border-white/10">
            {searchEngines.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setEngine(item)}
                className={`px-2 py-1.5 rounded-lg text-xs transition flex items-center gap-1 ${
                  engine.name === item.name
                    ? 'bg-indigo-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'
                }`}
                title={item.name}
              >
                <span>{item.icon}</span>
              </button>
            ))}
          </div>
        </form>

        {/* 网址导航分类看板 */}
        <div className="w-full space-y-6 pt-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-xs font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
              <Folder className="w-4 h-4 text-indigo-300" />
              云端导航书签
            </h2>
            {isEditMode && (
              <span className="text-xs text-amber-300 animate-pulse">
                编辑模式已开启：点击右上角图标可删除分类或书签
              </span>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-300 text-sm backdrop-blur-sm">
              正在加载云端书签数据...
            </div>
          ) : categories.length > 0 ? (
            <div className={gridClass}>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white/10 border border-white/15 rounded-2xl p-4 backdrop-blur-md space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-200 tracking-wider uppercase">
                      {cat.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openAddBookmark(cat.id)}
                        className="p-1 rounded-lg text-slate-300 hover:text-indigo-300 hover:bg-white/10 transition"
                        title="在此分类下添加网址"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      {isEditMode && (
                        <button
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="p-1 rounded-lg text-rose-300 hover:bg-rose-500/20 transition"
                          title="删除此分类"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {cat.bookmarks?.map((bookmark) => (
                      <a
                        key={bookmark.id}
                        href={bookmark.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          if (isEditMode) e.preventDefault()
                        }}
                        className="relative flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 hover:border-indigo-400/30 transition group"
                      >
                        <span className="text-base p-1.5 rounded-lg bg-white/10 border border-white/10 shrink-0">
                          {bookmark.icon || '🔗'}
                        </span>
                        <span className="text-xs text-slate-200 group-hover:text-indigo-200 transition truncate">
                          {bookmark.title}
                        </span>
                        {!isEditMode && (
                          <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition ml-auto shrink-0" />
                        )}
                        {isEditMode && (
                          <button
                            onClick={(e) => handleDeleteBookmark(e, bookmark.id)}
                            className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-500 transition"
                            title="删除书签"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-300 text-sm backdrop-blur-sm">
              暂无分类数据，点击右上角「新建分类」开始定制你的起始页。
            </div>
          )}
        </div>
      </main>

      {/* 底部版权 */}
      <footer className="w-full max-w-6xl mx-auto p-6 text-center text-xs text-slate-400 z-10 drop-shadow">
        DevStart Dashboard &copy; 2026 &bull; Powered by React, Hono & Cloudflare Workers
      </footer>

      {/* 弹窗 1：新建分类 */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateCategory}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">新建书签分类</h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              autoFocus
              required
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="例如：常用工具、技术博客"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
              >
                确认创建
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 弹窗 2：新增书签 */}
      {showBookmarkModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateBookmark}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">添加网址书签</h3>
              <button
                type="button"
                onClick={() => setShowBookmarkModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">所属分类</label>
                <select
                  value={bookmarkForm.category_id}
                  onChange={(e) =>
                    setBookmarkForm({ ...bookmarkForm, category_id: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs text-slate-400 mb-1">图标</label>
                  <input
                    type="text"
                    value={bookmarkForm.icon}
                    onChange={(e) => setBookmarkForm({ ...bookmarkForm, icon: e.target.value })}
                    placeholder="🔗"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-center text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs text-slate-400 mb-1">网站名称</label>
                  <input
                    type="text"
                    autoFocus
                    required
                    value={bookmarkForm.title}
                    onChange={(e) => setBookmarkForm({ ...bookmarkForm, title: e.target.value })}
                    placeholder="例如：GitHub"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">网址 URL</label>
                <input
                  type="text"
                  required
                  value={bookmarkForm.url}
                  onChange={(e) => setBookmarkForm({ ...bookmarkForm, url: e.target.value })}
                  placeholder="https://github.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBookmarkModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
              >
                保存书签
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 弹窗 3：设置面板 */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setShowSettingsModal(false)
            }}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">起始页设置</h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <WallpaperSettingPanel />

            <div>
              <label className="block text-xs text-slate-400 mb-2">分类卡片列数</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="columns"
                    checked={settings.layout_config.columns === 2}
                    onChange={() =>
                      updateSettings({
                        layout_config: { ...settings.layout_config, columns: 2 },
                      })
                    }
                    className="accent-indigo-500"
                  />
                  <span className="text-xs text-slate-200">2 列</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="columns"
                    checked={settings.layout_config.columns === 3}
                    onChange={() =>
                      updateSettings({
                        layout_config: { ...settings.layout_config, columns: 3 },
                      })
                    }
                    className="accent-indigo-500"
                  />
                  <span className="text-xs text-slate-200">3 列</span>
                </label>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.layout_config.showClock}
                  onChange={(e) =>
                    updateSettings({
                      layout_config: { ...settings.layout_config, showClock: e.target.checked },
                    })
                  }
                  className="accent-indigo-500"
                />
                <span className="text-xs text-slate-200">显示时钟与日期</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800"
              >
                关闭
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}