# Release review — AEVORI 0.3.0

Reviewed on 2026-09-30. The functionality checks below describe 0.2.0. For 0.2.1, all 36 tests and the production build passed again; rounded branding was visually checked in light/dark/mobile layouts and the new cloud disclosures were checked in the connection dialog. No browser console errors were observed. This records the checks performed; it is not a blanket
claim that every feature, machine, provider or legal question has been verified.

## English edition (0.3.0)

The application UI, server errors, model prompts, onboarding, offline page,
privacy page, PWA metadata, and launcher instructions are in English. Existing
user-written conversations and stored content are preserved. AI responses default
to English while respecting explicit requests for another language.

- All 36 automated tests and the TypeScript/Vite build pass.
- Prettier and strict TypeScript checks, including unused declarations, run through
  `npm run check`. CI runs the same checks on Linux and macOS. Tasks, device
  readings, shared types, navigation, and modal layout have dedicated modules.
- HTTP integration tests use a temporary port and health-based readiness, so a
  running preview does not conflict with the test server.
- Browser checks cover English onboarding, real local code and agent replies,
  character editing, settings, memories, rules, tasks, notes, models, team, and
  Mac-pool pages. The 390-pixel phone layout has no horizontal overflow; the
  install guide is English. No browser warnings or errors were observed.
- The README has live build/status badges, a new code banner, and a reply GIF.
  The GIF is an actual synthetic demo conversation, with original response timing
  and an added final reading pause. It is not a speed benchmark.
- The launcher is now named `Start Aevori.command`.

## Functionality

- 36 Node tests pass locally, covering streaming, UTF-8 chunks, failures and stop,
  image validation, model routing, permissions, invitations/revocation, member
  isolation, memory, policies, characters, background replies and reminders.
- New launcher tests cover conflicting ports, invalid port values and reuse of
  an existing AEVORI instance. The health route rejects a foreign Origin.
- TypeScript and Vite production build pass. Vendor chunks are split; no build
  chunk exceeds the default 500 kB warning threshold.
- Browser checks at 1280×720 and 390×844: onboarding, compact/expanded composer,
  Escape focus return, text attachment preview, live local responses, agent
  messages, settings, dark/light themes and motion preference. No console errors
  or horizontal overflow were observed in these checks.
- Actual Gemma 3 4B responses were verified, including a question about an attached
  synthetic text file. Test screenshots contain synthetic demo content only.
- Apple-silicon archive was extracted and launched with its bundled Node runtime,
  without npm dependencies. Its health endpoint, model discovery and repeated
  launcher invocation passed. Intel archive contents/checksum are verified; it
  has not been run on an Intel Mac. The current machine cannot execute x64 Node.
- `npm audit` reports zero known vulnerabilities as of this review. This is not
  a penetration test or a guarantee of future dependency security.

## Publication and licensing

The public repository starts from an explicit, reviewed source snapshot. Earlier
private development history and releases are not included. `.aevori`, `.orbit`,
API keys, private chat data, invitations, user uploads and model weights are
excluded from source publication and downloadable archives.

In 0.2.0, unclear-rights material was replaced: the supplied wordmark, Apple CoreTypes
product images, Iconly artwork, Meta Veda/Muse assets, and two imported components
whose public metadata did not supply a usable source license. Old screenshots
and videos containing these items are excluded as well.

In 0.2.1, the supplied rounded wordmark and related symbol were restored at the project owner’s request. Their rights remain unverified and they are explicitly excluded from MIT, including derivatives in the banner and screenshots. See [META-REVIEW.md](META-REVIEW.md).

Original AEVORI code/independently created artwork is MIT licensed; dependencies and imported code
retain their own notices. The adapted free Efferd block remains subject to its
terms, not AEVORI's MIT license. See [ASSETS.md](../ASSETS.md) and the full retained
notices. Provider logos are removed in 0.2.1. Remaining provider names describe the API/model being configured; they do not assert endorsement or a trademark license.

This technical provenance review cannot provide a legal guarantee. The AEVORI
name has not received a comprehensive trademark clearance. Model licenses and
rights to any future user uploads must be checked separately. Obtain qualified
legal advice if a binding commercial clearance is needed.

Primary references reviewed:

- [GitHub: licensing a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)
- [Apple: third-party trademark and copyright guidelines](https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html)
- [Efferd terms](https://efferd.com/terms)
- [21st marketplace terms](https://mcp.21st.dev/terms)
- [LobeHub Icons source and license](https://github.com/lobehub/lobe-icons)
- [shadcn/ui license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md)
- [ElevenLabs UI](https://github.com/elevenlabs/ui)
- [Official bundled Node release](https://nodejs.org/dist/v22.23.3/)

## Explicit limitations

- Unsigned preview; no Apple signing/notarization. No bypass of OS protections.
- No real iPhone home-screen installation or Internet team tunnel tested here.
  Phone access needs HTTPS, configured routing and an invitation to the host Mac.
- No paid/live Muse account verification in this release run. Adapter tests use
  a fixture of the provider protocol. No private Muse-account synchronization.
- No SMS, push notifications, autonomous browser/shell/email/payment access.
- Local persistence is unencrypted. Reminders need the host process running or
  are delivered on its next start. Dictation may use a browser-vendor cloud service.
