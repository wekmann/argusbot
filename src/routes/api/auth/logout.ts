import { createFileRoute } from "@tanstack/react-router";
import { appOrigin, cookie, SESSION_COOKIE } from "@/lib/session.server";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        new Response(null, {
          status: 302,
          headers: { Location: `${appOrigin(request)}/`, "Set-Cookie": cookie(SESSION_COOKIE, "", 0) },
        }),
    },
  },
});
