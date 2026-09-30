# Artwork and component provenance

Release 0.2.1 uses a reviewed source snapshot, not the earlier private history.

| Material | Origin and terms |
| --- | --- |
| AEVORI wordmark, A symbol, app icons, banner and app screenshots | The rounded user-supplied wordmark and related A symbol were restored at the project owner’s request in 0.2.1. The supplied artwork’s origin and rights have not been verified. The wordmark, symbol and their derivatives are excluded from the MIT grant; AEVORI grants no additional rights in them. The banner layout and character are original, but this does not clear the embedded logo. |
| Agent characters, appearance previews, device illustrations | Original SVG/CSS in `Companion.tsx`, `ThemePreview.tsx`, `MacImage.tsx`. No Meta characters, Apple product images or copied product screenshots are bundled. |
| Interface icons | Lucide React, ISC; Feather-derived portions MIT. Notices are included in THIRD_PARTY_NOTICES.txt. Motion is implemented by AEVORI. |
| Provider icons | Neutral Lucide capability icons. Provider brand-logo SVGs were removed in 0.2.1. The earlier LobeHub notice is retained for provenance; its MIT license did not establish trademark permission. |
| App shell | Adapted free [Efferd app-shell-3](https://efferd.com/blocks/app-shell). See [Efferd terms](https://efferd.com/terms), reviewed 2026-09-30, last updated 2026-09-15. Its license permits use/modification/shipping in projects, including commercial projects; prohibits redistribution as a competing library/kit. Applies to `app-shell.tsx`, `app-sidebar.tsx`, `app-header.tsx`, `nav-group.tsx`, `app-breadcrumbs.tsx`, `app-shared.ts`. Not represented as original AEVORI or MIT code. |
| UI primitives in `src/components/ui` (except shimmering-text) | shadcn/ui, MIT; notice in `licenses/shadcn-ui.txt`. Radix dependencies retain their MIT license. |
| `src/components/ui/shimmering-text.tsx` | [ElevenLabs UI](https://github.com/elevenlabs/ui), MIT; `licenses/elevenlabs-ui.txt`. Imported via [the author's 21st page](https://21st.dev/@ElevenLabs/components/shimmering-text). |
| Composer and activity indicators | Original `PromptComposer.tsx`, `ActivityIndicator.tsx` and associated CSS. Earlier imported components with unknown/no license are excluded. |
| Node runtime in downloadable archives | Unmodified official Node.js 22.23.3 binary, downloaded from nodejs.org and SHA-256 checked against its official manifest. Full upstream license and dependency notices at `runtime/LICENSE`; source URL and exact checksum at `runtime/SOURCE.txt`. |
| User uploads and locally detected application icons | Not part of the repository or release. User uploads remain local. Application icons are read from installed software and only served to the local owner. |

## Excluded from this public snapshot

Apple CoreTypes exports,
Iconly assets, Meta's Veda example and Muse artwork, and older screenshots or
videos containing these assets are excluded. The supplied wordmark is now the exception described above. The prior Jahed composer, Shane
Levine loader and unused model-select reference are also excluded because a
public source redistribution license could not be established.

AEVORI is independent of Apple, Meta, OpenAI and other model providers. Their
names are used to describe compatibility. Model weights are not distributed;
each model's license must be checked separately before use or redistribution.

See [the Meta integration review](docs/META-REVIEW.md) for API and brand limits.
