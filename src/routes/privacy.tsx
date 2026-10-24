import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/Legal";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Argus" },
      { name: "description", content: "How Argus Studio collects and processes data for the Argus Discord bot." },
      { property: "og:title", content: "Privacy Policy — Argus" },
      { property: "og:description", content: "How Argus Studio processes data for the Argus Discord bot." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <LegalPage
      title="Privacy Policy"
      render={(o) => (
        <>
          <h2>1. Data controller</h2>
          <p>The Argus bot and this website are operated by {o.name}, {o.country}. Contact: <a className="text-gold" href={`mailto:${o.email}`}>{o.email}</a>.</p>
          <h2>2. Data we collect</h2>
          <ul>
            <li>Discord account ID, username and avatar (OAuth2 scope <code>identify</code>).</li>
            <li>List of servers you belong to and your permissions there (scope <code>guilds</code>).</li>
            <li>Moderation records on servers using Argus: action type, target and moderator IDs, reason and timestamp.</li>
            <li>Prompts you submit to the AI Server Builder.</li>
          </ul>
          <h2>3. Purpose and legal basis</h2>
          <p>Data is processed to provide moderation features and the dashboard (Art. 6(1)(b) GDPR) and to keep communities safe (Art. 6(1)(f) GDPR).</p>
          <h2>4. Storage and retention</h2>
          <p>Login sessions are stored in a secure cookie for up to 7 days. Moderation logs are kept while Argus remains on the server, or until a server administrator requests deletion.</p>
          <h2>5. Third parties</h2>
          <p>We use Discord (authentication and bot platform) and an AI provider (Google Gemini) to generate server structures. We do not sell personal data.</p>
          <h2>6. Your rights</h2>
          <p>Under the GDPR you may request access, rectification, erasure, restriction or portability of your data, and lodge a complaint with your supervisory authority (in Poland: UODO). Email {o.email}.</p>
        </>
      )}
    />
  ),
});
