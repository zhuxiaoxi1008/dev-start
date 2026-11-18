-- ==========================================
-- 初始化种子数据脚本 (data.sql)
-- ==========================================

-- 1. 清理已有测试数据（如需要反复执行重置，可保留；首次运行不影响）
truncate table bookmarks, categories, user_settings restart identity cascade;

-- 2. 插入分类、书签及默认配置
do $$
declare
  cat_dev_id uuid;
  cat_ai_id uuid;
  cat_cloud_id uuid;
  cat_design_id uuid;
begin
  -- 2.1 插入分类目录并获取自动生成的 UUID
  insert into categories (name, sort_order) values ('常用开发与文档', 1) returning id into cat_dev_id;
  insert into categories (name, sort_order) values ('AI 与大模型', 2) returning id into cat_ai_id;
  insert into categories (name, sort_order) values ('云平台与基础设施', 3) returning id into cat_cloud_id;
  insert into categories (name, sort_order) values ('UI 与工具箱', 4) returning id into cat_design_id;

  -- 2.2 插入「常用开发与文档」书签
  insert into bookmarks (category_id, title, url, icon, sort_order) values
    (cat_dev_id, 'GitHub', 'https://github.com', '🐙', 1),
    (cat_dev_id, 'Vue.js', 'https://cn.vuejs.org', '💚', 2),
    (cat_dev_id, 'React', 'https://react.dev', '⚛️', 3),
    (cat_dev_id, 'TypeScript', 'https://www.typescriptlang.org', '📘', 4),
    (cat_dev_id, 'MDN Web Docs', 'https://developer.mozilla.org', '🦊', 5),
    (cat_dev_id, 'Hono', 'https://hono.dev', '🔥', 6);

  -- 2.3 插入「AI 与大模型」书签
  insert into bookmarks (category_id, title, url, icon, sort_order) values
    (cat_ai_id, 'DeepSeek', 'https://chat.deepseek.com', '🤖', 1),
    (cat_ai_id, 'ChatGPT', 'https://chatgpt.com', '⚡', 2),
    (cat_ai_id, 'Google AI Studio', 'https://aistudio.google.com', '✨', 3),
    (cat_ai_id, 'Claude', 'https://claude.ai', '🧠', 4);

  -- 2.4 插入「云平台与基础设施」书签
  insert into bookmarks (category_id, title, url, icon, sort_order) values
    (cat_cloud_id, 'Cloudflare', 'https://dash.cloudflare.com', '☁️', 1),
    (cat_cloud_id, 'Supabase', 'https://supabase.com/dashboard', '⚡', 2),
    (cat_cloud_id, 'Vercel', 'https://vercel.com', '▲', 3);

  -- 2.5 插入「UI 与工具箱」书签
  insert into bookmarks (category_id, title, url, icon, sort_order) values
    (cat_design_id, 'Tailwind CSS', 'https://tailwindcss.com', '🎨', 1),
    (cat_design_id, 'Lucide Icons', 'https://lucide.dev', '🎯', 2),
    (cat_design_id, 'Excalidraw', 'https://excalidraw.com', '✏️', 3);

  -- 2.6 插入一条全局默认个性化配置（user_id 为 null 表示未登录态默认配置）
  insert into user_settings (user_id, theme, wallpaper, layout_config)
  values (
    null,
    'dark',
    'radial-gradient(ellipse at top, #1e1b4b, #020617)',
    '{"columns": 2, "showSearch": true, "openInNewTab": true}'::jsonb
  );
end $$;