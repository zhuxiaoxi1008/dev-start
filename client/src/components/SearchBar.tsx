import { useState } from "react";
import { Search, ChevronDown, Settings } from "lucide-react";

export interface SearchEngine {
  name: string;
  icon: string;
  url: string;
}

interface SearchBarProps {
  engines: SearchEngine[];
  selectedEngine: SearchEngine;
  keyword: string;
  onChangeKeyword: (v: string) => void;
  onChangeEngine: (v: SearchEngine) => void;
  onSearch: () => void;
  onOpenSetting: () => void;
}

const FALLBACK_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m21 21-4.3-4.3'/%3E%3C/svg%3E";

export function SearchBar({
  engines,
  selectedEngine,
  keyword,
  onChangeKeyword,
  onChangeEngine,
  onSearch,
  onOpenSetting,
}: SearchBarProps) {
  const [engineMenuOpen, setEngineMenuOpen] = useState(false);

  const handlePickEngine = (engine: SearchEngine) => {
    onChangeEngine(engine);
    setEngineMenuOpen(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-3 sm:mt-4">
      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-2xl bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-sm">
        {/* 搜索引擎选择 */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setEngineMenuOpen((v) => !v)}
            className="touch-target flex items-center gap-1 px-1 sm:px-1.5 sm:pr-2 rounded-lg active:bg-black/10 dark:active:bg-white/10 transition-colors"
            aria-label="选择搜索引擎"
          >
            <img
              src={selectedEngine.icon}
              alt={selectedEngine.name}
              className="w-5 h-5 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_ICON }}
            />
            <span className="text-sm text-foreground hidden sm:inline">
              {selectedEngine.name}
            </span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {engineMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-44 max-w-[calc(100vw-2rem)] rounded-xl bg-white dark:bg-neutral-900 border border-white/60 dark:border-white/10 shadow-lg p-1 z-50">
              {engines.map((engine) => (
                <button
                  key={engine.name}
                  type="button"
                  onClick={() => handlePickEngine(engine)}
                  className="w-full flex items-center gap-2 px-2 py-2.5 rounded-lg text-sm active:bg-black/10 dark:active:bg-white/10 transition-colors"
                >
                  <img
                    src={engine.icon}
                    alt={engine.name}
                    className="w-5 h-5 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_ICON }}
                  />
                  <span className="text-foreground">{engine.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-border dark:bg-white/10 shrink-0" />

        {/* 输入框：text-base 避免 iOS 聚焦时自动放大页面 */}
        <input
          type="text"
          inputMode="search"
          enterKeyHint="search"
          value={keyword}
          onChange={(e) => onChangeKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch();
          }}
          placeholder="搜索或输入网址"
          className="flex-1 min-w-0 bg-transparent outline-none text-base sm:text-sm text-foreground placeholder:text-muted-foreground px-1 py-1"
        />

        {/* 设置按钮 */}
        <button
          type="button"
          onClick={onOpenSetting}
          className="touch-target flex items-center justify-center p-1 sm:p-1.5 rounded-lg active:bg-black/10 dark:active:bg-white/10 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="设置"
          aria-label="设置"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* 搜索按钮 */}
        <button
          type="button"
          onClick={onSearch}
          className="touch-target shrink-0 px-3 sm:px-4 rounded-lg bg-foreground text-background text-sm font-medium active:scale-[0.98] transition-transform inline-flex items-center justify-center"
        >
          <Search className="w-4 h-4 sm:hidden" />
          <span className="hidden sm:inline">搜索</span>
        </button>
      </div>
    </div>
  );
}