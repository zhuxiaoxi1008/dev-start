// worker/src/routes/hotlist.ts
// 热榜代理：直接转发各平台官方公开接口
// 对外接口：GET /api/hotlist/:platform
// 可选平台：weibo | baidu | zhihu | douyin | v2ex | hackernews | reddit | github
// 返回结构：{ code: 200, data: [{ title, url, hot }] }
import { Hono } from 'hono'
import type { Context } from 'hono'
import type { EnvBindings } from '../db/supabase'

const hotlist = new Hono<{ Bindings: EnvBindings }>()

const CACHE_SECONDS = 30 * 60 // 30 分钟
const UPSTREAM_TIMEOUT = 10000

interface NormalItem {
  title: string
  url: string
  hot?: string
}

const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'

// 单端点配置
interface Endpoint {
  url: string
  headers?: Record<string, string>
  normalize: (json: any) => NormalItem[]
  // 抖音这类需要先取 cookie 的特殊流程
  pre?: () => Promise<Record<string, string>>
  // HN / GitHub 这类需要二次请求组装数据的
  fetchJson?: (url: string, headers?: Record<string, string>) => Promise<any>
}

interface PlatformConfig {
  endpoints: Endpoint[]
}

// 通用 fetch JSON
async function getJson(url: string, headers?: Record<string, string>): Promise<any> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT)
  try {
    const res = await fetch(url, { signal: controller.signal, headers })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

// ---------- codernav 兜底公共逻辑 ----------

// 抽取抖音 cookie 预热逻辑（双 UA 端点复用）
async function douyinPre(): Promise<Record<string, string>> {
  const res = await fetch('https://www.douyin.com/passport/general/login_guiding_strategy/?aid=6383', {
    headers: { 'User-Agent': IPHONE_UA },
  })
  const setCookie = res.headers.get('set-cookie') || ''
  const pairs = setCookie
    .split(/,(?=[^;]+?=)/)
    .map((s) => s.split(';')[0].trim())
    .filter(Boolean)
  return { cookie: pairs.join('; ') }
}

// 抖音 normalize（双 UA 端点复用）
const douyinNormalize = (json: any): NormalItem[] =>
  (json?.data?.word_list ?? [])
    .filter((d: any) => d.word)
    .map((d: any) => ({
      title: d.word,
      url: `https://www.douyin.com/hot/${d.sentence_id}`,
      hot: d.hot_value != null ? String(d.hot_value) : undefined,
    }))

// codernav 兜底 normalize（宽松字段匹配）
const codernavNormalize =
  (fallbackUrl: (t: string) => string) =>
  (json: any): NormalItem[] => {
    const list = json?.data ?? json?.result ?? (Array.isArray(json) ? json : [])
    return list
      .map((d: any) => ({
        title: d.title ?? d.name ?? d.word ?? '',
        url: d.url ?? d.link ?? fallbackUrl(d.title ?? d.name ?? d.word ?? ''),
        hot: d.hot != null ? String(d.hot) : d.hot_value != null ? String(d.hot_value) : undefined,
      }))
      .filter((it) => it.title)
  }

const codernavUrl = (type: string) =>
  `https://start.codernav.com/apps.topSearch.Index/TopSearch?type=${type}&timestamp=${Date.now()}`

const codernavHeaders = {
  'User-Agent': DESKTOP_UA,
  Referer: 'https://start.codernav.com/',
  Accept: 'application/json',
}

// ---------- 各平台配置 ----------

const PLATFORMS: Record<string, PlatformConfig> = {
  // ---------- 国内 ----------

  // 微博热搜：官方 + codernav 兜底
  weibo: {
    endpoints: [
      {
        url: 'https://weibo.com/ajax/side/hotSearch',
        headers: {
          'User-Agent': DESKTOP_UA,
          Referer: 'https://weibo.com/',
          Accept: 'application/json',
        },
        normalize: (json) =>
          (json?.realtime ?? [])
            .filter((d: any) => d.word)
            .map((d: any) => ({
              title: d.word,
              url: `https://s.weibo.com/weibo?q=${encodeURIComponent(d.word)}`,
              hot: d.num != null ? String(d.num) : undefined,
            })),
      },
      {
        url: codernavUrl('weibo'),
        headers: codernavHeaders,
        normalize: codernavNormalize(
          (t) => `https://s.weibo.com/weibo?q=${encodeURIComponent(t)}`,
        ),
      },
    ],
  },

  // 百度热搜：官方（iPhone UA 最稳）+ codernav 兜底
  baidu: {
    endpoints: [
      {
        url: 'https://top.baidu.com/api/board?platform=wise&tab=realtime',
        headers: {
          'User-Agent': IPHONE_UA,
          Referer: 'https://top.baidu.com/',
          Accept: 'application/json',
        },
        normalize: (json) => {
          const out: NormalItem[] = []
          // 数据在 data.cards[].content[] 两层嵌套里
          for (const card of json?.data?.cards ?? []) {
            for (const item of card?.content ?? []) {
              if (!item.word) continue
              out.push({
                title: item.word,
                url: item.url || item.rawUrl || `https://www.baidu.com/s?wd=${encodeURIComponent(item.word)}`,
                hot: item.hotScore != null ? String(item.hotScore) : undefined,
              })
            }
          }
          return out
        },
      },
      {
        url: codernavUrl('baidu'),
        headers: codernavHeaders,
        normalize: codernavNormalize(
          (t) => `https://www.baidu.com/s?wd=${encodeURIComponent(t)}`,
        ),
      },
    ],
  },

  // 知乎热榜
  zhihu: {
    endpoints: [
      {
        url: 'https://api.zhihu.com/topstory/hot-list?limit=20',
        headers: {
          'User-Agent': DESKTOP_UA,
          Referer: 'https://www.zhihu.com/hot',
          Accept: 'application/json',
        },
        normalize: (json) =>
          (json?.data ?? [])
            .filter((d: any) => d.target?.title)
            .map((d: any) => {
              // api 域名的 url 转成网页地址
              let url = d.target?.url || ''
              url = url
                .replace('https://api.zhihu.com/questions/', 'https://www.zhihu.com/question/')
                .replace('https://api.zhihu.com/answers/', 'https://www.zhihu.com/question/')
              if (!url.startsWith('http')) url = `https://www.zhihu.com${url}`
              return {
                title: d.target.title,
                url: url || 'https://www.zhihu.com/hot',
                hot: d.detail_text || undefined,
              }
            }),
      },
    ],
  },

  // 抖音热榜：先取 cookie 再请求，双 UA 尝试
  douyin: {
    endpoints: [
      {
        url: 'https://www.douyin.com/aweme/v1/web/hot/search/list/?device_platform=webapp&aid=6383&channel=channel_pc_web&detail_list=1',
        headers: {
          'User-Agent': IPHONE_UA,
          Referer: 'https://www.douyin.com/',
          Accept: 'application/json',
        },
        pre: douyinPre,
        normalize: douyinNormalize,
      },
      {
        url: 'https://www.douyin.com/aweme/v1/web/hot/search/list/?device_platform=webapp&aid=6383&channel=channel_pc_web&detail_list=1',
        headers: {
          'User-Agent': DESKTOP_UA,
          Referer: 'https://www.douyin.com/',
          Accept: 'application/json',
        },
        pre: douyinPre,
        normalize: douyinNormalize,
      },
    ],
  },

  // V2EX 热门主题（官方公开 API，最稳）
  v2ex: {
    endpoints: [
      {
        url: 'https://www.v2ex.com/api/topics/hot.json',
        headers: { 'User-Agent': DESKTOP_UA, Accept: 'application/json' },
        normalize: (json) =>
          (Array.isArray(json) ? json : [])
            .filter((d: any) => d.title)
            .map((d: any) => ({
              title: d.title,
              url: d.url || `https://www.v2ex.com/t/${d.id}`,
              hot: d.replies != null ? `${d.replies} 回复` : undefined,
            })),
      },
    ],
  },

  // ---------- 国外 ----------

  // Hacker News（官方公开 API，两次请求：先 ID 列表再批量详情）
  hackernews: {
    endpoints: [
      {
        url: 'https://hacker-news.firebaseio.com/v0/topstories.json',
        headers: { 'User-Agent': DESKTOP_UA, Accept: 'application/json' },
        normalize: () => [], // 占位，实际逻辑在 fetchItems 里特判
        fetchJson: async (url: string, headers?: Record<string, string>) => {
          const ids: number[] = await getJson(url, headers)
          const topIds = (ids ?? []).slice(0, 20)
          const items = await Promise.all(
            topIds.map((id) =>
              getJson(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).catch(() => null),
            ),
          )
          return items.filter(Boolean)
        },
      },
    ],
  },

  // Reddit 热门（需要浏览器 UA，Workers IP 偶尔被风控）
  reddit: {
    endpoints: [
      {
        url: 'https://www.reddit.com/r/popular.json?limit=20',
        headers: { 'User-Agent': DESKTOP_UA, Accept: 'application/json' },
        normalize: (json) =>
          (json?.data?.children ?? [])
            .map((c: any) => c.data)
            .filter((d: any) => d.title)
            .map((d: any) => ({
              title: d.title,
              url: `https://www.reddit.com${d.permalink}`,
              hot: d.ups != null ? String(d.ups) : undefined,
            })),
      },
    ],
  },

  // GitHub Trending（官方 Search API 按 7 日新增 star 排序模拟趋势榜）
  github: {
    endpoints: [
      {
        url: '', // 实际 URL 在 fetchJson 里动态生成（带日期）
        headers: {
          'User-Agent': DESKTOP_UA,
          Accept: 'application/vnd.github+json',
        },
        normalize: (json) =>
          (json?.items ?? [])
            .filter((d: any) => d.full_name)
            .map((d: any) => ({
              title: d.full_name,
              url: d.html_url,
              hot: d.stargazers_count != null ? `★ ${d.stargazers_count}` : undefined,
            })),
        fetchJson: async (_url: string, headers?: Record<string, string>) => {
          const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)
          const apiUrl = `https://api.github.com/search/repositories?q=created:>${since}&sort=stars&order=desc&per_page=20`
          return getJson(apiUrl, headers)
        },
      },
    ],
  },
}

// ---------- 请求 + 缓存 ----------

async function fetchUpstream(ep: Endpoint): Promise<any> {
  const extraHeaders = ep.pre ? await ep.pre() : {}
  const headers = { Accept: 'application/json', ...(ep.headers ?? {}), ...extraHeaders }

  // 特殊流程：fetchJson 优先（HN / GitHub）
  if (ep.fetchJson) {
    return await ep.fetchJson(ep.url, headers)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT)
  try {
    const res = await fetch(ep.url, {
      signal: controller.signal,
      headers,
      cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

async function fetchItems(cfg: PlatformConfig, platform: string): Promise<NormalItem[]> {
  const errors: string[] = []
  for (const ep of cfg.endpoints) {
    try {
      const json = await fetchUpstream(ep)
      let items = ep.normalize(json).filter((it) => it.title).slice(0, 20)

      // HN 特殊处理：fetchJson 返回的就是详情数组，在这里统一 map
      if (platform === 'hackernews' && Array.isArray(json) && json.length > 0) {
        items = json
          .filter((d: any) => d?.title)
          .map((d: any) => ({
            title: d.title,
            url: d.url || `https://news.ycombinator.com/item?id=${d.id}`,
            hot: d.score != null ? `${d.score} points` : undefined,
          }))
          .slice(0, 20)
      }

      if (items.length === 0) {
        errors.push('empty')
        continue
      }
      return items
    } catch (e: any) {
      errors.push(e?.message ?? String(e))
    }
  }
  throw new Error(`[${platform}] all endpoints failed: ${errors.join(' | ')}`)
}

async function cachedJson(c: Context, platform: string, cfg: PlatformConfig): Promise<Response> {
  const cacheKey = new Request(`https://hotlist.internal/${platform}`)

  let cache: Cache | null = null
  try {
    cache = typeof caches !== 'undefined' ? caches.default : null
  } catch {
    cache = null
  }

  if (cache) {
    try {
      const hit = await cache.match(cacheKey)
      if (hit) {
        return new Response(hit.body, {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
        })
      }
    } catch {
      cache = null
    }
  }

  let items: NormalItem[]
  try {
    items = await fetchItems(cfg, platform)
  } catch (e: any) {
    console.error(`[hotlist] ${e?.message}`)
    return c.json({ code: 502, message: '热搜服务暂不可用', data: [] }, 502)
  }

  const bodyText = JSON.stringify({ code: 200, data: items })
  const outHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
    'X-Cache': 'MISS',
  }

  if (cache) {
    try {
      const cacheable = new Response(bodyText, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
        },
      })
      c.executionCtx.waitUntil(cache.put(cacheKey, cacheable))
    } catch (e) {
      console.error('[hotlist] cache.put failed:', e)
    }
  }

  return new Response(bodyText, { status: 200, headers: outHeaders })
}

hotlist.get('/:platform', async (c) => {
  const platform = c.req.param('platform')
  const cfg = PLATFORMS[platform]
  if (!cfg) {
    return c.json({ code: 404, message: 'unknown platform', data: [] }, 404)
  }
  return cachedJson(c, platform, cfg)
})

export default hotlist
