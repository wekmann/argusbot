import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { getAutomod, saveAutomod, type Automod } from "@/lib/argus.functions";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard/$guildId/automod")({
  head: () => ({
    meta: [
      { title: "Auto-Moderation — Argus" },
      { name: "description", content: "Configure banned words and automatic punishments for your Discord server." },
      { property: "og:title", content: "Auto-Moderation — Argus" },
      { property: "og:description", content: "Configure banned words and automatic punishments." },
    ],
  }),
  component: AutomodPage,
});

const PUNISHMENTS: Automod["punishment"][] = ["mute", "kick", "ban"];

function AutomodPage() {
  const { guildId } = Route.useParams();
  const q = useQuery({ queryKey: ["automod", guildId], queryFn: () => getAutomod({ data: { guildId } }), retry: false });
  const [cfg, setCfg] = useState<Automod>({ enabled: false, bannedWords: [], punishment: "mute" });
  const [word, setWord] = useState("");
  useEffect(() => { if (q.data) setCfg(q.data); }, [q.data]);
  const save = useMutation({
    mutationFn: () => saveAutomod({ data: { guildId, automod: cfg } }),
    onSuccess: () => toast.success("Auto-moderation saved"),
    onError: (e) => toast.error(e.message),
  });
  const addWord = () => {
    const w = word.trim().toLowerCase();
    if (w && !cfg.bannedWords.includes(w)) setCfg({ ...cfg, bannedWords: [...cfg.bannedWords, w] });
    setWord("");
  };

  return (
    <div className="glass space-y-8 p-6">
      {q.error && <p className="text-sm text-destructive">Couldn't load settings from the bot: {q.error.message}</p>}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{t.automod}</h2>
          <p className="text-sm text-muted-foreground">{t.automodHint}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold ${cfg.enabled ? "text-gold" : "text-muted-foreground"}`}>{cfg.enabled ? "ON" : "OFF"}</span>
          <Switch checked={cfg.enabled} onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })} />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t.bannedWords}</h3>
        <div className="flex gap-2">
          <input
            value={word}
            maxLength={50}
            onChange={(e) => setWord(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addWord(); } }}
            placeholder="Type a word and press Enter"
            className="flex-1 rounded-xl border border-border bg-input/40 px-4 py-2 text-sm outline-none focus:border-gold"
          />
          <button onClick={addWord} className="btn-ghost rounded-xl px-4 py-2 text-sm">Add</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {cfg.bannedWords.length === 0 && <p className="text-sm text-muted-foreground">No banned words yet.</p>}
          {cfg.bannedWords.map((w) => (
            <span key={w} className="flex items-center gap-1 rounded-full bg-gold-soft px-3 py-1 text-sm text-gold">
              {w}
              <button aria-label={`Remove ${w}`} onClick={() => setCfg({ ...cfg, bannedWords: cfg.bannedWords.filter((x) => x !== w) })}>
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t.punishment}</h3>
        <div className="inline-flex gap-1 rounded-xl border border-border p-1">
          {PUNISHMENTS.map((p) => (
            <button
              key={p}
              onClick={() => setCfg({ ...cfg, punishment: p })}
              className={`rounded-lg px-5 py-2 text-sm font-semibold capitalize ${cfg.punishment === p ? "bg-gold-soft text-gold" : "text-muted-foreground hover:text-foreground"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-gold rounded-xl px-6 py-2.5 text-sm font-bold disabled:opacity-60">
        {save.isPending ? "Saving…" : t.save}
      </button>
    </div>
  );
}
