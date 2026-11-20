-- ============================================================
-- 小组件：待办事项 / 记事本 建表脚本
-- 执行方式：在 Supabase 控制台 SQL Editor 中整段执行（幂等，可重复运行）
-- 所属计划：小组件集成执行计划书 阶段 4
-- ============================================================

-- 1. 待办事项（一个用户可放多个待办卡片，用 widget_id 区分）
create table if not exists todos (
    id          uuid default gen_random_uuid() primary key,
    user_id     uuid not null,
    widget_id   uuid,                    -- 关联 bookmarks.id
    content     text not null,
    done        boolean not null default false,
    sort_order  int default 0,
    created_at  timestamptz default now(),
    updated_at  timestamptz default now()
);
create index if not exists idx_todos_user on todos(user_id, widget_id);

-- 2. 记事本（同一卡片只保留一条记录）
create table if not exists notes (
    id          uuid default gen_random_uuid() primary key,
    user_id     uuid not null,
    widget_id   uuid,
    content     text not null default '',
    created_at  timestamptz default now(),
    updated_at  timestamptz default now()
);
create index if not exists idx_notes_user on notes(user_id, widget_id);
create unique index if not exists uniq_notes_user_widget on notes(user_id, widget_id);

-- 3. 权限（沿用项目现状：关闭 RLS + anon/authenticated 授权）
alter table todos disable row level security;
alter table notes disable row level security;

grant select, insert, update, delete on todos to anon, authenticated;
grant select, insert, update, delete on notes to anon, authenticated;

-- 4. updated_at 触发器（复用 init.sql 中的 set_updated_at）
drop trigger if exists trigger_todos_updated_at on todos;
create trigger trigger_todos_updated_at before update on todos
    for each row execute function set_updated_at();

drop trigger if exists trigger_notes_updated_at on notes;
create trigger trigger_notes_updated_at before update on notes
    for each row execute function set_updated_at();

notify pgrst, 'reload schema';
