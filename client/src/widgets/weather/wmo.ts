// client/src/widgets/weather/wmo.ts
// WMO 天气代码 -> 中文文案 + 图标
import type { LucideIcon } from 'lucide-react'
import {
  Sun, Moon, CloudSun, CloudMoon, Cloud, CloudFog, CloudDrizzle,
  CloudRain, CloudSnow, Snowflake, CloudLightning, CloudHail,
} from 'lucide-react'

export interface WmoInfo {
  label: string
  Icon: LucideIcon
}

export function wmoInfo(code: number, isDay = true): WmoInfo {
  switch (code) {
    case 0: return { label: '晴', Icon: isDay ? Sun : Moon }
    case 1: return { label: '晴间多云', Icon: isDay ? CloudSun : CloudMoon }
    case 2: return { label: '多云', Icon: isDay ? CloudSun : CloudMoon }
    case 3: return { label: '阴', Icon: Cloud }
    case 45: case 48: return { label: '雾', Icon: CloudFog }
    case 51: case 53: case 55: return { label: '毛毛雨', Icon: CloudDrizzle }
    case 56: case 57: return { label: '冻毛毛雨', Icon: CloudDrizzle }
    case 61: case 63: case 65: return { label: '雨', Icon: CloudRain }
    case 66: case 67: return { label: '冻雨', Icon: CloudRain }
    case 71: case 73: case 75: return { label: '雪', Icon: CloudSnow }
    case 77: return { label: '雪粒', Icon: Snowflake }
    case 80: case 81: case 82: return { label: '阵雨', Icon: CloudRain }
    case 85: case 86: return { label: '阵雪', Icon: CloudSnow }
    case 95: return { label: '雷阵雨', Icon: CloudLightning }
    case 96: case 99: return { label: '雷暴冰雹', Icon: CloudHail }
    default: return { label: '未知', Icon: Cloud }
  }
}

const WIND_DIRS = ['北', '东北偏北', '东北', '东北偏东', '东', '东南偏东', '东南', '东南偏南',
  '南', '西南偏南', '西南', '西南偏西', '西', '西北偏西', '西北', '西北偏北']

export function windDirection(deg: number): string {
  return WIND_DIRS[Math.round(deg / 22.5) % 16]
}

export function uvLevel(uv: number): string {
  if (uv < 3) return '低'
  if (uv < 6) return '中等'
  if (uv < 8) return '高'
  if (uv < 11) return '很高'
  return '极高'
}
