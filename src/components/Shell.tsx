import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getMe } from "@/lib/argus.functions";
import { t } from "@/lib/i18n";

export const meQuery = { queryKey: ["me"], queryFn: () => getMe(), staleTime: 60_000 };

export function avatarUrl(u: { id: string; avatar: string | null }) {
  return u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64` : "/argus-logo.png";
}

export function Shell({ children }: { children: ReactNode }) {
  const { data: me } = useQuery(meQuery);
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-3">
            <img src={"/argus-logo.png"} alt="Argus logo" className="h-9 w-9 rounded-full" />
            <span className="font-display text-lg font-bold tracking-widest">{t.brand.toUpperCase()}</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            {me ? (
              <>
                <Link to="/dashboard" className="btn-ghost rounded-xl px-4 py-2">{t.dashboard}</Link>
                <img src={avatarUrl(me)} alt={me.username} className="h-8 w-8 rounded-full ring-1 ring-gold" />
                <a href="/api/auth/logout" className="text-muted-foreground hover:text-foreground">{t.logout}</a>
              </>
            ) : (
              <a href="/api/auth/login" className="btn-gold rounded-xl px-4 py-2">{t.login}</a>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {t.studio}. All rights reserved.</p>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-gold">{t.privacy}</Link>
            <Link to="/terms" className="hover:text-gold">{t.terms}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function LoginGate({ children }: { children: ReactNode }) {
  const { data: me, isLoading } = useQuery(meQuery);
  if (isLoading) return <div className="p-20 text-center text-muted-foreground">Loading…</div>;
  if (!me)
    return (
      <div className="mx-auto max-w-md p-20 text-center">
        <h2 className="text-2xl font-bold">Sign in required</h2>
        <p className="mt-2 text-muted-foreground">Log in with Discord to manage your servers.</p>
        <a href="/api/auth/login" className="btn-gold mt-6 inline-block rounded-xl px-6 py-3">{t.login}</a>
      </div>
    );
  return <>{children}</>;
}
