// client/src/widgets/weather/useWeather.ts
// 天气数据获取：走 Worker 代理（带 30 分钟服务端缓存），前端再按 30 分钟刷新
import { useEffect, useState } from 'react'

export interface WeatherCurrent {
  time: string
  temperature_2m: number
  relative_humidity_2m: number
  apparent_temperature: number
  is_day: number
  weather_code: number
  wind_speed_10m: number
  wind_direction_10m: number
  pressure_msl: number
  cloud_cover: number
  precipitation: number
}

export interface WeatherDaily {
  time: string[]
  weather_code: number[]
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  sunrise: string[]
  sunset: string[]
  uv_index_max: number[]
  precipitation_probability_max: number[]
}

export interface WeatherHourly {
  time: string[]
  weather_code: number[]
  visibility: number[]
}

export interface WeatherResponse {
  timezone: string
  current: WeatherCurrent
  daily: WeatherDaily
  hourly: WeatherHourly
}

export interface GeoCity {
  id: number
  name: string
  latitude: number
  longitude: number
  admin1?: string
  country?: string
}

interface WeatherState {
  data: WeatherResponse | null
  loading: boolean
  error: string
}

export function useWeather(userId: string, lat: number, lon: number): WeatherState {
  const [state, setState] = useState<WeatherState>({ data: null, loading: true, error: '' })

  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setState({ data: null, loading: false, error: '未设置城市' })
      return
    }
    let alive = true

    const load = async () => {
      try {
        const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`, {
          headers: { 'X-User-Id': userId },
        })
        if (!res.ok) throw new Error('天气接口请求失败')
        const json = await res.json() as WeatherResponse
        if (alive) setState({ data: json, loading: false, error: '' })
      } catch (err) {
        if (alive) setState(prev => ({
          data: prev.data,
          loading: false,
          error: err instanceof Error ? err.message : '天气获取失败',
        }))
      }
    }

    setState(prev => ({ ...prev, loading: true }))
    load()
    const timer = setInterval(load, 30 * 60 * 1000)
    return () => { alive = false; clearInterval(timer) }
  }, [userId, lat, lon])

  return state
}

export async function searchCity(userId: string, q: string): Promise<GeoCity[]> {
  const res = await fetch(`/api/weather/city?q=${encodeURIComponent(q)}`, {
    headers: { 'X-User-Id': userId },
  })
  if (!res.ok) throw new Error('城市搜索失败')
  const json = await res.json() as { results?: GeoCity[] }
  return json.results ?? []
}
