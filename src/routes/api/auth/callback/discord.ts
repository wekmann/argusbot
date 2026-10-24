import { createFileRoute } from "@tanstack/react-router";
import {
  appOrigin,
  cookie,
  encodeSession,
  readCookie,
  SESSION_COOKIE,
  STATE_COOKIE,
  unsign,
} from "@/lib/session.server";

export const Route = createFileRoute("/api/auth/callback/discord")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = appOrigin(request);
        const fail = (reason: string) =>
          new Response(null, {
            status: 302,
            headers: { Location: `${origin}/?error=discord&reason=${reason}`, "Set-Cookie": cookie(STATE_COOKIE, "", 0) },
          });
        try {
          const url = new URL(request.url);
          if (url.searchParams.get("error")) return fail(url.searchParams.get("error") ?? "denied");
          const code = url.searchParams.get("code");
          const state = url.searchParams.get("state");
          const expected = await unsign(readCookie(request.headers.get("cookie"), STATE_COOKIE));
          if (!code || !state || state !== expected) return fail("state");

          const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env["DISCORD_CLIENT_ID"] ?? "",
              client_secret: process.env["DISCORD_CLIENT_SECRET"] ?? "",
              grant_type: "authorization_code",
              code,
              redirect_uri: `${origin}/api/auth/callback/discord`,
            }),
          });
          if (!tokenRes.ok) {
            console.error("Discord token exchange failed", tokenRes.status, await tokenRes.text());
            return fail("token");
          }
          const token = (await tokenRes.json()) as { access_token: string; expires_in: number };
          const meRes = await fetch("https://discord.com/api/v10/users/@me", {
            headers: { Authorization: `Bearer ${token.access_token}` },
          });
          if (!meRes.ok) return fail("profile");
          const me = (await meRes.json()) as { id: string; username: string; global_name?: string; avatar: string | null };

          const maxAge = Math.min(token.expires_in, 7 * 24 * 3600);
          const session = await encodeSession({
            id: me.id,
            username: me.global_name || me.username,
            avatar: me.avatar,
            accessToken: token.access_token,
            exp: Date.now() + maxAge * 1000,
          });
          const headers = new Headers({ Location: `${origin}/dashboard` });
          headers.append("Set-Cookie", cookie(SESSION_COOKIE, session, maxAge));
          headers.append("Set-Cookie", cookie(STATE_COOKIE, "", 0));
          return new Response(null, { status: 302, headers });
        } catch (e) {
          console.error("Discord callback error", e);
          return fail("server");
        }
      },
    },
  },
});
