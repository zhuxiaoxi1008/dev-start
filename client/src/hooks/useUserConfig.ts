import { useCallback } from 'react'
import type { UserSettings, UserSettingsPatch } from '../types/userConfig'

const API_BASE = import.meta.env.VITE_API_BASE || ''

async function fetcher<T>(
  path: string,
  options: RequestInit = {},
  userId: string
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-User-Id': userId,
    ...options.headers,
  }
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers,
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.error || '请求失败')
  }
  return json
}

export function useUserConfig(userId: string) {
  const getSettings = useCallback(async () => {
    return fetcher<UserSettings>('/settings', { method: 'GET' }, userId)
  }, [userId])

  const updateSettings = useCallback(async (patch: UserSettingsPatch) => {
    return fetcher<UserSettings>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }, userId)
  }, [userId])

  return { getSettings, updateSettings }
}
