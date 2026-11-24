// client/src/widgets/encode/EncodeDecodeWidget.tsx
// 编解码工具：Base64 / Base64URL / URL / HTML 实体 / Unicode / Hex，纯本地处理
import React, { useState } from 'react'
import { ArrowLeftRight, Binary, Check, ClipboardCopy, Eraser, Play } from 'lucide-react'
import type { WidgetCardProps, WidgetSettingsProps } from '@/types/widgets'

type CodecKey = 'base64' | 'base64url' | 'url' | 'html' | 'unicode' | 'hex'
type Direction = 'encode' | 'decode'

const CODECS: Array<{ key: CodecKey; label: string; hint: string }> = [
  { key: 'base64', label: 'Base64', hint: 'UTF-8 安全' },
  { key: 'base64url', label: 'Base64URL', hint: 'URL 安全变体' },
  { key: 'url', label: 'URL 编码', hint: 'encodeURIComponent' },
  { key: 'html', label: 'HTML 实体', hint: '&amp; &lt; 等' },
  { key: 'unicode', label: 'Unicode', hint: '\\uXXXX' },
  { key: 'hex', label: 'Hex', hint: 'UTF-8 十六进制' },
]

function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

function base64ToUtf8(b64: string): string {
  let binary: string
  try {
    binary = atob(b64.replace(/\s+/g, ''))
  } catch {
    throw new Error('Base64 内容不合法')
  }
  const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function base64ToUrlSafe(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function urlSafeToBase64(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '')
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
  return b64 + pad
}

function htmlEncode(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function htmlDecode(text: string): string {
  const el = document.createElement('textarea')
  el.innerHTML = text
  return el.value
}

function unicodeEncode(text: string): string {
  return Array.from(text).map(ch => {
    const cp = ch.codePointAt(0) as number
    if (cp <= 0xffff) return '\\u' + cp.toString(16).padStart(4, '0')
    // 超出 BMP 的字符拆成代理对，兼容常见实现
    const hi = Math.floor((cp - 0x10000) / 0x400) + 0xd800
    const lo = ((cp - 0x10000) % 0x400) + 0xdc00
    return '\\u' + hi.toString(16).padStart(4, '0') + '\\u' + lo.toString(16).padStart(4, '0')
  }).join('')
}

function unicodeDecode(text: string): string {
  return text.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})/g, (_m, braced?: string, plain?: string) => {
    return String.fromCodePoint(parseInt(braced ?? plain ?? '0', 16))
  })
}

function textToHex(text: string): string {
  return Array.from(new TextEncoder().encode(text), b => b.toString(16).padStart(2, '0')).join('')
}

function hexToText(hex: string): string {
  const clean = hex.replace(/0x/gi, '').replace(/[\s,;:-]+/g, '')
  if (!clean) return ''
  if (!/^[0-9a-fA-F]+$/.test(clean) || clean.length % 2 !== 0) {
    throw new Error('十六进制内容不合法（需两位一组，如 e4bda0）')
  }
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return new TextDecoder().decode(bytes)
}

function transform(codec: CodecKey, direction: Direction, text: string): string {
  if (direction === 'encode') {
    switch (codec) {
      case 'base64': return utf8ToBase64(text)
      case 'base64url': return base64ToUrlSafe(utf8ToBase64(text))
      case 'url': return encodeURIComponent(text)
      case 'html': return htmlEncode(text)
      case 'unicode': return unicodeEncode(text)
      case 'hex': return textToHex(text)
    }
  }
  switch (codec) {
    case 'base64': return base64ToUtf8(text)
    case 'base64url': return base64ToUtf8(urlSafeToBase64(text))
    case 'url': {
      try {
        return decodeURIComponent(text)
      } catch {
        throw new Error('URL 编码内容不合法')
      }
    }
    case 'html': return htmlDecode(text)
    case 'unicode': return unicodeDecode(text)
    case 'hex': return hexToText(text)
  }
  throw new Error('未知的编码类型')
}

export function defaultEncodeDecodeConfig(): Record<string, never> {
  return {}
}

export const EncodeDecodeCard: React.FC<WidgetCardProps> = ({ bookmark, isDragging, onOpen }) => {
  return (
    <div
      className="relative overflow-hidden w-full h-full rounded-xl shadow-sm border border-white/20 bg-gradient-to-br from-emerald-500 to-teal-600 text-white cursor-pointer select-none"
      onClick={() => { if (!isDragging) onOpen() }}
    >
      <div className="flex flex-col items-center justify-center h-full w-full p-4 no-drag text-center">
        <Binary size={22} className="mb-1 opacity-90" />
        <h3 className="text-base font-bold mb-0.5 truncate max-w-full">{bookmark.title || '编解码工具'}</h3>
        <p className="text-xs opacity-80">Base64 · URL · Unicode</p>
      </div>
    </div>
  )
}

export const EncodeDecodeSettings: React.FC<WidgetSettingsProps> = ({ onClose }) => {
  const [codec, setCodec] = useState<CodecKey>('base64')
  const [direction, setDirection] = useState<Direction>('encode')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const activeCodec = CODECS.find(c => c.key === codec)

  const convert = () => {
    if (!input) {
      setOutput('')
      setError('请输入需要转换的内容')
      return
    }
    try {
      setOutput(transform(codec, direction, input))
      setError('')
    } catch (e) {
      setOutput('')
      setError(e instanceof Error ? e.message : '转换失败')
    }
  }

  const swap = () => {
    if (!output) return
    setInput(output)
    setOutput('')
    setError('')
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
      <h3 className="text-center text-base font-semibold mb-1">编解码工具</h3>
      <p className="text-center text-xs text-muted-foreground mb-4">全部在本地浏览器完成，内容不会上传</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        {CODECS.map(item => (
          <button
            key={item.key}
            className={`rounded-lg border px-2 py-1.5 text-left transition-colors ${
              codec === item.key
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'border-border active:bg-accent sm:hover:bg-accent'
            }`}
            onClick={() => { setCodec(item.key); setOutput(''); setError('') }}
          >
            <span className="block text-sm">{item.label}</span>
            <span className={`block text-[10px] ${codec === item.key ? 'opacity-80' : 'text-muted-foreground'}`}>
              {item.hint}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center rounded-lg border border-border p-0.5">
          <button
            className={`min-h-8 px-3 rounded-md text-xs ${direction === 'encode' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            onClick={() => setDirection('encode')}
          >
            编码
          </button>
          <button
            className={`min-h-8 px-3 rounded-md text-xs ${direction === 'decode' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            onClick={() => setDirection('decode')}
          >
            解码
          </button>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {direction === 'encode' ? '文本 → ' : '文本 ← '}{activeCodec?.label}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <textarea
          className="w-full h-[40vh] sm:h-64 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm font-mono resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
          placeholder={direction === 'encode' ? '输入需要编码的文本' : '输入需要解码的内容'}
          value={input}
          onChange={e => setInput(e.target.value)}
          spellCheck={false}
        />
        <textarea
          className="w-full h-[40vh] sm:h-64 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-mono resize-none focus:outline-none"
          placeholder="结果会显示在这里"
          value={output}
          readOnly
          spellCheck={false}
        />
      </div>

      {error && <div className="mt-2 text-xs text-destructive break-all">{error}</div>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          className="min-h-10 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm inline-flex items-center gap-1.5 active:bg-primary/80 sm:hover:bg-primary/80"
          onClick={convert}
        >
          <Play size={15} />{direction === 'encode' ? '编码' : '解码'}
        </button>
        <button
          className="min-h-10 px-3 py-1.5 rounded-lg border border-border text-sm inline-flex items-center gap-1.5 active:bg-accent sm:hover:bg-accent disabled:opacity-50"
          disabled={!output}
          onClick={swap}
        >
          <ArrowLeftRight size={15} />结果转输入
        </button>
        <button
          className="min-h-10 px-3 py-1.5 rounded-lg border border-border text-sm inline-flex items-center gap-1.5 active:bg-accent sm:hover:bg-accent disabled:opacity-50"
          disabled={!output}
          onClick={copy}
        >
          {copied ? <><Check size={15} />已复制</> : <><ClipboardCopy size={15} />复制</>}
        </button>
        <button
          className="min-h-10 px-3 py-1.5 rounded-lg border border-border text-sm inline-flex items-center gap-1.5 active:bg-accent sm:hover:bg-accent"
          onClick={clearAll}
        >
          <Eraser size={15} />清空
        </button>
        <button
          className="ml-auto min-h-10 px-4 py-1.5 rounded-lg border border-border text-sm active:bg-accent sm:hover:bg-accent"
          onClick={onClose}
        >
          关闭
        </button>
      </div>
    </div>
  )
}
