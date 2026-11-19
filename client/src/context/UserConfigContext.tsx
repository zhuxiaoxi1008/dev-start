import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useUserConfig } from '../hooks/useUserConfig'
import type { UserSettings, UserSettingsPatch } from '../types/userConfig'

interface UserConfigCtxType {
  userId: string
  settings: UserSettings | null
  loading: boolean
  error: string | null
  updateSettings: (patch: UserSettingsPatch) => Promise<void>
}

const UserConfigContext = createContext<UserConfigCtxType | undefined>(undefined)
const STORAGE_KEY = 'devstart_user_id'

export function UserConfigProvider({ children }: { children: ReactNode }) {
  const [userId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return saved
    const newId = uuidv4()
    localStorage.setItem(STORAGE_KEY, newId)
    return newId
  })

  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { getSettings, updateSettings: apiUpdate } = useUserConfig(userId)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getSettings()
      setSettings(data)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const updateSettings = async (patch: UserSettingsPatch) => {
    const newData = await apiUpdate(patch)
    setSettings(newData)
  }

  return (
    <UserConfigContext.Provider value={{ userId, settings, loading, error, updateSettings }}>
      {children}
    </UserConfigContext.Provider>
  )
}

export function useConfig() {
  const ctx = useContext(UserConfigContext)
  if (!ctx) throw new Error('useConfig must inside UserConfigProvider')
  return ctx
}
