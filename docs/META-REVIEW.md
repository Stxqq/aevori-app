# Meta integration and logo review

Reviewed 30 September 2026. This is a source/code review, not legal clearance.

## What AEVORI actually ships

The app contains an independently written HTTPS client for `api.meta.ai/v1`.
It sends user-selected chat content using a user-provided API key. It does not
bundle Meta model weights, Muse Code, Meta character art, account credentials
or an account-sync implementation. The local agent uses Ollama; its memory is
stored context, not training or distillation of Meta models.

## Official conditions checked

- [Model API terms](https://dev.meta.ai/legal/terms-of-service), dated 18 September
  2026, allow integrated products subject to their conditions. They restrict
  key sharing, harness-subscription credentials, redistribution and competing
  model training; API access grants no trademark license. Standard-tier content
  is not used to train Meta models, but retention still applies.
- [Geographic policy](https://dev.meta.ai/legal/geographic-use-policy) limits where
  API-backed products can be offered. A valid key is not universal legal clearance.
- [Acceptable Use Policy](https://dev.meta.ai/legal/acceptable-use-policy) applies
  to applications and end users, including privacy, AI disclosure and oversight.
- [Meta brand guidelines](https://www.meta.com/brand/resources/meta/company-brand/)
  require approval for Meta-logo use. A third-party icon pack's MIT license does
  not supply this approval.

## Changes in 0.2.1

Provider logos were replaced by neutral capability icons. The optional cloud
page is labelled as an independent API connection, with terms and privacy links.
Only supported Standard-tier Muse Spark models are accepted. No provider login
or service agreement was accepted during this review and no live Meta request
was made. No Meta approval has been obtained or asserted.

The previous release's statement about provider-icon provenance should not be
read as trademark approval. Historical 0.2.0 files retain those icons; use the
updated release. History was not rewritten.

## Supplied AEVORI logo

The project owner requested the rounded wordmark shown in their screenshot.
Its source and underlying rights are still unverified. It and derived marks are
excluded from the MIT license, including their use in screenshots and banners.
Publishing them does not establish ownership. Resolve their provenance before
claiming cleared commercial rights. The AEVORI name has not received a complete
trademark search.

## Limits

These changes reduce identified branding and disclosure issues; they do not
certify the whole application as lawful. A host serving other people must assess
applicable privacy, end-user, territory and AI-system obligations for the actual
deployment. Model downloads have separate licenses. The source review does not
verify a user's age, jurisdiction, API contract or live account entitlement.
