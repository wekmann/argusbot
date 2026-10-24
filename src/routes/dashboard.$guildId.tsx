import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, LayoutDashboard, ScrollText, ShieldCheck, Sparkles } from "lucide-react";
import { LoginGate, Shell } from "@/components/Shell";
import { Skeleton } from "@/components/motion";
import { getGuild } from "@/lib/argus.functions";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard/$guildId")({
  head: () => ({
    meta: [
      { title: "Manage Server — Argus" },
      { name: "description", content: "Manage moderation, logs and AI server builder for your Discord server." },
      { property: "og:title", content: "Manage Server — Argus" },
      { property: "og:description", content: "Manage your Discord server with Argus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <Shell bare>
      <LoginGate>
        <GuildLayout />
      </LoginGate>
    </Shell>
  ),
});

function GuildLayout() {
  const { guildId } = Route.useParams();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const q = useQuery({ queryKey: ["guild", guildId], queryFn: () => getGuild({ data: { guildId } }), staleTime: 5 * 60_000, retry: false });

  if (q.error)
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <div className="glass p-10">
          <h2 className="text-xl font-bold">No access</h2>
          <p className="mt-2 text-sm text-muted-foreground">You don't have access to this server, or Argus isn't on it.</p>
          <Link to="/dashboard" className="btn-ghost mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
            <ArrowLeft className="h-4 w-4" /> {t.servers}
          </Link>
        </div>
      </div>
    );

  const nav = [
    { to: "/dashboard/$guildId", label: t.overview, icon: LayoutDashboard, exact: true },
    { to: "/dashboard/$guildId/stats", label: "Statistics", icon: BarChart3 },
    { to: "/dashboard/$guildId/logs", label: "Logs", icon: ScrollText },
    { to: "/dashboard/$guildId/automod", label: "Auto-Mod", icon: ShieldCheck },
    { to: "/dashboard/$guildId/aibuild", label: "AI Build", icon: Sparkles },
  ] as const;

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[17rem_1fr] lg:gap-8 lg:py-10">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-gold">
          <ArrowLeft className="h-4 w-4" /> {t.servers}
        </Link>

        <div className="glass mt-4 flex items-center gap-3 p-3">
          {q.data ? (
            q.data.icon ? (
              <img src={`https://cdn.discordapp.com/icons/${q.data.id}/${q.data.icon}.png?size=96`} alt="" width={48} height={48} className="h-12 w-12 rounded-xl ring-1 ring-gold/30" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-soft font-display text-xl text-gold">{q.data.name[0]}</div>
            )
          ) : (
            <Skeleton className="h-12 w-12" />
          )}
          <div className="min-w-0 flex-1">
            {q.data ? <p className="truncate font-bold leading-tight">{q.data.name}</p> : <Skeleton className="h-5 w-32" />}
            <p className="mt-0.5 text-xs text-muted-foreground">Server dashboard</p>
          </div>
        </div>

        <nav className="-mx-5 mt-4 flex gap-1 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              params={{ guildId }}
              activeOptions={{ exact: "exact" in n }}
              className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
              activeProps={{ className: "nav-active" }}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div key={pathname} className="page-in min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
