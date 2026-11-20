import { useState, useCallback } from 'react'
import type { UserSettings, UserSettingsPatch } from '../types/userConfig'

export function useUserConfig(userId: string) {
  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'X-User-Id': userId
  }), [userId])

  const getSettings = useCallback(async (): Promise<UserSettings> => {
    const res = await fetch('/api/settings', { headers: getHeaders() })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || '获取配置失败')
    }
    return res.json()
  }, [getHeaders])

  const updateSettings = useCallback(async (patch: UserSettingsPatch): Promise<UserSettings> => {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(patch)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || '更新配置失败')
    }
    return res.json()
  }, [getHeaders])

  return { getSettings, updateSettings }
}
