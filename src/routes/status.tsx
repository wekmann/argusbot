import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  Activity, Boxes, Clock, Cpu, Gauge, Hash, MemoryStick, RefreshCw, Server, Terminal, Users, Wifi,
} from "lucide-react";
import { Shell } from "@/components/Shell";
import { CountUp, Reveal, Skeleton, Spotlight } from "@/components/motion";
import { getBotStatus } from "@/lib/argus.functions";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "Live Status — Argus" },
      { name: "description", content: "Real-time status of the Argus Discord moderation bot: uptime, latency, servers and more." },
      { property: "og:title", content: "Live Status — Argus" },
      { property: "og:description", content: "Real-time status of the Argus Discord moderation bot." },
    ],
  }),
  component: StatusPage,
});

function formatUptime(s: number) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  return d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m ${sec}s` : `${m}m ${sec}s`;
}

function pingTone(ms: number) {
  return ms < 150 ? "text-success" : ms < 400 ? "text-gold" : "text-destructive";
}

function StatusPage() {
  const q = useQuery({
    queryKey: ["bot-status", "details"],
    queryFn: () => getBotStatus(),
    refetchInterval: 15_000,
  });
  const s = q.data?.ok ? q.data.status : null;
  const failed = q.data && !q.data.ok ? q.data : null;
  const dash = "—";

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-5 py-12">
        <Link to="/" className="text-sm text-muted-foreground hover:text-gold">← Home</Link>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={s?.avatar || "/favicon.png"} alt="Argus" width={64} height={64} className="h-16 w-16 rounded-full ring-2 ring-gold shadow-[0_0_30px_-4px_oklch(0.8_0.15_75/0.6)]" />
            <div>
              <h1 className="text-4xl font-black text-gold-gradient">{t.status}</h1>
              <p className="mt-1 font-mono text-sm text-muted-foreground">{s?.username ?? dash}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-bold ${
                s ? (s.online ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/10 text-destructive") : "border-border text-muted-foreground"
              }`}
            >
              <span className={`live-dot h-2.5 w-2.5 rounded-full ${s ? (s.online ? "bg-success" : "bg-destructive") : "bg-muted-foreground"}`} />
              {s ? (s.online ? "ONLINE" : "OFFLINE") : q.isLoading ? "CHECKING…" : "UNKNOWN"}
            </span>
            <button onClick={() => q.refetch()} disabled={q.isFetching} className="btn-ghost flex items-center gap-2 rounded-xl px-4 py-2 text-sm">
              <RefreshCw className={`h-4 w-4 ${q.isFetching ? "animate-spin" : ""}`} /> {t.refresh}
            </button>
          </div>
        </div>

        {failed && (
          <div className="mt-6 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
            {failed.error} <span className="font-mono text-xs opacity-70">({failed.code})</span>
          </div>
        )}

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Overview</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card icon={Activity} label="Status" value={s ? (s.online ? "Online" : "Offline") : dash} accent={s?.online ? "text-success" : s ? "text-destructive" : ""} />
            <Card icon={Clock} label="Uptime" value={s ? formatUptime(s.uptimeSeconds) : dash} />
            <Card icon={Wifi} label="Latency" value={s?.ping != null ? <><CountUp value={s.ping} /> ms</> : dash} accent={s?.ping != null ? pingTone(s.ping) : ""} bar={s?.ping != null ? Math.min(1, s.ping / 600) : undefined} loading={q.isLoading} />
            <Card icon={Server} label="Servers" value={s ? <CountUp value={s.guilds} /> : dash} loading={q.isLoading} />
            <Card icon={Users} label="Members (all servers)" value={s?.users != null ? <CountUp value={s.users} /> : dash} loading={q.isLoading} />
            <Card icon={Hash} label="Channels cached" value={s?.channels != null ? <CountUp value={s.channels} /> : dash} loading={q.isLoading} />
            <Card icon={Terminal} label="Commands" value={s?.commands != null ? String(s.commands) : dash} />
            <Card icon={Gauge} label="Command prefix" value={s?.prefix ?? dash} />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">System</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card icon={MemoryStick} label="Memory" value={s?.memoryMb != null ? <><CountUp value={s.memoryMb} /> MB</> : dash} bar={s?.memoryMb != null ? Math.min(1, s.memoryMb / 512) : undefined} loading={q.isLoading} />
            <Card icon={Cpu} label="Node.js" value={s?.nodeVersion ?? dash} />
            <Card icon={Boxes} label="discord.js" value={s?.discordJsVersion ? `v${s.discordJsVersion}` : dash} />
            <Card icon={Clock} label="Online since" value={s?.startedAt ? new Date(s.startedAt).toLocaleString() : dash} small />
          </div>
        </section>

        <p className="mt-8 text-xs text-muted-foreground">
          Refreshes automatically every 15 seconds
          {s?.checkedAt && <> · last checked {new Date(s.checkedAt).toLocaleTimeString()}</>}
          {s && s.ping === undefined && " · update the bot to see latency, memory and the other details"}
        </p>
      </div>
    </Shell>
  );
}

function Card({
  icon: Icon, label, value, accent, small, bar, loading,
}: { icon: typeof Activity; label: string; value: ReactNode; accent?: string; small?: boolean; bar?: number; loading?: boolean }) {
  return (
    <Reveal>
      <Spotlight className="p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <Icon className="h-4 w-4 text-gold" /> {label}
        </div>
        {loading ? (
          <Skeleton className="mt-3 h-7 w-24" />
        ) : (
          <p className={`mt-2 truncate font-mono font-bold tabular-nums ${small ? "text-base" : "text-xl"} ${accent ?? ""}`}>{value}</p>
        )}
        {bar != null && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="bar-fill h-full rounded-full bg-gradient-to-r from-gold to-warning" style={{ width: `${Math.max(3, bar * 100)}%` }} />
          </div>
        )}
      </Spotlight>
    </Reveal>
  );
}
