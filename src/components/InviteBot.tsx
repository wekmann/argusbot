import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getBotPresence } from "@/lib/argus.functions";
import { botInviteUrl } from "@/lib/invite";
import { t } from "@/lib/i18n";

export type InviteTarget = { id: string; name: string; icon: string | null };

const POLL_MS = 3000;
/** Stop polling after this long; the user can reopen the Discord window to start over. */
const GIVE_UP_MS = 10 * 60_000;

/** Must be called synchronously from a click handler, otherwise browsers block the popup. */
function openInviteWindow(guildId: string): Window | null {
  const w = 520;
  const h = 820;
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - w) / 2));
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - h) / 2));
  return window.open(botInviteUrl(guildId), "argus-bot-invite", `popup=yes,width=${w},height=${h},left=${left},top=${top}`);
}

/**
 * Click on a server without Argus → Discord's "add bot" window opens right away, we wait until the
 * bot has actually joined the server, close the window and send the user to that server's dashboard.
 *
 * Usage: `const invite = useBotInvite();` → `invite.start(guild)` in an onClick and render `{invite.dialog}`.
 */
export function useBotInvite(): { start: (g: InviteTarget) => void; dialog: ReactNode } {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const popup = useRef<Window | null>(null);
  const [target, setTarget] = useState<InviteTarget | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const open = useCallback((g: InviteTarget) => {
    popup.current = openInviteWindow(g.id);
    popup.current?.focus();
    setBlocked(!popup.current);
    setTimedOut(false);
    setAttempt((n) => n + 1);
  }, []);

  const start = useCallback(
    (g: InviteTarget) => {
      open(g);
      setTarget(g);
    },
    [open],
  );

  const closePopup = useCallback(() => {
    try {
      popup.current?.close();
    } catch {
      /* cross-origin window we can't touch any more - harmless */
    }
    popup.current = null;
  }, []);

  const cancel = useCallback(() => {
    closePopup();
    setTarget(null);
  }, [closePopup]);

  // Give up polling after a while (user walked away); "Open Discord window" starts a new round.
  useEffect(() => {
    if (!target) return;
    const id = setTimeout(() => setTimedOut(true), GIVE_UP_MS);
    return () => clearTimeout(id);
  }, [target, attempt]);

  const presence = useQuery({
    queryKey: ["bot-presence", target?.id],
    queryFn: () => getBotPresence({ data: { guildId: target!.id } }),
    enabled: !!target,
    refetchInterval: timedOut ? false : POLL_MS,
    // the user is busy in the Discord window, so this tab is usually in the background
    refetchIntervalInBackground: true,
    retry: false,
    gcTime: 0,
  });

  const joined = presence.data?.botPresent === true;
  useEffect(() => {
    if (!target || !joined) return;
    closePopup();
    qc.setQueryData(["guild", target.id], (old: object | undefined) => (old ? { ...old, botPresent: true } : old));
    void qc.invalidateQueries({ queryKey: ["guilds"] });
    void qc.invalidateQueries({ queryKey: ["guild", target.id] });
    setTarget(null);
    void navigate({ to: "/dashboard/$guildId", params: { guildId: target.id } });
  }, [joined, target, closePopup, qc, navigate]);

  const dialog = (
    <Dialog open={!!target} onOpenChange={(o) => !o && cancel()}>
      {target && (
        <DialogContent className="max-w-md text-center">
          <DialogHeader className="items-center space-y-3 text-center sm:text-center">
            {target.icon ? (
              <img src={`https://cdn.discordapp.com/icons/${target.id}/${target.icon}.png?size=96`} alt="" width={64} height={64} className="h-16 w-16 rounded-2xl ring-1 ring-gold/40" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-soft font-display text-2xl text-gold">{target.name[0]}</div>
            )}
            <DialogTitle className="text-xl leading-snug">
              {t.addBotTitle} {target.name}
            </DialogTitle>
            <DialogDescription>{blocked ? t.addBotBlocked : timedOut ? t.addBotTimeout : t.addBotHint}</DialogDescription>
          </DialogHeader>

          {!blocked && !timedOut && (
            <p className="flex items-center justify-center gap-2 text-sm text-gold" role="status">
              <Loader2 className="h-4 w-4 animate-spin" /> {t.addBotWaiting}
            </p>
          )}

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-center">
            {blocked ? (
              <a href={botInviteUrl(target.id)} target="_blank" rel="noreferrer noopener" className="btn-gold inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm">
                <ExternalLink className="h-4 w-4" /> {t.addBotReopen}
              </a>
            ) : (
              <button type="button" onClick={() => open(target)} className="btn-gold inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm">
                <ExternalLink className="h-4 w-4" /> {t.addBotReopen}
              </button>
            )}
            <button type="button" onClick={cancel} className="btn-ghost rounded-xl px-5 py-2.5 text-sm">
              {t.cancel}
            </button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );

  return { start, dialog };
}