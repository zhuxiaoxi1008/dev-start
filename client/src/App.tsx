import React, { useState, useEffect, useMemo } from 'react'
import { useConfig } from '@/context/UserConfigContext'
import { BackgroundLayer } from '@/components/BackgroundLayer'
import { TimeDisplay } from '@/components/TimeDisplay'
import { SearchBar } from '@/components/SearchBar'
import { SettingModal } from '@/components/SettingModal'
import { Sidebar } from '@/components/Sidebar'
import { WidgetRenderer } from '@/widgets/WidgetRenderer'
import type { Bookmark } from '@/types/userConfig'
import { Responsive, type Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'

const searchEngines = [
  { name: 'Google', icon: 'https://www.google.com/favicon.ico', url: 'https://www.google.com/search?q=' },
  { name: '百度', icon: 'https://www.baidu.com/favicon.ico', url: 'https://www.baidu.com/s?wd=' },
  { name: 'GitHub', icon: 'https://github.com/favicon.ico', url: 'https://github.com/search?q=' },
]

interface EngineItem { name: string; icon: string; url: string; }

function HomePage() {
  const { loading, settings, patchSetting } = useConfig()
  const [keyword, setKeyword] = useState("")
  const [selectedEngine, setSelectedEngine] = useState<EngineItem>(searchEngines[0])
  const [settingOpen, setSettingOpen] = useState(false)
  
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [bookmarksLoading, setBookmarksLoading] = useState(true)

  const handleSearch = () => {
    const val = keyword.trim()
    if (!val) return
    window.open(selectedEngine.url + encodeURIComponent(val), "_blank")
  }

  useEffect(() => {
    if (settings.dark_mode) document.documentElement.classList.add("dark")
    else document.documentElement.classList.remove("dark")
  }, [settings.dark_mode])

  // ========== 【这里是修改后的请求 useEffect，带 isMounted 保护】 ==========
  useEffect(() => {
    if (!settings.user_id) return;

    let isMounted = true;
    const fetchBookmarks = async () => {
      try {
        const res = await fetch('/api/bookmarks', {
          headers: { 'X-User-Id': settings.user_id }
        })
        const json = await res.json()
        if (isMounted && json.data) {
          setBookmarks(json.data)
        }
      } catch (err) {
        console.error('获取书签失败', err)
      } finally {
        if (isMounted) {
          setBookmarksLoading(false)
        }
      }
    }
    fetchBookmarks()

    return () => {
      isMounted = false
    }
  }, [settings.user_id])
  // ======================================================================

  // 将后端数据转换为 react-grid-layout 需要的 Layout 格式
  const layouts = useMemo(() => {
    return bookmarks.map(bm => ({
      i: bm.id,
      x: bm.x,
      y: bm.y,
      w: bm.w,
      h: bm.h,
      static: false
    }))
  }, [bookmarks])

  // 拖拽结束后的保存逻辑
  const onLayoutChange = async (currentLayout: Layout[]) => {
    // 1. 更新本地状态，避免视觉闪回
    const updatedBookmarks = bookmarks.map(bm => {
      const layoutItem = currentLayout.find(l => l.i === bm.id)
      if (layoutItem) {
        return { ...bm, x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h }
      }
      return bm
    })
    setBookmarks(updatedBookmarks)

    // 2. 异步发送到后端保存
    try {
      await fetch('/api/bookmarks/layout', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': settings.user_id 
        },
        body: JSON.stringify(currentLayout)
      })
    } catch (err) {
      console.error('保存布局失败', err)
    }
  }

  if (loading || bookmarksLoading) {
    return <div className="min-h-screen flex items-center justify-center text-foreground">加载配置...</div>
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <BackgroundLayer />
      <Sidebar />

      <div className="relative z-20 flex flex-col items-center pt-16 px-4 shrink-0 pointer-events-none">
        <div className="pointer-events-auto flex flex-col items-center w-full">
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
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto mt-8 pb-32">
        <div className="max-w-6xl mx-auto px-4 relative">
          <Responsive
            className="layout"
            layouts={{ lg: layouts }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={80}
            width={1152}
            onLayoutChange={onLayoutChange}
            draggableCancel=".no-drag"
            isBounded={true}
            isResizable={false} 
            compactType="vertical" 
            preventCollision={false} 
            margin={[16, 16]} 
            containerPadding={[0, 0]} 
            useCSSTransforms={true} 
            transitionDuration={200} 
          >
            {bookmarks.map((widget) => (
              <div key={widget.id} className="group relative cursor-grab active:cursor-grabbing">
                <WidgetRenderer bookmark={widget} />
              </div>
            ))}
          </Responsive>
        </div>
      </div>

      <SettingModal open={settingOpen} onClose={() => setSettingOpen(false)} />
    </div>
  )
}

export default HomePage
