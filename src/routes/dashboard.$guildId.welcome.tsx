import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ghost, PartyPopper, RotateCcw, Save, Send, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/motion";
import { Switch } from "@/components/ui/switch";
import { getGuild, getGuildMeta, getWelcome, saveWelcome, sendWelcomeTest, type GuildMeta, type WelcomeConfig } from "@/lib/argus.functions";

export const Route = createFileRoute("/dashboard/$guildId/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome & Auto-role — Argus" },
      { name: "description", content: "Give new members a role, greet them with a custom message and ghost-ping them." },
      { property: "og:title", content: "Welcome & Auto-role — Argus" },
      { property: "og:description", content: "Auto-role, welcome embed and ghost ping for new members." },
    ],
  }),
  component: WelcomePage,
});

const EMPTY: WelcomeConfig = {
  autorole: { enabled: false, roleId: null },
  welcome: {
    enabled: false,
    channelId: null,
    message: "{user}",
    embed: { enabled: true, title: "Welcome to {server}!", description: "Hey {user}, glad to have you here. You are member #{membercount}.", color: "#F2B544", footer: "", thumbnail: true, image: "" },
  },
  ghostPing: { enabled: false, channelId: null },
};

const VARIABLES = [
  { v: "{user}", hint: "Pings the new member" },
  { v: "{username}", hint: "Their username" },
  { v: "{displayname}", hint: "Their display name" },
  { v: "{server}", hint: "Server name" },
  { v: "{membercount}", hint: "Current member count" },
  { v: "{id}", hint: "Their Discord ID" },
] as const;

type FieldKey = "message" | "title" | "description" | "footer";

/** "Bot API /guilds/…/welcome failed [400]: {"error":"…"}" → the readable part. */
function errorText(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.match(/"error"\s*:\s*"([^"]+)"/)?.[1] ?? msg;
}

const inputCls = "w-full rounded-xl border border-border bg-input/30 px-4 py-2.5 text-sm outline-none transition focus:border-gold";
const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground";

function Section({ icon: Icon, title, hint, enabled, onToggle, children }: { icon: typeof Ghost; title: string; hint: string; enabled: boolean; onToggle: (v: boolean) => void; children: ReactNode }) {
  return (
    <section className="glass p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`hidden rounded-full px-3 py-1 text-xs font-bold ring-1 transition sm:inline ${enabled ? "bg-success/15 text-success ring-success/30" : "bg-secondary text-muted-foreground ring-border"}`}>{enabled ? "ACTIVE" : "OFF"}</span>
          <Switch checked={enabled} onCheckedChange={onToggle} aria-label={`Toggle ${title}`} />
        </div>
      </div>
      <div className={`mt-6 space-y-4 transition-opacity ${enabled ? "" : "opacity-60"}`}>{children}</div>
    </section>
  );
}

function ChannelSelect({ value, onChange, meta, loading }: { value: string | null; onChange: (v: string | null) => void; meta: GuildMeta | undefined; loading: boolean }) {
  const groups = useMemo(() => {
    const map = new Map<string, GuildMeta["channels"]>();
    for (const c of meta?.channels ?? []) {
      const key = c.category ?? "No category";
      map.set(key, [...(map.get(key) ?? []), c]);
    }
    return [...map.entries()];
  }, [meta]);
  if (loading) return <Skeleton className="h-10 w-full" />;
  const missing = value && !meta?.channels.some((c) => c.id === value);
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} className={inputCls}>
      <option value="">Select a channel…</option>
      {missing && <option value={value}>(deleted channel)</option>}
      {groups.map(([cat, list]) => (
        <optgroup key={cat} label={cat}>
          {list.map((c) => (
            <option key={c.id} value={c.id} disabled={!c.canSend}>
              #{c.name}
              {c.canSend ? "" : " — Argus can't write here"}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

/** Tiny Discord-like markdown: **bold**, new lines, and the {user} mention as a pill. */
function Rich({ text, server }: { text: string; server: string }) {
  const sample: Record<string, string> = { username: "neo", displayname: "Neo", id: "123456789012345678", membercount: "128", server };
  const filled = text.replace(/\{(\w+)\}/g, (whole, k: string) => sample[k.toLowerCase()] ?? whole);
  const parts = filled.split(/(\{user\}|\*\*[^*]+\*\*)/i);
  return (
    <>
      {parts.map((p, i) =>
        /^\{user\}$/i.test(p) ? (
          <span key={i} className="rounded bg-[#5865f2]/30 px-1 font-medium text-[#c9cdfb]">
            @Neo
          </span>
        ) : /^\*\*[^*]+\*\*$/.test(p) ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function Preview({ cfg, server }: { cfg: WelcomeConfig["welcome"]; server: string }) {
  const e = cfg.embed;
  const hasEmbed = e.enabled && (e.title || e.description);
  const hasContent = cfg.message.trim().length > 0;
  return (
    <div className="rounded-2xl border border-border bg-[#313338] p-4 text-[#dbdee1]">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-soft font-display text-gold">A</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-semibold text-white">Argus</span>
            <span className="ml-1.5 rounded bg-[#5865f2] px-1 py-0.5 align-middle text-[10px] font-bold text-white">BOT</span>
            <span className="ml-2 text-xs text-[#949ba4]">Today</span>
          </p>
          {hasContent && (
            <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px]">
              <Rich text={cfg.message} server={server} />
            </p>
          )}
          {hasEmbed && (
            <div className="mt-1.5 max-w-md overflow-hidden rounded border-l-4 bg-[#2b2d31] p-3" style={{ borderLeftColor: e.color }}>
              <div className="flex gap-3">
                <div className="min-w-0 flex-1">
                  {e.title && (
                    <p className="break-words font-semibold text-white">
                      <Rich text={e.title} server={server} />
                    </p>
                  )}
                  {e.description && (
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                      <Rich text={e.description} server={server} />
                    </p>
                  )}
                </div>
                {e.thumbnail && <div className="h-16 w-16 shrink-0 rounded-lg bg-gradient-to-br from-[#5865f2] to-[#eb459e]" aria-label="Member avatar" />}
              </div>
              {e.image && /^https?:\/\//i.test(e.image) && <img src={e.image} alt="" className="mt-3 max-h-48 w-full rounded object-cover" onError={(ev) => (ev.currentTarget.style.display = "none")} />}
              {e.footer && (
                <p className="mt-2 text-xs text-[#949ba4]">
                  <Rich text={e.footer} server={server} />
                </p>
              )}
            </div>
          )}
          {!hasContent && !hasEmbed && <p className="mt-1 text-sm italic text-[#949ba4]">Nothing to send yet — add a message or an embed.</p>}
        </div>
      </div>
    </div>
  );
}

function WelcomePage() {
  const { guildId } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["welcome", guildId], queryFn: () => getWelcome({ data: { guildId } }), retry: false });
  const metaQ = useQuery({ queryKey: ["meta", guildId], queryFn: () => getGuildMeta({ data: { guildId } }), retry: false, staleTime: 30_000 });
  const guildQ = useQuery({ queryKey: ["guild", guildId], queryFn: () => getGuild({ data: { guildId } }), staleTime: 5 * 60_000, retry: false });
  const [cfg, setCfg] = useState<WelcomeConfig>(EMPTY);
  useEffect(() => {
    if (q.data) setCfg(q.data);
  }, [q.data]);

  const saved = q.data ?? EMPTY;
  const dirty = useMemo(() => JSON.stringify(cfg) !== JSON.stringify(saved), [cfg, saved]);
  const server = guildQ.data?.name ?? "Your Server";
  const meta = metaQ.data;

  // --- insert a {variable} at the caret of the last focused text field ---
  const fields = useRef<Partial<Record<FieldKey, HTMLInputElement | HTMLTextAreaElement | null>>>({});
  const lastField = useRef<FieldKey>("description");
  const read = (k: FieldKey) => (k === "message" ? cfg.welcome.message : cfg.welcome.embed[k]);
  const write = (k: FieldKey, v: string) => setCfg((c) => (k === "message" ? { ...c, welcome: { ...c.welcome, message: v } } : { ...c, welcome: { ...c.welcome, embed: { ...c.welcome.embed, [k]: v } } }));
  const insertVariable = (variable: string) => {
    const key = lastField.current;
    const el = fields.current[key];
    const current = read(key);
    const start = el?.selectionStart ?? current.length;
    const end = el?.selectionEnd ?? current.length;
    write(key, current.slice(0, start) + variable + current.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + variable.length, start + variable.length);
    });
  };
  const bindField = useCallback(
    (key: FieldKey) => ({
      ref: (el: HTMLInputElement | HTMLTextAreaElement | null) => {
        fields.current[key] = el;
      },
      onFocus: () => {
        lastField.current = key;
      },
    }),
    [],
  );

  const save = useMutation({
    mutationFn: () => saveWelcome({ data: { guildId, welcome: cfg } }),
    onSuccess: (res) => {
      toast.success("Welcome settings saved");
      qc.setQueryData(["welcome", guildId], res);
    },
    onError: (e) => toast.error(errorText(e)),
  });

  const test = useMutation({
    mutationFn: () => sendWelcomeTest({ data: { guildId } }),
    onSuccess: (r) => (r.welcome || r.ghostPing ? toast.success("Test sent — check the channel (it pings you)") : toast.error("Nothing was sent. Turn a feature on, choose a channel and save first.")),
    onError: (e) => toast.error(errorText(e)),
  });

  const set = <K extends keyof WelcomeConfig>(key: K, patch: Partial<WelcomeConfig[K]>) => setCfg((c) => ({ ...c, [key]: { ...c[key], ...patch } }));
  const setEmbed = (patch: Partial<WelcomeConfig["welcome"]["embed"]>) => setCfg((c) => ({ ...c, welcome: { ...c.welcome, embed: { ...c.welcome.embed, ...patch } } }));

  const role = meta?.roles.find((r) => r.id === cfg.autorole.roleId);
  const embed = cfg.welcome.embed;

  return (
    <div className="space-y-6 pb-28">
      {q.error && <p className="text-sm text-destructive">Couldn't load settings from the bot: {errorText(q.error)}</p>}
      {metaQ.error && <p className="text-sm text-destructive">Couldn't load channels and roles: {errorText(metaQ.error)}</p>}

      {/* ---------------- Auto-role ---------------- */}
      <Section icon={UserPlus} title="Auto-role" hint="Every new member gets this role the moment they join." enabled={cfg.autorole.enabled} onToggle={(v) => set("autorole", { enabled: v })}>
        <div>
          <label className={labelCls} htmlFor="autorole">
            Role to give
          </label>
          {metaQ.isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <select id="autorole" value={cfg.autorole.roleId ?? ""} onChange={(e) => set("autorole", { roleId: e.target.value || null })} className={inputCls}>
              <option value="">Select a role…</option>
              {cfg.autorole.roleId && !role && <option value={cfg.autorole.roleId}>(deleted role)</option>}
              {(meta?.roles ?? []).map((r) => (
                <option key={r.id} value={r.id} disabled={!r.assignable}>
                  {r.name}
                  {r.assignable ? "" : " — above Argus's role"}
                </option>
              ))}
            </select>
          )}
          {role && !role.assignable && <p className="mt-2 text-xs text-warning">Argus can't give this role. In Discord go to Server Settings → Roles and drag the Argus role above “{role.name}”.</p>}
        </div>
      </Section>

      {/* ---------------- Welcome message ---------------- */}
      <Section icon={PartyPopper} title="Welcome message" hint="Greet new members in a channel of your choice, as plain text and/or an embed." enabled={cfg.welcome.enabled} onToggle={(v) => set("welcome", { enabled: v })}>
        <div>
          <label className={labelCls}>Channel</label>
          <ChannelSelect value={cfg.welcome.channelId} onChange={(v) => set("welcome", { channelId: v })} meta={meta} loading={metaQ.isLoading} />
        </div>

        <div>
          <label className={labelCls} htmlFor="wmsg">
            Message text <span className="font-normal normal-case tracking-normal">(above the embed — a {"{user}"} here really pings)</span>
          </label>
          <textarea id="wmsg" rows={2} maxLength={2000} value={cfg.welcome.message} onChange={(e) => set("welcome", { message: e.target.value })} {...bindField("message")} placeholder="Welcome {user}!" className={`${inputCls} resize-y`} />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Send as embed</p>
            <p className="text-xs text-muted-foreground">A styled card with title, description, colour and the member's avatar.</p>
          </div>
          <Switch checked={embed.enabled} onCheckedChange={(v) => setEmbed({ enabled: v })} aria-label="Toggle embed" />
        </div>

        {embed.enabled && (
          <div className="space-y-4">
            <div>
              <label className={labelCls} htmlFor="etitle">
                Embed title
              </label>
              <input id="etitle" maxLength={256} value={embed.title} onChange={(e) => setEmbed({ title: e.target.value })} {...bindField("title")} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="edesc">
                Embed description
              </label>
              <textarea id="edesc" rows={4} maxLength={4000} value={embed.description} onChange={(e) => setEmbed({ description: e.target.value })} {...bindField("description")} className={`${inputCls} resize-y`} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="efooter">
                  Footer
                </label>
                <input id="efooter" maxLength={2048} value={embed.footer} onChange={(e) => setEmbed({ footer: e.target.value })} {...bindField("footer")} placeholder="Optional" className={inputCls} />
              </div>
              <div>
                <label className={labelCls} htmlFor="ecolor">
                  Colour
                </label>
                <div className="flex gap-2">
                  <input type="color" aria-label="Pick colour" value={/^#[0-9a-f]{6}$/i.test(embed.color) ? embed.color : "#F2B544"} onChange={(e) => setEmbed({ color: e.target.value.toUpperCase() })} className="h-10 w-14 cursor-pointer rounded-xl border border-border bg-input/30 p-1" />
                  <input id="ecolor" maxLength={7} value={embed.color} onChange={(e) => setEmbed({ color: e.target.value })} className={`${inputCls} font-mono`} />
                </div>
              </div>
            </div>
            <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto]">
              <div>
                <label className={labelCls} htmlFor="eimage">
                  Image URL
                </label>
                <input id="eimage" maxLength={500} value={embed.image} onChange={(e) => setEmbed({ image: e.target.value })} placeholder="https://… (optional big banner)" className={inputCls} />
              </div>
              <label className="flex h-10 items-center gap-3 text-sm">
                <Switch checked={embed.thumbnail} onCheckedChange={(v) => setEmbed({ thumbnail: v })} aria-label="Show member avatar" /> Show member avatar
              </label>
            </div>
          </div>
        )}

        <div>
          <p className={labelCls}>Variables — click to insert at the cursor</p>
          <div className="flex flex-wrap gap-2">
            {VARIABLES.map((x) => (
              <button key={x.v} type="button" title={x.hint} onClick={() => insertVariable(x.v)} className="rounded-full bg-gold-soft px-3 py-1 font-mono text-xs text-gold ring-1 ring-gold/20 transition hover:bg-gold/20">
                {x.v}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Mentions inside an embed are shown but don't notify — put {"{user}"} in the message text above to actually ping.</p>
        </div>

        <div>
          <p className={labelCls}>Preview</p>
          <Preview cfg={cfg.welcome} server={server} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => test.mutate()} disabled={test.isPending || dirty} className="btn-ghost flex items-center gap-2 rounded-xl px-4 py-2 text-sm">
            <Send className="h-4 w-4" /> {test.isPending ? "Sending…" : "Send test to the channel"}
          </button>
          <span className="text-xs text-muted-foreground">{dirty ? "Save your changes first — the test uses saved settings." : "Sends the welcome message and ghost ping for you (no role is given)."}</span>
        </div>
      </Section>

      {/* ---------------- Ghost ping ---------------- */}
      <Section icon={Ghost} title="Ghost ping" hint="Right after the auto-role, ping the new member in a channel — the ping disappears after 5 seconds." enabled={cfg.ghostPing.enabled} onToggle={(v) => set("ghostPing", { enabled: v })}>
        <div>
          <label className={labelCls}>Channel</label>
          <ChannelSelect value={cfg.ghostPing.channelId} onChange={(v) => set("ghostPing", { channelId: v })} meta={meta} loading={metaQ.isLoading} />
          <p className="mt-2 text-xs text-muted-foreground">The member must be able to see this channel to get the notification (for example the channel that new members see before verification).</p>
        </div>
      </Section>

      {/* Save bar slides in only when something changed */}
      <div className={`fixed inset-x-0 bottom-5 z-40 mx-auto w-[min(34rem,calc(100%-2rem))] transition-all duration-300 [transition-timing-function:var(--ease-out-expo)] ${dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"}`}>
        <div className="glass glass-blur flex items-center justify-between gap-3 border-gold/40 bg-popover/90 p-3 pl-5 shadow-2xl">
          <span className="text-sm">You have unsaved changes</span>
          <div className="flex gap-2">
            <button onClick={() => setCfg(saved)} className="btn-ghost flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-gold flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm">
              <Save className="h-4 w-4" /> {save.isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}