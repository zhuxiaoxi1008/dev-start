// worker/src/routes/weather.ts
// Open-Meteo 免密钥代理：统一缓存，避免每个访客都直连外部接口
// 数据来源：Open-Meteo（CC-BY 4.0，仅限非商业免费档）
import { Hono } from 'hono'
import type { EnvBindings } from '../db/supabase'

const weather = new Hono<{ Bindings: EnvBindings }>()

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const CACHE_SECONDS = 30 * 60

const CURRENT_FIELDS = [
  'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'is_day',
  'weather_code', 'wind_speed_10m', 'wind_direction_10m', 'pressure_msl',
  'cloud_cover', 'precipitation',
].join(',')

const DAILY_FIELDS = [
  'weather_code', 'temperature_2m_max', 'temperature_2m_min',
  'sunrise', 'sunset', 'uv_index_max', 'precipitation_probability_max',
].join(',')

// 带 Workers Cache 的 JSON 透传；缓存不可用时自动降级为直接转发
async function cachedJson(c: {
  executionCtx: { waitUntil: (p: Promise<unknown>) => void }
}, key: string, upstreamUrl: string): Promise<Response> {
  const cacheKey = new Request(key)
  let cache: Cache | null = null
  try {
    cache = typeof caches !== 'undefined' ? caches.default : null
  } catch {
    cache = null
  }

  if (cache) {
    const hit = await cache.match(cacheKey)
    if (hit) {
      return new Response(hit.body, {
        headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
      })
    }
  }

  const upstream = await fetch(upstreamUrl)
  const text = await upstream.text()
  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: '天气服务暂不可用', status: upstream.status }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (cache) {
    const cacheable = new Response(text, {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${CACHE_SECONDS}` },
    })
    c.executionCtx.waitUntil(cache.put(cacheKey, cacheable))
  }

  return new Response(text, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
      'X-Cache': 'MISS',
    },
  })
}

// GET /api/weather?lat=34.34&lon=108.94
weather.get('/', async (c) => {
  const lat = Number(c.req.query('lat'))
  const lon = Number(c.req.query('lon'))
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return c.json({ error: '经纬度参数不合法' }, 400)
  }

  const params = new URLSearchParams({
    latitude: lat.toFixed(2),
    longitude: lon.toFixed(2),
    current: CURRENT_FIELDS,
    daily: DAILY_FIELDS,
    hourly: 'weather_code,visibility',
    timezone: 'auto',
    forecast_days: '7',
  })

  return cachedJson(c, `https://dev-start.invalid/weather?lat=${lat.toFixed(2)}&lon=${lon.toFixed(2)}`, `${FORECAST_URL}?${params}`)
})

// GET /api/weather/city?q=西安
weather.get('/city', async (c) => {
  const q = (c.req.query('q') || '').trim()
  if (!q) return c.json({ error: '缺少城市名' }, 400)

  const params = new URLSearchParams({
    name: q,
    count: '10',
    language: 'zh',
    format: 'json',
  })

  return cachedJson(c, `https://dev-start.invalid/weather/city?q=${encodeURIComponent(q)}`, `${GEO_URL}?${params}`)
})

export default weather
