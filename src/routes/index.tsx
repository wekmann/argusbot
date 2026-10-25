import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, BarChart3, Check, Folder, Hash, LayoutDashboard, LogIn, PartyPopper, Plus, ScrollText, ShieldCheck, Sparkles, Star, Ticket, UserPlus } from "lucide-react";
import { Shell, meQuery } from "@/components/Shell";
import { CountUp, Reveal } from "@/components/motion";
import { getBotStatus } from "@/lib/argus.functions";
import { botInviteUrl } from "@/lib/invite";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  validateSearch: z.object({ error: z.string().optional(), reason: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Argus — Discord Moderation Bot" },
      { name: "description", content: "Argus is the all-seeing Discord bot: auto-moderation, logs, tickets, welcome messages and an AI server builder." },
      { property: "og:title", content: "Argus — Discord Moderation Bot" },
      { property: "og:description", content: "Auto-moderation, logs, tickets, welcome messages and AI-built server architecture." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/* ------------------------------------------------------------------ */
/* Small building blocks for the product mock-ups                      */
/* ------------------------------------------------------------------ */

function MockWindow({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("glass overflow-hidden", className)} aria-hidden>
      <div className="flex items-center gap-1.5 border-b border-border/70 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        <span className="ml-3 truncate text-xs text-muted-foreground">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Pill({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "success" | "muted" | "destructive" | "violet" }) {
  const tones = {
    gold: "bg-gold-soft text-gold ring-gold/25",
    success: "bg-success/15 text-success ring-success/30",
    muted: "bg-secondary text-muted-foreground ring-border",
    destructive: "bg-destructive/15 text-destructive ring-destructive/30",
    violet: "bg-violet/15 text-violet ring-violet/30",
  } as const;
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1", tones[tone])}>{children}</span>;
}

function FakeSwitch({ on = true }: { on?: boolean }) {
  return (
    <span className={cn("relative inline-block h-5 w-9 shrink-0 rounded-full transition", on ? "bg-gold" : "bg-secondary ring-1 ring-border")}>
      <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all", on ? "left-[1.1rem]" : "left-0.5")} />
    </span>
  );
}

function Mention({ children = "@NewMember" }: { children?: string }) {
  return <span className="rounded bg-[#5865f2]/30 px-1 font-medium text-[#c9cdfb]">{children}</span>;
}

/* ---- hero: dashboard mock-up ---- */
const MODULES = [
  { icon: ShieldCheck, name: "Auto-Moderation", hint: "Banned words · instant punishment" },
  { icon: PartyPopper, name: "Welcome & auto-role", hint: "Embed greeting · ghost ping" },
  { icon: Ticket, name: "Tickets & transcripts", hint: "Private support · ratings" },
  { icon: ScrollText, name: "Moderation logs", hint: "Every action recorded" },
] as const;

function HeroMock() {
  return (
    <MockWindow title="Argus · Dashboard" className="shadow-[0_30px_80px_-30px_oklch(0.8_0.15_75/0.35)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/favicon.png" alt="" width={36} height={36} className="h-9 w-9 rounded-xl ring-1 ring-gold/40" />
          <div>
            <p className="text-sm font-bold leading-tight">Your server</p>
            <p className="text-[11px] text-muted-foreground">Server dashboard</p>
          </div>
        </div>
        <Pill tone="success">{MODULES.length}/{MODULES.length} modules on</Pill>
      </div>
      <ul className="mt-4 space-y-2">
        {MODULES.map((m) => (
          <li key={m.name} className="flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/30 px-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-soft text-gold">
              <m.icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{m.name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{m.hint}</span>
            </span>
            <FakeSwitch />
          </li>
        ))}
      </ul>
    </MockWindow>
  );
}

/* ---- feature mock-ups ---- */
function AutoModMock() {
  return (
    <MockWindow title="Dashboard · Auto-Moderation">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">Auto-Moderation</p>
        <div className="flex items-center gap-2">
          <Pill tone="success">ACTIVE</Pill>
          <FakeSwitch />
        </div>
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Banned words</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {["spam", "free nitro", "scam", "discord.gg/"].map((w) => (
          <span key={w} className="rounded-full bg-gold-soft px-3 py-1 text-xs text-gold ring-1 ring-gold/20">
            {w}
          </span>
        ))}
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Punishment</p>
      <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl border border-border bg-secondary/30 p-1 text-center text-xs font-bold">
        <span className="rounded-lg bg-gold-soft py-2 text-gold ring-1 ring-gold/40">Mute</span>
        <span className="py-2 text-muted-foreground">Kick</span>
        <span className="py-2 text-muted-foreground">Ban</span>
      </div>
    </MockWindow>
  );
}

function LogsMock() {
  const rows = [
    { a: "BAN", tone: "destructive", who: "user_8841", why: "Posting scam links", when: "2 min ago" },
    { a: "MUTE", tone: "violet", who: "user_1207", why: "Spam in #general", when: "18 min ago" },
    { a: "KICK", tone: "gold", who: "user_5530", why: "Banned word (auto-mod)", when: "1 h ago" },
  ] as const;
  return (
    <MockWindow title="Dashboard · Logs (example data)">
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.who} className="flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/30 px-3 py-2.5">
            <Pill tone={r.tone}>{r.a}</Pill>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{r.who}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{r.why}</span>
            </span>
            <span className="shrink-0 text-[11px] text-muted-foreground">{r.when}</span>
          </li>
        ))}
      </ul>
    </MockWindow>
  );
}

function WelcomeMock() {
  return (
    <MockWindow title="#welcome">
      <div className="rounded-2xl bg-[#313338] p-3 text-[#dbdee1]">
        <p className="text-sm">
          <span className="font-semibold text-white">Argus</span>
          <span className="ml-1.5 rounded bg-[#5865f2] px-1 py-0.5 align-middle text-[10px] font-bold text-white">BOT</span>
        </p>
        <p className="mt-0.5 text-sm">
          <Mention />
        </p>
        <div className="mt-1.5 flex gap-3 rounded border-l-4 border-gold bg-[#2b2d31] p-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">Welcome to Your Server!</p>
            <p className="mt-1 text-xs">
              Hey <Mention />, glad to have you here. You are member #128.
            </p>
          </div>
          <div className="h-12 w-12 shrink-0 rounded-lg bg-gradient-to-br from-[#5865f2] to-[#eb459e]" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        <Pill tone="success">
          <UserPlus className="mr-1 h-3 w-3" /> Role: Member
        </Pill>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-muted-foreground ring-1 ring-border">
          <Mention /> <span className="opacity-70">ghost ping · gone in 5 s</span>
        </span>
      </div>
    </MockWindow>
  );
}

function TicketsMock() {
  return (
    <MockWindow title="#ticket-0042">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">Support ticket</p>
        <Pill tone="muted">Closed</Pill>
      </div>
      <div className="mt-3 space-y-2 text-xs">
        <p className="max-w-[80%] rounded-2xl rounded-bl-sm bg-secondary/60 px-3 py-2">Hi, how do I set up the welcome message?</p>
        <p className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-gold-soft px-3 py-2 text-gold">Open the Welcome tab in the dashboard — it has a live preview.</p>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-border/70 bg-secondary/30 px-3 py-2.5">
        <span className="flex gap-0.5 text-gold" aria-label="5 stars">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className="h-4 w-4 fill-current" />
          ))}
        </span>
        <span className="text-[11px] font-semibold text-gold">View transcript →</span>
      </div>
    </MockWindow>
  );
}

const BARS = [3, 2, 2, 1, 1, 2, 4, 6, 8, 9, 7, 6, 8, 10, 12, 11, 9, 8, 10, 13, 12, 9, 6, 4];
function StatsMock() {
  return (
    <MockWindow title="Dashboard · Statistics">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Message activity · last 24 h</p>
      <div className="mt-4 flex h-32 items-end gap-1">
        {BARS.map((v, i) => (
          <span key={i} className="bar-col flex-1 rounded-t bg-gradient-to-t from-gold/40 to-gold" style={{ height: `${(v / 13) * 100}%`, "--d": `${i * 25}ms` } as CSSProperties} />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>24 h ago</span>
        <span>now</span>
      </div>
    </MockWindow>
  );
}

function AiMock() {
  return (
    <MockWindow title="Dashboard · AI Build">
      <p className="rounded-xl border border-border bg-input/30 px-3 py-2.5 text-xs text-muted-foreground">A friendly gaming community with news, voice chats and a support area…</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        {[
          { cat: "INFO", ch: ["rules", "announcements"] },
          { cat: "COMMUNITY", ch: ["general", "media"] },
        ].map((c) => (
          <div key={c.cat} className="rounded-xl border border-border/70 bg-secondary/30 p-3">
            <p className="flex items-center gap-1.5 font-bold text-gold">
              <Folder className="h-3.5 w-3.5" /> {c.cat}
            </p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {c.ch.map((n) => (
                <li key={n} className="flex items-center gap-1.5">
                  <Hash className="h-3 w-3" /> {n}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="flex gap-1.5">
          <Pill tone="violet">Admin</Pill>
          <Pill tone="gold">Mod</Pill>
          <Pill tone="muted">Member</Pill>
        </span>
        <span className="btn-gold rounded-lg px-3 py-1.5 text-xs">Apply to server</span>
      </div>
    </MockWindow>
  );
}

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: ShieldCheck,
    kicker: "Auto-Moderation",
    title: "Bad messages disappear before anyone reads them",
    text: "Add banned words once and Argus deletes matching messages instantly, then punishes the author the way you choose.",
    points: ["Up to 200 banned words", "Mute, kick or ban as the punishment", "Changes apply instantly, no restart"],
    mock: <AutoModMock />,
  },
  {
    icon: ScrollText,
    kicker: "Moderation logs",
    title: "A clear record of every action",
    text: "Bans, kicks and timeouts are saved with the moderator, the reason and the time, and the latest ones show up right on your overview.",
    points: ["Moderator, target, reason and time", "Latest actions on the server overview", "Old entries are cleaned up automatically"],
    mock: <LogsMock />,
  },
  {
    icon: PartyPopper,
    kicker: "Welcome & auto-role",
    title: "Make a great first impression",
    text: "Give every newcomer a role, greet them with a message or embed of your own design, and ghost-ping them so they can't miss where to start.",
    points: ["Auto-role for every new member", "Text and embed with {user}, {server} and more", "Ghost ping that vanishes after 5 seconds", "Live preview while you edit"],
    mock: <WelcomeMock />,
  },
  {
    icon: Ticket,
    kicker: "Tickets & transcripts",
    title: "Support that stays organised",
    text: "Members open private tickets, your team helps them, and every closed ticket gets a rating and a shareable transcript page.",
    points: ["Private ticket channels", "Inactive tickets close automatically", "Ratings and transcripts for every ticket"],
    mock: <TicketsMock />,
  },
  {
    icon: BarChart3,
    kicker: "Live statistics",
    title: "See how your community moves",
    text: "Message activity per hour and member growth over the last 30 days, drawn as clean interactive charts.",
    points: ["Messages per hour, last 24 h", "Member count for the last 30 days"],
    mock: <StatsMock />,
  },
  {
    icon: Sparkles,
    kicker: "AI Server Builder",
    title: "Describe your server. Argus builds it.",
    text: "Tell Argus what your community is about and it designs roles, categories and channels — review the plan, then apply it with one click.",
    points: ["Roles, categories and channels in one plan", "You approve it before anything is created"],
    mock: <AiMock />,
  },
] as const;

const STEPS = [
  { icon: Plus, title: "Add Argus to your server", text: "Pick your server in Discord and confirm the invite." },
  { icon: LogIn, title: "Log in with Discord", text: "One click, no passwords. We only see the servers you manage." },
  { icon: LayoutDashboard, title: "Configure in the dashboard", text: "Turn on the modules you need and tune them live." },
] as const;

function formatCount(n: number | null | undefined) {
  return n == null ? "—" : n.toLocaleString();
}

function Index() {
  const { error, reason } = Route.useSearch();
  const status = useQuery({ queryKey: ["bot-status"], queryFn: () => getBotStatus(), refetchInterval: 30_000 });
  const me = useQuery(meQuery).data;
  const s = status.data?.ok ? status.data.status : null;

  return (
    <Shell>
      {/* ---------------- Hero ---------------- */}
      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
        <div className="relative z-10">
          {error && (
            <div className="animate-pop-in mb-6 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
              {error === "config" ? "Discord login is not configured yet." : t.loginError}
              {reason && <span className="ml-2 font-mono text-xs text-muted-foreground">({reason})</span>}
            </div>
          )}

          <Link
            to="/status"
            className="animate-pop-in inline-flex items-center gap-2.5 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-xs font-semibold tracking-wide transition hover:border-gold/60"
          >
            <span className={`live-dot h-2 w-2 rounded-full ${s ? (s.online ? "bg-success" : "bg-destructive") : "bg-muted-foreground"}`} />
            {s ? (s.online ? `Online${s.ping != null ? ` · ${s.ping} ms` : ""}` : "Currently offline") : "Checking status…"}
            <ArrowRight className="h-3.5 w-3.5 text-gold" />
          </Link>

          <h1 className="mt-7 font-sans text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            Run your Discord server with <span className="text-shimmer">Argus</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            The all-seeing guardian for your community: auto-moderation, logs, tickets, welcome messages and an AI server builder — all in one dashboard.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href={botInviteUrl()} target="_blank" rel="noreferrer" className="btn-gold flex items-center gap-2 rounded-xl px-7 py-3.5 text-base">
              <Plus className="h-5 w-5" /> {t.addToServer}
            </a>
            <a href="#features" className="btn-ghost flex items-center gap-2 rounded-xl px-7 py-3.5 text-base">
              {t.learnMore} <ArrowRight className="h-4 w-4 text-gold" />
            </a>
          </div>

          <dl className="mt-10 flex gap-10">
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">Servers</dt>
              <dd className="mt-1 font-mono text-3xl font-bold tabular-nums">{s ? <CountUp value={s.guilds} /> : formatCount(null)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">Members watched</dt>
              <dd className="mt-1 font-mono text-3xl font-bold tabular-nums">{s?.users != null ? <CountUp value={s.users} /> : formatCount(null)}</dd>
            </div>
          </dl>
          {status.data && !status.data.ok && (
            <p className="mt-4 text-sm text-destructive">
              {status.data.error} <span className="opacity-70">({status.data.code})</span>
            </p>
          )}
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="pointer-events-none absolute -inset-1 rounded-full bg-gold/15 blur-3xl sm:-inset-6" />
          <div className="relative">
            <HeroMock />
          </div>
        </div>
      </section>

      {/* ---------------- Features ---------------- */}
      <section id="features" className="mx-auto max-w-7xl scroll-mt-24 px-5 pb-12">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-gold">Features</p>
          <h2 className="mt-3 font-sans text-3xl font-black tracking-tight md:text-5xl">Everything your server needs</h2>
          <p className="mt-4 text-muted-foreground">Moderation, support and growth tools in one place — fast to set up, pleasant to use.</p>
        </Reveal>

        <div className="mt-16 space-y-20 md:space-y-28">
          {FEATURES.map((f, i) => (
            <Reveal key={f.kicker}>
              <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
                <div className={cn(i % 2 === 1 && "md:order-2")}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-soft ring-1 ring-gold/25">
                    <f.icon className="h-6 w-6 text-gold" />
                  </span>
                  <p className="mt-5 text-sm font-semibold uppercase tracking-[0.3em] text-gold">{f.kicker}</p>
                  <h3 className="mt-2 font-sans text-2xl font-extrabold tracking-tight md:text-3xl">{f.title}</h3>
                  <p className="mt-4 leading-relaxed text-muted-foreground">{f.text}</p>
                  <ul className="mt-5 space-y-2.5">
                    {f.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={cn("relative", i % 2 === 1 && "md:order-1")}>
                  <div className="pointer-events-none absolute -inset-4 rounded-full bg-gold/10 blur-3xl" />
                  <div className="relative">{f.mock}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Get started ---------------- */}
      <section id="start" className="mx-auto max-w-7xl scroll-mt-24 px-5 pb-24 pt-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-gold">Get started</p>
          <h2 className="mt-3 font-sans text-3xl font-black tracking-tight md:text-5xl">Ready in three steps</h2>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((st, i) => (
            <Reveal key={st.title} delay={i * 100}>
              <div className="glass relative h-full p-6">
                <span className="absolute right-5 top-4 font-mono text-5xl font-black text-gold/15">{i + 1}</span>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-soft ring-1 ring-gold/25">
                  <st.icon className="h-6 w-6 text-gold" />
                </span>
                <h3 className="mt-5 font-sans text-lg font-bold">{st.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{st.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <section className="mx-auto max-w-7xl px-5 pb-28">
        <Reveal>
          <div className="glass relative overflow-hidden p-10 text-center md:p-16">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />
            <h2 className="relative font-sans text-3xl font-black tracking-tight md:text-5xl">Let Argus watch over your community</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-muted-foreground">Add the bot, sign in with Discord and open your dashboard in under a minute.</p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <a href={botInviteUrl()} target="_blank" rel="noreferrer" className="btn-gold inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg">
                <Plus className="h-5 w-5" /> {t.addToServer}
              </a>
              {me ? (
                <Link to="/dashboard" className="btn-ghost inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg">
                  <LayoutDashboard className="h-5 w-5 text-gold" /> {t.dashboard}
                </Link>
              ) : (
                <a href="/api/auth/login" className="btn-ghost inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg">
                  <LogIn className="h-5 w-5 text-gold" /> {t.login}
                </a>
              )}
            </div>
          </div>
        </Reveal>
      </section>
    </Shell>
  );
}