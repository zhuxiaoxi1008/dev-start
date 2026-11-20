import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useConfig } from '@/context/UserConfigContext'
import { BackgroundLayer } from '@/components/BackgroundLayer'
import { TimeDisplay } from '@/components/TimeDisplay'
import { SearchBar } from '@/components/SearchBar'
import { SettingModal } from '@/components/SettingModal'
import { Sidebar } from '@/components/Sidebar'
import { WidgetPicker } from '@/components/WidgetPicker'
import { WidgetRenderer } from '@/widgets/WidgetRenderer'
import type { Bookmark } from '@/types/userConfig'
import { WIDGET_DEFAULT_SIZE, type WidgetType } from '@/types/widgets'
import { getWidget } from '@/widgets/registry'
import { Responsive, type Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import { WidgetActionProvider, type WidgetActions } from '@/widgets/WidgetActionContext'
import { WidgetContextMenu } from '@/widgets/WidgetContextMenu'

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
  const [pickerOpen, setPickerOpen] = useState(false)
  
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [bookmarksLoading, setBookmarksLoading] = useState(true)
  // 👉 新增拖拽标记
  const [isDragging, setIsDragging] = useState(false)

  // 右键菜单状态：哪个小组件、在哪个坐标弹出
  const [menu, setMenu] = useState<{ open: boolean; x: number; y: number; bookmark: Bookmark | null }>({
    open: false, x: 0, y: 0, bookmark: null,
  })
  // 各小组件"打开设置"入口注册表：WidgetRenderer 通过 context 注册自身打开函数
  const openersRef = useRef(new Map<string, () => void>())

  // 跨组件动作：打开设置 / 移除组件（移除即 DELETE bookmark 并从本地状态过滤）
  const actions = useMemo<WidgetActions>(() => ({
    registerOpener: (id, fn) => {
      openersRef.current.set(id, fn)
      return () => { openersRef.current.delete(id) }
    },
    openSettings: (id) => { openersRef.current.get(id)?.() },
    removeWidget: async (id) => {
      try {
        const res = await fetch(`/api/bookmarks/${id}`, {
          method: 'DELETE',
          headers: { 'X-User-Id': settings.user_id },
        })
        if (!res.ok) throw new Error('移除失败')
        setBookmarks(prev => prev.filter(b => b.id !== id))
      } catch (err) {
        console.error('移除组件失败', err)
      }
    },
  }), [settings.user_id])

  // 全局屏蔽浏览器默认右键菜单（统一改由小组件自定义菜单接管）
  useEffect(() => {
    const prevent = (e: MouseEvent) => e.preventDefault()
    window.addEventListener('contextmenu', prevent)
    return () => window.removeEventListener('contextmenu', prevent)
  }, [])

  const handleSearch = () => {
    const val = keyword.trim()
    if (!val) return
    window.open(selectedEngine.url + encodeURIComponent(val), "_blank")
  }

  useEffect(() => {
    if (settings.dark_mode) document.documentElement.classList.add("dark")
    else document.documentElement.classList.remove("dark")
  }, [settings.dark_mode])

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

  const onLayoutChange = async (currentLayout: Layout[]) => {
    const updatedBookmarks = bookmarks.map(bm => {
      const layoutItem = currentLayout.find(l => l.i === bm.id)
      if (layoutItem) {
        return { ...bm, x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h }
      }
      return bm
    })
    setBookmarks(updatedBookmarks)

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

  // 添加小组件：按默认尺寸追加到网格底部
  const addWidget = async (type: WidgetType) => {
    const label = getWidget(type)?.label ?? '小组件'
    const size = WIDGET_DEFAULT_SIZE[type] ?? { w: 2, h: 2 }
    const maxY = bookmarks.reduce((m, bm) => Math.max(m, bm.y + bm.h), 0)
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': settings.user_id,
        },
        body: JSON.stringify({
          title: label,
          widget_type: type,
          w: size.w,
          h: size.h,
          x: 0,
          y: maxY,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '添加失败')
      }
      const created = await res.json() as Bookmark
      setBookmarks(prev => [...prev, created])
    } catch (err) {
      console.error('添加小组件失败', err)
      alert(err instanceof Error ? err.message : '添加小组件失败')
    }
  }

  if (loading || bookmarksLoading) {
    return <div className="h-screen flex items-center justify-center text-foreground">加载配置...</div>
  }

  return (
    <WidgetActionProvider actions={actions}>
      <div className="h-screen relative overflow-hidden flex flex-col">
        <BackgroundLayer />
      <Sidebar onAddClick={() => setPickerOpen(true)} />

      <div className="relative z-20 flex flex-col items-center pt-4 px-4 shrink-0 pointer-events-none">
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

      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto no-scrollbar mt-8 pb-32">
        <div className="max-w-6xl mx-auto px-4 relative">
          <Responsive
            className="layout"
            layouts={{ lg: layouts }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={80}
            width={1152}
            onLayoutChange={onLayoutChange}
            dragConfig={{
              cancel: '.no-drag',
              bounded: true,
              // 触摸时保留浏览器滚动和 click 派生；8px 阈值区分手抖点按与拖拽
              allowMobileScroll: true,
              threshold: 8,
            }}
            resizeConfig={{ enabled: false }}
            compactType="vertical" 
            preventCollision={false} 
            margin={[16, 16]} 
            containerPadding={[0, 0]} 
            useCSSTransforms={true} 
            transitionDuration={200}
            // 👉 拖拽事件
            onDragStart={() => setIsDragging(true)}
            onDragStop={() => {
              // 延迟重置，等click事件跑完
              setTimeout(() => setIsDragging(false), 50)
            }}
          >
            {bookmarks.map((widget) => (
              <div
                key={widget.id}
                className="group relative cursor-grab active:cursor-grabbing"
                onContextMenu={(e) => {
                  e.preventDefault()
                  setMenu({ open: true, x: e.clientX, y: e.clientY, bookmark: widget })
                }}
              >
                {/* 传给子组件 */}
                <WidgetRenderer bookmark={widget} isDragging={isDragging} />
              </div>
            ))}
          </Responsive>
        </div>
      </div>

        <SettingModal open={settingOpen} onClose={() => setSettingOpen(false)} />
        <WidgetPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onAdd={addWidget} />
        <WidgetContextMenu
          open={menu.open}
          x={menu.x}
          y={menu.y}
          bookmark={menu.bookmark}
          onClose={() => setMenu(m => ({ ...m, open: false }))}
        />
      </div>
    </WidgetActionProvider>
  )
}

export default HomePage
