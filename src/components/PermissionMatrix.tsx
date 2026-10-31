import { Fragment } from "react";
import type { Architecture, Overwrite } from "@/lib/architecture";

type Cell = "allow" | "deny" | "inherit";
type Level = { visibleTo: string[]; overwrites: Overwrite[] };
type Channel = Level & { readOnly: boolean };

const find = (list: Overwrite[], role: string) => list.find((o) => o.role === role);

/**
 * Mirrors what the bot will write to Discord:
 * visibleTo hides a channel from @everyone and shows it to the listed roles,
 * explicit overwrites win (channel over category). Anything else is "inherit" (Discord default).
 */
function viewState(role: string, cat: Level, ch: Channel): Cell {
  for (const list of [ch.overwrites, cat.overwrites]) {
    const o = find(list, role);
    if (o?.allow.includes("ViewChannel")) return "allow";
    if (o?.deny.includes("ViewChannel")) return "deny";
  }
  const visible = ch.visibleTo.length ? ch.visibleTo : cat.visibleTo;
  if (visible.length) return role !== "@everyone" && visible.includes(role) ? "allow" : "deny";
  return "inherit";
}

function writeState(role: string, cat: Level, ch: Channel): Cell {
  for (const list of [ch.overwrites, cat.overwrites]) {
    const o = find(list, role);
    if (o?.allow.includes("SendMessages")) return "allow";
    if (o?.deny.includes("SendMessages")) return "deny";
  }
  if (ch.readOnly && role === "@everyone") return "deny";
  return "inherit";
}

const tone: Record<Cell, string> = {
  allow: "bg-green-500/15 text-green-400",
  deny: "bg-red-500/15 text-red-400",
  inherit: "bg-secondary/40 text-muted-foreground",
};
const mark: Record<Cell, string> = { allow: "✓", deny: "✗", inherit: "–" };

function Badge({ label, state }: { label: string; state: Cell }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold ${tone[state]}`}>
      {label} {mark[state]}
    </span>
  );
}

export function PermissionMatrix({ arch }: { arch: Architecture }) {
  const roles = ["@everyone", ...arch.roles.map((r) => r.name)];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Role permissions</p>
        <div className="mt-2 space-y-2">
          {arch.roles.map((r, i) => (
            <div key={i} className="rounded-xl border border-border p-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                {r.name}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {r.permissions.length ? (
                  r.permissions.map((p) => (
                    <span key={p} className="rounded bg-secondary/60 px-1.5 py-0.5 font-mono text-[11px]">
                      {p}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No extra permissions</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Channel access</p>
        <div className="mt-2 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-max text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-3 py-2 font-medium">Channel</th>
                {roles.map((r) => (
                  <th key={r} className="px-2 py-2 font-medium">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {arch.categories.map((cat, ci) => (
                <Fragment key={ci}>
                  <tr className="bg-secondary/30">
                    <td colSpan={roles.length + 1} className="px-3 py-1.5 font-bold uppercase tracking-wide text-gold">
                      {cat.name}
                    </td>
                  </tr>
                  {cat.channels.map((ch, chi) => (
                    <tr key={chi} className="border-t border-border/60">
                      <td className="px-3 py-2">
                        <span className="text-muted-foreground">{ch.type === "voice" ? "🔊" : "#"}</span> {ch.name}
                        {ch.readOnly && <span className="ml-2 text-[10px] text-muted-foreground">read-only</span>}
                      </td>
                      {roles.map((r) => (
                        <td key={r} className="px-2 py-2">
                          <div className="flex flex-col gap-1">
                            <Badge label="view" state={viewState(r, cat, ch)} />
                            {ch.type !== "voice" && <Badge label="write" state={writeState(r, cat, ch)} />}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          ✓ allowed · ✗ denied · – default (inherited from Discord). Roles with the Administrator permission bypass these rules.
        </p>
      </div>
    </div>
  );
}