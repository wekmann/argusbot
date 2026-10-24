import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BarChart3, Hash, MessageSquare, Radio, ScrollText, ShieldAlert, ShieldCheck, Sparkles, Users } from "lucide-react";
import type { ReactNode } from "react";
import { ActionBadge, actionTone } from "@/components/action";
import { HourBars, Sparkline } from "@/components/charts";
import { CountUp, Skeleton, Spotlight, timeAgo } from "@/components/motion";
import { getGuildOverview } from "@/lib/argus.functions";

export const Route = createFileRoute("/dashboard/$guildId/")({
  component: Overview,
});

function Overview() {
  const { guildId } = Route.useParams();
  const q = useQuery({
    queryKey: ["overview", guildId],
    queryFn: () => getGuildOverview({ data: { guildId } }),
    staleTime: 20_000,
    refetchInterval: 60_000,
    retry: 1,
  });
  const d = q.data;

  if (q.error)
    return (
      <div className="glass p-8 text-center">
        <p className="font-semibold text-destructive">Couldn't load the overview</p>
        <p className="mt-1 text-sm text-muted-foreground">{q.error.message}</p>
        <button onClick={() => q.refetch()} className="btn-ghost mt-5 rounded-xl px-5 py-2 text-sm">Try again</button>
      </div>
    );

  const memberSeries = d?.members.map((m) => m.count) ?? [];
  const delta = memberSeries.length > 1 ? memberSeries[memberSeries.length - 1] - memberSeries[0] : 0;
  const peak = d ? d.messagesByHour.reduce((a, b) => (b.count > a.count ? b : a), d.messagesByHour[0]) : null;
  const maxType = Math.max(1, ...(d?.actionsByType.map((a) => a.count) ?? [1]));

  return (
    <div className="space-y-6">
      {/* ---- top stats ---- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Members" loading={!d}
          value={<CountUp value={d?.guild.memberCount} />}
          foot={<span className={delta >= 0 ? "text-success" : "text-destructive"}>{delta >= 0 ? "+" : ""}{delta.toLocaleString()} <span className="text-muted-foreground">in 30 days</span></span>}
          extra={<Sparkline data={memberSeries} className="mt-3 h-10 w-full" />} />
        <StatCard icon={MessageSquare} label="Messages (24 h)" loading={!d}
          value={<CountUp value={d?.messages24h} />}
          foot={peak && peak.count > 0 ? <span className="text-muted-foreground">Peak at <span className="font-mono text-foreground">{String(peak.hour).padStart(2, "0")}:00</span></span> : <span className="text-muted-foreground">No activity yet</span>} />
        <StatCard icon={ShieldAlert} label="Mod actions (7 d)" loading={!d}
          value={<CountUp value={d?.actions7d} />}
          foot={<span className="text-muted-foreground">{d?.actionsTotal.toLocaleString() ?? "—"} all time</span>} />
        <StatCard icon={ShieldCheck} label="Auto-Moderation" loading={!d}
          value={d ? <span className={d.automod.enabled ? "text-success" : "text-muted-foreground"}>{d.automod.enabled ? "ON" : "OFF"}</span> : null}
          foot={<span className="text-muted-foreground">{d ? `${d.automod.words} word${d.automod.words === 1 ? "" : "s"} · ${d.automod.punishment}` : "—"}</span>} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        {/* ---- activity ---- */}
        <section className="glass p-5">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Message activity · last 24 h</h3>
            <Link to="/dashboard/$guildId/stats" params={{ guildId }} className="flex items-center gap-1 text-xs text-gold hover:underline">Details <ArrowRight className="h-3 w-3" /></Link>
          </div>
          {d ? <HourBars data={d.messagesByHour} /> : <Skeleton className="h-52 w-full" />}
        </section>

        {/* ---- action breakdown ---- */}
        <section className="glass p-5">
          <h3 className="mb-5 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Actions · last 30 d</h3>
          {!d && <Skeleton className="h-40 w-full" />}
          {d && d.actionsByType.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Nothing to show — a quiet month.</p>}
          <ul className="space-y-4">
            {d?.actionsByType.slice(0, 6).map((a, i) => (
              <li key={a.action}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="truncate pr-3">{a.action}</span>
                  <span className="font-mono font-bold tabular-nums">{a.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className={`bar-fill h-full rounded-full ${actionTone(a.action).bar}`} style={{ width: `${(a.count / maxType) * 100}%`, ["--d" as string]: `${i * 90}ms` } as React.CSSProperties} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        {/* ---- recent ---- */}
        <section className="glass overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Recent moderation</h3>
            <Link to="/dashboard/$guildId/logs" params={{ guildId }} className="flex items-center gap-1 text-xs text-gold hover:underline">All logs <ArrowRight className="h-3 w-3" /></Link>
          </div>
          {!d && <div className="space-y-3 px-5 pb-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>}
          {d && d.recent.length === 0 && <p className="px-5 pb-8 text-center text-sm text-muted-foreground">No moderation actions yet.</p>}
          <ul className="divide-y divide-border/50">
            {d?.recent.map((l, i) => (
              <li key={l.id} className="row-in flex items-center gap-4 px-5 py-3 transition hover:bg-accent/30" style={{ ["--d" as string]: `${i * 60}ms` } as React.CSSProperties}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-sm text-gold">{l.target.replace(/^@/, "")[0]?.toUpperCase() ?? "?"}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm"><span className="font-semibold">{l.target}</span> <span className="text-muted-foreground">by {l.moderator}</span></p>
                  <p className="truncate text-xs text-muted-foreground">{l.reason ?? "No reason given"}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <ActionBadge action={l.action} />
                  <span className="text-[11px] text-muted-foreground" title={new Date(l.createdAt).toLocaleString()}>{timeAgo(l.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          {/* ---- server facts ---- */}
          <section className="glass p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Server</h3>
            <dl className="space-y-3 text-sm">
              <Fact icon={Hash} label="Channels" value={d?.guild.channelCount} />
              <Fact icon={ShieldCheck} label="Roles" value={d?.guild.roleCount} />
              <Fact icon={Radio} label="Bot latency" value={d?.botPing != null ? `${d.botPing} ms` : d ? "—" : undefined} />
            </dl>
          </section>

          {/* ---- quick actions ---- */}
          <section className="space-y-3">
            <Quick to="/dashboard/$guildId/aibuild" guildId={guildId} icon={Sparkles} title="AI Server Builder" text="Design roles & channels from a prompt." />
            <Quick to="/dashboard/$guildId/automod" guildId={guildId} icon={ShieldCheck} title="Auto-Moderation" text="Manage banned words and punishments." />
            <Quick to="/dashboard/$guildId/logs" guildId={guildId} icon={ScrollText} title="Moderation logs" text="Search the full action history." />
            <Quick to="/dashboard/$guildId/stats" guildId={guildId} icon={BarChart3} title="Statistics" text="Activity and member growth charts." />
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, foot, extra, loading }: { icon: typeof Users; label: string; value: ReactNode; foot?: ReactNode; extra?: ReactNode; loading?: boolean }) {
  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-soft"><Icon className="h-4 w-4 text-gold" /></span>
      </div>
      {loading ? (
        <>
          <Skeleton className="mt-3 h-9 w-24" />
          <Skeleton className="mt-3 h-4 w-32" />
        </>
      ) : (
        <>
          <p className="mt-3 font-mono text-3xl font-bold tabular-nums">{value}</p>
          <p className="mt-1 text-xs">{foot}</p>
          {extra}
        </>
      )}
    </div>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" /> {label}</dt>
      <dd className="font-mono font-bold tabular-nums">{value ?? <Skeleton className="h-4 w-12" />}</dd>
    </div>
  );
}

function Quick({ to, guildId, icon: Icon, title, text }: { to: "/dashboard/$guildId/aibuild" | "/dashboard/$guildId/automod" | "/dashboard/$guildId/logs" | "/dashboard/$guildId/stats"; guildId: string; icon: typeof Users; title: string; text: string }) {
  return (
    <Spotlight as={Link} to={to} params={{ guildId }} className="group flex items-center gap-4 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-soft ring-1 ring-gold/20"><Icon className="h-5 w-5 text-gold" /></span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-tight">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{text}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-gold" />
    </Spotlight>
  );
}
