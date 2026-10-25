import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gavel, UserMinus, VolumeX, X } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/motion";
import { SaveBar } from "@/components/SaveBar";
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

const PUNISHMENTS = [
  { id: "mute", label: "Mute", hint: "10-minute timeout", icon: VolumeX },
  { id: "kick", label: "Kick", hint: "Remove from server", icon: UserMinus },
  { id: "ban", label: "Ban", hint: "Permanent ban", icon: Gavel },
] as const satisfies readonly { id: Automod["punishment"]; label: string; hint: string; icon: typeof Gavel }[];

const EMPTY: Automod = { enabled: false, bannedWords: [], punishment: "mute" };

function AutomodPage() {
  const { guildId } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["automod", guildId], queryFn: () => getAutomod({ data: { guildId } }), retry: false });
  const [cfg, setCfg] = useState<Automod>(EMPTY);
  const [word, setWord] = useState("");
  useEffect(() => { if (q.data) setCfg(q.data); }, [q.data]);

  const saved = q.data ?? EMPTY;
  const dirty = useMemo(() => JSON.stringify(cfg) !== JSON.stringify(saved), [cfg, saved]);

  const save = useMutation({
    mutationFn: () => saveAutomod({ data: { guildId, automod: cfg } }),
    onSuccess: (res) => {
      toast.success("Auto-moderation saved");
      qc.setQueryData(["automod", guildId], res);
      qc.invalidateQueries({ queryKey: ["overview", guildId] });
    },
    onError: (e) => toast.error(e.message),
  });

  const addWords = () => {
    const incoming = word.split(/[,\n]/).map((w) => w.trim().toLowerCase().slice(0, 50)).filter(Boolean);
    if (incoming.length) {
      const next = [...cfg.bannedWords];
      for (const w of incoming) if (!next.includes(w) && next.length < 200) next.push(w);
      setCfg({ ...cfg, bannedWords: next });
    }
    setWord("");
  };
  const idx = PUNISHMENTS.findIndex((p) => p.id === cfg.punishment);

  return (
    <div className="space-y-6">
      {q.error && <p className="text-sm text-destructive">Couldn't load settings from the bot: {q.error.message}</p>}

      <section className="glass flex items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-xl font-bold">{t.automod}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.automodHint}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 transition ${cfg.enabled ? "bg-success/15 text-success ring-success/30" : "bg-secondary text-muted-foreground ring-border"}`}>{cfg.enabled ? "ACTIVE" : "OFF"}</span>
          <Switch checked={cfg.enabled} onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })} aria-label="Toggle auto-moderation" />
        </div>
      </section>

      <section className={`glass p-6 transition-opacity ${cfg.enabled ? "" : "opacity-60"}`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t.bannedWords}</h3>
          <span className="font-mono text-xs text-muted-foreground">{cfg.bannedWords.length}/200</span>
        </div>
        <div className="flex gap-2">
          <input
            value={word}
            maxLength={200}
            onChange={(e) => setWord(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addWords(); } }}
            placeholder="Type a word and press Enter (separate several with commas)"
            className="flex-1 rounded-xl border border-border bg-input/30 px-4 py-2.5 text-sm outline-none transition focus:border-gold"
          />
          <button onClick={addWords} className="btn-ghost rounded-xl px-5 py-2 text-sm">Add</button>
        </div>
        <div className="mt-4 flex min-h-10 flex-wrap gap-2">
          {q.isLoading && <Skeleton className="h-8 w-48" />}
          {!q.isLoading && cfg.bannedWords.length === 0 && <p className="text-sm text-muted-foreground">No banned words yet.</p>}
          {cfg.bannedWords.map((w) => (
            <span key={w} className="animate-pop-in flex items-center gap-1.5 rounded-full bg-gold-soft py-1 pl-3.5 pr-2 text-sm text-gold ring-1 ring-gold/20">
              {w}
              <button aria-label={`Remove ${w}`} className="rounded-full p-0.5 transition hover:bg-gold/20" onClick={() => setCfg({ ...cfg, bannedWords: cfg.bannedWords.filter((x) => x !== w) })}>
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
        {cfg.bannedWords.length > 0 && (
          <button onClick={() => setCfg({ ...cfg, bannedWords: [] })} className="mt-4 text-xs text-muted-foreground transition hover:text-destructive">Clear all</button>
        )}
      </section>

      <section className={`glass p-6 transition-opacity ${cfg.enabled ? "" : "opacity-60"}`}>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t.punishment}</h3>
        <div className="relative grid grid-cols-3 gap-1 rounded-2xl border border-border bg-secondary/30 p-1">
          <span
            aria-hidden
            className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-xl bg-gold-soft ring-1 ring-gold/40 transition-transform duration-300 [transition-timing-function:var(--ease-out-expo)]"
            style={{ transform: `translateX(calc(${Math.max(idx, 0)} * (100% + 0.25rem)))` }}
          />
          {PUNISHMENTS.map((p) => (
            <button key={p.id} onClick={() => setCfg({ ...cfg, punishment: p.id })} className={`relative z-10 flex flex-col items-center gap-1 rounded-xl px-3 py-3.5 transition ${cfg.punishment === p.id ? "text-gold" : "text-muted-foreground hover:text-foreground"}`}>
              <p.icon className="h-5 w-5" />
              <span className="text-sm font-bold">{p.label}</span>
              <span className="hidden text-[11px] opacity-70 sm:block">{p.hint}</span>
            </button>
          ))}
        </div>
      </section>

      <SaveBar dirty={dirty} saving={save.isPending} onSave={() => save.mutate()} onReset={() => setCfg(saved)} />
    </div>
  );
}