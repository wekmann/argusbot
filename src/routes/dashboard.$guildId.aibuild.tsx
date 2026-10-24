import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Hash, Megaphone, MessagesSquare, Sparkles, Volume2 } from "lucide-react";
import { applyArchitecture, generateArchitecture } from "@/lib/argus.functions";
import type { Architecture } from "@/lib/architecture";
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

const MAX = 500;
const icons = { text: Hash, voice: Volume2, announcement: Megaphone, forum: MessagesSquare };

function AiBuild() {
  const { guildId } = Route.useParams();
  const [prompt, setPrompt] = useState("");
  const [view, setView] = useState<"visual" | "json">("visual");
  const gen = useMutation({ mutationFn: (p: string) => generateArchitecture({ data: { guildId, prompt: p } }) });
  const apply = useMutation({ mutationFn: (a: Architecture) => applyArchitecture({ data: { guildId, architecture: a } }) });
  const arch = gen.data;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="glass p-6">
        <h2 className="text-xl font-bold">Describe your server</h2>
        <textarea
          value={prompt}
          maxLength={MAX}
          onChange={(e) => setPrompt(e.target.value.slice(0, MAX))}
          placeholder="e.g. A Polish gaming community for Valorant and CS2 with tournaments, clips and voice lobbies"
          className="mt-4 h-48 w-full resize-none rounded-xl border border-input bg-background/60 p-4 text-sm outline-none focus:border-gold"
        />
        <div className="mt-2 text-right font-mono text-xs text-muted-foreground">{prompt.length}/{MAX}</div>
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
        {!arch && <p className="mt-10 text-center text-sm text-muted-foreground">Your generated structure will appear here.</p>}
        {arch && view === "json" && (
          <pre className="mt-4 max-h-[480px] overflow-auto rounded-xl bg-background/70 p-4 font-mono text-xs">{JSON.stringify(arch, null, 2)}</pre>
        )}
        {arch && view === "visual" && (
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
            {arch.categories.map((c) => (
              <div key={c.name}>
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
        {arch && (
          <div className="mt-6 border-t border-border pt-4">
            <button
              onClick={() => {
                if (confirm("Apply this structure to the server? Argus will create these roles and channels.")) apply.mutate(arch);
              }}
              disabled={apply.isPending}
              className="btn-gold w-full rounded-xl px-6 py-3"
            >
              {apply.isPending ? "Applying…" : t.apply}
            </button>
            {apply.data && <p className="mt-3 text-sm text-success">{apply.data.message ?? "Structure applied."}</p>}
            {apply.error && <p className="mt-3 text-sm text-destructive">{apply.error.message}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
