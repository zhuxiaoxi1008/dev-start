<div align="center">

# 🚀 dev-start

**一个懂你的个性化浏览器起始页。**
告别杂乱的书签栏，用最顺手的方式开启你的每一次网上冲浪。

基于 React + Hono + Supabase 构建，支持拖拽布局、多引擎搜索与免登录云端同步。

[功能预览](#-核心功能) | [快速开始](#-快速开始) | [项目架构](#-项目架构) | [工作原理](#-工作原理)

</div>

---

## ✨ 核心功能

- 🖱️ **自由拖拽布局**：基于网格的所见即所得设计，随心所欲安排你的常用网站，告别死板的列表。
- ☁️ **免登录云同步**：无需注册账号！系统会自动为你分配唯一游客 ID，你的所有布局和配置将在云端静默保存，换电脑也能无缝衔接。
- 🌈 **极致个性化**：支持自定义壁纸、纯色与渐变背景，一键切换明亮/暗黑模式，甚至可调整侧边栏方位。
- 🔍 **多引擎快捷搜索**：内置主流搜索引擎无缝切换，按下 `空格键` 或点击搜索框，即可开启高效检索。
- 🧩 **组件化书签**：不仅支持常规图标链接，还支持 `Banner` 横幅等特殊展现形式，打造专属 Dashboard。

## 🛠 技术栈

| 分类 | 技术选型 |
| :--- | :--- |
| **前端** | `React` `TypeScript` `Vite` `Tailwind CSS` `Radix UI (shadcn/ui)` |
| **后端** | `Hono` (运行于 Cloudflare Workers) |
| **数据库** | `Supabase` (PostgreSQL) |
| **核心依赖** | `react-grid-layout` (拖拽网格) |

## 🚀 快速开始

本项目前后端分离，需分别启动服务。

### 1. 克隆仓库
```bash
git clone https://github.com/your-username/dev-start.git
cd dev-start


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

## 📁 项目架构

```
├── client/                 # 🖥️ 前端工程
│   ├── src/
│   │   ├── components/     # 基础组件 (背景层、搜索栏、侧边栏等)
│   │   ├── context/        # 全局状态
│   │   ├── widgets/        # 书签渲染器
│   │   └── App.tsx         # 主页面与拖拽布局逻辑
│   └── vite.config.ts      # Vite 配置 (含 /api 代理至 8787)
│
└── worker/                 # ⚙️ 后端工程
    └── src/
        ├── routes/         # API 路由
        ├── middleware/     # 中间件 (CORS, 游客ID鉴权)
        └── index.ts        # Hono 入口
```

## 🔗 工作原理
本项目最大的亮点在于无感持久化，其工作流如下：

身份生成：前端首次加载时，通过 uuid 生成一个唯一游客 ID，存入浏览器 localStorage。
请求注入：后续所有 API 请求都会在 HTTP Header 中携带 X-User-Id: <你的ID>。
后端兜底：后端中间件拦截请求验证 ID。若数据库发现是新用户，会自动从 setting_template 表克隆一份默认配置和书签数据分配给该用户。
静默同步：用户在页面上拖拽书签、切换壁纸等操作，会自动触发 PATCH 请求，将最新状态同步至 Supabase 数据库。