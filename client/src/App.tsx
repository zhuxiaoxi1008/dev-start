import { useState, useEffect } from 'react'
import { Sparkles, Terminal } from 'lucide-react'

export default function App() {
  const [apiMessage, setApiMessage] = useState<string>('正在连接后端...')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data: any) => {
        setApiMessage(`后端状态: ${data.message} (${data.timestamp})`)
      })
      .catch((err) => {
        setApiMessage('后端连接失败（请确保 Hono 服务已在 8787 端口启动）')
      })
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950">
      <div className="max-w-xl w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          <span>DevStart 开发者起始页</span>
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight text-white">
          阶段一：环境初始化完成
        </h1>
        
        <p className="text-slate-400 text-sm sm:text-base">
          前端 (React + Vite + Tailwind) 与后端 (Hono) 骨架已全部就绪。
        </p>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-left shadow-xl backdrop-blur-md space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>API 健康检查联调</span>
          </div>
          <div className="text-emerald-400 font-mono text-xs bg-slate-950/50 p-3 rounded-lg border border-slate-800/60 break-all">
            {apiMessage}
          </div>
        </div>
      </div>
    </div>
  )
}