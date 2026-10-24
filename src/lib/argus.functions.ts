import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { architectureSchema, type Architecture } from "./architecture";

export type BotStatus = {
  online: boolean;
  username: string;
  guilds: number;
  uptimeSeconds: number;
  id?: string | null;
  avatar?: string | null;
  ping?: number | null;
  users?: number;
  channels?: number;
  commands?: number;
  prefix?: string;
  memoryMb?: number;
  nodeVersion?: string;
  discordJsVersion?: string;
  startedAt?: string | null;
  checkedAt?: string;
};export type ModLog = { id: string; action: string; target: string; moderator: string; reason: string | null; createdAt: string };

export const getMe = createServerFn({ method: "GET" }).handler(async () => {
  const { currentSession } = await import("./argus.server");
  const s = await currentSession();
  return s ? { id: s.id, username: s.username, avatar: s.avatar } : null;
});

export const getBotStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { botApi } = await import("./argus.server");
  try {
    return { ok: true as const, status: await botApi<BotStatus>("/status") };
  } catch (e) {
    console.error(e);
    // Short, non-sensitive reason shown on the page: not-configured | HTTP status (e.g. 401) | network
    const msg = e instanceof Error ? e.message : String(e);
    const code = /not configured/i.test(msg) ? "not-configured" : (msg.match(/\[(\d{3})\]/)?.[1] ?? "network");
    return { ok: false as const, error: "Bot status is unavailable right now.", code };
  }
});

export const getAdminGuilds = createServerFn({ method: "GET" }).handler(async () => {
  const { requireSession, adminGuilds, botApi } = await import("./argus.server");
  const s = await requireSession();
  const guilds = await adminGuilds(s.accessToken);
  let botGuildIds: string[] | null = null;
  try {
    botGuildIds = (await botApi<{ guildIds: string[] }>("/guilds")).guildIds;
  } catch (e) {
    console.error(e);
  }
  return guilds.map((g) => ({
    id: g.id,
    name: g.name,
    icon: g.icon,
    botPresent: botGuildIds ? botGuildIds.includes(g.id) : null,
  }));
});

const guildInput = z.object({ guildId: z.string().regex(/^\d{5,25}$/) });

export const getGuild = createServerFn({ method: "GET" })
  .inputValidator((d) => guildInput.parse(d))
  .handler(async ({ data }) => {
    const { requireGuildAdmin, botInGuild } = await import("./argus.server");
    const { guild } = await requireGuildAdmin(data.guildId);
    return { id: guild.id, name: guild.name, icon: guild.icon, botPresent: await botInGuild(guild.id) };
  });

/** Polled while the user is adding the bot in the Discord window. */
export const getBotPresence = createServerFn({ method: "GET" })
  .inputValidator((d) => guildInput.parse(d))
  .handler(async ({ data }) => {
    const { requireGuildAdmin, botInGuild } = await import("./argus.server");
    await requireGuildAdmin(data.guildId);
    return { botPresent: await botInGuild(data.guildId) };
  });

export const getGuildLogs = createServerFn({ method: "GET" })
  .inputValidator((d) => guildInput.parse(d))
  .handler(async ({ data }) => {
    const { requireGuildAdmin, botApi } = await import("./argus.server");
    await requireGuildAdmin(data.guildId);
    return (await botApi<{ logs: ModLog[] }>(`/guilds/${data.guildId}/logs?limit=100`)).logs;
  });

export const generateArchitecture = createServerFn({ method: "POST" })
  .inputValidator((d) => guildInput.extend({ prompt: z.string().trim().min(3).max(500) }).parse(d))
  .handler(async ({ data }): Promise<Architecture> => {
    const { requireGuildAdmin } = await import("./argus.server");
    const { generateWithGemini } = await import("./ai.server");
    await requireGuildAdmin(data.guildId);
    return generateWithGemini(data.prompt);
  });

export const applyArchitecture = createServerFn({ method: "POST" })
  .inputValidator((d) => guildInput.extend({ architecture: architectureSchema }).parse(d))
  .handler(async ({ data }) => {
    const { requireGuildAdmin, botApi } = await import("./argus.server");
    const { session } = await requireGuildAdmin(data.guildId);
    return botApi<{ ok: boolean; message?: string }>(`/guilds/${data.guildId}/apply`, {
      method: "POST",
      body: JSON.stringify({ requestedBy: session.id, architecture: data.architecture }),
    });
  });

export const automodSchema = z.object({
  enabled: z.boolean(),
  bannedWords: z.array(z.string().trim().min(1).max(50)).max(200),
  punishment: z.enum(["mute", "kick", "ban"]),
});
export type Automod = z.infer<typeof automodSchema>;
export type GuildStats = {
  messagesByHour: { hour: number; count: number }[];
  members: { date: string; count: number }[];
};

export const getAutomod = createServerFn({ method: "GET" })
  .inputValidator((d) => guildInput.parse(d))
  .handler(async ({ data }) => {
    const { requireGuildAdmin, botApi } = await import("./argus.server");
    await requireGuildAdmin(data.guildId);
    return botApi<Automod>(`/guilds/${data.guildId}/automod`);
  });

export const saveAutomod = createServerFn({ method: "POST" })
  .inputValidator((d) => guildInput.extend({ automod: automodSchema }).parse(d))
  .handler(async ({ data }) => {
    const { requireGuildAdmin, botApi } = await import("./argus.server");
    await requireGuildAdmin(data.guildId);
    return botApi<Automod>(`/guilds/${data.guildId}/automod`, { method: "PUT", body: JSON.stringify(data.automod) });
  });

export type GuildOverview = {
  guild: { id: string; name: string; icon: string | null; memberCount: number; channelCount: number; roleCount: number; createdAt: string };
  messages24h: number;
  messagesByHour: { hour: number; count: number }[];
  members: { date: string; count: number }[];
  actions7d: number;
  actions30d: number;
  actionsTotal: number;
  actionsByType: { action: string; count: number }[];
  automod: { enabled: boolean; words: number; punishment: "mute" | "kick" | "ban" };
  recent: ModLog[];
  botPing: number | null;
};

/** One request to the bot for the whole dashboard overview. */
export const getGuildOverview = createServerFn({ method: "GET" })
  .inputValidator((d) => guildInput.parse(d))
  .handler(async ({ data }) => {
    const { requireGuildAdmin, botApi } = await import("./argus.server");
    await requireGuildAdmin(data.guildId);
    return botApi<GuildOverview>(`/guilds/${data.guildId}/overview`);
  });

export const getGuildStats = createServerFn({ method: "GET" })
  .inputValidator((d) => guildInput.parse(d))
  .handler(async ({ data }) => {
    const { requireGuildAdmin, botApi } = await import("./argus.server");
    await requireGuildAdmin(data.guildId);
    return botApi<GuildStats>(`/guilds/${data.guildId}/stats`);
  });