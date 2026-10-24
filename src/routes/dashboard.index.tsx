import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LoginGate, Shell } from "@/components/Shell";
import { getAdminGuilds } from "@/lib/argus.functions";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Your Servers — Argus Dashboard" },
      { name: "description", content: "Choose a Discord server to manage with Argus." },
      { property: "og:title", content: "Your Servers — Argus Dashboard" },
      { property: "og:description", content: "Choose a Discord server to manage with Argus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <Shell>
      <LoginGate>
        <Servers />
      </LoginGate>
    </Shell>
  ),
});

function Servers() {
  const q = useQuery({ queryKey: ["guilds"], queryFn: () => getAdminGuilds(), staleTime: 60_000 });
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="text-4xl font-bold">{t.servers}</h1>
      <p className="mt-2 text-muted-foreground">{t.serversHint}</p>
      {q.isLoading && <p className="mt-10 text-muted-foreground">Loading servers…</p>}
      {q.error && <p className="mt-10 text-destructive">Couldn't load servers: {q.error.message}</p>}
      {q.data?.length === 0 && <p className="mt-10 text-muted-foreground">No servers with admin permissions found.</p>}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {q.data?.map((g) => (
          <Link key={g.id} to="/dashboard/$guildId" params={{ guildId: g.id }} className="glass group flex items-center gap-4 p-5 transition hover:border-gold">
            {g.icon ? (
              <img src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=96`} alt="" className="h-14 w-14 rounded-xl" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gold-soft font-display text-xl text-gold">{g.name[0]}</div>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold group-hover:text-gold">{g.name}</p>
              <p className="text-xs text-muted-foreground">
                {g.botPresent === null ? "Manage" : g.botPresent ? "Argus is active" : "Argus not added yet"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
