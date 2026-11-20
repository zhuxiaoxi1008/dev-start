// client/src/widgets/dataEvents.ts
// 小组件数据变更通知：弹窗内保存后，让同卡片的 Card 重新拉取数据
const EVENT = 'widget-data-changed'

export function notifyWidgetDataChanged(widgetId: string) {
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: widgetId }))
}

export function onWidgetDataChanged(widgetId: string, cb: () => void): () => void {
  const handler = (e: Event) => {
    if ((e as CustomEvent<string>).detail === widgetId) cb()
  }
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
