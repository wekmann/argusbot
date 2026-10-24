import { useId, type CSSProperties } from "react";

/** Tiny dependency-free area sparkline (draws itself in). */
export function Sparkline({ data, className = "h-12 w-full" }: { data: number[]; className?: string }) {
  const id = useId();
  if (data.length < 2) return <div className={className} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const W = 120;
  const H = 36;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * W, H - 4 - ((v - min) / span) * (H - 8)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} className="fade-area" />
      <path d={line} fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength={1} vectorEffect="non-scaling-stroke" className="draw-line" />
    </svg>
  );
}

/** 24-hour message bars in plain CSS - light, animated, with hover tooltips. */
export function HourBars({ data }: { data: { hour: number; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div>
      <div className="flex h-44 items-end gap-1 sm:gap-1.5">
        {data.map((d, i) => (
          <div key={i} className="group relative flex h-full flex-1 items-end">
            <div
              className="bar-col w-full rounded-t-md bg-gradient-to-t from-gold/30 to-gold transition group-hover:brightness-125"
              style={{ height: `${Math.max(d.count ? 4 : 1.5, (d.count / max) * 100)}%`, opacity: d.count ? 1 : 0.25, "--d": `${i * 28}ms` } as CSSProperties}
            />
            <div className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2 py-1 text-xs opacity-0 shadow-lg transition group-hover:opacity-100">
              <span className="font-mono font-bold text-gold">{d.count.toLocaleString()}</span> · {String(d.hour).padStart(2, "0")}:00
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1 sm:gap-1.5 font-mono text-[10px] text-muted-foreground">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">{i % 4 === 0 ? String(d.hour).padStart(2, "0") : ""}</div>
        ))}
      </div>
    </div>
  );
}
