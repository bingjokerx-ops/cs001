# Howbetter — Monster Survivors

Independent play page and short first-run guide at https://howbetter.online/. Static HTML/CSS/JavaScript; no build or package installation. The existing Cloudflare Pages project publishes the repository root.

Keep the complete provider game frame and advertising intact. Do not self-host its game files or copy another publisher's identity. The official publisher instructions and catalogue confirm the exact iframe used here:

- https://www.onlinegames.io/t/embeddable-games-for-websites/
- https://www.onlinegames.io/media/plugins/genGames/embed.json

The frame is requested only after “Play Monster Survivors”. Immediate loading feedback is painted before attaching the external frame. The pre-load preview is a labelled real screenshot of this game, not a running session. A frame load is not proof of playability. Events game_launch and game_reload describe requests only. Reloading requires confirmation because it ends the run. Optional guide_feedback is yes/no reader feedback, not a game outcome.

The guide uses the linked provider article for mouse movement, sword/wand choice, XP and menu upgrades. An independent host-level check in desktop Chrome on November 6, 2026 verified mouse movement and XP, the first level-up choice, defeat, return to the menu and starting another run with the other weapon. This verifies the initial play flow only; keyboard/touch controls, save persistence, later stages and upgrade values remain unverified. Keep those boundaries until supported by evidence.

GA4 retains G-CC5FRCJJMW. It loads only on the canonical origin after consent. Set guide-internal-test-v1=true in local storage before site maintenance to prevent loading our tag; preview origins do not load it. Device emulation can recreate a document, so verify the flag and requests again rather than relying on one injected flag.

Production Cloudflare can inject a separate Web Analytics/RUM beacon before any Google Analytics choice. The Google preference and our internal-test flag control our Google tag, not that Cloudflare beacon or the provider iframe. Local preview's zero-external-request result is not a promise that production sends no measurements before Google consent. Cloudflare's actual production configuration is managed separately; the privacy page discloses this distinction.

Keep enhanced measurement disabled in the existing Google stream so automatic collection does not add unreviewed events or query strings. Run `node --test analytics.test.mjs game-shell.test.mjs` for consent, preview/internal exclusion, withdrawal, event boundaries, loading and cancelled/confirmed reload regressions. These tests do not replace real Google receipt or an actual playable run. Image provenance is in `assets/IMAGE-SOURCES.md`.

The approved public correction address is adrianotitski159@gmail.com. Contact links draft an email; this site does not send it.

For local inspection, serve this root on an unused loopback port using Python's standard HTTP server. There is no application backend, account, database or custom cross-origin game-state bridge.
