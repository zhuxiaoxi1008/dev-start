-- ==========================================
-- 清理旧表（如需重新建表，取消下面三行的注释）
-- ==========================================
-- drop table if exists bookmarks cascade;
-- drop table if exists categories cascade;
-- drop table if exists user_settings cascade;

-- ==========================================
-- 1. 分类目录表 (Categories)
-- ==========================================
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid, -- 放宽限制，方便无登录状态下的开发与测试
  name text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 权限闭环：关闭 RLS 并授予 API 角色读写权限
alter table categories disable row level security;
grant select, insert, update, delete on categories to anon, authenticated;

-- ==========================================
-- 2. 网址导航书签表 (Bookmarks)
-- ==========================================
create table if not exists bookmarks (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references categories(id) on delete cascade not null,
  user_id uuid, -- 放宽限制
  title text not null,
  url text not null,
  icon text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 权限闭环：关闭 RLS 并授予 API 角色读写权限
alter table bookmarks disable row level security;
grant select, insert, update, delete on bookmarks to anon, authenticated;

-- ==========================================
-- 3. 用户个性化设置表 (User Settings)
-- ==========================================
create table if not exists user_settings (
  id uuid default gen_random_uuid() primary key, -- 使用独立主键，不再强绑定 auth.users
  user_id uuid unique,
  wallpaper text,
  theme text default 'dark',
  layout_config jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- 权限闭环：关闭 RLS 并授予 API 角色读写权限
alter table user_settings disable row level security;
grant select, insert, update, delete on user_settings to anon, authenticated;

-- ==========================================
-- 4. 未来新建表的默认权限兜底（一劳永逸）
-- ==========================================
-- 确保后续在 public 模式下新建的任何表，默认都对 anon 和 authenticated 开放基础权限

-- ==========================================
-- 为现有 user_settings 表扩展渐变背景字段
-- 无损升级：原有字段全部保留，旧数据自动填充默认值
-- ==========================================
alter table user_settings 
add column if not exists bg_type text default 'gradient',
add column if not exists bg_solid_color text default '#0f172a',
add column if not exists bg_gradient text default '#1e1b4b,#020617',
add column if not exists bg_gradient_angle int default 135;