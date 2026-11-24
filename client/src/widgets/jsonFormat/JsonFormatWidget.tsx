// client/src/widgets/jsonFormat/JsonFormatWidget.tsx
// JSON 格式化工具：格式化 / 压缩 / 校验，纯本地处理，不上传
import React, { useState } from 'react'
import { Braces, Check, ClipboardCopy, Eraser, Minimize2, Wand2 } from 'lucide-react'
import type { WidgetCardProps, WidgetSettingsProps } from '@/types/widgets'

type IndentOption = '2' | '4' | 'tab'

const INDENT_OPTIONS: Array<{ label: string; value: IndentOption }> = [
  { label: '2 空格', value: '2' },
  { label: '4 空格', value: '4' },
  { label: 'Tab', value: 'tab' },
]

export function defaultJsonFormatConfig(): Record<string, never> {
  return {}
}

export const JsonFormatCard: React.FC<WidgetCardProps> = ({ bookmark, isDragging, onOpen }) => {
  return (
    <div
      className="relative overflow-hidden w-full h-full rounded-xl shadow-sm border border-white/20 bg-gradient-to-br from-sky-500 to-cyan-600 text-white cursor-pointer select-none"
      onClick={() => { if (!isDragging) onOpen() }}
    >
      <div className="flex flex-col items-center justify-center h-full w-full p-4 no-drag text-center">
        <Braces size={22} className="mb-1 opacity-90" />
        <h3 className="text-base font-bold mb-0.5 truncate max-w-full">{bookmark.title || 'JSON 格式化'}</h3>
        <p className="text-xs opacity-80">格式化 · 压缩 · 校验</p>
      </div>
    </div>
  )
}

export const JsonFormatSettings: React.FC<WidgetSettingsProps> = ({ onClose }) => {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [indent, setIndent] = useState<IndentOption>('2')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const run = (compact: boolean) => {
    const text = input.trim()
    if (!text) {
      setOutput('')
      setError('请先粘贴 JSON 内容')
      return
    }
    try {
      const value = JSON.parse(text)
      const space = compact ? 0 : indent === 'tab' ? '\t' : Number(indent)
      setOutput(JSON.stringify(value, null, space))
      setError('')
    } catch (e) {
      setOutput('')
      setError(e instanceof Error ? e.message : 'JSON 解析失败')
    }
  }

  const copy = async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      alert('复制失败，请手动选择结果复制')
    }
  }

  const clearAll = () => {
    setInput('')
    setOutput('')
    setError('')
  }

  return (
    <div className="p-5">
      <h3 className="text-center text-base font-semibold mb-1">JSON 格式化</h3>
      <p className="text-center text-xs text-muted-foreground mb-4">全部在本地浏览器完成，内容不会上传</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <textarea
            className="w-full h-[45vh] sm:h-72 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm font-mono resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
            placeholder='在这里粘贴 JSON，例如 {"name":"dev-start","ok":true}'
            value={input}
            onChange={e => setInput(e.target.value)}
            spellCheck={false}
          />
          <div className="flex items-center gap-2">
            <button
              className="flex-1 min-h-10 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm inline-flex items-center justify-center gap-1.5 active:bg-primary/80 sm:hover:bg-primary/80"
              onClick={() => run(false)}
            >
              <Wand2 size={15} />格式化
            </button>
            <button
              className="min-h-10 px-3 py-1.5 rounded-lg border border-border text-sm inline-flex items-center gap-1.5 active:bg-accent sm:hover:bg-accent"
              onClick={() => run(true)}
            >
              <Minimize2 size={15} />压缩
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              {INDENT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`min-h-8 px-2 py-1 rounded-md text-xs border ${
                    indent === opt.value
                      ? 'bg-primary text-primary-foreground border-transparent'
                      : 'border-border text-muted-foreground active:bg-accent sm:hover:bg-accent'
                  }`}
                  onClick={() => setIndent(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground">{output ? `${output.length} 字符` : '缩进方式'}</span>
          </div>
          <textarea
            className="w-full h-[45vh] sm:h-72 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-mono resize-none focus:outline-none"
            placeholder="结果会显示在这里"
            value={output}
            readOnly
            spellCheck={false}
          />
          <div className="flex items-center gap-2">
            <button
              className="flex-1 min-h-10 px-3 py-1.5 rounded-lg border border-border text-sm inline-flex items-center justify-center gap-1.5 active:bg-accent sm:hover:bg-accent disabled:opacity-50"
              disabled={!output}
              onClick={copy}
            >
              {copied ? <><Check size={15} />已复制</> : <><ClipboardCopy size={15} />复制结果</>}
            </button>
            <button
              className="min-h-10 px-3 py-1.5 rounded-lg border border-border text-sm inline-flex items-center gap-1.5 active:bg-accent sm:hover:bg-accent"
              onClick={clearAll}
            >
              <Eraser size={15} />清空
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 text-xs text-destructive break-all">解析失败：{error}</div>
      )}

      <div className="mt-4 flex justify-end">
        <button className="min-h-10 px-4 py-1.5 rounded-lg border border-border text-sm active:bg-accent sm:hover:bg-accent" onClick={onClose}>
          关闭
        </button>
      </div>
    </div>
  )
}
