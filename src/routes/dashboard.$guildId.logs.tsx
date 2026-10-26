import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { ActionBadge, actionTone } from "@/components/action";
import { Skeleton, timeAgo } from "@/components/motion";
import { getGuildLogs } from "@/lib/argus.functions";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard/$guildId/logs")({
  head: () => ({
    meta: [
      { title: "Moderation Logs — Argus" },
      { name: "description", content: "History of moderation actions on your Discord server." },
      { property: "og:title", content: "Moderation Logs — Argus" },
      { property: "og:description", content: "History of moderation actions on your Discord server." },
    ],
  }),
  component: Logs,
});

function Logs() {
  const { guildId } = Route.useParams();
  const q = useQuery({ queryKey: ["logs", guildId], queryFn: () => getGuildLogs({ data: { guildId } }) });
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");

  const types = useMemo(() => {
    const m = new Map<string, number>([["automod", 0], ["kick", 0], ["ban", 0], ["purge", 0]]);
    for (const l of q.data ?? []) {
      const k = actionTone(l.action).key;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [q.data]);

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (q.data ?? []).filter(
      (l) =>
        (type === "all" || actionTone(l.action).key === type) &&
        (!needle || `${l.action} ${l.target} ${l.moderator} ${l.reason ?? ""}`.toLowerCase().includes(needle)),
    );
  }, [q.data, search, type]);

  const exportCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = ["action,target,moderator,reason,date", ...rows.map((l) => [l.action, l.target, l.moderator, l.reason ?? "", l.createdAt].map(esc).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "argus-logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="text-xl font-bold">{t.logs}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{q.data ? `${rows.length} of ${q.data.length} actions` : "Loading…"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="w-44 rounded-xl border border-border bg-input/30 py-2 pl-9 pr-3 text-sm outline-none transition focus:w-56 focus:border-gold" />
          </label>
          <button onClick={exportCsv} disabled={!rows.length} className="btn-ghost flex items-center gap-2 rounded-xl px-3 py-2 text-sm" title="Export visible rows as CSV">
            <Download className="h-4 w-4" /> CSV
          </button>
          <button onClick={() => q.refetch()} className="btn-ghost flex items-center gap-2 rounded-xl px-3 py-2 text-sm">
            <RefreshCw className={`h-4 w-4 ${q.isFetching ? "animate-spin" : ""}`} /> {t.refresh}
          </button>
        </div>
      </div>

      {types.length > 0 && (
        <div className="flex flex-wrap gap-2 px-5 pb-4">
          {[["all", q.data?.length ?? 0] as const, ...types].map(([k, n]) => (
            <button
              key={k}
              onClick={() => setType(k)}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold capitalize transition ${type === k ? "bg-gold text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              {k} <span className="ml-1 opacity-70">{n}</span>
            </button>
          ))}
        </div>
      )}

      {q.error && <p className="px-5 pb-5 text-sm text-destructive">{q.error.message}</p>}
      {q.isLoading && <div className="space-y-2 px-5 pb-5">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-11 w-full" />)}</div>}
      {q.data && rows.length === 0 && (
        <div className="px-5 pb-12 pt-6 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-gold/60" />
          <p className="mt-3 text-sm text-muted-foreground">{q.data.length === 0 ? "No moderation actions yet." : "No actions match your filters."}</p>
        </div>
      )}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:min-w-[640px] sm:text-sm">
            <thead className="border-y border-border bg-secondary/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr><th className="px-2.5 py-3 sm:px-5">Action</th><th className="px-2.5 py-3 sm:px-5">Target</th><th className="px-2.5 py-3 sm:px-5">Moderator</th><th className="px-2.5 py-3 sm:px-5">Reason</th><th className="px-2.5 py-3 sm:px-5">When</th></tr>
            </thead>
            <tbody>
              {rows.map((l, i) => (
                <tr key={l.id} className="row-in border-b border-border/40 transition hover:bg-accent/30" style={{ animationDelay: `${Math.min(i, 14) * 30}ms` }}>
                  <td className="px-2.5 py-3 sm:px-5"><ActionBadge action={l.action} /></td>
                  <td className="px-2.5 py-3 sm:px-5 font-medium">{l.target}</td>
                  <td className="px-2.5 py-3 sm:px-5 text-muted-foreground">{l.moderator}</td>
                  <td className="max-w-[9rem] truncate sm:max-w-xs px-2.5 py-3 sm:px-5 text-muted-foreground" title={l.reason ?? ""}>{l.reason ?? "—"}</td>
                  <td className="whitespace-nowrap px-2.5 py-3 sm:px-5 text-xs text-muted-foreground" title={new Date(l.createdAt).toLocaleString()}>{timeAgo(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
