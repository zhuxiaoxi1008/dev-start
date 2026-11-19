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
    <div className="w-full max-w-2xl mx-auto mt-10">
      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-sm">
        {/* 搜索引擎选择 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setEngineMenuOpen((v) => !v)}
            className="flex items-center gap-1 pr-2 pl-1 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <img
              src={selectedEngine.icon}
              alt={selectedEngine.name}
              className="w-5 h-5 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m21 21-4.3-4.3'/%3E%3C/svg%3E";
              }}
            />
            <span className="text-sm text-foreground hidden sm:inline">
              {selectedEngine.name}
            </span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {engineMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-44 rounded-xl bg-white dark:bg-neutral-900 border border-white/60 dark:border-white/10 shadow-lg p-1 z-50">
              {engines.map((engine) => (
                <button
                  key={engine.name}
                  type="button"
                  onClick={() => handlePickEngine(engine)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <img
                    src={engine.icon}
                    alt={engine.name}
                    className="w-5 h-5 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m21 21-4.3-4.3'/%3E%3C/svg%3E";
                    }}
                  />
                  <span className="text-foreground">{engine.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-border dark:bg-white/10" />

        {/* 输入框 */}
        <input
          type="text"
          value={keyword}
          onChange={(e) => onChangeKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch();
          }}
          placeholder="搜索或输入网址"
          className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground px-1 py-1"
        />

        {/* 设置按钮 */}
        <button
          type="button"
          onClick={onOpenSetting}
          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          title="设置"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* 搜索按钮 */}
        <button
          type="button"
          onClick={onSearch}
          className="px-4 py-1.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all"
        >
          搜索
        </button>
      </div>
    </div>
  );
}
