import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Boxes, Hash, LayoutTemplate, LogIn, Plus, Search, Shield, Users } from "lucide-react";
import { Shell, meQuery } from "@/components/Shell";
import { Reveal, Skeleton, Spotlight } from "@/components/motion";
import { StarsRow, discordAvatar } from "@/components/TemplateBits";
import { addTemplate, listTemplates } from "@/lib/templates.functions";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/templates/")({
  head: () => ({
    meta: [
      { title: "Templates — Argus" },
      { name: "description", content: "Community Discord server templates with a live preview of roles and channels. Browse, rate and share." },
      { property: "og:title", content: "Templates — Argus" },
      { property: "og:description", content: "Community Discord server templates with a live preview." },
    ],
  }),
  component: TemplatesPage,
});

const PAGE = 24;
const sorts = [
  { key: "new", label: "Newest" },
  { key: "top", label: "Top rated" },
  { key: "popular", label: "Most used" },
] as const;

function TemplatesPage() {
  const navigate = useNavigate();
  const { data: me } = useQuery(meQuery);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sort, setSort] = useState<(typeof sorts)[number]["key"]>("new");
  const [page, setPage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(id);
  }, [search]);

  const q = useQuery({
    queryKey: ["templates", debounced, sort, page],
    queryFn: () => listTemplates({ data: { q: debounced, sort, offset: page * PAGE } }),
    placeholderData: keepPreviousData,
  });

  const add = useMutation({
    mutationFn: () => addTemplate({ data: { link } }),
    onSuccess: (r) => {
      if (r.ok || r.id) {
        navigate({ to: "/templates/$id", params: { id: r.id! } });
        return;
      }
      setError(r.ok ? null : r.error);
    },
    onError: () => setError("Something went wrong. Try again."),
  });

  const total = q.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-5 py-12">
        <Link to="/" className="text-sm text-muted-foreground hover:text-gold">← Home</Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-gold-gradient">{t.templates}</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Discord server templates shared by the community. Open one to see exactly which roles and channels it creates.
            </p>
          </div>
          {me ? (
            <button type="button" onClick={() => setAdding((v) => !v)} className="btn-gold flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
              <Plus className="h-4 w-4" /> Add template
            </button>
          ) : (
            <a href="/api/auth/login" className="btn-ghost flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
              <LogIn className="h-4 w-4 text-gold" /> Log in to add a template
            </a>
          )}
        </div>

        {me && adding && (
          <div className="glass page-in mt-6 p-5">
            <p className="text-sm font-semibold">Paste a Discord template link</p>
            <p className="mt-1 text-xs text-muted-foreground">
              In Discord: Server Settings → Server Template → create and copy the link (it looks like <span className="font-mono">discord.new/AbCdEf</span>).
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                value={link}
                onChange={(e) => { setLink(e.target.value); setError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter" && link.trim() && !add.isPending) add.mutate(); }}
                placeholder="https://discord.new/…"
                maxLength={200}
                className="flex-1 rounded-xl border border-border bg-input/30 px-4 py-2.5 text-sm outline-none transition focus:border-gold"
              />
              <button type="button" disabled={add.isPending || !link.trim()} onClick={() => add.mutate()} className="btn-gold rounded-xl px-6 py-2.5 text-sm disabled:opacity-50">
                {add.isPending ? "Checking…" : "Add"}
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              maxLength={80}
              className="w-full rounded-xl border border-border bg-input/30 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gold"
            />
          </div>
          <div className="flex gap-1 rounded-xl border border-border p-1">
            {sorts.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => { setSort(s.key); setPage(0); }}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${sort === s.key ? "bg-gold-soft text-gold" : "text-muted-foreground hover:text-foreground"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {q.isError && (
          <div className="mt-6 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
            Templates are unavailable right now. Try again in a moment.
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {q.isLoading &&
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
          {q.data?.templates.map((tpl, i) => (
            <Reveal key={tpl.id} delay={Math.min(i, 8) * 40}>
              <Spotlight as={Link} to="/templates/$id" params={{ id: tpl.id }} className="group flex h-full flex-col p-5">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold">
                    <LayoutTemplate className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold transition group-hover:text-gold">{tpl.name}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <StarsRow value={tpl.rating.average} size={14} />
                      <span className="text-xs text-muted-foreground">
                        {tpl.rating.count ? `${tpl.rating.average.toFixed(1)} (${tpl.rating.count})` : "No reviews yet"}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 flex-1 text-sm text-muted-foreground">{tpl.description ?? "No description."}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" />{tpl.counts.roles} roles</span>
                  <span className="flex items-center gap-1"><Boxes className="h-3.5 w-3.5" />{tpl.counts.categories} categories</span>
                  <span className="flex items-center gap-1"><Hash className="h-3.5 w-3.5" />{tpl.counts.channels} channels</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{tpl.usageCount} uses</span>
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <img src={discordAvatar(tpl.author)} alt="" width={20} height={20} className="h-5 w-5 rounded-full" />
                  <span className="truncate">{tpl.author.name}</span>
                </div>
              </Spotlight>
            </Reveal>
          ))}
        </div>

        {q.data && q.data.templates.length === 0 && (
          <div className="glass mt-6 p-10 text-center text-sm text-muted-foreground">
            {debounced ? "No templates match your search." : "No templates yet — be the first to add one."}
          </div>
        )}

        {pages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3 text-sm">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="btn-ghost rounded-xl px-4 py-2 disabled:opacity-40">← Prev</button>
            <span className="text-muted-foreground">{page + 1} / {pages}</span>
            <button type="button" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)} className="btn-ghost rounded-xl px-4 py-2 disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>
    </Shell>
  );
}