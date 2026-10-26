import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, MessageSquare, RefreshCw, TrendingUp, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CountUp, Skeleton } from "@/components/motion";
import { getGuildStats } from "@/lib/argus.functions";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard/$guildId/stats")({
  head: () => ({
    meta: [
      { title: "Server Statistics — Argus" },
      { name: "description", content: "Daily message activity and member growth for your Discord server." },
      { property: "og:title", content: "Server Statistics — Argus" },
      { property: "og:description", content: "Daily message activity and member growth." },
    ],
  }),
  component: Stats,
});

const tip = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)", boxShadow: "0 12px 30px -10px rgba(0,0,0,.7)", fontSize: 12 },
  labelStyle: { color: "var(--muted-foreground)", marginBottom: 2 },
  itemStyle: { color: "var(--gold)", fontWeight: 700 },
};

function Stats() {
  const { guildId } = Route.useParams();
  const q = useQuery({ queryKey: ["stats", guildId], queryFn: () => getGuildStats({ data: { guildId } }), retry: false, staleTime: 30_000 });
  const hours = q.data?.messagesByHour.map((h) => ({ ...h, label: `${String(h.hour).padStart(2, "0")}:00` })) ?? [];
  const members = q.data?.members ?? [];

  const total = hours.reduce((s, h) => s + h.count, 0);
  const peak = hours.length ? hours.reduce((a, b) => (b.count > a.count ? b : a)) : null;
  const delta = members.length > 1 ? members[members.length - 1].count - members[0].count : 0;
  const shortDate = (d: string) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t.stats}</h2>
        <button onClick={() => q.refetch()} className="btn-ghost flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm">
          <RefreshCw className={`h-4 w-4 ${q.isFetching ? "animate-spin" : ""}`} /> {t.refresh}
        </button>
      </div>
      {q.error && <p className="text-sm text-destructive">Couldn't load statistics from the bot: {q.error.message}</p>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Mini icon={MessageSquare} label="Messages (24 h)" loading={q.isLoading} value={<CountUp value={total} />} />
        <Mini icon={Clock} label="Busiest hour" loading={q.isLoading} value={peak && peak.count > 0 ? peak.label : "—"} />
        <Mini icon={TrendingUp} label="Average / hour" loading={q.isLoading} value={<CountUp value={hours.length ? total / hours.length : 0} decimals={1} />} />
        <Mini icon={Users} label="Members (30 d)" loading={q.isLoading} value={<span className={delta >= 0 ? "text-success" : "text-destructive"}>{delta >= 0 ? "+" : ""}{delta.toLocaleString()}</span>} />
      </div>

      <div className="glass p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t.messagesByHour}</h3>
        <div className="h-72">
          {q.isLoading ? <Skeleton className="h-full w-full" /> : (
            <ResponsiveContainer>
              <BarChart data={hours} margin={{ left: -18, right: 4 }}>
                <defs>
                  <linearGradient id="bars" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--gold)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--gold)" stopOpacity={0.25} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} interval={2} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip {...tip} cursor={{ fill: "var(--gold-soft)" }} />
                <Bar dataKey="count" name="Messages" fill="url(#bars)" radius={[6, 6, 0, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="glass p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t.memberCount}</h3>
        <div className="h-72">
          {q.isLoading ? <Skeleton className="h-full w-full" /> : (
            <ResponsiveContainer>
              <AreaChart data={members} margin={{ left: -10, right: 8 }}>
                <defs>
                  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={shortDate} minTickGap={32} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                <Tooltip {...tip} labelFormatter={(l) => shortDate(String(l))} />
                <Area type="monotone" dataKey="count" name="Members" stroke="var(--gold)" strokeWidth={2.5} fill="url(#gold)" animationDuration={1100} dot={false} activeDot={{ r: 5, fill: "var(--gold)", stroke: "var(--background)", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function Mini({ icon: Icon, label, value, loading }: { icon: typeof Users; label: string; value: ReactNode; loading?: boolean }) {
  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between gap-1 text-[11px] uppercase tracking-wider text-muted-foreground sm:text-xs sm:tracking-widest">
        {label}
        <Icon className="h-4 w-4 text-gold" />
      </div>
      {loading ? <Skeleton className="mt-3 h-8 w-20" /> : <p className="mt-3 font-mono text-2xl font-bold tabular-nums">{value}</p>}
    </div>
  );
}
