import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/Legal";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Argus" },
      { name: "description", content: "Terms of Service for the Argus Discord moderation bot and dashboard." },
      { property: "og:title", content: "Terms of Service — Argus" },
      { property: "og:description", content: "Terms of Service for the Argus Discord bot." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <LegalPage
      title="Terms of Service"
      render={(o) => (
        <>
          <h2>1. Acceptance</h2>
          <p>By adding Argus to a server or using this dashboard you agree to these Terms, provided by {o.name} ({o.country}).</p>
          <h2>2. The service</h2>
          <p>Argus provides Discord moderation tools, logs and an AI-assisted server builder. Features may change or be discontinued at any time.</p>
          <h2>3. Acceptable use</h2>
          <ul>
            <li>Follow Discord's Terms of Service and Community Guidelines.</li>
            <li>Do not abuse, reverse-engineer or overload the bot or its API.</li>
            <li>You are responsible for actions you take through the dashboard, including applying AI-generated structures.</li>
          </ul>
          <h2>4. AI-generated content</h2>
          <p>AI suggestions may be inaccurate. Review every structure before applying it to your server.</p>
          <h2>5. Disclaimer and liability</h2>
          <p>The service is provided "as is" without warranties. To the extent permitted by law, {o.name} is not liable for indirect damages or data loss.</p>
          <h2>6. Governing law</h2>
          <p>These Terms are governed by the laws of {o.country}. Questions: <a className="text-gold" href={`mailto:${o.email}`}>{o.email}</a>.</p>
        </>
      )}
    />
  ),
});
