interface BookmarkItem {
  id: string;
  name: string;
  url: string;
  icon: string;
}

interface QuickBookmarkBarProps {
  list: BookmarkItem[];
}

export function QuickBookmarkBar({ list }: QuickBookmarkBarProps) {
  return (
    <div className="mt-8">
      <div className="flex gap-2 flex-wrap p-3 rounded-2xl bg-white/60 dark:bg-neutral-900/50 backdrop-blur-xl border border-white/60 dark:border-white/10 max-w-2xl mx-auto">
        {list.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1 p-2.5 w-[72px] rounded-xl hover:bg-white/80 dark:hover:bg-white/10 transition-all"
          >
            <img
              src={item.icon}
              alt={item.name}
              className="w-6 h-6 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'%3E%3C/path%3E%3Cpath d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'%3E%3C/path%3E%3C/svg%3E";
              }}
            />
            <span className="text-xs text-foreground truncate w-full text-center">
              {item.name}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
