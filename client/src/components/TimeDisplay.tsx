import { useState, useEffect } from "react";

export function TimeDisplay() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekArr = [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六",
  ];
  const week = weekArr[now.getDay()];

  return (
    <div className="text-center mt-6">
      <div
        className="text-4xl sm:text-5xl md:text-6xl tabular-nums text-white font-medium leading-tight"
        style={{ textShadow: "0 2px 10px rgba(0,0,0,.35), 0 1px 2px rgba(0,0,0,.3)" }}
      >
        {hh}:{mm}:{ss}
      </div>
      <div
        className="text-sm sm:text-lg"
        style={{
          color: "#ffffff",
          opacity: 0.9,
          textShadow: "0 1px 6px rgba(0,0,0,.35)",
        }}
      >
        {month}月{day}日{week}
      </div>
    </div>
  );
}
