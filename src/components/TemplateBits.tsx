import { useEffect, useState } from "react";
import { Hash, Megaphone, MessagesSquare, Mic2, Star, Volume2, type LucideIcon } from "lucide-react";
import type { TemplateChannelKind } from "@/lib/templates.functions";

export const channelIcons: Record<TemplateChannelKind, LucideIcon> = {
  text: Hash,
  voice: Volume2,
  announcement: Megaphone,
  stage: Mic2,
  forum: MessagesSquare,
};

/** Read-only stars (supports halves visually via rounding). */
export function StarsRow({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          width={size}
          height={size}
          className={n <= Math.round(value) ? "fill-gold text-gold" : "text-muted-foreground/40"}
        />
      ))}
    </span>
  );
}

/** Clickable 1-5 stars. */
export function StarsInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="inline-flex items-center gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onBlur={() => setHover(0)}
          onClick={() => onChange(n)}
          className="rounded p-0.5 transition hover:scale-110"
        >
          <Star width={28} height={28} className={n <= shown ? "fill-gold text-gold" : "text-muted-foreground/40"} />
        </button>
      ))}
    </div>
  );
}

export function discordAvatar(a: { id: string; avatar: string | null }) {
  return a.avatar ? `https://cdn.discordapp.com/avatars/${a.id}/${a.avatar}.png?size=64` : "/favicon.png";
}

/** Random id kept in this browser (localStorage) - "1 browser = 1 review". Empty until mounted. */
export function useVoterKey() {
  const [key, setKey] = useState("");
  useEffect(() => {
    try {
      let k = localStorage.getItem("argus_voter");
      if (!k || k.length < 16) {
        k = crypto.randomUUID();
        localStorage.setItem("argus_voter", k);
      }
      setKey(k);
    } catch {
      // Storage blocked (private mode etc.): a per-tab id still works, it just resets on reload.
      setKey(crypto.randomUUID());
    }
  }, []);
  return key;
}