import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
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
  return (
    <div className="glass overflow-hidden">
      <div className="flex items-center justify-between p-5">
        <h2 className="text-xl font-bold">{t.logs}</h2>
        <button onClick={() => q.refetch()} className="btn-ghost flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm">
          <RefreshCw className={`h-4 w-4 ${q.isFetching ? "animate-spin" : ""}`} /> {t.refresh}
        </button>
      </div>
      {q.error && <p className="px-5 pb-5 text-sm text-destructive">{q.error.message}</p>}
      {q.data?.length === 0 && <p className="px-5 pb-5 text-sm text-muted-foreground">No moderation actions yet.</p>}
      {!!q.data?.length && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-y border-border bg-secondary/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr><th className="px-5 py-3">Action</th><th className="px-5 py-3">Target</th><th className="px-5 py-3">Moderator</th><th className="px-5 py-3">Reason</th><th className="px-5 py-3">Date</th></tr>
            </thead>
            <tbody>
              {q.data.map((l) => (
                <tr key={l.id} className="border-b border-border/50">
                  <td className="px-5 py-3"><span className="rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-bold uppercase text-gold">{l.action}</span></td>
                  <td className="px-5 py-3">{l.target}</td>
                  <td className="px-5 py-3">{l.moderator}</td>
                  <td className="px-5 py-3 text-muted-foreground">{l.reason ?? "—"}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
