import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowUp, LayoutDashboard, LogIn, LogOut, Plus } from "lucide-react";
import { getMe } from "@/lib/argus.functions";
import { botInviteUrl } from "@/lib/invite";
import { t } from "@/lib/i18n";
import { Skeleton } from "@/components/motion";

export const meQuery = { queryKey: ["me"], queryFn: () => getMe(), staleTime: 5 * 60_000 };

export function avatarUrl(u: { id: string; avatar: string | null }) {
  return u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64` : "/favicon.png";
}

export function Shell({ children, bare = false }: { children: ReactNode; bare?: boolean }) {
  const { data: me } = useQuery(meQuery);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className={`sticky top-0 z-30 glass-blur transition-all duration-300 ${
          scrolled ? "border-b border-border bg-background/95 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.8)]" : "border-b border-transparent bg-background/70"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-5">
          <Link to="/" className="group flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
            <img src="/favicon.png" alt="Argus logo" width={36} height={36} className="h-9 w-9 rounded-full ring-1 ring-gold/40 transition duration-500 group-hover:rotate-[24deg] group-hover:ring-gold" />
            <span className="font-display text-base font-bold tracking-[0.15em] sm:text-lg sm:tracking-[0.25em]">{t.brand.toUpperCase()}</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm md:flex">
            <a href="/#features" className="rounded-lg px-3 py-2 text-muted-foreground transition hover:text-foreground">
              Features
            </a>
            <a href="/#start" className="rounded-lg px-3 py-2 text-muted-foreground transition hover:text-foreground">
              Get started
            </a>
            <Link to="/templates" className="rounded-lg px-3 py-2 text-muted-foreground transition hover:text-foreground" activeProps={{ className: "text-gold" }}>
               {t.templates}
            </Link>
            <Link to="/status" className="rounded-lg px-3 py-2 text-muted-foreground transition hover:text-foreground" activeProps={{ className: "text-gold" }}>
              {t.status}
            </Link>
          </nav>
          <div className="flex min-w-0 items-center gap-1.5 text-sm sm:gap-3">
            <a href={botInviteUrl()} target="_blank" rel="noreferrer" className="btn-ghost flex shrink-0 items-center gap-2 rounded-xl px-2.5 py-2 sm:px-4" aria-label={t.addToServer}>
              <Plus className="h-4 w-4 text-gold" /> <span className="hidden min-[430px]:inline">{t.addToServer}</span>
            </a>
            {me ? (
              <>
                <Link to="/dashboard" className="btn-gold flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[13px] sm:px-4 sm:text-sm">
                  <LayoutDashboard className="hidden h-4 w-4 sm:block" />
                  <span>{t.dashboard}</span>
                </Link>
                <img src={avatarUrl(me)} alt={me.username} title={me.username} width={32} height={32} className="hidden h-8 w-8 shrink-0 rounded-full ring-1 ring-gold/70 min-[400px]:block" />
                <a href="/api/auth/logout" className="rounded-lg p-2 text-muted-foreground transition hover:text-foreground" aria-label={t.logout} title={t.logout}>
                  <LogOut className="h-4 w-4" />
                </a>
              </>
            ) : (
              <a href="/api/auth/login" className="btn-gold flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] sm:px-4 sm:text-sm">
                <LogIn className="h-4 w-4" /> {t.login}
              </a>
            )}
          </div>
        </div>
      </header>
      <main className={`flex-1 ${bare ? "" : "page-in"}`}>{children}</main>
      <footer className="border-t border-border/60 bg-background/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              <img src="/favicon.png" alt="" width={36} height={36} className="h-9 w-9 rounded-full ring-1 ring-gold/40" />
              <span className="font-display text-lg font-bold tracking-[0.25em]">{t.brand.toUpperCase()}</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">Auto-moderation, logs, tickets, welcomes and an AI server builder — managed from one dashboard.</p>
            <a href={botInviteUrl()} target="_blank" rel="noreferrer" className="btn-gold mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm">
              <Plus className="h-4 w-4" /> {t.addToServer}
            </a>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground">Product</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><a href="/#features" className="transition hover:text-gold">Features</a></li>
              <li><a href="/#start" className="transition hover:text-gold">Get started</a></li>
              <li><Link to="/status" className="transition hover:text-gold">{t.status}</Link></li>
              <li><Link to="/templates" className="transition hover:text-gold">{t.templates}</Link></li>
              <li><Link to="/dashboard" className="transition hover:text-gold">{t.dashboard}</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground">Legal</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="transition hover:text-gold">{t.privacy}</Link></li>
              <li><Link to="/terms" className="transition hover:text-gold">{t.terms}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/60">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} {t.studio}. All rights reserved.</p>
            <p className="max-w-md text-center sm:text-right">Argus is an independent project and is not affiliated with or endorsed by Discord Inc.</p>
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="inline-flex items-center gap-1.5 transition hover:text-gold">
              <ArrowUp className="h-3.5 w-3.5" /> Back to top
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function LoginGate({ children }: { children: ReactNode }) {
  const { data: me, isLoading } = useQuery(meQuery);
  if (isLoading)
    return (
      <div className="mx-auto max-w-7xl space-y-4 px-5 py-12">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  if (!me)
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <div className="glass p-10">
          <img src="/favicon.png" alt="" className="mx-auto h-16 w-16 rounded-full ring-1 ring-gold/50" />
          <h2 className="mt-6 text-2xl font-bold">Sign in required</h2>
          <p className="mt-2 text-muted-foreground">Log in with Discord to manage your servers.</p>
          <a href="/api/auth/login" className="btn-gold mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3">
            <LogIn className="h-4 w-4" /> {t.login}
          </a>
        </div>
      </div>
    );
  return <>{children}</>;
}