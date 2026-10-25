/** Public Discord application ID of the Argus bot (safe to expose, it is part of every invite link). */
export const BOT_CLIENT_ID = "1563494130347417722";

/** Permissions integer requested on invite (8 = Administrator). */
const BOT_PERMISSIONS = "8";

/**
 * Discord OAuth2 "add bot" URL. When a guildId is given the server picker is pre-filled and locked
 * to that server, so the user only has to confirm.
 */
export function botInviteUrl(guildId?: string): string {
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", BOT_CLIENT_ID);
  url.searchParams.set("permissions", BOT_PERMISSIONS);
  url.searchParams.set("integration_type", "0");
  url.searchParams.set("scope", "bot");
  if (guildId) {
    url.searchParams.set("guild_id", guildId);
    url.searchParams.set("disable_guild_select", "true");
  }
  return url.toString();
}