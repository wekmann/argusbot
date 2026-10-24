import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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

const tip = { contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" } };

function Stats() {
  const { guildId } = Route.useParams();
  const q = useQuery({ queryKey: ["stats", guildId], queryFn: () => getGuildStats({ data: { guildId } }), retry: false });
  const hours = q.data?.messagesByHour.map((h) => ({ ...h, label: `${String(h.hour).padStart(2, "0")}:00` })) ?? [];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t.stats}</h2>
        <button onClick={() => q.refetch()} className="btn-ghost flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm">
          <RefreshCw className={`h-4 w-4 ${q.isFetching ? "animate-spin" : ""}`} /> {t.refresh}
        </button>
      </div>
      {q.error && <p className="text-sm text-destructive">Couldn't load statistics from the bot: {q.error.message}</p>}
      <div className="glass p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t.messagesByHour}</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={hours}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
              <Tooltip {...tip} cursor={{ fill: "var(--gold-soft)" }} />
              <Bar dataKey="count" name="Messages" fill="var(--gold)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="glass p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t.memberCount}</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <AreaChart data={q.data?.members ?? []}>
              <defs>
                <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} domain={["auto", "auto"]} />
              <Tooltip {...tip} />
              <Area type="monotone" dataKey="count" name="Members" stroke="var(--gold)" strokeWidth={2} fill="url(#gold)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
