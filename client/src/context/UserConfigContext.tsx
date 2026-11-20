import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react'
import { useUserConfig } from '../hooks/useUserConfig'
import type { UserSettings, UserSettingsPatch } from '../types/userConfig'

const defaultSettings: UserSettings = {
  id: '', user_id: '', wallpaper: '', theme: 'dark',
  bg_type: 'gradient', bg_solid_color: '#eef2ff',
  bg_gradient: '#a8edea,#fed6e3', bg_gradient_angle: 135,
  dark_mode: false, sidebar_position: 'left',
  layout_config: { wallpaperB: '', widgets: [] },
  created_at: '', updated_at: ''
}

interface ConfigContextType {
  loading: boolean
  settings: UserSettings
  patchSetting: (patch: UserSettingsPatch) => Promise<void>
}

const UserConfigContext = createContext<ConfigContextType | undefined>(undefined)

export function UserConfigProvider({ children, userId }: { children: ReactNode, userId: string }) {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  // 用 ref 替代 state，避免 loadSettings 因依赖变化而重建引用、触发 effect 死循环
  const isFetchingRef = useRef(false)
  const { getSettings, updateSettings } = useUserConfig(userId)

  const settingsRef = useRef(settings)
  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  // 👉 把 getSettings 移出依赖，用 ref 拿最新版本
  const getSettingsRef = useRef(getSettings)
  useEffect(() => {
    getSettingsRef.current = getSettings
  }, [getSettings])

  const loadSettings = useCallback(async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    setLoading(true)
    try {
      const remote = await getSettingsRef.current()
      setSettings({ ...defaultSettings, ...remote })
    } catch (err) {
      console.warn('加载用户配置失败，使用默认配置', err)
    } finally {
      isFetchingRef.current = false
      setLoading(false)
    }
  }, [])

  const patchSetting = useCallback(async (patch: UserSettingsPatch) => {
    const next = { ...settingsRef.current, ...patch }
    setSettings(next)
    await updateSettings(patch)
  }, [updateSettings])

  // 只在 userId 切换时加载，这是唯一触发源
  useEffect(() => {
    loadSettings()
  }, [userId, loadSettings])

  return (
    <UserConfigContext.Provider value={{ loading, settings, patchSetting }}>
      {children}
    </UserConfigContext.Provider>
  )
}

export const useConfig = () => {
  const ctx = useContext(UserConfigContext)
  if (!ctx) throw new Error('useConfig must be used inside UserConfigProvider')
  return ctx
}
