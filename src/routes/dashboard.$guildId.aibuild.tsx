import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Hash, Megaphone, MessagesSquare, Sparkles, Volume2 } from "lucide-react";
import { applyArchitecture, generateArchitecture, getCurrentStructure } from "@/lib/argus.functions";
import type { Architecture, CurrentStructure } from "@/lib/architecture";
import { Skeleton } from "@/components/motion";
import { PermissionMatrix } from "@/components/PermissionMatrix";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard/$guildId/aibuild")({
  head: () => ({
    meta: [
      { title: "AI Server Builder — Argus" },
      { name: "description", content: "Generate or edit a Discord server structure with AI." },
      { property: "og:title", content: "AI Server Builder — Argus" },
      { property: "og:description", content: "Generate roles and channels for your Discord server with AI, or edit the existing ones." },
    ],
  }),
  component: AiBuild,
});

const MAX = 1000;
const CREATE_EXAMPLES = [
  "A Polish gaming community for Valorant and CS2 with tournaments, clips and voice lobbies",
  "A study group for university students with subject channels and quiet voice rooms",
  "A small art community with commissions, critique and a showcase gallery",
];
const EDIT_EXAMPLES = [
  "Translate all category and channel names to Polish",
  "Rename the general channel to lobby and let the staff role manage messages",
  "Hide the staff category from members and make the announcements channel read-only",
];
const icons = { text: Hash, voice: Volume2, announcement: Megaphone, forum: MessagesSquare };

type Mode = "create" | "edit";
type View = "visual" | "permissions" | "json";

/** Small tag next to an item in edit mode: "new" or "renamed ← old name". */
function Tag({ label, was }: { label: "new" | "renamed"; was?: string }) {
  const cls = label === "new" ? "bg-green-500/15 text-green-400" : "bg-gold-soft text-gold";
  return (
    <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${cls}`}>
      {label}
      {was ? ` ← ${was}` : ""}
    </span>
  );
}

function changeOf(id: string | undefined, name: string, names: Map<string, string>) {
  if (!id) return { label: "new" as const };
  const old = names.get(id);
  return old && old !== name ? { label: "renamed" as const, was: old } : null;
}

function AiBuild() {
  const { guildId } = Route.useParams();
  const [mode, setMode] = useState<Mode>("create");
  const [prompt, setPrompt] = useState("");
  const [view, setView] = useState<View>("visual");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const structure = useQuery({
    queryKey: ["ai-structure", guildId],
    queryFn: async () => (await getCurrentStructure({ data: { guildId } })) as CurrentStructure,
    enabled: mode === "edit",
  });
  const gen = useMutation({
    mutationFn: (v: { prompt: string; mode: Mode }) => generateArchitecture({ data: { guildId, prompt: v.prompt, mode: v.mode } }),
  });
  const apply = useMutation({
    mutationFn: (v: { architecture: Architecture; mode: "add" | "edit" }) =>
      applyArchitecture({ data: { guildId, architecture: v.architecture, mode: v.mode } }),
  });

  const arch = gen.data;
  const genMode: Mode = gen.variables?.mode ?? mode;
  const current = structure.data;

  // id -> current name, to show what an edit renames
  const names = useMemo(
    () => ({
      roles: new Map((current?.roles ?? []).map((r) => [r.id, r.name] as const)),
      categories: new Map((current?.categories ?? []).map((c) => [c.id, c.name] as const)),
      channels: new Map((current?.categories ?? []).flatMap((c) => c.channels.map((ch) => [ch.id, ch.name] as const))),
    }),
    [current],
  );

  function switchMode(next: Mode) {
    setMode(next);
    setPrompt("");
    gen.reset();
    apply.reset();
    setView("visual");
  }

  const editReady = mode === "create" || !!current;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="glass p-6">
        <div className="flex gap-1 rounded-xl border border-border p-1 text-xs">
          {([
            ["create", "New server"],
            ["edit", "Edit current server"],
          ] as const).map(([m, label]) => (
            <button key={m} onClick={() => switchMode(m)} className={`flex-1 rounded-lg px-3 py-2 ${mode === m ? "bg-gold-soft text-gold" : "text-muted-foreground"}`}>
              {label}
            </button>
          ))}
        </div>

        <h2 className="mt-5 text-xl font-bold">{mode === "create" ? "Describe your server" : "Describe the changes"}</h2>
        <textarea
          value={prompt}
          maxLength={MAX}
          onChange={(e) => setPrompt(e.target.value.slice(0, MAX))}
          placeholder={mode === "create" ? `e.g. ${CREATE_EXAMPLES[0]}` : `e.g. ${EDIT_EXAMPLES[0]}`}
          className="mt-4 h-40 w-full resize-none rounded-xl border border-input bg-background/60 p-4 text-sm outline-none transition focus:border-gold focus:shadow-[0_0_0_3px_oklch(0.8_0.15_75/0.15)]"
        />
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {(mode === "create" ? CREATE_EXAMPLES : EDIT_EXAMPLES).map((ex, i) => (
              <button key={i} onClick={() => setPrompt(ex)} className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs text-muted-foreground transition hover:border-gold/60 hover:text-gold">
                Example {i + 1}
              </button>
            ))}
          </div>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {prompt.length}/{MAX}
          </span>
        </div>

        {mode === "edit" && (
          <div className="mt-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Current server</p>
            {structure.isLoading && <Skeleton className="mt-2 h-24" />}
            {structure.error && <p className="mt-2 text-sm text-destructive">{structure.error.message}</p>}
            {current && (
              <div className="mt-2 max-h-48 space-y-2 overflow-auto rounded-xl border border-border p-3 text-sm">
                {current.categories.map((c) => (
                  <div key={c.id}>
                    <p className="text-xs font-bold uppercase tracking-wide text-gold">{c.name}</p>
                    <p className="text-muted-foreground">{c.channels.map((ch) => ch.name).join(", ") || "no channels"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => gen.mutate({ prompt, mode })}
          disabled={gen.isPending || prompt.trim().length < 3 || !editReady}
          className="btn-gold mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3"
        >
          <Sparkles className={`h-5 w-5 ${gen.isPending ? "animate-pulse" : ""}`} />
          {gen.isPending ? "Generating…" : mode === "create" ? t.generate : "Generate changes"}
        </button>
        {gen.error && <p className="mt-3 text-sm text-destructive">{gen.error.message}</p>}
      </div>

      <div className="glass p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Preview</h2>
          <div className="flex gap-1 rounded-xl border border-border p-1 text-xs">
            {(["visual", "permissions", "json"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`rounded-lg px-3 py-1 ${view === v ? "bg-gold-soft text-gold" : "text-muted-foreground"}`}>
                {v === "permissions" ? "PERMISSIONS" : v.toUpperCase()}
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
            <p className="pt-2 text-center text-xs text-muted-foreground">{genMode === "edit" ? "Planning the changes…" : "Designing your server…"}</p>
          </div>
        )}

        {arch && !gen.isPending && view === "json" && (
          <pre className="mt-4 max-h-[480px] overflow-auto rounded-xl bg-background/70 p-4 font-mono text-xs">{JSON.stringify(arch, null, 2)}</pre>
        )}

        {arch && !gen.isPending && view === "permissions" && (
          <div className="mt-4 max-h-[480px] overflow-auto pr-2">
            <PermissionMatrix arch={arch} />
          </div>
        )}

        {arch && !gen.isPending && view === "visual" && (
          <div className="mt-4 max-h-[480px] space-y-5 overflow-auto pr-2">
            {genMode === "edit" && (
              <p className="text-xs text-muted-foreground">Only the items listed here change. Everything else on the server stays as it is.</p>
            )}
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Roles</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {arch.roles.map((r, i) => {
                  const ch = genMode === "edit" ? changeOf(r.id, r.name, names.roles) : null;
                  return (
                    <span key={i} className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                      {r.name}
                      {ch && <Tag label={ch.label} was={ch.was} />}
                    </span>
                  );
                })}
              </div>
            </div>
            {arch.categories.map((c, ci) => {
              const cc = genMode === "edit" ? changeOf(c.id, c.name, names.categories) : null;
              return (
                <div key={ci} className="row-in" style={{ animationDelay: `${ci * 70}ms` }}>
                  <p className="text-xs font-bold uppercase tracking-widest text-gold">
                    {c.name}
                    {cc && <Tag label={cc.label} was={cc.was} />}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {c.channels.map((ch, chi) => {
                      const I = icons[ch.type];
                      const cg = genMode === "edit" ? changeOf(ch.id, ch.name, names.channels) : null;
                      return (
                        <li key={chi} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-accent">
                          <I className="h-4 w-4 text-muted-foreground" /> {ch.name}
                          {cg && <Tag label={cg.label} was={cg.was} />}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {arch && !gen.isPending && (
          <div className="mt-6 border-t border-border pt-4">
            <button onClick={() => setConfirmOpen(true)} disabled={apply.isPending} className="btn-gold w-full rounded-xl px-6 py-3">
              {apply.isPending ? "Applying…" : t.apply}
            </button>
            {apply.data && <p className="mt-3 text-sm text-success">{apply.data.message ?? "Changes applied."}</p>}
            {apply.error && <p className="mt-3 text-sm text-destructive">{apply.error.message}</p>}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{genMode === "edit" ? "Apply these changes?" : "Apply this structure?"}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {genMode === "edit"
                      ? "Argus will rename and update the items shown above and create the new ones. Nothing else is deleted."
                      : "Argus will create these roles and channels on your server. Existing channels are not deleted."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => apply.mutate({ architecture: arch, mode: genMode === "edit" ? "edit" : "add" })}>
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