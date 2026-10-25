import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Clock, FileText, LifeBuoy, LockKeyhole, MessageSquareText, Paperclip, Search, Send, Settings2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/motion";
import { SaveBar } from "@/components/SaveBar";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  getGuild,
  getTicketConfig,
  getTicketRating,
  getTicketTranscript,
  getTicketTranscripts,
  saveTicketConfig,
  sendTicketPanel,
  type TicketConfig,
  type TicketRating,
  type TicketSettings,
  type TicketTranscriptRow,
} from "@/lib/argus.functions";

export const Route = createFileRoute("/dashboard/$guildId/tickets")({
  head: () => ({
    meta: [
      { title: "Tickets — Argus" },
      { name: "description", content: "Set up your own ticket panel and read the transcripts of every ticket on your server." },
      { property: "og:title", content: "Tickets — Argus" },
      { property: "og:description", content: "Your ticket panel, ticket messages, transcripts and average rating." },
    ],
  }),
  component: TicketsPage,
});

const EMPTY: TicketSettings = {
  enabled: false,
  panelChannelId: null,
  categoryId: null,
  logChannelId: null,
  supportRoleIds: [],
  inactivityHours: 48,
  graceHours: 24,
  panel: {
    title: "🎫 Support Tickets",
    description: "Need help? Want to report an issue or ask a question?\nClick the button below to open a **private ticket** with our support team.",
    color: "#5865F2",
    footer: "Only you and the support team will be able to see your ticket.",
    image: "",
    thumbnail: "",
    buttonLabel: "Open Ticket",
    buttonEmoji: "📩",
  },
  welcome: {
    title: "🎫 Ticket opened",
    description: "Welcome {user}! Our support team will be with you shortly.\n\nPlease describe your issue in as much detail as possible.\nWhen it is resolved, close this ticket with the button below.",
    color: "#57F287",
    image: "",
    pingSupport: true,
  },
};

const inputCls = "w-full rounded-xl border border-border bg-input/30 px-4 py-2.5 text-sm outline-none transition focus:border-gold";
const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground";

/** "Bot API /guilds/…/tickets failed [400]: {"error":"…"}" → the readable part. */
function errorText(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  if (/\[403\]/.test(msg)) return "Only the server owner or an Administrator can manage tickets.";
  return msg.match(/"error"\s*:\s*"([^"]+)"/)?.[1] ?? msg;
}

function Stars({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-4 w-4 ${value >= n - 0.25 ? "fill-gold text-gold" : value >= n - 0.75 ? "fill-gold/40 text-gold" : "text-border"}`} />
      ))}
    </span>
  );
}

function Section({ icon: Icon, title, hint, children, right }: { icon: typeof Settings2; title: string; hint: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="glass p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
          </div>
        </div>
        {right}
      </div>
      <div className="mt-6 space-y-4">{children}</div>
    </section>
  );
}

/** Tiny Discord-like markdown: **bold**, new lines, {user} pill and {server}. */
function Rich({ text, server }: { text: string; server: string }) {
  const parts = text.replace(/\{server\}/gi, server).split(/(\{user\}|\*\*[^*]+\*\*)/i);
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

const isHttps = (u: string) => /^https:\/\//i.test(u);

function EmbedPreview({ title, description, color, footer, image, thumbnail, button, server }: { title: string; description: string; color: string; footer?: string; image?: string; thumbnail?: string; button?: { label: string; emoji: string }; server: string }) {
  const barColor = /^#[0-9a-f]{6}$/i.test(color) ? color : "#5865F2";
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
          <div className="mt-1.5 max-w-md overflow-hidden rounded border-l-4 bg-[#2b2d31] p-3" style={{ borderLeftColor: barColor }}>
            <div className="flex gap-3">
              <div className="min-w-0 flex-1">
                {title && (
                  <p className="break-words font-semibold text-white">
                    <Rich text={title} server={server} />
                  </p>
                )}
                {description && (
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                    <Rich text={description} server={server} />
                  </p>
                )}
              </div>
              {thumbnail && isHttps(thumbnail) && <img src={thumbnail} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />}
            </div>
            {image && isHttps(image) && <img src={image} alt="" className="mt-3 max-h-48 w-full rounded object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />}
            {footer && (
              <p className="mt-2 text-xs text-[#949ba4]">
                <Rich text={footer} server={server} />
              </p>
            )}
          </div>
          {button && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded bg-[#5865f2] px-4 py-1.5 text-sm font-medium text-white">
              {button.emoji && <span>{button.emoji}</span>}
              {button.label || "Open Ticket"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ColorField({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      <input type="color" aria-label="Pick colour" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#5865F2"} onChange={(e) => onChange(e.target.value.toUpperCase())} className="h-10 w-14 cursor-pointer rounded-xl border border-border bg-input/30 p-1" />
      <input id={id} maxLength={7} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} font-mono`} />
    </div>
  );
}

function RatingCard({ guildId }: { guildId: string }) {
  const q = useQuery({ queryKey: ["ticket-rating", guildId], queryFn: () => getTicketRating({ data: { guildId } }), retry: false });
  const r: TicketRating | undefined = q.data;
  const max = Math.max(1, ...Object.values(r?.distribution ?? {}));
  return (
    <section className="glass grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Average rating of this server</p>
        {q.isLoading ? (
          <Skeleton className="mt-3 h-12 w-40" />
        ) : r && r.count > 0 && r.average !== null ? (
          <>
            <p className="mt-2 font-display text-5xl text-gold">
              {r.average.toFixed(2)}
              <span className="ml-1 text-lg text-muted-foreground">/ 5</span>
            </p>
            <Stars value={r.average} className="mt-2" />
            <p className="mt-2 text-sm text-muted-foreground">
              Based on {r.count} {r.count === 1 ? "rating" : "ratings"} from your members
            </p>
          </>
        ) : (
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">No ratings yet. Members rate a ticket in their DMs after it is closed.</p>
        )}
      </div>
      {r && r.count > 0 && (
        <ul className="space-y-1.5" aria-label="Rating distribution">
          {([5, 4, 3, 2, 1] as const).map((n) => (
            <li key={n} className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="w-4 text-right tabular-nums">{n}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <span className="block h-full rounded-full bg-gold" style={{ width: `${(r.distribution[String(n) as "1"] / max) * 100}%` }} />
              </span>
              <span className="w-8 tabular-nums">{r.distribution[String(n) as "1"]}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Settings tab
// ---------------------------------------------------------------------------

function SettingsTab({ guildId, config, serverName }: { guildId: string; config: TicketConfig; serverName: string }) {
  const qc = useQueryClient();
  const [cfg, setCfg] = useState<TicketSettings>(config.settings);
  useEffect(() => setCfg(config.settings), [config.settings]);

  const saved = config.settings;
  const dirty = useMemo(() => JSON.stringify(cfg) !== JSON.stringify(saved), [cfg, saved]);
  const setPanel = (patch: Partial<TicketSettings["panel"]>) => setCfg((c) => ({ ...c, panel: { ...c.panel, ...patch } }));
  const setWelcome = (patch: Partial<TicketSettings["welcome"]>) => setCfg((c) => ({ ...c, welcome: { ...c.welcome, ...patch } }));

  const save = useMutation({
    mutationFn: () => saveTicketConfig({ data: { guildId, settings: cfg } }),
    onSuccess: (res) => {
      toast.success("Ticket settings saved");
      qc.setQueryData<TicketConfig>(["tickets", guildId], (old) => (old ? { ...old, settings: res.settings, problems: res.problems } : old));
    },
    onError: (e) => toast.error("Couldn't save ticket settings", { description: errorText(e) }),
  });

  const panel = useMutation({
    mutationFn: () => sendTicketPanel({ data: { guildId } }),
    onSuccess: (r) => {
      const ch = config.channels.find((c) => c.id === r.channelId);
      toast.success("Ticket panel sent", { description: ch ? `Posted in #${ch.name}.` : "Check your panel channel." });
      void qc.invalidateQueries({ queryKey: ["tickets", guildId] });
    },
    onError: (e) => toast.error("Couldn't send the panel", { description: errorText(e) }),
  });

  const groups = useMemo(() => {
    const map = new Map<string, TicketConfig["channels"]>();
    for (const c of config.channels) map.set(c.category ?? "No category", [...(map.get(c.category ?? "No category") ?? []), c]);
    return [...map.entries()];
  }, [config.channels]);

  const channelSelect = (value: string | null, onChange: (v: string | null) => void, id: string) => (
    <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} className={inputCls}>
      <option value="">Select a channel…</option>
      {value && !config.channels.some((c) => c.id === value) && <option value={value}>(deleted channel)</option>}
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

  const availableRoles = config.roles.filter((r) => !cfg.supportRoleIds.includes(r.id));
  const canSendPanel = !dirty && cfg.panelChannelId && cfg.categoryId;

  return (
    <div className="space-y-6">
      {config.problems.length > 0 && (
        <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm" role="alert">
          <p className="font-semibold text-warning">Argus can't open tickets yet</p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-muted-foreground">
            {config.problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      <Section
        icon={LifeBuoy}
        title="Ticket system"
        hint="Where tickets are created, who answers them and where logs go."
        right={
          <div className="flex items-center gap-3">
            <span className={`hidden rounded-full px-3 py-1 text-xs font-bold ring-1 transition sm:inline ${cfg.enabled ? "bg-success/15 text-success ring-success/30" : "bg-secondary text-muted-foreground ring-border"}`}>{cfg.enabled ? "ACTIVE" : "OFF"}</span>
            <Switch checked={cfg.enabled} onCheckedChange={(v) => setCfg((c) => ({ ...c, enabled: v }))} aria-label="Toggle tickets" />
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="t-panel-channel">
              Panel channel
            </label>
            {channelSelect(cfg.panelChannelId, (v) => setCfg((c) => ({ ...c, panelChannelId: v })), "t-panel-channel")}
            <p className="mt-1.5 text-xs text-muted-foreground">The channel with the “Open ticket” button.</p>
          </div>
          <div>
            <label className={labelCls} htmlFor="t-category">
              Ticket category
            </label>
            <select id="t-category" value={cfg.categoryId ?? ""} onChange={(e) => setCfg((c) => ({ ...c, categoryId: e.target.value || null }))} className={inputCls}>
              <option value="">Select a category…</option>
              {cfg.categoryId && !config.categories.some((c) => c.id === cfg.categoryId) && <option value={cfg.categoryId}>(deleted category)</option>}
              {config.categories.map((c) => (
                <option key={c.id} value={c.id} disabled={!c.canManage}>
                  {c.name}
                  {c.canManage ? "" : " — Argus can't manage channels here"}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-muted-foreground">New ticket channels are created inside it.</p>
          </div>
          <div>
            <label className={labelCls} htmlFor="t-log-channel">
              Log channel
            </label>
            {channelSelect(cfg.logChannelId, (v) => setCfg((c) => ({ ...c, logChannelId: v })), "t-log-channel")}
            <p className="mt-1.5 text-xs text-muted-foreground">Closed tickets and ratings are posted here. Optional.</p>
          </div>
        </div>

        <div>
          <p className={labelCls}>Support roles</p>
          <div className="flex flex-wrap gap-2">
            {cfg.supportRoleIds.length === 0 && <span className="text-sm text-muted-foreground">No roles yet — only Administrators can see tickets.</span>}
            {cfg.supportRoleIds.map((id) => {
              const role = config.roles.find((r) => r.id === id);
              return (
                <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft py-1 pl-3 pr-1.5 text-sm text-gold ring-1 ring-gold/20">
                  {role?.name ?? "(deleted role)"}
                  <button type="button" aria-label={`Remove ${role?.name ?? "role"}`} onClick={() => setCfg((c) => ({ ...c, supportRoleIds: c.supportRoleIds.filter((x) => x !== id) }))} className="flex h-5 w-5 items-center justify-center rounded-full transition hover:bg-gold/20">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              );
            })}
          </div>
          {cfg.supportRoleIds.length < 10 && (
            <select
              aria-label="Add a support role"
              value=""
              onChange={(e) => e.target.value && setCfg((c) => ({ ...c, supportRoleIds: [...c.supportRoleIds, e.target.value] }))}
              className={`${inputCls} mt-3 sm:max-w-xs`}
            >
              <option value="">Add a role…</option>
              {availableRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="t-inactive">
              Ask “still needed?” after (hours)
            </label>
            <input id="t-inactive" type="number" min={0} max={720} value={cfg.inactivityHours} onChange={(e) => setCfg((c) => ({ ...c, inactivityHours: Number(e.target.value) }))} className={inputCls} />
            <p className="mt-1.5 text-xs text-muted-foreground">Without messages. Set 0 to never ask.</p>
          </div>
          <div>
            <label className={labelCls} htmlFor="t-grace">
              Then close after (hours)
            </label>
            <input id="t-grace" type="number" min={1} max={168} value={cfg.graceHours} onChange={(e) => setCfg((c) => ({ ...c, graceHours: Number(e.target.value) }))} className={inputCls} />
            <p className="mt-1.5 text-xs text-muted-foreground">If the ticket owner doesn't answer.</p>
          </div>
        </div>
      </Section>

      <Section icon={MessageSquareText} title="Ticket panel" hint="The message with the button members click to open a ticket.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="p-title">
              Title
            </label>
            <input id="p-title" maxLength={256} value={cfg.panel.title} onChange={(e) => setPanel({ title: e.target.value })} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="p-desc">
              Description
            </label>
            <textarea id="p-desc" rows={5} maxLength={4000} value={cfg.panel.description} onChange={(e) => setPanel({ description: e.target.value })} className={`${inputCls} resize-y`} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Use **bold** for bold text and <span className="font-mono text-gold">{"{server}"}</span> for your server name.
            </p>
          </div>
          <div>
            <label className={labelCls} htmlFor="p-color">
              Colour
            </label>
            <ColorField id="p-color" value={cfg.panel.color} onChange={(v) => setPanel({ color: v })} />
          </div>
          <div>
            <label className={labelCls} htmlFor="p-footer">
              Footer
            </label>
            <input id="p-footer" maxLength={2048} value={cfg.panel.footer} onChange={(e) => setPanel({ footer: e.target.value })} placeholder="Optional" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="p-image">
              Big image URL
            </label>
            <input id="p-image" maxLength={500} value={cfg.panel.image} onChange={(e) => setPanel({ image: e.target.value })} placeholder="https://… (optional banner)" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="p-thumb">
              Small image URL
            </label>
            <input id="p-thumb" maxLength={500} value={cfg.panel.thumbnail} onChange={(e) => setPanel({ thumbnail: e.target.value })} placeholder="https://… (optional, top right)" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="p-btn">
              Button text
            </label>
            <input id="p-btn" maxLength={80} value={cfg.panel.buttonLabel} onChange={(e) => setPanel({ buttonLabel: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="p-emoji">
              Button emoji
            </label>
            <input id="p-emoji" maxLength={64} value={cfg.panel.buttonEmoji} onChange={(e) => setPanel({ buttonEmoji: e.target.value })} placeholder="📩 (optional)" className={inputCls} />
          </div>
        </div>

        <div>
          <p className={labelCls}>Preview</p>
          <EmbedPreview {...cfg.panel} button={{ label: cfg.panel.buttonLabel, emoji: cfg.panel.buttonEmoji }} server={serverName} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => panel.mutate()} disabled={panel.isPending || !canSendPanel} className="btn-gold flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
            <Send className="h-4 w-4" /> {panel.isPending ? "Sending…" : saved.panelMessage ? "Update panel in Discord" : "Send panel to Discord"}
          </button>
          <span className="text-xs text-muted-foreground">{dirty ? "Save your changes first — the panel uses saved settings." : !cfg.panelChannelId || !cfg.categoryId ? "Choose a panel channel and a category first." : "Replaces the previous panel, so there are never two."}</span>
        </div>
      </Section>

      <Section icon={FileText} title="Message inside a ticket" hint="What the member sees right after their ticket is created.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="w-title">
              Title
            </label>
            <input id="w-title" maxLength={256} value={cfg.welcome.title} onChange={(e) => setWelcome({ title: e.target.value })} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="w-desc">
              Description
            </label>
            <textarea id="w-desc" rows={5} maxLength={4000} value={cfg.welcome.description} onChange={(e) => setWelcome({ description: e.target.value })} className={`${inputCls} resize-y`} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              <span className="font-mono text-gold">{"{user}"}</span> mentions the member, <span className="font-mono text-gold">{"{server}"}</span> is your server name.
            </p>
          </div>
          <div>
            <label className={labelCls} htmlFor="w-color">
              Colour
            </label>
            <ColorField id="w-color" value={cfg.welcome.color} onChange={(v) => setWelcome({ color: v })} />
          </div>
          <div>
            <label className={labelCls} htmlFor="w-image">
              Image URL
            </label>
            <input id="w-image" maxLength={500} value={cfg.welcome.image} onChange={(e) => setWelcome({ image: e.target.value })} placeholder="https://… (optional)" className={inputCls} />
          </div>
        </div>
        <label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-secondary/30 px-4 py-3">
          <span>
            <span className="block text-sm font-semibold">Ping the support roles</span>
            <span className="block text-xs text-muted-foreground">Mentions every support role when a ticket opens.</span>
          </span>
          <Switch checked={cfg.welcome.pingSupport} onCheckedChange={(v) => setWelcome({ pingSupport: v })} aria-label="Ping support roles" />
        </label>
        <div>
          <p className={labelCls}>Preview</p>
          <EmbedPreview title={cfg.welcome.title} description={cfg.welcome.description} color={cfg.welcome.color} image={cfg.welcome.image} server={serverName} />
        </div>
      </Section>

      <SaveBar dirty={dirty} saving={save.isPending} onSave={() => save.mutate()} onReset={() => setCfg(saved)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Transcripts tab
// ---------------------------------------------------------------------------

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");

function TranscriptViewer({ guildId, id, onClose }: { guildId: string; id: string | null; onClose: () => void }) {
  const q = useQuery({ queryKey: ["ticket-transcript", guildId, id], queryFn: () => getTicketTranscript({ data: { guildId, transcriptId: id! } }), enabled: !!id, retry: false });
  const t = q.data;
  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t ? `#${t.channelName}` : "Transcript"}</DialogTitle>
          <DialogDescription>{t ? `Opened by ${t.ownerTag ?? t.ownerId} · closed ${fmt(t.closedAt)}${t.closeReason ? ` · ${t.closeReason}` : ""}` : "Loading the conversation…"}</DialogDescription>
        </DialogHeader>
        {q.isLoading && <Skeleton className="h-48 w-full" />}
        {q.error && <p className="text-sm text-destructive">{errorText(q.error)}</p>}
        {t && (
          <ol className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
            {t.messages.length === 0 && <li className="text-sm text-muted-foreground">This ticket has no messages.</li>}
            {t.messages.map((m) => (
              <li key={m.id} className="flex gap-3">
                {isHttps(m.avatar) ? <img src={m.avatar} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full" /> : <span className="h-9 w-9 shrink-0 rounded-full bg-secondary" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">{m.author}</span>
                    {m.bot && <span className="ml-1.5 rounded bg-[#5865f2] px-1 py-0.5 align-middle text-[10px] font-bold text-white">BOT</span>}
                    <span className="ml-2 text-xs text-muted-foreground">{fmt(m.at)}</span>
                  </p>
                  {m.content && <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{m.content}</p>}
                  {m.embeds.map((e, i) => (
                    <div key={i} className="mt-1.5 rounded-lg border-l-4 border-gold/60 bg-secondary/40 p-2.5 text-sm">
                      {e.title && <p className="font-semibold">{e.title}</p>}
                      {e.description && <p className="mt-0.5 whitespace-pre-wrap break-words text-muted-foreground">{e.description}</p>}
                    </div>
                  ))}
                  {m.attachments.map((a) => (
                    <p key={a.url} className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Paperclip className="h-3.5 w-3.5" />
                      {isHttps(a.url) ? (
                        <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                          {a.name}
                        </a>
                      ) : (
                        a.name
                      )}
                    </p>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TranscriptsTab({ guildId }: { guildId: string }) {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["ticket-transcripts", guildId, search, offset], queryFn: () => getTicketTranscripts({ data: { guildId, q: search, offset } }), retry: false, placeholderData: (prev) => prev });
  const data = q.data;
  const rows: TicketTranscriptRow[] = data?.transcripts ?? [];

  return (
    <div className="space-y-4">
      <form
        className="glass flex flex-wrap items-center gap-3 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          setOffset(0);
          setSearch(input);
        }}
      >
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search by member, Discord ID or ticket name" aria-label="Search transcripts" className={`${inputCls} pl-10`} />
        </div>
        <button type="submit" className="btn-gold rounded-xl px-5 py-2.5 text-sm">
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setInput("");
              setSearch("");
              setOffset(0);
            }}
            className="btn-ghost rounded-xl px-4 py-2.5 text-sm"
          >
            Clear
          </button>
        )}
      </form>

      {q.error && <p className="text-sm text-destructive">{errorText(q.error)}</p>}

      <div className="glass overflow-hidden">
        {q.isLoading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">{search ? "No tickets match your search" : "No transcripts yet"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{search ? "Try a member's name or Discord ID." : "A transcript is saved automatically every time a ticket on this server is closed."}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => setOpen(r.id)} className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3.5 text-left transition hover:bg-accent/40 sm:grid-cols-[1.2fr_1fr_auto_auto]">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">#{r.channelName}</span>
                    <span className="block truncate text-xs text-muted-foreground">{r.ownerTag ?? r.ownerId}</span>
                  </span>
                  <span className="hidden min-w-0 sm:block">
                    <span className="block truncate text-sm">{r.closedByTag ?? "Closed automatically"}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {fmt(r.closedAt)}
                    </span>
                  </span>
                  <span className="hidden text-xs tabular-nums text-muted-foreground sm:block">{r.messageCount} msg</span>
                  <span className="justify-self-end">{r.rating ? <Stars value={r.rating} /> : <span className="text-xs text-muted-foreground">Not rated</span>}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data && data.total > data.limit && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {data.offset + 1}–{Math.min(data.offset + data.limit, data.total)} of {data.total}
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - data.limit))} className="btn-ghost flex items-center gap-1 rounded-xl px-3 py-2 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" /> Newer
            </button>
            <button type="button" disabled={offset + data.limit >= data.total} onClick={() => setOffset(offset + data.limit)} className="btn-ghost flex items-center gap-1 rounded-xl px-3 py-2 disabled:opacity-40">
              Older <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <TranscriptViewer guildId={guildId} id={open} onClose={() => setOpen(null)} />
    </div>
  );
}

// ---------------------------------------------------------------------------

function TicketsPage() {
  const { guildId } = Route.useParams();
  const [tab, setTab] = useState<"settings" | "transcripts">("settings");
  const configQ = useQuery({ queryKey: ["tickets", guildId], queryFn: () => getTicketConfig({ data: { guildId } }), retry: false });
  const guildQ = useQuery({ queryKey: ["guild", guildId], queryFn: () => getGuild({ data: { guildId } }), staleTime: 5 * 60_000, retry: false });

  if (configQ.error)
    return (
      <div className="glass p-10 text-center">
        <LockKeyhole className="mx-auto h-8 w-8 text-gold" />
        <h2 className="mt-3 text-xl font-bold">Tickets are for administrators</h2>
        <p className="mt-2 text-sm text-muted-foreground">{errorText(configQ.error)}</p>
      </div>
    );

  const tabs = [
    { id: "settings", label: "Settings", icon: Settings2 },
    { id: "transcripts", label: "Transcripts", icon: FileText },
  ] as const;

  return (
    <div className="space-y-6">
      <RatingCard guildId={guildId} />

      <div role="tablist" aria-label="Tickets" className="glass inline-flex gap-1 p-1">
        {tabs.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} onClick={() => setTab(x.id)} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${tab === x.id ? "bg-gold-soft text-gold" : "text-muted-foreground hover:text-foreground"}`}>
            <x.icon className="h-4 w-4" />
            {x.label}
          </button>
        ))}
      </div>

      {tab === "settings" &&
        (configQ.data ? (
          <SettingsTab guildId={guildId} config={configQ.data} serverName={guildQ.data?.name ?? "Your Server"} />
        ) : (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ))}
      {tab === "transcripts" && <TranscriptsTab guildId={guildId} />}
    </div>
  );
}