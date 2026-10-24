import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronRight, Plus, Search } from "lucide-react";
import { useBotInvite } from "@/components/InviteBot";
import { LoginGate, Shell } from "@/components/Shell";
import { Reveal, Skeleton, Spotlight } from "@/components/motion";
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
  const [search, setSearch] = useState("");
  const invite = useBotInvite();
  const list = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (q.data ?? [])
      .filter((g) => !needle || g.name.toLowerCase().includes(needle))
      // servers where Argus is active first
      .sort((a, b) => Number(b.botPresent === true) - Number(a.botPresent === true) || a.name.localeCompare(b.name));
  }, [q.data, search]);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black">{t.servers}</h1>
          <p className="mt-2 text-muted-foreground">{t.serversHint}</p>
        </div>
        {(q.data?.length ?? 0) > 6 && (
          <label className="relative block w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search servers…"
              className="w-full rounded-xl border border-border bg-input/30 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gold"
            />
          </label>
        )}
      </div>

      {q.error && <p className="mt-10 text-destructive">Couldn't load servers: {q.error.message}</p>}
      {q.data?.length === 0 && <p className="mt-10 text-muted-foreground">No servers with admin permissions found.</p>}
      {q.data && q.data.length > 0 && list.length === 0 && <p className="mt-10 text-muted-foreground">Nothing matches “{search}”.</p>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {q.isLoading &&
          Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="glass flex items-center gap-4 p-5">
              <Skeleton className="h-14 w-14 !rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}

        {list.map((g, i) => {
          const botMissing = g.botPresent === false;
          const content = (
            <>
              {g.icon ? (
                <img src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=96`} alt="" width={56} height={56} loading="lazy" className="h-14 w-14 rounded-xl ring-1 ring-border transition group-hover:ring-gold/60" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gold-soft font-display text-xl text-gold">{g.name[0]}</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold transition group-hover:text-gold">{g.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`h-1.5 w-1.5 rounded-full ${g.botPresent ? "bg-success" : botMissing ? "bg-muted-foreground/50" : "bg-warning"}`} />
                  {g.botPresent === null ? "Manage" : g.botPresent ? "Argus is active" : t.botMissing}
                </p>
              </div>
              {botMissing ? (
                <Plus className="h-5 w-5 text-muted-foreground transition group-hover:rotate-90 group-hover:text-gold" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-gold" />
              )}
            </>
          );
          return (
            <Reveal key={g.id} delay={Math.min(i, 8) * 50}>
              {botMissing ? (
                // No bot on this server yet: open Discord's "add bot" window first, dashboard comes after.
                <Spotlight as="button" type="button" onClick={() => invite.start(g)} className="group flex w-full items-center gap-4 p-5 text-left">
                  {content}
                </Spotlight>
              ) : (
                <Spotlight as={Link} to="/dashboard/$guildId" params={{ guildId: g.id }} className="group flex items-center gap-4 p-5">
                  {content}
                </Spotlight>
              )}
            </Reveal>
          );
        })}
      </div>
      {invite.dialog}
    </div>
  );
}