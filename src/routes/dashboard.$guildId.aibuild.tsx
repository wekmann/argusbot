import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AlertTriangle, Hammer, Hash, Megaphone, MessagesSquare, Plus, Sparkles, UserCog, Volume2 } from "lucide-react";
import { applyArchitecture, generateArchitecture, getApplyPreview, getApplyProgress, type BuildMode } from "@/lib/argus.functions";
import type { Architecture } from "@/lib/architecture";
import { Skeleton } from "@/components/motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard/$guildId/aibuild")({
  head: () => ({
    meta: [
      { title: "AI Server Builder — Argus" },
      { name: "description", content: "Generate a Discord server structure with AI." },
      { property: "og:title", content: "AI Server Builder — Argus" },
      { property: "og:description", content: "Generate roles and channels for your Discord server with AI." },
    ],
  }),
  component: AiBuild,
});

const MAX = 1000;
const MODES: { id: BuildMode; title: string; hint: string; icon: typeof Hammer; destructive: boolean; confirm: string }[] = [
  {
    id: "wipe",
    title: "Rebuild from scratch",
    hint: "Deletes all channels, categories and roles, then builds the new structure.",
    icon: Hammer,
    destructive: true,
    confirm: "Rebuild the whole server?",
  },
  {
    id: "add",
    title: "Add to current server",
    hint: "Keeps everything you have and only adds the new roles and channels.",
    icon: Plus,
    destructive: false,
    confirm: "Add this structure?",
  },
  {
    id: "roles",
    title: "Replace roles only",
    hint: "Deletes the current roles and creates the new ones. Channels are left untouched.",
    icon: UserCog,
    destructive: true,
    confirm: "Replace all roles?",
  },
];
const EXAMPLES = [
  "A Polish gaming community for Valorant and CS2 with tournaments, clips and voice lobbies",
  "A study group for university students with subject channels and quiet voice rooms",
  "A small art community with commissions, critique and a showcase gallery",
];
const icons = { text: Hash, voice: Volume2, announcement: Megaphone, forum: MessagesSquare };

function AiBuild() {
  const { guildId } = Route.useParams();
  const [prompt, setPrompt] = useState("");
  const [view, setView] = useState<"visual" | "json">("visual");
  const gen = useMutation({ mutationFn: (p: string) => generateArchitecture({ data: { guildId, prompt: p } }) });
  const [mode, setMode] = useState<BuildMode>("wipe");
  const [understood, setUnderstood] = useState(false);
  const apply = useMutation({
    mutationFn: (a: Architecture) => applyArchitecture({ data: { guildId, architecture: a, mode } }),
  });
  const arch = gen.data;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const modeInfo = MODES.find((m) => m.id === mode)!;

  useEffect(() => setUnderstood(false), [mode, confirmOpen]);

  const preview = useQuery({
    queryKey: ["apply-preview", guildId, mode],
    queryFn: () => getApplyPreview({ data: { guildId, mode } }),
    enabled: confirmOpen,
    staleTime: 0,
    gcTime: 0,
  });

  const buildId = apply.data?.buildId;
  const progress = useQuery({
    queryKey: ["apply-progress", guildId, buildId],
    queryFn: () => getApplyProgress({ data: { guildId, buildId: buildId! } }),
    enabled: buildId != null,
    refetchInterval: (q) => (["done", "failed"].includes(q.state.data?.status ?? "") ? false : 1500),
  });
  const prog = progress.data?.progress;
  const finished = progress.data?.status === "done" || progress.data?.status === "failed";
  const building = apply.isPending || (buildId != null && !finished);
  const pct = prog && prog.total > 0 ? Math.min(100, Math.round((prog.done / prog.total) * 100)) : 0;
  const PHASES: Record<string, string> = { starting: "Starting…", cleaning: "Deleting the old structure…", roles: "Creating roles…", channels: "Creating channels…", finished: "Finished" };
  const p = preview.data;
  const willDeleteAny = p ? p.willDelete.channels + p.willDelete.categories + p.willDelete.roles : 0;
  const blocked = !!p && (!p.botCanManage || p.busy);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="glass p-6">
        <h2 className="text-xl font-bold">Describe your server</h2>
        <textarea
          value={prompt}
          maxLength={MAX}
          onChange={(e) => setPrompt(e.target.value.slice(0, MAX))}
          placeholder="e.g. A Polish gaming community for Valorant and CS2 with tournaments, clips and voice lobbies"
          className="mt-4 h-48 w-full resize-none rounded-xl border border-input bg-background/60 p-4 text-sm outline-none transition focus:border-gold focus:shadow-[0_0_0_3px_oklch(0.8_0.15_75/0.15)]"
        />
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => setPrompt(ex)} className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs text-muted-foreground transition hover:border-gold/60 hover:text-gold">
                Example {i + 1}
              </button>
            ))}
          </div>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">{prompt.length}/{MAX}</span>
        </div>
        <button
          onClick={() => gen.mutate(prompt)}
          disabled={gen.isPending || prompt.trim().length < 3}
          className="btn-gold mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3"
        >
          <Sparkles className={`h-5 w-5 ${gen.isPending ? "animate-pulse" : ""}`} />
          {gen.isPending ? "Generating…" : t.generate}
        </button>
        {gen.error && <p className="mt-3 text-sm text-destructive">{gen.error.message}</p>}
      </div>

      <div className="glass p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Preview</h2>
          <div className="flex gap-1 rounded-xl border border-border p-1 text-xs">
            {(["visual", "json"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`rounded-lg px-3 py-1 ${view === v ? "bg-gold-soft text-gold" : "text-muted-foreground"}`}>
                {v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        {!arch && !gen.isPending && (
          <div className="py-14 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-gold/50" />
            <p className="mt-3 text-sm text-muted-foreground">Your generated structure will appear here.</p>
          </div>
        )}
        {gen.isPending && (
          <div className="mt-5 space-y-3">
            {[70, 90, 55, 80, 65, 85].map((w, i) => (
              <Skeleton key={i} className="h-7" style={{ width: `${w}%` }} />
            ))}
            <p className="pt-2 text-center text-xs text-muted-foreground">Designing your server…</p>
          </div>
        )}
        {arch && !gen.isPending && view === "json" && (
          <pre className="mt-4 max-h-[480px] overflow-auto rounded-xl bg-background/70 p-4 font-mono text-xs">{JSON.stringify(arch, null, 2)}</pre>
        )}
        {arch && !gen.isPending && view === "visual" && (
          <div className="mt-4 max-h-[480px] space-y-5 overflow-auto pr-2">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Roles</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {arch.roles.map((r) => (
                  <span key={r.name} className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                    {r.name}
                  </span>
                ))}
              </div>
            </div>
            {arch.categories.map((c, ci) => (
              <div key={c.name} className="row-in" style={{ animationDelay: `${ci * 70}ms` }}>
                <p className="text-xs font-bold uppercase tracking-widest text-gold">{c.name}</p>
                <ul className="mt-1 space-y-1">
                  {c.channels.map((ch) => {
                    const I = icons[ch.type];
                    return (
                      <li key={ch.name} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-accent">
                        <I className="h-4 w-4 text-muted-foreground" /> {ch.name}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
        {arch && !gen.isPending && (
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">How to apply</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  disabled={building}
                  className={`rounded-xl border p-3 text-left transition ${mode === m.id ? "border-gold bg-gold-soft" : "border-border hover:border-gold/50"}`}
                >
                  <m.icon className={`h-4 w-4 ${mode === m.id ? "text-gold" : "text-muted-foreground"}`} />
                  <p className="mt-1.5 text-sm font-semibold">{m.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{m.hint}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={building}
              className="btn-gold mt-4 w-full rounded-xl px-6 py-3"
            >
              {building ? "Building…" : t.apply}
            </button>

            {buildId != null && (
              <div className="mt-4 space-y-2">
                <Progress value={finished && progress.data?.status === "done" ? 100 : pct} />
                <p className="text-xs text-muted-foreground">
                  {finished
                    ? progress.data?.status === "done" ? "Done — your server has been updated." : "Build failed."
                    : PHASES[prog?.phase ?? "starting"] ?? "Working…"}{" "}
                  {prog ? `(${prog.done}/${prog.total})` : ""}
                </p>
                {prog && prog.errors.length > 0 && (
                  <ul className="list-disc pl-5 text-xs text-destructive">{prog.errors.slice(0, 8).map((e, i) => <li key={i}>{e}</li>)}</ul>
                )}
                {prog && prog.warnings.length > 0 && (
                  <ul className="list-disc pl-5 text-xs text-muted-foreground">{prog.warnings.slice(0, 8).map((w, i) => <li key={i}>{w}</li>)}</ul>
                )}
              </div>
            )}
            {apply.error && <p className="mt-3 text-sm text-destructive">{apply.error.message}</p>}

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{modeInfo.confirm}</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-3 text-sm">
                      <p>{modeInfo.hint}</p>
                      {preview.isLoading && <p>Checking what will change…</p>}
                      {preview.error && <p className="text-destructive">{preview.error.message}</p>}
                      {p && modeInfo.destructive && (
                        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-foreground">
                          <p className="flex items-center gap-2 font-semibold text-destructive">
                            <AlertTriangle className="h-4 w-4" /> This cannot be undone
                          </p>
                          <p className="mt-1">
                            Will be deleted: {p.willDelete.channels} channels, {p.willDelete.categories} categories, {p.willDelete.roles} roles.
                          </p>
                          {willDeleteAny > 0 && (
                            <p className="mt-1 max-h-24 overflow-auto text-xs text-muted-foreground">
                              {[...p.names.categories, ...p.names.channels, ...p.names.roles].join(", ")}
                            </p>
                          )}
                          {p.keptChannels.length > 0 && <p className="mt-1 text-xs">Kept (required by Discord): {p.keptChannels.join(", ")}</p>}
                          {p.skippedRoles > 0 && <p className="mt-1 text-xs">{p.skippedRoles} roles stay (bot/integration roles or above the bot).</p>}
                        </div>
                      )}
                      {p && !p.botCanManage && <p className="text-destructive">Argus needs the Manage Channels and Manage Roles permissions.</p>}
                      {p?.busy && <p className="text-destructive">A build is already running on this server.</p>}
                      {modeInfo.destructive && (
                        <label className="flex items-center gap-2 text-foreground">
                          <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} />
                          I understand the old {mode === "roles" ? "roles" : "structure"} will be deleted.
                        </label>
                      )}
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={!p || blocked || (modeInfo.destructive && !understood)}
                    onClick={() => apply.mutate(arch)}
                  >
                    {t.apply}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
}