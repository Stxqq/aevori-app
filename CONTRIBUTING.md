# Contributing to AEVORI

AEVORI is a local AI workspace, not a hosted AI service. Contributions should keep
that boundary visible and preserve existing user data.

## Develop

Use Node.js 22.13 or newer. Install dependencies with `npm ci`, then start the app
with `npm run dev`. Ollama and model weights are installed separately. Never commit
API keys, `.aevori/`, `.orbit/`, private conversations, or personal screenshots.

Before opening a pull request, run:

```sh
npm run format
npm run check
```

The check command enforces formatting, strict TypeScript (including unused code),
the Node test suite, and a production build. CI runs it on Linux and macOS.

## Code organization

- `src/App.tsx` coordinates the workspace and persistent client state.
- `src/components/` contains focused views and accessible controls. `TasksPanel`,
  `SystemPanel`, and `Modal` keep those flows separate from chat orchestration.
- `src/types.ts` defines workspace entities; `src/navigation.ts` defines navigation.
- `server/` owns model adapters, streaming, team sessions, and agent permissions.
- `shared/` validates character data used by the UI and server.
- `tests/` exercises provider protocols, cancellation, persistence, and access boundaries.

Keep product copy in English. User content and explicit language requests must
remain intact. Use existing design tokens and respect reduced motion. Extract a
component when it owns a distinct interaction; avoid abstractions with no concrete use.

Treat model output as untrusted input. Validate proposed actions on the server and
apply the member's rules again when approving them. A UI control is not an access
boundary. Include meaningful regression coverage for changes to these behaviors.

## Submit a change

Explain the problem, the resulting behavior, and how you verified it. Add screenshots
for visual changes, using synthetic data. Call out changes to storage formats,
permissions, provider traffic, and dependencies. Retain third-party notices and
review [ASSETS.md](ASSETS.md) before adding artwork.

For security issues, follow [SECURITY.md](SECURITY.md) rather than posting credentials
or exploit details in a public issue.
