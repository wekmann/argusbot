<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Discord login is a custom OAuth2 flow (src/routes/api/auth/*) with an HMAC-signed HttpOnly cookie (src/lib/session.server.ts); Lovable Cloud auth has no Discord provider.
- Bot data (status, guild list, logs, apply structure) comes only from the bot's own HTTP API via botApi() in src/lib/argus.server.ts, authenticated with BOT_API_SECRET; every guild-scoped server fn must call requireGuildAdmin first.
- UI strings live in src/lib/i18n.ts to allow later localization.
