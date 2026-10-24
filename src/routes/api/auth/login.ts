import { createFileRoute } from "@tanstack/react-router";
import { appOrigin, cookie, sign, STATE_COOKIE } from "@/lib/session.server";

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const clientId = process.env["DISCORD_CLIENT_ID"];
        if (!clientId) return Response.redirect(`${appOrigin(request)}/?error=config`, 302);
        const state = crypto.randomUUID();
        const params = new URLSearchParams({
          client_id: clientId,
          response_type: "code",
          scope: "identify guilds",
          redirect_uri: `${appOrigin(request)}/api/auth/callback/discord`,
          state,
          prompt: "none",
        });
        return new Response(null, {
          status: 302,
          headers: {
            Location: `https://discord.com/oauth2/authorize?${params}`,
            "Set-Cookie": cookie(STATE_COOKIE, await sign(state), 600),
          },
        });
      },
    },
  },
});
