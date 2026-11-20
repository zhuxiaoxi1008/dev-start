-- ============================================================
-- 迁移：补齐壁纸双字段 wallpaper_a / wallpaper_b
--
-- 背景：worker/src/routes/settings.ts 的新用户初始化会写入
--       wallpaper_a / wallpaper_b，但旧库（由早期 init.sql 建立）
--       的 user_settings / setting_template 只有单一 wallpaper 列，
--       导致 PostgREST 报 PGRST204：
--       "Could not find the 'wallpaper_a' column of 'user_settings'
--        in the schema cache"
--
-- 适用：已有数据的旧库。新库直接跑更新后的 init.sql 即可。
-- 幂等：可重复执行；不删除任何列、不覆盖已有壁纸值。
-- ============================================================

begin;

-- 1. 补列（默认空串，与代码中的 `?? ''` 兜底一致）
alter table public.user_settings
    add column if not exists wallpaper_a text not null default '';

alter table public.user_settings
    add column if not exists wallpaper_b text not null default '';

alter table public.setting_template
    add column if not exists wallpaper_a text not null default '';

alter table public.setting_template
    add column if not exists wallpaper_b text not null default '';

-- 2. 回填旧数据（仅补空值，已有配置不动）
--    旧结构里 bg_type='wallpaperB' 时，地址存在 layout_config.wallpaperB，
--    其次是 wallpaper 列；两者按优先级取第一个非空值。
update public.user_settings
set wallpaper_b = coalesce(
        nullif(layout_config ->> 'wallpaperB', ''),
        nullif(wallpaper, ''),
        ''
    )
where bg_type = 'wallpaperB'
  and coalesce(wallpaper_b, '') = '';

--    早期单壁纸写法：bg_type='image' 且 wallpaper 有值。
--    归入自定义壁纸 B，保留用户原本看到的图片。
update public.user_settings
set wallpaper_b = wallpaper
where bg_type = 'image'
  and coalesce(wallpaper, '') <> ''
  and coalesce(wallpaper_b, '') = '';

--    bg_type 只允许 gradient / solid / wallpaperA / wallpaperB
--    （见 settings.ts 的 VALID_BG_TYPES）。历史遗留的 'image'
--    在前端 switch 中会落到 default 走渐变，等于壁纸失效，
--    这里统一改为 wallpaperB，使上面回填的地址真正生效。
update public.user_settings
set bg_type = 'wallpaperB'
where bg_type = 'image'
  and coalesce(wallpaper_b, '') <> '';

-- 3. 模板表同样回填，保证新用户能继承到默认壁纸
update public.setting_template
set wallpaper_b = coalesce(
        nullif(layout_config ->> 'wallpaperB', ''),
        nullif(wallpaper, ''),
        ''
    )
where coalesce(wallpaper_b, '') = '';

-- 4. 让 PostgREST 立刻重新加载 schema 缓存
--    否则加完列后仍可能短时间继续报 PGRST204。
notify pgrst, 'reload schema';

commit;

-- ============================================================
-- 执行后自检（可选，单独运行）
-- ============================================================
-- select column_name, data_type, column_default
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name in ('user_settings', 'setting_template')
--   and column_name in ('wallpaper_a', 'wallpaper_b')
-- order by table_name, column_name;
--
-- select user_id, bg_type, wallpaper_a, wallpaper_b
-- from public.user_settings
-- order by updated_at desc;