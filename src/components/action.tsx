/** Colour + label for a moderation action ("Ban", "AutoMod: Mute (Timeout)", ...). */
export function actionTone(action: string) {
  const a = action.toLowerCase();
  if (a.includes("automod")) return { key: "automod", cls: "bg-violet/15 text-violet ring-violet/30", bar: "bg-violet" };
  if (a.includes("ban")) return { key: "ban", cls: "bg-destructive/15 text-destructive ring-destructive/30", bar: "bg-destructive" };
  if (a.includes("kick")) return { key: "kick", cls: "bg-warning/15 text-warning ring-warning/30", bar: "bg-warning" };
  if (a.includes("mute") || a.includes("timeout")) return { key: "mute", cls: "bg-gold-soft text-gold ring-gold/30", bar: "bg-gold" };
  if (a.includes("purge") || a.includes("delete") || a.includes("clear")) return { key: "purge", cls: "bg-success/15 text-success ring-success/30", bar: "bg-success" };
  return { key: "other", cls: "bg-secondary text-muted-foreground ring-border", bar: "bg-muted-foreground" };
}

export function ActionBadge({ action }: { action: string }) {
  return (
    <span className={`inline-flex max-w-[11rem] rounded-md px-2 py-0.5 text-center text-[10px] font-bold uppercase leading-tight tracking-wide ring-1 sm:max-w-none sm:whitespace-nowrap sm:rounded-full sm:px-2.5 sm:text-[11px] ${actionTone(action).cls}`}>
      {action}
    </span>
  );
}
