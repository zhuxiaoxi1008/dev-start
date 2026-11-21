// client/src/widgets/weather/WeatherWidget.tsx
// 天气：卡片 + 城市搜索/7天预报弹窗；数据来自 Worker 代理的 Open-Meteo
import React, { useMemo, useState } from 'react'
import { MapPin, Search, Wind, Droplets, Gauge, Eye, SunMedium, Thermometer } from 'lucide-react'
import type { WidgetCardProps, WidgetSettingsProps, WeatherWidgetConfig } from '@/types/widgets'
import { useConfig } from '@/context/UserConfigContext'
import { wmoInfo, windDirection, uvLevel } from './wmo'
import { useWeather, searchCity, type WeatherResponse, type GeoCity } from './useWeather'

export function defaultWeatherConfig(): WeatherWidgetConfig {
  // 默认西安（计划书默认值），用户可在弹窗里搜索其他城市
  return { city: '西安', lat: 34.3416, lon: 108.9398 }
}

function asWeather(config: unknown): WeatherWidgetConfig {
  return { ...defaultWeatherConfig(), ...(config as Partial<WeatherWidgetConfig>) }
}

function weekday(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return '周' + ['日', '一', '二', '三', '四', '五', '六'][new Date(y, m - 1, d).getDay()]
}

// 取某天某小时的天气代码（白天 13 点 / 夜间 23 点）
function hourlyCode(data: WeatherResponse, dateStr: string, hour: number): number | null {
  const target = `${dateStr}T${String(hour).padStart(2, '0')}:00`
  const idx = data.hourly.time.indexOf(target)
  return idx >= 0 ? data.hourly.weather_code[idx] : null
}

export const WeatherCard: React.FC<WidgetCardProps> = ({ config, isDragging, onOpen }) => {
  const { settings } = useConfig()
  const cfg = asWeather(config)
  const { data, loading, error } = useWeather(settings.user_id, cfg.lat, cfg.lon)

  if (loading && !data) {
    return (
      <div className="w-full h-full rounded-xl bg-white/40 dark:bg-zinc-900/50 animate-pulse" />
    )
  }

  if (!data) {
    return (
      <div
        className="w-full h-full rounded-xl bg-white/40 dark:bg-zinc-900/50 backdrop-blur-sm border border-white/20 p-3 flex flex-col items-center justify-center text-xs text-zinc-600 dark:text-zinc-300 cursor-pointer"
        onClick={() => { if (!isDragging) onOpen() }}
      >
        <MapPin size={14} className="mb-1" />
        <span>{error || '天气加载失败，点击设置城市'}</span>
      </div>
    )
  }

  const now = data.current
  const { label, Icon } = wmoInfo(now.weather_code, now.is_day === 1)
  const days = data.daily.time.slice(1, 6)

  return (
    <div
      className="relative w-full h-full rounded-xl overflow-hidden border border-white/20 bg-gradient-to-br from-sky-500 to-blue-600 backdrop-blur-xl shadow-sm cursor-pointer select-none text-white p-3 flex flex-col justify-between"
      onClick={() => { if (!isDragging) onOpen() }}
    >
      <div className="flex items-center justify-between text-xs no-drag">
        <span className="inline-flex items-center gap-1 truncate">
          <MapPin size={12} />{cfg.city}
        </span>
        <span className="opacity-80">{label}</span>
      </div>

      <div className="flex items-center justify-between no-drag">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold leading-none">{Math.round(now.temperature_2m)}</span>
          <span className="text-sm">°C</span>
        </div>
        <Icon size={30} className="opacity-90" />
      </div>

      <div className="no-drag">
        <div className="text-[11px] opacity-90 mb-1">
          最高 {Math.round(data.daily.temperature_2m_max[0])}° / 最低 {Math.round(data.daily.temperature_2m_min[0])}°
        </div>
        <div className="flex justify-between gap-1 text-[10px]">
          {days.map((d, i) => {
            const code = hourlyCode(data, d, 13) ?? data.daily.weather_code[i + 1]
            const { Icon: DIcon } = wmoInfo(code, true)
            return (
              <div key={d} className="flex flex-col items-center gap-0.5">
                <span className="opacity-80">{weekday(d).replace('周', '')}</span>
                <DIcon size={13} className="opacity-90" />
                <span className="opacity-80">{Math.round(data.daily.temperature_2m_max[i + 1])}°</span>
              </div>
            )
          })}
        </div>
      </div>

      {error && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-yellow-300" title={error} />}
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/60 dark:bg-white/10 p-2 flex flex-col items-center gap-0.5">
      <span className="text-muted-foreground flex items-center gap-1 text-[11px]">{icon}{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

export const WeatherSettings: React.FC<WidgetSettingsProps> = ({ config, onSave, onClose }) => {
  const { settings } = useConfig()
  const [draft, setDraft] = useState<WeatherWidgetConfig>(() => asWeather(config))
  const [query, setQuery] = useState('')
  const [cities, setCities] = useState<GeoCity[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const { data, loading, error } = useWeather(settings.user_id, draft.lat, draft.lon)

  const doSearch = async () => {
    const q = query.trim()
    if (!q) return
    setSearching(true)
    setSearchError('')
    try {
      setCities(await searchCity(settings.user_id, q))
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : '搜索失败')
    } finally {
      setSearching(false)
    }
  }

  const visibility = useMemo(() => {
    if (!data) return null
    const idx = data.hourly.time.indexOf(data.current.time)
    if (idx < 0) return null
    return data.hourly.visibility[idx]
  }, [data])

  const detail = useMemo(() => {
    if (!data) return null
    const cur = data.current
    return {
      apparent: `${Math.round(cur.apparent_temperature)}°`,
      humidity: `${cur.relative_humidity_2m}%`,
      wind: `${windDirection(cur.wind_direction_10m)} ${Math.round(cur.wind_speed_10m)} km/h`,
      pressure: `${Math.round(cur.pressure_msl)} hPa`,
      visibility: visibility === null ? '—' : visibility >= 1000 ? `${(visibility / 1000).toFixed(1)} km` : `${visibility} m`,
      uv: `${data.daily.uv_index_max[0]?.toFixed(1) ?? '—'} ${uvLevel(data.daily.uv_index_max[0] ?? 0)}`,
    }
  }, [data, visibility])

  return (
    <div className="p-4 sm:p-5">
      <h3 className="text-center text-base font-semibold mb-4">天气</h3>

      <div className="flex gap-2 mb-2">
        <input
          className="flex-1 min-w-0 min-h-11 rounded-lg border border-input bg-background/60 px-3 py-2 text-base sm:text-sm placeholder:text-muted-foreground"
          placeholder="搜索城市，例如：西安"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') doSearch() }}
        />
        <button
          className="min-h-11 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm inline-flex items-center gap-1 active:bg-primary/80 sm:hover:bg-primary/80 disabled:opacity-50 shrink-0"
          onClick={doSearch}
          disabled={searching}
        >
          <Search size={14} />{searching ? '搜索中' : '搜索'}
        </button>
      </div>

      {searchError && <div className="text-xs text-destructive mb-2">{searchError}</div>}

      {cities.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-lg border border-border divide-y divide-border mb-3">
          {cities.map(ct => (
            <button
              key={ct.id}
              className="w-full text-left px-3 py-2.5 min-h-11 text-sm active:bg-accent sm:hover:bg-accent"
              onClick={() => {
                setDraft({ city: ct.name, lat: ct.latitude, lon: ct.longitude })
                setCities([])
                setQuery('')
              }}
            >
              {ct.name}
              <span className="text-xs text-muted-foreground ml-2">
                {[ct.admin1, ct.country].filter(Boolean).join(' · ')}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-muted p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium inline-flex items-center gap-1">
            <MapPin size={14} />{draft.city}
          </span>
          {data && (
            <span className="text-sm">
              {Math.round(data.current.temperature_2m)}°C · {wmoInfo(data.current.weather_code, data.current.is_day === 1).label}
            </span>
          )}
        </div>

        {loading && !data && <div className="text-xs text-muted-foreground">加载中...</div>}
        {!loading && !data && <div className="text-xs text-destructive">{error || '天气获取失败'}</div>}

        {detail && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <DetailRow icon={<Thermometer size={12} />} label="体感" value={detail.apparent} />
            <DetailRow icon={<Droplets size={12} />} label="湿度" value={detail.humidity} />
            <DetailRow icon={<Wind size={12} />} label="风" value={detail.wind} />
            <DetailRow icon={<Gauge size={12} />} label="气压" value={detail.pressure} />
            <DetailRow icon={<Eye size={12} />} label="能见度" value={detail.visibility} />
            <DetailRow icon={<SunMedium size={12} />} label="紫外线" value={detail.uv} />
          </div>
        )}
      </div>

      {data && (
        <div className="rounded-xl border border-border divide-y divide-border mb-3">
          {data.daily.time.map((d, i) => {
            const dayCode = hourlyCode(data, d, 13) ?? data.daily.weather_code[i]
            const nightCode = hourlyCode(data, d, 23) ?? data.daily.weather_code[i]
            const DayIcon = wmoInfo(dayCode, true).Icon
            const NightIcon = wmoInfo(nightCode, false).Icon
            return (
              <div key={d} className="flex items-center justify-between px-3 py-1.5 text-sm">
                <span className="w-16 text-xs text-muted-foreground">{i === 0 ? '今天' : weekday(d)}</span>
                <span className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 w-24">
                    <DayIcon size={15} />
                    <span className="text-xs">{wmoInfo(dayCode, true).label}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 w-24">
                    <NightIcon size={15} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{wmoInfo(nightCode, false).label}</span>
                  </span>
                </span>
                <span className="text-xs">
                  {Math.round(data.daily.temperature_2m_min[i])}° ~ {Math.round(data.daily.temperature_2m_max[i])}°
                </span>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">数据来源 Open-Meteo（CC-BY 4.0）</span>
        <div className="flex gap-2">
          <button className="min-h-11 px-3 py-1.5 rounded-lg border border-border text-sm active:bg-accent sm:hover:bg-accent" onClick={onClose}>
            取消
          </button>
          <button
            className="min-h-11 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm active:bg-primary/80 sm:hover:bg-primary/80"
            onClick={() => onSave(draft)}
          >
            完成
          </button>
        </div>
      </div>
    </div>
  )
}
