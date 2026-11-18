import { createContext, useContext, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { BgConfig } from '../utils/bg'

interface UserSettings extends BgConfig {
  user_id: string
  theme: string
  layout_config: {
    columns: number
    showClock: boolean
  }
}

const defaultSettings: UserSettings = {
  user_id: '',
  bg_type: 'gradient',
  bg_solid_color: '#0f172a',
  bg_gradient: '#1e1b4b,#020617',
  bg_gradient_angle: 135,
  wallpaper: '',
  theme: 'dark',
  layout_config: {
    columns: 2,
    showClock: true
  }
}

interface ConfigContextValue {
  settings: UserSettings
  loading: boolean
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>
}

const ConfigContext = createContext<ConfigContextValue>({
  settings: defaultSettings,
  loading: false,
  updateSettings: async () => {}
})

export const UserConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  // 生成/读取浏览器唯一标识
  const getUserId = (): string => {
    let uid = localStorage.getItem('devstart_user_id')
    if (!uid) {
      uid = uuidv4()
      localStorage.setItem('devstart_user_id', uid)
    }
    return uid
  }

  // 拉取云端配置
  const loadSettings = async () => {
    const user_id = getUserId()
    try {
      const res = await fetch(`/api/settings?user_id=${user_id}`)
      const json = await res.json()
      if (json.success && json.data) {
        setSettings({
          ...defaultSettings,
          ...json.data,
          layout_config: {
            ...defaultSettings.layout_config,
            ...(json.data.layout_config || {})
          }
        })
      } else {
        setSettings(prev => ({ ...prev, user_id }))
      }
    } catch {
      // 云端拉取失败，使用本地默认
      setSettings(prev => ({ ...prev, user_id }))
    } finally {
      setLoading(false)
    }
  }

  // 更新配置并同步云端
  const updateSettings = async (patch: Partial<UserSettings>) => {
    const newSettings = { ...settings, ...patch }
    setSettings(newSettings)

    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      })
    } catch (err) {
      console.error('设置同步云端失败', err)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  return (
    <ConfigContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </ConfigContext.Provider>
  )
}

export const useUserConfig = () => useContext(ConfigContext)
