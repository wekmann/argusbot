import { getRequestHeader } from "@tanstack/react-start/server";
import { decodeSession, SESSION_COOKIE, readCookie } from "./session.server";

export async function currentSession() {
  return decodeSession(readCookie(getRequestHeader("cookie") ?? null, SESSION_COOKIE));
}

export async function requireSession() {
  const s = await currentSession();
  if (!s) throw new Error("UNAUTHORIZED");
  return s;
}

export type DiscordGuild = { id: string; name: string; icon: string | null; owner: boolean; permissions: string };

const ADMINISTRATOR = 0x8n;
const MANAGE_GUILD = 0x20n;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Real call to Discord. Retries a couple of times when Discord answers 429. */
async function fetchAdminGuilds(accessToken: string): Promise<DiscordGuild[]> {
  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status !== 429) break;
    let wait = Number(res.headers.get("retry-after")) || 0;
    try {
      wait = ((await res.clone().json()) as { retry_after?: number }).retry_after ?? wait;
    } catch {
      /* body wasn't JSON */
    }
    if (attempt === 2 || wait > 5) break;
    await sleep(Math.ceil(wait * 1000) + 100);
  }
  if (!res) throw new Error("Discord request failed");
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (res.status === 429) throw new Error("Discord is rate-limiting requests right now. Wait a few seconds and refresh.");
  if (!res.ok) throw new Error(`Discord request failed [${res.status}]: ${(await res.text()).slice(0, 200)}`);
  const guilds = (await res.json()) as DiscordGuild[];
  return guilds.filter((g) => {
    const p = BigInt(g.permissions);
    return g.owner || (p & ADMINISTRATOR) === ADMINISTRATOR || (p & MANAGE_GUILD) === MANAGE_GUILD;
  });
}

const GUILD_TTL_MS = 60_000;
const guildCache = new Map<string, { at: number; guilds: DiscordGuild[] | null; inflight?: Promise<DiscordGuild[]> }>();

export async function adminGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const now = Date.now();
  const hit = guildCache.get(accessToken);
  if (hit?.guilds && now - hit.at < GUILD_TTL_MS) return hit.guilds;
  if (hit?.inflight) return hit.inflight;

  if (guildCache.size > 500) {
    for (const [k, v] of guildCache) if (now - v.at > GUILD_TTL_MS * 5) guildCache.delete(k);
  }

  const inflight = fetchAdminGuilds(accessToken)
    .then((guilds) => {
      guildCache.set(accessToken, { at: Date.now(), guilds });
      return guilds;
    })
    .catch((err) => {
      if (hit?.guilds && err instanceof Error && err.message !== "UNAUTHORIZED") {
        guildCache.set(accessToken, { at: Date.now() - GUILD_TTL_MS + 10_000, guilds: hit.guilds });
        return hit.guilds;
      }
      guildCache.delete(accessToken);
      throw err;
    });
  guildCache.set(accessToken, { at: hit?.at ?? now, guilds: hit?.guilds ?? null, inflight });
  return inflight;
}

export async function requireGuildAdmin(guildId: string) {
  const s = await requireSession();
  const guild = (await adminGuilds(s.accessToken)).find((g) => g.id === guildId);
  if (!guild) throw new Error("FORBIDDEN");
  return { session: s, guild };
}

/** Is the bot a member of this guild? `null` when the bot API can't be reached (state unknown). */
export async function botInGuild(guildId: string): Promise<boolean | null> {
  try {
    return (await botApi<{ guildIds: string[] }>("/guilds")).guildIds.includes(guildId);
  } catch (e) {
    console.error(e);
    return null;
  }
}

/** Calls the Argus bot's own HTTP API. */
export async function botApi<T>(path: string, init?: RequestInit): Promise<T> {
  const base = process.env["BOT_API_URL"]?.replace(/\/$/, "");
  const secret = process.env["BOT_API_SECRET"];
  if (!base || !secret) throw new Error("Bot API is not configured (BOT_API_URL / BOT_API_SECRET)");
  const res = await fetch(`${base}${path}`, {
    signal: AbortSignal.timeout(8000),
    ...init,
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Bot API ${path} failed [${res.status}]: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}