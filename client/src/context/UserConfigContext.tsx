// src/context/UserConfigContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useUserConfig } from '../hooks/useUserConfig'
import type { UserSettings, UserSettingsPatch } from '../types/userConfig'

const defaultSettings: UserSettings = {
  dark_mode: false,
  bg_type: 'gradient',
  wallpaper_a: '',
  wallpaper_b: '',
  solid_color: '#eef2ff',
  gradient_color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
}

interface ConfigContextType {
  loading: boolean
  settings: UserSettings
  // 改成 patch 增量，只传要改的key
  patchSetting: (patch: UserSettingsPatch) => Promise<void>
}

const UserConfigContext = createContext<ConfigContextType | undefined>(undefined)

// 这里 userId 你后续登录逻辑传入；现在开发固定一个测试id也行
export function UserConfigProvider({ children, userId }: { children: ReactNode, userId: string }) {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const { getSettings, updateSettings } = useUserConfig(userId)

  const loadSettings = useCallback(async () => {
    setLoading(true)
    try {
      const remote = await getSettings()
      setSettings({ ...defaultSettings, ...remote })
    } catch (err) {
      console.warn('加载用户配置失败，使用默认配置', err)
    } finally {
      setLoading(false)
    }
  }, [getSettings])

  // 增量patch，只提交变更的字段，符合你后端 PATCH 接口
  const patchSetting = useCallback(async (patch: UserSettingsPatch) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    await updateSettings(patch)
  }, [settings, updateSettings])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

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
