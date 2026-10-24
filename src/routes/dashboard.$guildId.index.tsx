import { createFileRoute, Link } from "@tanstack/react-router";
import { ScrollText, Sparkles } from "lucide-react";

export const Route = createFileRoute("/dashboard/$guildId/")({
  component: Overview,
});

function Overview() {
  const { guildId } = Route.useParams();
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Link to="/dashboard/$guildId/aibuild" params={{ guildId }} className="glass p-6 transition hover:border-gold">
        <Sparkles className="h-8 w-8 text-gold" />
        <h3 className="mt-4 text-xl font-bold">AI Server Builder</h3>
        <p className="mt-2 text-sm text-muted-foreground">Describe your community and let Gemini design roles, categories and channels.</p>
      </Link>
      <Link to="/dashboard/$guildId/logs" params={{ guildId }} className="glass p-6 transition hover:border-gold">
        <ScrollText className="h-8 w-8 text-gold" />
        <h3 className="mt-4 text-xl font-bold">Moderation Logs</h3>
        <p className="mt-2 text-sm text-muted-foreground">Review bans, kicks, timeouts and warnings issued on this server.</p>
      </Link>
    </div>
  );
}
