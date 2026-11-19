import { createClient } from '@supabase/supabase-js'

export type EnvBindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

export function getSupabaseClient(env: EnvBindings) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error('缺少 SUPABASE_URL / SUPABASE_ANON_KEY 环境变量')
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
}