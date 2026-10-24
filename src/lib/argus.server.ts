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

export async function adminGuilds(accessToken: string) {
  const res = await fetch("https://discord.com/api/v10/users/@me/guilds", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error(`Discord request failed [${res.status}]: ${await res.text()}`);
  const guilds = (await res.json()) as DiscordGuild[];
  return guilds.filter((g) => {
    const p = BigInt(g.permissions);
    return g.owner || (p & ADMINISTRATOR) === ADMINISTRATOR || (p & MANAGE_GUILD) === MANAGE_GUILD;
  });
}

export async function requireGuildAdmin(guildId: string) {
  const s = await requireSession();
  const guild = (await adminGuilds(s.accessToken)).find((g) => g.id === guildId);
  if (!guild) throw new Error("FORBIDDEN");
  return { session: s, guild };
}

/** Calls the Argus bot's own HTTP API. */
export async function botApi<T>(path: string, init?: RequestInit): Promise<T> {
  const base = process.env["BOT_API_URL"]?.replace(/\/$/, "");
  const secret = process.env["BOT_API_SECRET"];
  if (!base || !secret) throw new Error("Bot API is not configured (BOT_API_URL / BOT_API_SECRET)");
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Bot API ${path} failed [${res.status}]: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}
