import type { LucideIcon } from "lucide-react";

export interface BookmarkItem {
  id: string;
  name: string;
  url: string;
  icon: LucideIcon;
}

interface QuickBookmarkBarProps {
  list: BookmarkItem[];
}

export function QuickBookmarkBar({ list }: QuickBookmarkBarProps) {
  return (
    <div className="mt-6">
      <div className="flex gap-3 flex-wrap p-4 rounded-2xl bg-white/60 dark:bg-black/30 backdrop-blur-md border border-white/40">
        {list.map((item) => {
          const IconComp = item.icon;
          if (!IconComp) {
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-2 w-20 rounded-xl hover:bg-white/70 dark:hover:bg-white/10 transition-colors"
              >
                <span className="w-7 h-7 flex items-center justify-center">🔗</span>
                <span className="text-xs text-foreground truncate w-full text-center">
                  {item.name}
                </span>
              </a>
            );
          }
          return (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 p-2 w-20 rounded-xl hover:bg-white/70 dark:hover:bg-white/10 transition-colors"
            >
              <IconComp className="w-7 h-7 text-foreground" />
              <span className="text-xs text-foreground truncate w-full text-center">
                {item.name}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
