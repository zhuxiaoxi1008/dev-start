-- ============================================================
-- 开发者导航项目 init.sql（完整版：表结构 + 初始数据）
-- 幂等设计：可重复执行，不会报错，也不会产生重复数据
-- 执行顺序：清理 → 建表 → 触发器 → 数据 → 权限
-- ============================================================

-- ============================================================
-- 第 0 部分：清理旧表（需要完全重置时使用）
-- ============================================================
-- drop table if exists bookmarks cascade;
-- drop table if exists categories cascade;
-- drop table if exists user_settings cascade;
-- drop table if exists setting_template cascade;

-- ============================================================
-- 第 1 部分：表结构
-- ============================================================

-- 1.1 模板表（全局默认配置，只存一条）
create table if not exists setting_template (
    id                  uuid default gen_random_uuid() primary key,
    wallpaper           text not null default '',
    theme               text not null default 'dark',
    layout_config       jsonb not null default '{"wallpaperB": ""}'::jsonb,
    bg_type             text not null default 'gradient',
    bg_solid_color      text not null default '#0f172a',
    bg_gradient         text not null default '#1e1b4b,#020617',
    bg_gradient_angle   int not null default 135,
    default_bookmarks   jsonb not null default '[]'::jsonb,
    created_at          timestamptz default now(),
    updated_at          timestamptz default now()
);

-- 1.2 分类目录表
create table if not exists categories (
    id          uuid default gen_random_uuid() primary key,
    user_id     uuid,                                    -- null 表示全局分类
    name        text not null,
    sort_order  int default 0,
    created_at  timestamptz default now()
);

-- 1.3 书签表
create table if not exists bookmarks (
    id           uuid default gen_random_uuid() primary key,
    user_id      uuid,
    category_id  uuid references categories(id) on delete set null,
    title        text not null,
    url          text not null,
    icon         text,
    sort_order   int default 0,
    widget_type  text default 'link',                    -- link=普通链接, banner=大卡片
    w            int default 2,
    h            int default 2,
    x            int default 0,
    y            int default 0,
    created_at   timestamptz default now()
);

-- 1.4 用户设置表
create table if not exists user_settings (
    id                  uuid default gen_random_uuid() primary key,
    user_id             uuid unique not null,
    wallpaper           text default '',
    theme               text default 'dark',
    layout_config       jsonb default '{"wallpaperB": ""}'::jsonb,
    bg_type             text default 'gradient',
    bg_solid_color      text default '#0f172a',
    bg_gradient         text default '#1e1b4b,#020617',
    bg_gradient_angle   int default 135,
    dark_mode           boolean default false,
    widgets_config      jsonb default '{}',
    sidebar_position    text default 'left',
    created_at          timestamptz default now(),
    updated_at          timestamptz default now()
);

-- ============================================================
-- 第 2 部分：函数与触发器
-- ============================================================

-- 2.1 自动刷新 updated_at
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
    for each row execute function set_updated_at();

-- 2.2 新用户初始化时自动插入默认书签
create or replace function insert_default_bookmarks()
returns trigger as $$
begin
    insert into bookmarks (user_id, title, url, icon, widget_type, w, h, x, y)
    values
        (new.user_id, 'GitHub', 'https://github.com', 'https://cdn.simpleicons.org/github/181717', 'link',   2, 2, 0, 0),
        (new.user_id, 'Vite',   'https://vitejs.dev', 'https://cdn.simpleicons.org/vite/646CFF',   'link',   2, 2, 2, 0),
        (new.user_id, '图片格式转换', '', '', 'banner', 4, 2, 0, 2);
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_insert_default_bookmarks on user_settings;
create trigger trigger_insert_default_bookmarks
    after insert on user_settings
    for each row execute function insert_default_bookmarks();

-- ============================================================
-- 第 3 部分：初始数据（按外键依赖顺序，幂等插入）
-- ============================================================

-- 3.1 全局模板（只保留一条）
insert into setting_template
    (id, wallpaper, theme, layout_config, bg_type, bg_solid_color,
     bg_gradient, bg_gradient_angle, default_bookmarks)
values
    ('9578225d-2387-4d1a-9ff5-bb59825614c4',
     '', 'dark', '{"wallpaperB": ""}'::jsonb, 'gradient', '#0f172a',
     '#3F3870,#2BBBAA', 135,
     '[
        {"title": "GitHub", "url": "https://github.com", "icon": "https://cdn.simpleicons.org/github/181717", "widget_type": "link", "w": 2, "h": 2, "x": 0, "y": 0},
        {"title": "Vite", "url": "https://vitejs.dev", "icon": "https://cdn.simpleicons.org/vite/646CFF", "widget_type": "link", "w": 2, "h": 2, "x": 2, "y": 0},
        {"title": "图片格式转换", "url": "", "icon": "", "widget_type": "banner", "w": 4, "h": 2, "x": 0, "y": 2}
     ]'::jsonb)
on conflict (id) do nothing;

-- 3.2 分类目录（user_id = null 的为全局分类）
insert into categories (id, user_id, name, sort_order, created_at)
values
    ('0fc13740-3978-459e-85c7-cfba64863b86', '550e8400-e29b-41d4-a716-446655440000', '开发文档',         2, '2026-11-19 05:00:18.357867+00'),
    ('2117f43b-9183-4cb0-b334-49bbe79c2d1d', null, 'AI 与大模型',         2, '2026-11-18 09:28:15.990781+00'),
    ('48b485e5-b325-414b-befa-53939ba98b56', '550e8400-e29b-41d4-a716-446655440000', '娱乐',             3, '2026-11-19 05:00:18.357867+00'),
    ('4a36c730-a1f4-4bb0-a1e8-800c55146acd', null, '娱乐',               5, '2026-11-18 09:36:30.890785+00'),
    ('4d54ffe0-0558-4d17-a016-37bbd4913eef', null, '常用开发与文档',       1, '2026-11-18 09:28:15.990781+00'),
    ('e833ebd6-3d85-410e-878f-4d5756f62ee1', null, '云平台与基础设施',     3, '2026-11-18 09:28:15.990781+00'),
    ('ebad51e2-2241-4234-9a7f-585359f29978', '550e8400-e29b-41d4-a716-446655440000', '常用工具',         1, '2026-11-19 05:00:18.357867+00'),
    ('fd3d6ef0-6977-4ec6-9c5c-c7665fd7bf78', null, 'UI 与工具箱',         4, '2026-11-18 09:28:15.990781+00')
on conflict (id) do nothing;

-- 3.3 书签数据
insert into bookmarks (id, user_id, category_id, title, url, icon, sort_order, created_at, widget_type, w, h, x, y)
values
    -- 用户 fc01733c 的默认书签
    ('4ccb467a-1c24-46a4-adab-7dbdb1344900', 'fc01733c-8eee-455d-839e-fe04a5530cad', null, 'GitHub',       'https://github.com', 'https://cdn.simpleicons.org/github/181717', 0, '2026-11-20 03:31:55.583332+00', 'link',   2, 2, 0, 0),
    ('5a46b970-e915-49f1-a8bf-12d6ce26771d', 'fc01733c-8eee-455d-839e-fe04a5530cad', null, 'Vite',         'https://vitejs.dev', 'https://cdn.simpleicons.org/vite/646CFF',   0, '2026-11-20 03:31:55.242972+00', 'link',   2, 2, 2, 0),
    ('7181fa28-52a6-46ce-b58c-5cf7ad42459f', 'fc01733c-8eee-455d-839e-fe04a5530cad', null, '图片格式转换',  '',                   '',                                          0, '2026-11-20 03:31:55.242972+00', 'banner', 4, 2, 0, 2),
    ('879e5215-c419-4f93-b353-48f0fd662399', 'fc01733c-8eee-455d-839e-fe04a5530cad', null, '图片格式转换',  '',                   '',                                          0, '2026-11-20 03:31:55.583332+00', 'banner', 4, 2, 0, 2),
    ('e4024366-d672-4202-8b09-4e723c0de69d', 'fc01733c-8eee-455d-839e-fe04a5530cad', null, 'Vite',         'https://vitejs.dev', 'https://cdn.simpleicons.org/vite/646CFF',   0, '2026-11-20 03:31:55.583332+00', 'link',   2, 2, 2, 0),
    ('fa9bd2ca-76ca-4f0d-9ac7-bf5551acb823', 'fc01733c-8eee-455d-839e-fe04a5530cad', null, 'GitHub',       'https://github.com', 'https://cdn.simpleicons.org/github/181717', 0, '2026-11-20 03:31:55.242972+00', 'link',   2, 2, 0, 0),
    -- 用户 550e8400 的分类书签
    ('7b42cebf-0b2c-4df1-ab77-9324dc23e18c', '550e8400-e29b-41d4-a716-446655440000', 'ebad51e2-2241-4234-9a7f-585359f29978', 'GitHub',      'https://github.com',  '🐙', 1, '2026-11-19 05:00:18.357867+00', 'link', 2, 2, 0, 0),
    ('7cc2f44d-1147-4f46-aa42-c0b854da113a', '550e8400-e29b-41d4-a716-446655440000', '0fc13740-3978-459e-85c7-cfba64863b86', 'React 文档',  'https://react.dev',   '⚛️', 1, '2026-11-19 05:00:18.357867+00', 'link', 2, 2, 0, 0),
    ('a06c9154-7d3a-4fa6-9ceb-c5211b565aeb', '550e8400-e29b-41d4-a716-446655440000', 'ebad51e2-2241-4234-9a7f-585359f29978', 'Supabase',    'https://supabase.com','🟢', 2, '2026-11-19 05:00:18.357867+00', 'link', 2, 2, 0, 0)
on conflict (id) do nothing;

-- 3.4 用户设置数据
-- ⚠️ 注意：插入 user_settings 会触发 insert_default_bookmarks 触发器，
--    自动为每个新用户生成 3 条默认书签（GitHub / Vite / 图片格式转换）
insert into user_settings
    (id, user_id, wallpaper, theme, layout_config, bg_type, bg_solid_color,
     bg_gradient, bg_gradient_angle, dark_mode, widgets_config, sidebar_position, updated_at)
values
    ('1f1477c5-348c-4997-9197-4f5710eee7dd', '550e8400-e29b-41d4-a716-446655440000', 'https://picsum.photos/id/1039/1920/1080', 'dark', '{"wallpaperB": "https://picsum.photos/id/1039/1920/1080"}', 'wallpaperB', '#bcfbe0', '#1e1b4b,#020617', 135, false, '{}', 'left',  '2026-11-19 05:06:43.671942+00'),
    ('39f2466b-350c-444e-b519-bdcef329e738', '308b5990-b3c0-4ffe-a09a-a6959c922ed4', '', 'dark', '{"wallpaperB": ""}', 'gradient', '#0f172a', '#1e1b4b,#020617', 135, false, '{}', 'left', '2026-11-19 06:22:27.446781+00'),
    ('732cb2fc-5bd9-48a9-a308-add95665a265', 'bbb26986-d28c-404b-80bb-882e76327c59', '', 'dark', '{"wallpaperB": ""}', 'gradient', '#0f172a', '#1e1b4b,#020617', 135, false, '{}', 'left', '2026-11-19 06:23:03.091593+00'),
    ('82ad8d86-757a-4bcc-9ff1-4d2d90781860', 'fc01733c-8eee-455d-839e-fe04a5530cad', '', 'dark', '{"wallpaperB": ""}', 'gradient', '#0f172a', '#3F3870,#2BBBAA', 135, false, '{}', 'left', '2026-11-20 08:14:17.319942+00'),
    ('94860eca-3935-4e38-9f69-0fda2740bbbc', 'e49141df-5503-4ea9-bf15-f418f6d0b712', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80', 'dark', '{"columns": 2, "showClock": true}', 'image', '#064e3b', '#3e3c73,#2cbbab', 135, false, '{}', 'left', '2026-11-18 16:00:59.865+00'),
    ('c0c5e9e3-2541-431a-a394-8812c5eb40d5', '49a4c682-7b10-43dd-9ddd-434ddd440d09', '', 'dark', '{"wallpaperB": ""}', 'gradient', '#0f172a', '#1e1b4b,#020617', 135, false, '{}', 'left', '2026-11-19 06:35:19.977159+00'),
    ('dd59b189-282f-4483-a0a5-82d9cd7a262f', '5f578d92-1062-4f5c-aa87-5f189c903769', 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&q=80', 'dark', '{"columns": 2, "showClock": true}', 'image', '#0f172a', '#1e1b4b,#020617', 135, false, '{}', 'left', '2026-11-18 16:16:40.081+00'),
    ('f8ad2194-75c9-424b-aeeb-6334eb7546f1', 'cdd93bf9-2773-4567-a405-e76b5a128591', '', 'dark', '{"wallpaperB": ""}', 'gradient', '#0f172a', '#1e1b4b,#020617', 135, false, '{}', 'left', '2026-11-19 06:43:58.151152+00'),
    ('ff7b8885-0542-41da-8094-a78a401d2e8f', 'b51afec8-6c84-4485-bb31-909ab1c7466d', '', 'dark', '{"wallpaperB": ""}', 'gradient', '#0f172a', '#1e1b4b,#020617', 135, false, '{}', 'left', '2026-11-19 05:01:29.579663+00')
on conflict (user_id) do nothing;  -- user_id 有唯一约束，按它防重复

-- ============================================================
-- 第 4 部分：权限（最后统一配置）
-- ============================================================
alter table categories       disable row level security;
alter table bookmarks        disable row level security;
alter table user_settings    disable row level security;
alter table setting_template disable row level security;

grant select, insert, update, delete on categories       to anon, authenticated;
grant select, insert, update, delete on bookmarks        to anon, authenticated;
grant select, insert, update, delete on user_settings    to anon, authenticated;
grant select on setting_template                         to anon, authenticated;
