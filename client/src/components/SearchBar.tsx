import { Search, Settings, ChevronDown } from "lucide-react";
import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type EngineItem = {
  id: string;
  name: string;
  icon: string;
  url: string;
  placeholder: string;
};

interface SearchBarProps {
  engines: EngineItem[];
  selectedEngine: EngineItem;
  keyword: string;
  onKeywordChange: (v: string) => void;
  onSelectEngine: (engine: EngineItem) => void;
  onSearch: () => void;
  onOpenSetting: () => void;
}

export function SearchBar({
  engines,
  selectedEngine,
  keyword,
  onKeywordChange,
  onSelectEngine,
  onSearch,
  onOpenSetting,
}: SearchBarProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSearch();
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 rounded-2xl border bg-card/60 backdrop-blur-lg p-3 shadow-sm transition-all hover:shadow-md">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary" className="gap-2 h-10">
              <img
                src={selectedEngine.icon}
                alt={selectedEngine.name}
                className="w-4 h-4 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2364748b'><path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/></svg>";
                }}
              />
              <span className="text-sm">{selectedEngine.name}</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="grid grid-cols-4 gap-2">
              {engines.map((eng) => (
                <Button
                  key={eng.id}
                  variant={eng.id === selectedEngine.id ? "default" : "ghost"}
                  className="h-16 w-16 flex flex-col gap-1"
                  onClick={() => onSelectEngine(eng)}
                >
                  <img
                    src={eng.icon}
                    alt={eng.name}
                    className="w-5 h-5 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2364748b'><path d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/></svg>";
                    }}
                  />
                  <span className="text-xs">{eng.name}</span>
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            className="h-10 w-full rounded-xl border bg-muted/50 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-ring transition-all"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedEngine.placeholder}
          />
        </div>

        <Button onClick={onSearch} className="h-10">搜索</Button>

        <Button variant="ghost" size="icon" onClick={onOpenSetting} className="h-10 w-10">
          <Settings className="size-4" />
        </Button>
      </div>
    </div>
  );
}
