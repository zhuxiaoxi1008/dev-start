import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useConfig } from '@/context/UserConfigContext'
import { BackgroundLayer } from '@/components/BackgroundLayer'
import { TimeDisplay } from '@/components/TimeDisplay'
import { SearchBar } from '@/components/SearchBar'
import { SettingModal } from '@/components/SettingModal'
import { Sidebar } from '@/components/Sidebar'
import { WidgetPicker } from '@/components/WidgetPicker'
import { RootContextMenu, type RootMenuAction } from '@/components/RootContextMenu'
import { AddBookmarkDialog } from '@/components/AddBookmarkDialog'
import { AddCategoryDialog } from '@/components/AddCategoryDialog'
import { BatchEditDialog } from '@/components/BatchEditDialog'
import { SettingsModal } from '@/components/SettingsModal'
import { CategoryCard, CategoryBookmarksModal } from '@/components/CategoryCard'
import { WidgetRenderer } from '@/widgets/WidgetRenderer'
import type { Bookmark, Category } from '@/types/userConfig'
import { WIDGET_DEFAULT_SIZE, type WidgetType } from '@/types/widgets'
import { getWidget } from '@/widgets/registry'
import { Responsive, type Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import { WidgetActionProvider, type WidgetActions } from '@/widgets/WidgetActionContext'
import { WidgetContextMenu } from '@/widgets/WidgetContextMenu'
import { WidgetCell } from '@/components/WidgetCell'
import { useCoarsePointer } from '@/hooks/useCoarsePointer'
import { useElementWidth } from '@/hooks/useElementWidth'

const searchEngines = [
  { name: 'Google', icon: 'https://www.google.com/favicon.ico', url: 'https://www.google.com/search?q=' },
  { name: '百度', icon: 'https://www.baidu.com/favicon.ico', url: 'https://www.baidu.com/s?wd=' },
  { name: 'GitHub', icon: 'https://github.com/favicon.ico', url: 'https://github.com/search?q=' },
]

interface EngineItem { name: string; icon: string; url: string; }

// 分类框位置存本地：categories 表暂无布局字段，先按设备保存
const CAT_LAYOUT_KEY = 'devstart_category_layout'
type CatLayout = Record<string, { x: number; y: number; w: number; h: number }>
function readCatLayout(): CatLayout {
  try { return JSON.parse(localStorage.getItem(CAT_LAYOUT_KEY) || '{}') as CatLayout } catch { return {} }
}

function HomePage() {
  const { loading, settings, patchSetting } = useConfig()
  const [keyword, setKeyword] = useState("")
  const [selectedEngine, setSelectedEngine] = useState<EngineItem>(searchEngines[0])
  const [settingOpen, setSettingOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  // 空白处右键菜单与弹窗
  const [rootMenu, setRootMenu] = useState<{ open: boolean; x: number; y: number }>({ open: false, x: 0, y: 0 })
  const [addBookmarkOpen, setAddBookmarkOpen] = useState(false)
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  // 当前打开查看的分类
  const [openCategory, setOpenCategory] = useState<Category | null>(null)
  // 从分类框添加书签时预选的分类 / 正在重命名的分类
  const [bookmarkCategoryId, setBookmarkCategoryId] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [catLayout, setCatLayout] = useState<CatLayout>(readCatLayout)
  
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [bookmarksLoading, setBookmarksLoading] = useState(true)
  // 👉 新增拖拽标记
  const [isDragging, setIsDragging] = useState(false)

  // 手指输入设备（手机/平板）关闭拖拽，避免与滚动抢手势；触屏笔记本仍可拖拽
  const isCoarsePointer = useCoarsePointer()
  // 网格宽度：实测容器宽度，让 RGL 的 breakpoints 真正生效（原为硬编码 1152）
  const { ref: gridWrapRef, width: gridWidth } = useElementWidth<HTMLDivElement>()

  // 右键（桌面）/ 长按（触屏）菜单状态
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

  // 分类：与书签一起加载，供添加书签/批量编辑使用
  useEffect(() => {
    if (!settings.user_id) return
    let alive = true
    fetch('/api/categories', { headers: { 'X-User-Id': settings.user_id } })
      .then(res => (res.ok ? res.json() : []))
      .then(data => { if (alive) setCategories(Array.isArray(data) ? data : []) })
      .catch(err => console.error('获取分类失败', err))
    return () => { alive = false }
  }, [settings.user_id])

  const layouts = useMemo(() => {
    const maxY = bookmarks.reduce((m, bm) => Math.max(m, bm.y + bm.h), 0)
    const bookmarkLayouts = bookmarks.map(bm => ({
      i: bm.id,
      x: bm.x,
      y: bm.y,
      w: bm.w,
      h: bm.h,
      static: false
    }))
    // 分类框可拖拽，位置优先取本地保存值
    const categoryLayouts = categories.map((c, index) => {
      const saved = catLayout[c.id]
      return {
        i: `cat-${c.id}`,
        x: saved?.x ?? (index % 4) * 3,
        y: saved?.y ?? maxY + Math.floor(index / 4) * 2,
        w: saved?.w ?? 2,
        h: saved?.h ?? 2,
      }
    })
    return [...bookmarkLayouts, ...categoryLayouts]
  }, [bookmarks, categories, catLayout])

  const onLayoutChange = async (currentLayout: Layout) => {
    // 分类框布局只存本地，不写入书签表
    const isCategoryItem = (id: unknown) => String(id).startsWith('cat-')
    const catItems = currentLayout.filter(l => isCategoryItem(l.i))
    if (catItems.length > 0) {
      const next: CatLayout = {}
      for (const item of catItems) {
        next[String(item.i).slice(4)] = { x: item.x, y: item.y, w: item.w, h: item.h }
      }
      setCatLayout(next)
      try { localStorage.setItem(CAT_LAYOUT_KEY, JSON.stringify(next)) } catch { /* ignore */ }
    }

    const widgetLayout = currentLayout.filter(l => !isCategoryItem(l.i))
    const updatedBookmarks = bookmarks.map(bm => {
      const layoutItem = widgetLayout.find(l => l.i === bm.id)
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
        body: JSON.stringify(widgetLayout)
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

  // 移动端：长按卡片弹出操作表；桌面端：右键弹出浮层
  const openMenuAt = (bookmark: Bookmark, pos: { x: number; y: number }) => {
    setMenu({ open: true, x: pos.x, y: pos.y, bookmark })
  }

  // 新组件默认追加到网格底部
  const maxWidgetY = bookmarks.reduce((m, bm) => Math.max(m, bm.y + bm.h), 0)

  // 批量归类
  const applyCategoryToBookmarks = async (ids: string[], categoryId: string | null) => {
    await Promise.all(ids.map(id => fetch(`/api/bookmarks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': settings.user_id },
      body: JSON.stringify({ category_id: categoryId }),
    })))
    setBookmarks(prev => prev.map(bm => ids.includes(bm.id) ? { ...bm, category_id: categoryId } : bm))
  }

  // 批量删除
  const deleteBookmarks = async (ids: string[]) => {
    await Promise.all(ids.map(id => fetch(`/api/bookmarks/${id}`, {
      method: 'DELETE',
      headers: { 'X-User-Id': settings.user_id },
    })))
    setBookmarks(prev => prev.filter(bm => !ids.includes(bm.id)))
  }

  // 单个组件移入/移出分类
  const moveToCategory = async (bookmarkId: string, categoryId: string | null) => {
    try {
      const res = await fetch(`/api/bookmarks/${bookmarkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': settings.user_id },
        body: JSON.stringify({ category_id: categoryId }),
      })
      if (!res.ok) throw new Error('移动分类失败')
      setBookmarks(prev => prev.map(bm => bm.id === bookmarkId ? { ...bm, category_id: categoryId } : bm))
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : '移动分类失败')
    }
  }

  // 删除分类：先把分类内书签置为未分类，再删分类
  // 注意：线上库的 category_id 外键实际是级联删除，直接删分类会连带删掉书签
  const deleteCategory = async (category: Category) => {
    const inside = bookmarks.filter(bm => bm.category_id === category.id)
    try {
      await Promise.all(inside.map(bm => fetch(`/api/bookmarks/${bm.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': settings.user_id },
        body: JSON.stringify({ category_id: null }),
      })))
    } catch (err) {
      console.error(err)
      alert('取回分类内书签失败，已取消删除')
      throw err
    }

    const res = await fetch(`/api/categories/${category.id}`, {
      method: 'DELETE',
      headers: { 'X-User-Id': settings.user_id },
    })
    if (!res.ok) {
      alert('删除分类失败')
      throw new Error('删除分类失败')
    }
    setCategories(prev => prev.filter(c => c.id !== category.id))
    setBookmarks(prev => prev.map(bm => bm.category_id === category.id ? { ...bm, category_id: null } : bm))
    setCatLayout(prev => {
      const next = { ...prev }
      delete next[category.id]
      try { localStorage.setItem(CAT_LAYOUT_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
    if (openCategory?.id === category.id) setOpenCategory(null)
  }

  // 空白处右键：避开卡片、表单与已打开的弹窗
  const handleRootContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('[data-widget-cell], .fixed.inset-0, input, textarea, select, button, a')) return
    e.preventDefault()
    setRootMenu({ open: true, x: e.clientX, y: e.clientY })
  }

  const handleRootAction = (action: RootMenuAction) => {
    if (action === 'addBookmark') { setBookmarkCategoryId(null); setAddBookmarkOpen(true) }
    else if (action === 'addCategory') { setEditingCategory(null); setAddCategoryOpen(true) }
    else if (action === 'wallpaper') setSettingOpen(true)
    else if (action === 'batch') setBatchOpen(true)
    else if (action === 'settings') setSettingsOpen(true)
  }

  if (loading || bookmarksLoading) {
    return <div className="h-[100dvh] flex items-center justify-center text-foreground">加载配置...</div>
  }

  return (
    <WidgetActionProvider actions={actions}>
      <div className="h-[100dvh] relative overflow-hidden flex flex-col" onContextMenu={handleRootContextMenu}>
        <BackgroundLayer />
        <Sidebar onAddClick={() => setPickerOpen(true)} onSettingsClick={() => setSettingsOpen(true)} />

        <div className="relative z-20 flex flex-col items-center pt-4 px-3 sm:px-4 shrink-0 pointer-events-none">
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

        <div className="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-contain no-scrollbar mt-4 sm:mt-8 pb-24 sm:pb-32">
          {/* 统一走 react-grid-layout：宽度取内层内容区实测值，窄屏由 RGL 断点换列 */}
          <div className="max-w-6xl mx-auto px-3 sm:px-4 relative">
            <div ref={gridWrapRef}>
              {gridWidth > 0 && (
                <Responsive
                  className="layout"
                  layouts={{ lg: layouts }}
                  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                  cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                  rowHeight={80}
                  width={gridWidth}
                  onLayoutChange={onLayoutChange}
                  draggableCancel=".no-drag"
                  isBounded={true}
                  resizeConfig={{ enabled: false }}
                  dragConfig={{
                    // 手指设备关闭拖拽：避免滑动页面时误拖卡片
                    enabled: !isCoarsePointer,
                    // 关键：开启后 react-draggable 不再对 touchstart 调 preventDefault，
                    // 触摸点按才会派生 click，卡片/按钮才能像鼠标一样使用
                    allowMobileScroll: true,
                    // 超过 8px 才算拖拽，区分"点一下"和"拖动"
                    threshold: 8,
                  }}
                  compactType="vertical"
                  preventCollision={false}
                  margin={[12, 12]}
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
                    <div key={widget.id}>
                      <WidgetCell
                        bookmark={widget}
                        isDragging={isDragging}
                        onRequestMenu={openMenuAt}
                      />
                    </div>
                  ))}
                  {categories.map(category => (
                    <div key={`cat-${category.id}`}>
                      <CategoryCard
                        category={category}
                        bookmarks={bookmarks}
                        isDragging={isDragging}
                        onOpen={() => setOpenCategory(category)}
                        onAddBookmark={c => { setBookmarkCategoryId(c.id); setAddBookmarkOpen(true) }}
                        onRename={c => { setEditingCategory(c); setAddCategoryOpen(true) }}
                        onDelete={deleteCategory}
                      />
                    </div>
                  ))}
                </Responsive>
              )}
            </div>
          </div>
        </div>

        <SettingModal open={settingOpen} onClose={() => setSettingOpen(false)} />
        <WidgetPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onAdd={addWidget} />
        <RootContextMenu
          open={rootMenu.open}
          x={rootMenu.x}
          y={rootMenu.y}
          onClose={() => setRootMenu(m => ({ ...m, open: false }))}
          onAction={handleRootAction}
        />
        <AddBookmarkDialog
          open={addBookmarkOpen}
          onClose={() => setAddBookmarkOpen(false)}
          categories={categories}
          defaultY={maxWidgetY}
          defaultCategoryId={bookmarkCategoryId}
          onCreated={bm => setBookmarks(prev => [...prev, bm])}
        />
        <AddCategoryDialog
          open={addCategoryOpen}
          onClose={() => { setAddCategoryOpen(false); setEditingCategory(null) }}
          sortOrder={categories.length}
          category={editingCategory}
          onSaved={c => {
            setCategories(prev => editingCategory ? prev.map(item => item.id === c.id ? c : item) : [...prev, c])
            setEditingCategory(null)
          }}
        />
        <BatchEditDialog
          open={batchOpen}
          onClose={() => setBatchOpen(false)}
          bookmarks={bookmarks}
          categories={categories}
          onApplyCategory={applyCategoryToBookmarks}
          onDelete={deleteBookmarks}
        />
        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <CategoryBookmarksModal
          open={!!openCategory}
          category={openCategory}
          bookmarks={bookmarks}
          onClose={() => setOpenCategory(null)}
          onRemoveFromCategory={(id) => moveToCategory(id, null)}
        />
        <WidgetContextMenu
          open={menu.open}
          x={menu.x}
          y={menu.y}
          bookmark={menu.bookmark}
          categories={categories}
          onMoveToCategory={moveToCategory}
          onClose={() => setMenu(m => ({ ...m, open: false }))}
        />
      </div>
    </WidgetActionProvider>
  )
}

export default HomePage