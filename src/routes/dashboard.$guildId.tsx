import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LoginGate, Shell } from "@/components/Shell";
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
    <Shell>
      <LoginGate>
        <GuildLayout />
      </LoginGate>
    </Shell>
  ),
});

function GuildLayout() {
  const { guildId } = Route.useParams();
  const q = useQuery({ queryKey: ["guild", guildId], queryFn: () => getGuild({ data: { guildId } }) });
  const tab = "rounded-xl px-4 py-2 text-sm text-muted-foreground hover:text-foreground";
  const active = { className: "rounded-xl px-4 py-2 text-sm bg-gold-soft text-gold" };
  if (q.error) return <p className="p-20 text-center text-destructive">You don't have access to this server.</p>;
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-gold">← {t.servers}</Link>
      <h1 className="mt-3 text-4xl font-bold">{q.data?.name ?? "…"}</h1>
      <nav className="glass mt-6 inline-flex gap-1 p-1">
        <Link to="/dashboard/$guildId" params={{ guildId }} activeOptions={{ exact: true }} className={tab} activeProps={active}>Overview</Link>
        <Link to="/dashboard/$guildId/aibuild" params={{ guildId }} className={tab} activeProps={active}>AI Build</Link>
        <Link to="/dashboard/$guildId/logs" params={{ guildId }} className={tab} activeProps={active}>Logs</Link>
      </nav>
      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
