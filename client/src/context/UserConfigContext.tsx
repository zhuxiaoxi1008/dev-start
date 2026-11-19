import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export type UserSettings = {
  bg_type: "gradient" | "solid" | "wallpaperA" | "wallpaperB"
  bg_gradient: string
  bg_gradient_angle: number
  bg_solid_color: string
  wallpaper: string
  layout_config: {
    wallpaperB: string
  }
  dark_mode: boolean
}

export type UserSettingsPatch = Partial<UserSettings>

const defaultSettings: UserSettings = {
  bg_type: "gradient",
  bg_gradient: "#e0f7fa,#f0f9ff",
  bg_gradient_angle: 135,
  bg_solid_color: "#ffffff",
  wallpaper: "",
  layout_config: {
    wallpaperB: "",
  },
  dark_mode: false,
}

interface ConfigContextType {
  settings: UserSettings
  loading: boolean
  updateSettings: (patch: UserSettingsPatch) => Promise<void>
}

const UserConfigContext = createContext<ConfigContextType | undefined>(undefined)

export function UserConfigProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  // vite代理 + 线上一体化部署，统一 /api
  const API_BASE = "/api"

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/settings`)
        if (res.ok) {
          const data = await res.json()
          setSettings({ ...defaultSettings, ...data })
        }
      } catch (err) {
        console.warn("后端接口读取失败，使用本地默认配置", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const updateSettings = async (patch: UserSettingsPatch) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    try {
      await fetch(`${API_BASE}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
    } catch (err) {
      console.warn("保存设置到后端失败", err)
    }
  }

  return (
    <UserConfigContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </UserConfigContext.Provider>
  )
}

export const useConfig = () => {
  const ctx = useContext(UserConfigContext)
  if (!ctx) throw new Error("useConfig 必须包裹在 UserConfigProvider 内")
  return ctx
}
