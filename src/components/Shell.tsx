import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { LayoutDashboard, LogIn, LogOut } from "lucide-react";
import { getMe } from "@/lib/argus.functions";
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
          scrolled ? "border-b border-border bg-background/75 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.8)]" : "border-b border-transparent bg-background/20"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link to="/" className="group flex items-center gap-3">
            <img src="/favicon.png" alt="Argus logo" width={36} height={36} className="h-9 w-9 rounded-full ring-1 ring-gold/40 transition duration-500 group-hover:rotate-[24deg] group-hover:ring-gold" />
            <span className="font-display text-lg font-bold tracking-[0.25em]">{t.brand.toUpperCase()}</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm sm:gap-3">
            <Link to="/status" className="hidden rounded-lg px-3 py-2 text-muted-foreground transition hover:text-foreground sm:block" activeProps={{ className: "text-gold" }}>
              {t.status}
            </Link>
            {me ? (
              <>
                <Link to="/dashboard" className="btn-ghost flex items-center gap-2 rounded-xl px-4 py-2">
                  <LayoutDashboard className="h-4 w-4 text-gold" />
                  <span className="hidden sm:inline">{t.dashboard}</span>
                </Link>
                <img src={avatarUrl(me)} alt={me.username} title={me.username} width={32} height={32} className="h-8 w-8 rounded-full ring-1 ring-gold/70" />
                <a href="/api/auth/logout" className="rounded-lg p-2 text-muted-foreground transition hover:text-foreground" aria-label={t.logout} title={t.logout}>
                  <LogOut className="h-4 w-4" />
                </a>
              </>
            ) : (
              <a href="/api/auth/login" className="btn-gold flex items-center gap-2 rounded-xl px-4 py-2">
                <LogIn className="h-4 w-4" /> {t.login}
              </a>
            )}
          </nav>
        </div>
      </header>
      <main className={`flex-1 ${bare ? "" : "page-in"}`}>{children}</main>
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {t.studio}. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/privacy" className="transition hover:text-gold">{t.privacy}</Link>
            <Link to="/terms" className="transition hover:text-gold">{t.terms}</Link>
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
