-- ==========================================
-- 清理旧表（需要重置时，取消注释下面三行）
-- ==========================================
-- drop table if exists bookmarks cascade;
-- drop table if exists categories cascade;
-- drop table if exists user_settings cascade;

-- ==========================================
-- 1. 分类目录表 categories
-- ==========================================
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  name text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table categories disable row level security;
grant select, insert, update, delete on categories to anon, authenticated;

-- ==========================================
-- 2. 书签表 bookmarks
-- ==========================================
create table if not exists bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  category_id uuid references categories(id) on delete set null,
  title text not null,
  url text not null,
  icon text,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table bookmarks disable row level security;
grant select, insert, update, delete on bookmarks to anon, authenticated;

-- ==========================================
-- 3. 用户设置表 user_settings（重点：背景、双壁纸字段）
-- ==========================================
create table if not exists user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid unique not null,
  wallpaper text default '',
  theme text default 'dark',
  layout_config jsonb default '{"wallpaperB": ""}'::jsonb,
  bg_type text default 'gradient',
  bg_solid_color text default '#0f172a',
  bg_gradient text default '#1e1b4b,#020617',
  bg_gradient_angle int default 135,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_settings disable row level security;
grant select, insert, update, delete on user_settings to anon, authenticated;

-- 触发器：更新 updated_at 自动刷新
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_user_settings_updated_at on user_settings;
create trigger trigger_user_settings_updated_at
before update on user_settings
for each row
execute function set_updated_at();


-- 模板表，只存全局默认配置，和用户配置隔离
create table if not exists setting_template (
  id uuid default gen_random_uuid() primary key,
  wallpaper text not null default '',
  theme text not null default 'dark',
  layout_config jsonb not null default '{"wallpaperB": ""}'::jsonb,
  bg_type text not null default 'gradient',
  bg_solid_color text not null default '#0f172a',
  bg_gradient text not null default '#1e1b4b,#020617',
  bg_gradient_angle int not null default 135,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 只保留一条全局模板，插入默认值
insert into setting_template (
  wallpaper,
  theme,
  layout_config,
  bg_type,
  bg_solid_color,
  bg_gradient,
  bg_gradient_angle
)
select '', 'dark', '{"wallpaperB": ""}'::jsonb, 'gradient', '#0f172a', '#1e1b4b,#020617', 135
where not exists (select 1 from setting_template);

-- 权限
alter table setting_template disable row level security;
grant select on setting_template to anon, authenticated;

