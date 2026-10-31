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
  .inputValidator((d) => guildInput.extend({ prompt: z.string().trim().min(3).max(1000) }).parse(d))
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

const snowflake = z.string().regex(/^\d{17,20}$/).nullable();
export const welcomeSchema = z.object({
  autorole: z.object({ enabled: z.boolean(), roleId: snowflake }),
  welcome: z.object({
    enabled: z.boolean(),
    channelId: snowflake,
    message: z.string().max(2000),
    embed: z.object({
      enabled: z.boolean(),
      title: z.string().max(256),
      description: z.string().max(4000),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      footer: z.string().max(2048),
      thumbnail: z.boolean(),
      image: z.string().max(500),
    }),
  }),
  ghostPing: z.object({ enabled: z.boolean(), channelId: snowflake }),
});
export type WelcomeConfig = z.infer<typeof welcomeSchema>;

export type GuildMeta = {
  channels: { id: string; name: string; category: string | null; canSend: boolean }[];
  roles: { id: string; name: string; color: string | null; assignable: boolean }[];
};

export const getWelcome = createServerFn({ method: "GET" })
  .inputValidator((d) => guildInput.parse(d))
  .handler(async ({ data }) => {
    const { requireGuildAdmin, botApi } = await import("./argus.server");
    await requireGuildAdmin(data.guildId);
    return botApi<WelcomeConfig>(`/guilds/${data.guildId}/welcome`);
  });

export const saveWelcome = createServerFn({ method: "POST" })
  .inputValidator((d) => guildInput.extend({ welcome: welcomeSchema }).parse(d))
  .handler(async ({ data }) => {
    const { requireGuildAdmin, botApi } = await import("./argus.server");
    await requireGuildAdmin(data.guildId);
    return botApi<WelcomeConfig>(`/guilds/${data.guildId}/welcome`, { method: "PUT", body: JSON.stringify(data.welcome) });
  });

/** Channels and roles of the server, for the pickers. */
export const getGuildMeta = createServerFn({ method: "GET" })
  .inputValidator((d) => guildInput.parse(d))
  .handler(async ({ data }) => {
    const { requireGuildAdmin, botApi } = await import("./argus.server");
    await requireGuildAdmin(data.guildId);
    return botApi<GuildMeta>(`/guilds/${data.guildId}/meta`);
  });

/** Plays the saved welcome message / ghost ping for the logged-in admin. */
export const sendWelcomeTest = createServerFn({ method: "POST" })
  .inputValidator((d) => guildInput.parse(d))
  .handler(async ({ data }) => {
    const { requireGuildAdmin, botApi } = await import("./argus.server");
    const { session } = await requireGuildAdmin(data.guildId);
    return botApi<{ welcome: boolean; ghostPing: boolean }>(`/guilds/${data.guildId}/welcome/test`, {
      method: "POST",
      body: JSON.stringify({ userId: session.id }),
    });
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

// ---------------------------------------------------------------------------
// Tickets (per-server configuration, rating and transcripts)
// The bot double-checks that this user is the owner / an Administrator of the server.
// ---------------------------------------------------------------------------

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const roleId = z.string().regex(/^\d{17,20}$/);

export const ticketSettingsSchema = z.object({
  enabled: z.boolean(),
  panelChannelId: snowflake,
  categoryId: snowflake,
  logChannelId: snowflake,
  supportRoleIds: z.array(roleId).max(10),
  inactivityHours: z.number().min(0).max(720),
  graceHours: z.number().min(1).max(168),
  panel: z.object({
    title: z.string().max(256),
    description: z.string().max(4000),
    color: hexColor,
    footer: z.string().max(2048),
    image: z.string().max(500),
    thumbnail: z.string().max(500),
    buttonLabel: z.string().trim().min(1).max(80),
    buttonEmoji: z.string().max(64),
  }),
  welcome: z.object({
    title: z.string().max(256),
    description: z.string().max(4000),
    color: hexColor,
    image: z.string().max(500),
    pingSupport: z.boolean(),
  }),
});
export type TicketSettings = z.infer<typeof ticketSettingsSchema> & { panelMessage?: { channelId: string; messageId: string } | null };

export type TicketConfig = {
  settings: TicketSettings;
  problems: string[];
  channels: { id: string; name: string; category: string | null; canSend: boolean }[];
  categories: { id: string; name: string; canManage: boolean }[];
  roles: { id: string; name: string; color: string | null }[];
};
export type TicketRating = { count: number; average: number | null; distribution: Record<"1" | "2" | "3" | "4" | "5", number> };
export type TicketTranscriptRow = {
  id: string;
  channelName: string;
  ownerId: string;
  ownerTag: string | null;
  closedById: string | null;
  closedByTag: string | null;
  closeReason: string | null;
  openedAt: string | null;
  closedAt: string;
  messageCount: number;
  rating: number | null;
};
export type TicketTranscriptList = { total: number; limit: number; offset: number; transcripts: TicketTranscriptRow[] };
export type TicketMessage = {
  id: string;
  author: string;
  bot: boolean;
  avatar: string;
  content: string;
  at: string;
  attachments: { name: string; url: string; type: string | null }[];
  embeds: { title: string | null; description: string | null }[];
};
export type TicketTranscript = TicketTranscriptRow & { guildName: string | null; messageCount: number; messages: TicketMessage[] };

export const getTicketConfig = createServerFn({ method: "GET" })
  .inputValidator((d) => guildInput.parse(d))
  .handler(async ({ data }) => {
    const { requireGuildAdmin, botApi } = await import("./argus.server");
    const { session } = await requireGuildAdmin(data.guildId);
    return botApi<TicketConfig>(`/guilds/${data.guildId}/tickets`, { headers: { "X-Discord-User-Id": session.id } });
  });

export const saveTicketConfig = createServerFn({ method: "POST" })
  .inputValidator((d) => guildInput.extend({ settings: ticketSettingsSchema }).parse(d))
  .handler(async ({ data }) => {
    const { requireGuildAdmin, botApi } = await import("./argus.server");
    const { session } = await requireGuildAdmin(data.guildId);
    return botApi<{ settings: TicketSettings; problems: string[] }>(`/guilds/${data.guildId}/tickets`, {
      method: "PUT",
      headers: { "X-Discord-User-Id": session.id },
      body: JSON.stringify(data.settings),
    });
  });

/** Posts (or replaces) the ticket panel in the chosen channel. */
export const sendTicketPanel = createServerFn({ method: "POST" })
  .inputValidator((d) => guildInput.parse(d))
  .handler(async ({ data }) => {
    const { requireGuildAdmin, botApi } = await import("./argus.server");
    const { session } = await requireGuildAdmin(data.guildId);
    return botApi<{ channelId: string; messageId: string; url: string }>(`/guilds/${data.guildId}/tickets/panel`, {
      method: "POST",
      headers: { "X-Discord-User-Id": session.id },
      body: "{}",
    });
  });

/** Average rating of THIS server's tickets. */
export const getTicketRating = createServerFn({ method: "GET" })
  .inputValidator((d) => guildInput.parse(d))
  .handler(async ({ data }) => {
    const { requireGuildAdmin, botApi } = await import("./argus.server");
    const { session } = await requireGuildAdmin(data.guildId);
    return botApi<TicketRating>(`/guilds/${data.guildId}/tickets/rating`, { headers: { "X-Discord-User-Id": session.id } });
  });

export const getTicketTranscripts = createServerFn({ method: "GET" })
  .inputValidator((d) => guildInput.extend({ offset: z.number().int().min(0).max(100000).default(0), q: z.string().max(100).default("") }).parse(d))
  .handler(async ({ data }) => {
    const { requireGuildAdmin, botApi } = await import("./argus.server");
    const { session } = await requireGuildAdmin(data.guildId);
    const qs = new URLSearchParams({ limit: "25", offset: String(data.offset) });
    if (data.q.trim()) qs.set("q", data.q.trim());
    return botApi<TicketTranscriptList>(`/guilds/${data.guildId}/tickets/transcripts?${qs}`, { headers: { "X-Discord-User-Id": session.id } });
  });

export const getTicketTranscript = createServerFn({ method: "GET" })
  .inputValidator((d) => guildInput.extend({ transcriptId: z.string().regex(/^[a-f0-9]{32}$/) }).parse(d))
  .handler(async ({ data }) => {
    const { requireGuildAdmin, botApi } = await import("./argus.server");
    const { session } = await requireGuildAdmin(data.guildId);
    return botApi<TicketTranscript>(`/guilds/${data.guildId}/tickets/transcripts/${data.transcriptId}`, { headers: { "X-Discord-User-Id": session.id } });
  });