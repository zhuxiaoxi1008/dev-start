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


alter table user_settings add column if not exists dark_mode boolean default false;
alter table user_settings add column if not exists bg_type text default 'gradient';
alter table user_settings add column if not exists bg_gradient text default '#e0f7fa,#f0f9ff';
alter table user_settings add column if not exists bg_gradient_angle int default 135;
alter table user_settings add column if not exists bg_solid_color text default '#ffffff';
alter table user_settings add column if not exists wallpaper text default '';
alter table user_settings add column if not exists layout_config jsonb default '{"wallpaperB":""}'::jsonb;

-- 1. 给 bookmarks 表增加一个字段，用于区分组件类型（'link' 表示普通链接，'banner' 表示大卡片）
alter table bookmarks add column if not exists widget_type text default 'link';
-- 增加宽高配置，用于前端网格布局
alter table bookmarks add column if not exists w int default 2;
alter table bookmarks add column if not exists h int default 2;
alter table bookmarks add column if not exists x int default 0;
alter table bookmarks add column if not exists y int default 0;

-- 2. 创建触发器函数：当有新的 user_settings 记录时（代表新用户初始化），插入默认书签
create or replace function insert_default_bookmarks()
returns trigger as $$
begin
  insert into bookmarks (user_id, title, url, icon, widget_type, w, h, x, y)
  values 
    (new.user_id, 'GitHub', 'https://github.com', 'https://cdn.simpleicons.org/github/181717', 'link', 2, 2, 0, 0),
    (new.user_id, 'Vite', 'https://vitejs.dev', 'https://cdn.simpleicons.org/vite/646CFF', 'link', 2, 2, 2, 0),
    (new.user_id, '图片格式转换', '', '', 'banner', 4, 2, 0, 2);
  return new;
end;
$$ language plpgsql;

-- 3. 绑定触发器（当插入用户设置时触发）
drop trigger if exists trigger_insert_default_bookmarks on user_settings;
create trigger trigger_insert_default_bookmarks
after insert on user_settings
for each row
execute function insert_default_bookmarks();

ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS dark_mode boolean DEFAULT false;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS sidebar_position text DEFAULT 'left';

-- 1. 给 setting_template 增加 default_bookmarks 字段，用 JSON 存默认标签
ALTER TABLE setting_template ADD COLUMN IF NOT EXISTS default_bookmarks jsonb DEFAULT '[]'::jsonb;

-- 2. 更新默认模板（如果之前没插，这步相当于插入/覆盖）
UPDATE setting_template 
SET default_bookmarks = '[
  {"title": "GitHub", "url": "https://github.com", "icon": "https://cdn.simpleicons.org/github/181717", "widget_type": "link", "w": 2, "h": 2, "x": 0, "y": 0},
  {"title": "Vite", "url": "https://vitejs.dev", "icon": "https://cdn.simpleicons.org/vite/646CFF", "widget_type": "link", "w": 2, "h": 2, "x": 2, "y": 0},
  {"title": "图片格式转换", "url": "", "icon": "", "widget_type": "banner", "w": 4, "h": 2, "x": 0, "y": 2}
]'::jsonb
WHERE id = (SELECT id FROM setting_template LIMIT 1);