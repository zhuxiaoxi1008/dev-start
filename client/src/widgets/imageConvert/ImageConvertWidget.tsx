// client/src/widgets/imageConvert/ImageConvertWidget.tsx
// 图片格式转换：Canvas 实现 JPG / PNG / WEBP 互转，纯前端处理，不上传
// 卡片沿用原 banner 外观；点击进入转换弹窗
import { useRef, useState } from 'react'
import type { WidgetCardProps, WidgetSettingsProps } from '@/types/widgets'

type TargetFormat = 'image/jpeg' | 'image/png' | 'image/webp'

const FORMAT_OPTIONS: Array<{ label: string; value: TargetFormat; ext: string }> = [
  { label: 'JPG', value: 'image/jpeg', ext: 'jpg' },
  { label: 'PNG', value: 'image/png', ext: 'png' },
  { label: 'WEBP', value: 'image/webp', ext: 'webp' },
]

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, '')
}

export function ImageConvertCard({ bookmark, isDragging, onOpen }: WidgetCardProps) {
  return (
    <div
      className="relative overflow-hidden w-full h-full rounded-xl shadow-sm border border-white/20 bg-gradient-to-br from-blue-500 to-indigo-600 text-white cursor-pointer select-none"
      onClick={() => { if (!isDragging) onOpen() }}
    >
      <div className="flex flex-col items-center justify-center h-full w-full p-4 no-drag">
        <h3 className="text-lg font-bold mb-1">{bookmark.title || '图片格式转换'}</h3>
        <p className="text-sm opacity-80">JPG / PNG / WEBP</p>
      </div>
    </div>
  )
}

export function ImageConvertSettings({ onClose }: WidgetSettingsProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [src, setSrc] = useState<{ file: File; url: string } | null>(null)
  const [target, setTarget] = useState<TargetFormat>('image/png')
  const [quality, setQuality] = useState(0.92)
  const [out, setOut] = useState<{ url: string; size: number; ext: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pickFile = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }
    setError('')
    setOut(null)
    setSrc({ file, url: URL.createObjectURL(file) })
  }

  const convert = async () => {
    if (!src) return
    setBusy(true)
    setError('')
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image()
        el.onload = () => resolve(el)
        el.onerror = () => reject(new Error('图片加载失败'))
        el.src = src.url
      })
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('当前浏览器不支持 Canvas')
      // JPG 无透明通道，先铺白底
      if (target === 'image/jpeg') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(img, 0, 0)

      const blob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(resolve, target, target === 'image/png' ? undefined : quality)
      })
      if (!blob) throw new Error('转换失败，可能是浏览器不支持该格式')
      const ext = FORMAT_OPTIONS.find(f => f.value === target)!.ext
      setOut({ url: URL.createObjectURL(blob), size: blob.size, ext })
    } catch (e) {
      setError(e instanceof Error ? e.message : '转换失败')
    } finally {
      setBusy(false)
    }
  }

  const download = () => {
    if (!out || !src) return
    const a = document.createElement('a')
    a.href = out.url
    a.download = `${baseName(src.file.name)}.${out.ext}`
    a.click()
  }

  return (
    <div className="p-5">
      <h3 className="text-center text-base font-semibold mb-1">图片格式转换</h3>
      <p className="text-center text-xs opacity-60 mb-4">全程在本地浏览器完成，图片不会上传</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => pickFile(e.target.files?.[0])}
          />
          <button
            className="w-full h-32 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-foreground/40"
            onClick={() => inputRef.current?.click()}
          >
            {src ? (
              <img src={src.url} alt="预览" className="max-h-24 max-w-full object-contain" />
            ) : (
              <>
                <span className="text-sm font-medium">点击选择图片</span>
                <span className="text-xs text-muted-foreground">支持 JPG / PNG / WEBP 等常见格式</span>
              </>
            )}
          </button>
          {src && <div className="text-xs text-muted-foreground truncate">{src.file.name} · {formatSize(src.file.size)}</div>}

          <div>
            <label className="block mb-1 text-sm font-medium">目标格式</label>
            <div className="grid grid-cols-3 gap-2">
              {FORMAT_OPTIONS.map(f => (
                <button
                  key={f.value}
                  className={`py-2 rounded-lg border text-sm ${target === f.value ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}
                  onClick={() => setTarget(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {target !== 'image/png' && (
            <div>
              <label className="block mb-1 text-sm font-medium">质量 {Math.round(quality * 100)}%</label>
              <input
                type="range" min={0.3} max={1} step={0.01}
                className="w-full"
                value={quality}
                onChange={e => setQuality(Number(e.target.value))}
              />
            </div>
          )}

          <div className="flex gap-2">
            <button
              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/80 disabled:opacity-50"
              disabled={!src || busy}
              onClick={convert}
            >
              {busy ? '转换中...' : '开始转换'}
            </button>
            <button
              className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent"
              onClick={onClose}
            >
              关闭
            </button>
          </div>
          {error && <div className="text-xs text-destructive">{error}</div>}
        </div>

        <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-muted p-3 min-h-40">
          {out ? (
            <>
              <img src={out.url} alt="转换结果" className="max-h-40 max-w-full object-contain" />
              <div className="text-xs text-muted-foreground">{formatSize(out.size)} · {out.ext.toUpperCase()}</div>
              <button className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/80" onClick={download}>
                下载
              </button>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">转换结果会显示在这里</span>
          )}
        </div>
      </div>
    </div>
  )
}
