import { useMemo, useEffect, useState } from "react";

export function TimeDisplay() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = useMemo(() => {
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }, [now]);

  const dateStr = useMemo(() => {
    return now.toLocaleDateString("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  }, [now]);

  return (
    <div className="pt-16 pb-10 text-center">
      <div className="text-8xl font-light tracking-widest text-foreground">
        {timeStr}
      </div>
      <div className="mt-2 text-base text-muted-foreground">{dateStr}</div>
    </div>
  );
}
