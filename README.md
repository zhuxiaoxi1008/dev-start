# dev-start
开发者起始页项目，monorepo管理方式

## 项目初始化
```bash
git clone
npm install -g pnpm
pnpm install

pnpm install wrangler -g
npm install -g wrangler

wrangler whoami

# powershell
# 替换为你的 API Token 字符串
[Environment]::SetEnvironmentVariable("CLOUDFLARE_API_TOKEN", "你的Token字符串", "User")

wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler deploy

```
