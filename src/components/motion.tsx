import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

/** One shared IntersectionObserver for every <Reveal /> on the page. */
let observer: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, () => void>();
function observe(el: Element, cb: () => void) {
  if (typeof IntersectionObserver === "undefined") return cb();
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        callbacks.get(e.target)?.();
        callbacks.delete(e.target);
        observer?.unobserve(e.target);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
  );
  callbacks.set(el, cb);
  observer.observe(el);
}

/**
 * Fade + slide in when scrolled into view. `delay` (ms) lets you stagger siblings.
 * Content stays visible without JavaScript (the hidden state only applies after `js-motion` is set).
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  delay?: number;
  as?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    document.documentElement.classList.add("js-motion");
    const el = ref.current;
    if (!el) return;
    observe(el, () => setVisible(true));
    return () => {
      callbacks.delete(el);
      observer?.unobserve(el);
    };
  }, []);
  return (
    <Tag ref={ref} className={cn("reveal", visible && "is-visible", className)} style={{ "--d": `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}

/** Number that counts up to `value` (and animates again whenever the value changes). */
export function CountUp({ value, duration = 1100, decimals = 0, suffix = "" }: { value: number | null | undefined; duration?: number; decimals?: number; suffix?: string }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (value == null || Number.isNaN(value)) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      from.current = value;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      setShown(a + (value - a) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  if (value == null) return <>—</>;
  return (
    <>
      {shown.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </>
  );
}

/** Card whose glow follows the pointer. Pass `as` to render a Link/anchor instead of a div. */
export function Spotlight({ children, className, as: Tag = "div", ...rest }: { children: ReactNode; className?: string; as?: ElementType; [k: string]: unknown }) {
  const onMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <Tag onPointerMove={onMove} className={cn("glass spotlight", className)} {...rest}>
      {children}
    </Tag>
  );
}

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn("skeleton", className)} style={style} aria-hidden />;
}

/** Relative time ("5 min ago") without extra dependencies. */
export function timeAgo(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} d ago`;
  return new Date(iso).toLocaleDateString();
}
