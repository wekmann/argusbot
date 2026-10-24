import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import type { CSSProperties } from "react";
import {
  Activity, ArrowRight, BarChart3, Bot, Gauge, LogIn, MessagesSquare, ScrollText, Server, ShieldCheck, Sparkles, Ticket, Timer, Users,
} from "lucide-react";
import { Shell } from "@/components/Shell";
import { CountUp, Reveal, Spotlight } from "@/components/motion";
import { getBotStatus } from "@/lib/argus.functions";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  validateSearch: z.object({ error: z.string().optional(), reason: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Argus — Discord Moderation Bot" },
      { name: "description", content: "Argus is the all-seeing Discord moderation bot with live status, logs and AI server builder." },
      { property: "og:title", content: "Argus — Discord Moderation Bot" },
      { property: "og:description", content: "All-seeing Discord moderation, audit logs and AI-built server architecture." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function formatUptime(s: number) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
}

const FEATURES = [
  { icon: ShieldCheck, title: "Auto-Moderation", text: "Banned-word filter with instant delete and an automatic mute, kick or ban — configured live from the dashboard." },
  { icon: ScrollText, title: "Moderation logs", text: "Every ban, kick and timeout is recorded with moderator, reason and time. Search and filter it in seconds." },
  { icon: Ticket, title: "Tickets & transcripts", text: "Private support tickets, inactivity auto-close, ratings and a shareable transcript page for every closed ticket." },
  { icon: Sparkles, title: "AI Server Builder", text: "Describe your community and Argus designs roles, categories and channels — then builds them with one click." },
  { icon: BarChart3, title: "Live statistics", text: "Message activity per hour and member growth for the last 30 days, drawn as clean interactive charts." },
  { icon: Bot, title: "Always watching", text: "Fast, lightweight and online around the clock. Check the live status page any time." },
];

const STEPS = [
  { icon: LogIn, title: "Log in with Discord", text: "One click, no passwords. We only see the servers you manage." },
  { icon: Server, title: "Pick your server", text: "Choose any server where Argus is present and you have manage rights." },
  { icon: Gauge, title: "Configure everything", text: "Auto-mod, logs, statistics and the AI builder — all in one dashboard." },
];

const PARTICLES = [8, 18, 27, 38, 47, 58, 66, 75, 84, 93].map((x, i) => ({ x, delay: (i * 0.9) % 8 }));

function Index() {
  const { error, reason } = Route.useSearch();
  const status = useQuery({ queryKey: ["bot-status"], queryFn: () => getBotStatus(), refetchInterval: 30_000 });
  const s = status.data?.ok ? status.data.status : null;

  return (
    <Shell>
      {/* ---------------- Hero ---------------- */}
      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 md:grid-cols-[1.15fr_1fr] md:pt-24">
        <div className="relative z-10">
          {error && (
            <div className="animate-pop-in mb-6 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
              {error === "config" ? "Discord login is not configured yet." : t.loginError}
              {reason && <span className="ml-2 font-mono text-xs text-muted-foreground">({reason})</span>}
            </div>
          )}

          <Link
            to="/status"
            className="animate-pop-in inline-flex items-center gap-2.5 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-xs font-semibold tracking-wide transition hover:border-gold/60"
          >
            <span className={`live-dot h-2 w-2 rounded-full ${s ? (s.online ? "bg-success" : "bg-destructive") : "bg-muted-foreground"}`} />
            {s ? (s.online ? `Online · ${s.guilds.toLocaleString()} servers${s.ping != null ? ` · ${s.ping} ms` : ""}` : "Currently offline") : "Checking status…"}
            <ArrowRight className="h-3.5 w-3.5 text-gold" />
          </Link>

          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.4em] text-gold">{t.heroKicker}</p>
          <h1 className="mt-3 text-6xl font-black md:text-8xl">
            <span className="text-shimmer">{t.heroTitle}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{t.heroText}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href="/api/auth/login" className="btn-gold flex items-center gap-2 rounded-xl px-8 py-4 text-lg">
              <LogIn className="h-5 w-5" /> {t.login}
            </a>
            <Link to="/status" className="btn-ghost flex items-center gap-2 rounded-xl px-8 py-4 text-lg">
              <Activity className="h-5 w-5 text-gold" /> {t.status}
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          {PARTICLES.map((p, i) => (
            <span key={i} className="particle" style={{ "--x": `${p.x}%`, "--delay": `${p.delay}s` } as CSSProperties} />
          ))}
          <div className="absolute inset-0 rounded-full bg-gold/25 blur-3xl" />
          <div className="eye-core relative aspect-square w-full">
            <div className="eye-ring eye-ring-1" />
            <div className="eye-ring eye-ring-2" />
            <img src="/favicon.png" alt="Argus all-seeing eye" width={384} height={384} fetchPriority="high" className="animate-slow-spin relative h-full w-full rounded-full" />
          </div>
        </div>
      </section>

      {/* ---------------- Live numbers ---------------- */}
      <section className="mx-auto max-w-7xl px-5 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat delay={0} icon={Server} label="Servers" value={<CountUp value={s?.guilds} />} />
          <Stat delay={80} icon={Users} label="Members watched" value={<CountUp value={s?.users} />} />
          <Stat delay={160} icon={Gauge} label="Latency" value={<CountUp value={s?.ping} suffix=" ms" />} />
          <Stat delay={240} icon={Timer} label="Uptime" value={s ? formatUptime(s.uptimeSeconds) : "—"} />
        </div>
        {status.data && !status.data.ok && (
          <p className="mt-4 text-sm text-destructive">
            {status.data.error} <span className="opacity-70">({status.data.code})</span>
          </p>
        )}
      </section>

      {/* ---------------- Features ---------------- */}
      <section className="mx-auto max-w-7xl px-5 pb-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-gold">Features</p>
          <h2 className="mt-3 text-3xl font-black md:text-5xl">Everything your server needs</h2>
          <p className="mt-4 text-muted-foreground">Moderation, support and growth tools in one place — fast to set up, pleasant to use.</p>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 90}>
              <Spotlight className="h-full p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-soft ring-1 ring-gold/25">
                  <f.icon className="h-6 w-6 text-gold" />
                </div>
                <h3 className="mt-5 text-xl font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </Spotlight>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Steps ---------------- */}
      <section className="mx-auto max-w-7xl px-5 pb-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-gold">How it works</p>
          <h2 className="mt-3 text-3xl font-black md:text-5xl">Ready in three steps</h2>
        </Reveal>
        <div className="relative mt-12 grid gap-5 md:grid-cols-3">
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-9 hidden h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent md:block" />
          {STEPS.map((st, i) => (
            <Reveal key={st.title} delay={i * 120}>
              <div className="relative text-center">
                <div className="relative mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-gold/40 bg-background shadow-[0_0_30px_-6px_oklch(0.8_0.15_75/0.5)]">
                  <st.icon className="h-7 w-7 text-gold" />
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gold font-mono text-xs font-bold text-primary-foreground">{i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold">{st.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{st.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="mx-auto max-w-7xl px-5 pb-28">
        <Reveal>
          <div className="glass relative overflow-hidden p-10 text-center md:p-16">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />
            <MessagesSquare className="relative mx-auto h-10 w-10 text-gold" />
            <h2 className="relative mt-5 text-3xl font-black md:text-5xl">Let Argus watch over your community</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-muted-foreground">Sign in with Discord and open your dashboard in under a minute.</p>
            <a href="/api/auth/login" className="btn-gold relative mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg">
              <LogIn className="h-5 w-5" /> {t.login}
            </a>
          </div>
        </Reveal>
      </section>
    </Shell>
  );
}

function Stat({ icon: Icon, label, value, delay }: { icon: typeof Activity; label: string; value: React.ReactNode; delay: number }) {
  return (
    <Reveal delay={delay}>
      <div className="glass p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <Icon className="h-4 w-4 text-gold" /> {label}
        </div>
        <p className="mt-3 truncate font-mono text-3xl font-bold tabular-nums">{value}</p>
      </div>
    </Reveal>
  );
}
