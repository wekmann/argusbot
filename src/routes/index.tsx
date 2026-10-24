import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Activity, RefreshCw, Server, Timer, User } from "lucide-react";
import { Shell } from "@/components/Shell";
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
  return `${d}d ${h}h ${m}m`;
}

function Index() {
  const { error, reason } = Route.useSearch();
  const status = useQuery({ queryKey: ["bot-status"], queryFn: () => getBotStatus() });
  const s = status.data?.ok ? status.data.status : null;

  return (
    <Shell>
      <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-[1.2fr_1fr]">
        <div>
          {error && (
            <div className="mb-6 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
              {error === "config" ? "Discord login is not configured yet." : t.loginError}
              {reason && <span className="ml-2 font-mono text-xs text-muted-foreground">({reason})</span>}
            </div>
          )}
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-gold">{t.heroKicker}</p>
          <h1 className="mt-3 text-6xl font-black md:text-8xl">
            <span className="text-gold-gradient">{t.heroTitle}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">{t.heroText}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href="/api/auth/login" className="btn-gold rounded-xl px-8 py-4 text-lg">{t.login}</a>
            <a href="#status" className="btn-ghost rounded-xl px-8 py-4 text-lg">{t.status}</a>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute inset-0 rounded-full bg-gold/20 blur-3xl" />
          <img src={"/favicon.png"} alt="Argus all-seeing eye" className="animate-slow-spin relative w-full rounded-full" />
        </div>
      </section>

      <section id="status" className="mx-auto max-w-6xl px-5 pb-24">
        <div className="glass p-6 md:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{t.status}</h2>
            <button onClick={() => status.refetch()} disabled={status.isFetching} className="btn-ghost flex items-center gap-2 rounded-xl px-4 py-2 text-sm">
              <RefreshCw className={`h-4 w-4 ${status.isFetching ? "animate-spin" : ""}`} /> {t.refresh}
            </button>
          </div>
          {status.data && !status.data.ok && <p className="mt-4 text-sm text-destructive">{status.data.error} <span className="opacity-70">({status.data.code})</span></p>}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={Activity} label="Status" value={s ? (s.online ? "ONLINE" : "OFFLINE") : "—"} accent={s?.online ? "text-success" : "text-destructive"} />
            <Stat icon={User} label="Bot Username" value={s?.username ?? "—"} />
            <Stat icon={Server} label="Servers" value={s ? s.guilds.toLocaleString() : "—"} />
            <Stat icon={Timer} label="Uptime" value={s ? formatUptime(s.uptimeSeconds) : "—"} />
          </div>
        </div>
      </section>
    </Shell>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: typeof Activity; label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon className="h-4 w-4 text-gold" /> {label}
      </div>
      <p className={`mt-2 truncate font-mono text-xl font-bold ${accent ?? ""}`}>{value}</p>
    </div>
  );
}
